import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export class GRNController {
  // Generate GRN number: GRN-YYYYMMDD-XXXX
  private static async generateGRNNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `GRN-${dateStr}-`;

    const lastGRN = await prisma.gRNbyPo.findFirst({
      where: { grnNumber: { startsWith: prefix } },
      orderBy: { grnNumber: 'desc' },
    });

    let seq = 1;
    if (lastGRN) {
      const lastSeq = parseInt(lastGRN.grnNumber.replace(prefix, ''), 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }

    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  // Create GRN with quality report
  static async createGRN(req: Request, res: Response): Promise<void> {
    try {
      const {
        purchaseOrderId,
        purchaseOrderItemId,
        rawMaterialName,
        variety,
        supplier,
        parameters,
      } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!purchaseOrderId || !purchaseOrderItemId || !rawMaterialName || !supplier) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Prevent creating multiple GRNs for the same Purchase Order
      const existingForPO = await prisma.gRNbyPo.findFirst({ where: { purchaseOrderId } });
      if (existingForPO) {
        res.status(400).json({ error: 'A GRN already exists for this Purchase Order' });
        return;
      }

      const grnNumber = await GRNController.generateGRNNumber();

      const result = await prisma.$transaction(async (tx) => {
        // Create quality report
        const qualityReport = await tx.rMQualityReport.create({
          data: {
            rawMaterialName,
            variety: variety || '',
            supplier,
            grn: grnNumber,
            createdById: userId,
            parameters: {
              create: (parameters || []).map((p: any) => ({
                parameter: p.parameter,
                standard: p.standard,
                result: p.result,
              })),
            },
          },
          include: { parameters: true },
        });

        // Create GRN entry
        const grn = await tx.gRNbyPo.create({
          data: {
            grnNumber,
            purchaseOrderId,
            purchaseOrderItemId,
            rawMaterialName,
            variety: variety || '',
            supplier,
            qualityReportId: qualityReport.id,
            createdById: userId,
          },
          include: {
            purchaseOrder: true,
            purchaseOrderItem: {
              include: { rawMaterial: true },
            },
            qualityReport: { include: { parameters: true } },
            createdBy: { select: { id: true, name: true, email: true } },
          },
        });

        return grn;
      }, { timeout: 30000 });

      res.status(201).json({
        success: true,
        data: result,
        message: 'GRN generated successfully',
      });
    } catch (error) {
      console.error('Error creating GRN:', error);
      res.status(500).json({ success: false, error: 'Failed to create GRN' });
    }
  }

  // Get all GRNs
  static async getGRNs(req: Request, res: Response): Promise<void> {
    try {
      const grns = await prisma.gRNbyPo.findMany({
        include: {
          purchaseOrder: { include: { vendor: true } },
          purchaseOrderItem: { include: { rawMaterial: true } },
          qualityReport: { include: { parameters: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: grns });
    } catch (error) {
      console.error('Error fetching GRNs:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch GRNs' });
    }
  }

  // Get GRNs by PO ID
  static async getGRNsByPO(req: Request, res: Response): Promise<void> {
    try {
      const { poId } = req.params;

      const grns = await prisma.gRNbyPo.findMany({
        where: { purchaseOrderId: poId },
        include: {
          purchaseOrder: { include: { vendor: true } },
          purchaseOrderItem: { include: { rawMaterial: true } },
          qualityReport: { include: { parameters: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: grns });
    } catch (error) {
      console.error('Error fetching GRNs by PO:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch GRNs' });
    }
  }

  // Get GRN by ID
  static async getGRNById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const grn = await prisma.gRNbyPo.findUnique({
        where: { id },
        include: {
          purchaseOrder: { include: { vendor: true } },
          purchaseOrderItem: {
            include: {
              rawMaterial: true,
              receivals: { include: { bags: true, warehouse: true } },
            },
          },
          qualityReport: {
            include: {
              parameters: true,
              createdBy: { select: { id: true, name: true, email: true } },
            },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      if (!grn) {
        res.status(404).json({ success: false, error: 'GRN not found' });
        return;
      }

      res.json({ success: true, data: grn });
    } catch (error) {
      console.error('Error fetching GRN:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch GRN' });
    }
  }

  // Delete GRN
  static async deleteGRN(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const grn = await prisma.gRNbyPo.findUnique({ where: { id } });
      if (!grn) {
        res.status(404).json({ success: false, error: 'GRN not found' });
        return;
      }

      await prisma.$transaction(async (tx) => {
        // Delete associated quality report if exists
        if (grn.qualityReportId) {
          await tx.rMQualityParameter.deleteMany({
            where: { reportId: grn.qualityReportId },
          });
          await tx.rMQualityReport.delete({
            where: { id: grn.qualityReportId },
          });
        }
        await tx.gRNbyPo.delete({ where: { id } });
      });

      res.json({ success: true, message: 'GRN deleted successfully' });
    } catch (error) {
      console.error('Error deleting GRN:', error);
      res.status(500).json({ success: false, error: 'Failed to delete GRN' });
    }
  }

  // Get received POs (POs with at least one RECEIVED or PARTIALLY_RECEIVED item)
  static async getReceivedPOs(req: Request, res: Response): Promise<void> {
    try {

      // Only return POs that have received items and do NOT already have a GRN
      const pos = await prisma.purchaseOrder.findMany({
        where: {
          grns: { none: {} },
          items: {
            some: {
              status: { in: ['RECEIVED', 'PARTIALLY_RECEIVED'] },
            },
          },
        },
        include: {
          vendor: true,
          items: {
            where: {
              status: { in: ['RECEIVED', 'PARTIALLY_RECEIVED'] },
            },
            include: {
              rawMaterial: true,
              receivals: {
                include: { bags: true, warehouse: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: pos });
    } catch (error) {
      console.error('Error fetching received POs:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch received POs' });
    }
  }
}
