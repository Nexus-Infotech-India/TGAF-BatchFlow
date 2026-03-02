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

  // Get received POs (POs with at least one fully RECEIVED item)
  // Used by the RM Quality Report page to list POs eligible for quality report generation
  // Filters at ITEM level: only excludes items that already have quality reports
  static async getReceivedPOs(req: Request, res: Response): Promise<void> {
    try {

      // Get item IDs that already have quality reports (item-level filtering)
      const reportsWithItems = await prisma.rMQualityReport.findMany({
        where: { purchaseOrderItemId: { not: null } },
        select: { purchaseOrderItemId: true },
      });
      const itemIdsWithReports = reportsWithItems
        .map(r => r.purchaseOrderItemId)
        .filter((id): id is string => id !== null);

      // Auto-correct any stale item statuses
      const allItems = await prisma.purchaseOrderItem.findMany({
        where: {
          status: { not: 'RECEIVED' },
          totalReceived: { gt: 0 },
        },
        select: { id: true, totalReceived: true, quantityOrdered: true, status: true },
      });

      const corrections: Promise<any>[] = [];
      for (const item of allItems) {
        let correctStatus: string | null = null;
        if (item.totalReceived >= item.quantityOrdered && item.status !== 'RECEIVED') {
          correctStatus = 'RECEIVED';
        } else if (item.totalReceived > 0 && item.totalReceived < item.quantityOrdered && item.status === 'PENDING') {
          correctStatus = 'PARTIALLY_RECEIVED';
        }
        if (correctStatus) {
          corrections.push(
            prisma.purchaseOrderItem.update({
              where: { id: item.id },
              data: { status: correctStatus as any },
            })
          );
        }
      }
      if (corrections.length > 0) {
        await Promise.all(corrections).catch((err) => {
          console.warn('Failed to auto-correct stale item statuses:', err);
        });
      }

      // Fetch POs that have at least one fully RECEIVED item
      // WITHOUT a quality report yet (item-level check)
      const pos = await prisma.purchaseOrder.findMany({
        where: {
          items: {
            some: {
              status: 'RECEIVED',
              id: { notIn: itemIdsWithReports.length > 0 ? itemIdsWithReports : [] },
            },
          },
        },
        include: {
          vendor: true,
          items: {
            where: {
              status: 'RECEIVED',
              id: { notIn: itemIdsWithReports.length > 0 ? itemIdsWithReports : [] },
            },
            include: {
              rawMaterial: true,
              receivals: {
                include: { bags: true, warehouse: true },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });


      res.json({ success: true, data: pos });
    } catch (error) {
      console.error('Error fetching received POs:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch received POs' });
    }
  }

  // Generate GRN from an existing quality report
  static async generateGRNForReport(req: Request, res: Response): Promise<void> {
    try {
      const { qualityReportId, truckNumber, deliveryLocation, costCenter, receivedBagsPacks, remarks } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!qualityReportId) {
        res.status(400).json({ error: 'Quality report ID is required' });
        return;
      }

      // Fetch the quality report
      const report = await prisma.rMQualityReport.findUnique({
        where: { id: qualityReportId },
        include: { grn_entry: true },
      });

      if (!report) {
        res.status(404).json({ error: 'Quality report not found' });
        return;
      }

      if (report.grn_entry) {
        res.status(400).json({ error: 'A GRN already exists for this quality report' });
        return;
      }

      if (!report.purchaseOrderId || !report.purchaseOrderItemId) {
        res.status(400).json({ error: 'Quality report is missing purchase order information' });
        return;
      }

      // Prevent creating multiple GRNs for the same Purchase Order Item
      const existingForItem = await prisma.gRNbyPo.findFirst({
        where: { purchaseOrderItemId: report.purchaseOrderItemId },
      });
      if (existingForItem) {
        res.status(400).json({ error: 'A GRN already exists for this Purchase Order Item' });
        return;
      }

      const grnNumber = await GRNController.generateGRNNumber();

      const result = await prisma.$transaction(async (tx) => {
        // Update the quality report with the GRN number
        await tx.rMQualityReport.update({
          where: { id: qualityReportId },
          data: { grn: grnNumber },
        });

        // Create GRN entry with additional fields from the form
        const grn = await tx.gRNbyPo.create({
          data: {
            grnNumber,
            purchaseOrderId: report.purchaseOrderId!,
            purchaseOrderItemId: report.purchaseOrderItemId!,
            rawMaterialName: report.rawMaterialName,
            variety: report.variety || '',
            supplier: report.supplier,
            qualityReportId: report.id,
            createdById: userId,
            truckNumber: truckNumber || null,
            deliveryLocation: deliveryLocation || null,
            costCenter: costCenter || null,
            receivedBagsPacks: receivedBagsPacks || null,
            remarks: remarks || null,
          },
          include: {
            purchaseOrder: { include: { vendor: true } },
            purchaseOrderItem: { include: { rawMaterial: true } },
            qualityReport: { include: { parameters: true } },
            createdBy: { select: { id: true, name: true, email: true } },
          },
        });

        return grn;
      }, { timeout: 30000 });

      res.status(201).json({
        success: true,
        data: result,
        grnNumber: result.grnNumber,
        message: `GRN ${result.grnNumber} generated successfully`,
      });
    } catch (error) {
      console.error('Error generating GRN for report:', error);
      res.status(500).json({ success: false, error: 'Failed to generate GRN' });
    }
  }
}
