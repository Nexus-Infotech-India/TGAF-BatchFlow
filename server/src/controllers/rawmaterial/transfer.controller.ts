import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
const prisma = new PrismaClient();

export class TransferController {
  /**
   * Create an inbound transfer (Warehouse → Grinding).
   * Step 1: warehouse sends cleaned RM to grinding production location.
   */
  static async createTransfer(req: Request, res: Response) {
    try {
      const { fromLocationId, toLocationId, lines, notes } = req.body;

      if (!fromLocationId || !toLocationId || !Array.isArray(lines) || lines.length === 0) {
        res.status(400).json({ error: 'fromLocationId, toLocationId, and lines are required' });
        return;
      }

      // Generate transfer number: TRF-YYYYMMDD-XXXX
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `TRF-${dateStr}-`;
      const lastTransfer = await prisma.materialTransfer.findFirst({
        where: { transferNumber: { startsWith: prefix } },
        orderBy: { transferNumber: 'desc' },
      });
      let seq = 1;
      if (lastTransfer?.transferNumber) {
        const lastSeq = parseInt(lastTransfer.transferNumber.replace(prefix, ''), 10);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
      }
      const transferNumber = `${prefix}${String(seq).padStart(4, '0')}`;

      const transfer = await prisma.$transaction(async (tx) => {
        const created = await tx.materialTransfer.create({
          data: {
            transferNumber,
            direction: 'INBOUND_TO_GRINDING',
            fromLocationId,
            toLocationId,
            status: 'SENT',
            sentById: req.user?.id || 'system',
            sentAt: new Date(),
            notes: notes || null,
            lines: {
              create: lines.map((line: any) => ({
                lineType: line.lineType || 'RAW_MATERIAL',
                rawMaterialId: line.rawMaterialId || null,
                productName: line.productName || null,
                skuCode: line.skuCode || null,
                quantity: Number(line.quantity),
                unitOfMeasurement: line.unitOfMeasurement || 'kg',
                batchNumber: line.batchNumber || null,
                cleaningLotId: line.cleaningLotId || null,
              })),
            },
          },
          include: {
            lines: true,
            fromLocation: true,
            toLocation: true,
          },
        });

        // Transaction log
        await tx.transactionLog.create({
          data: {
            type: 'TRANSFER_SENT',
            entity: 'MaterialTransfer',
            entityId: created.id,
            userId: req.user?.id || 'system',
            description: `Transfer ${transferNumber} sent from ${created.fromLocation.name} to ${created.toLocation.name}. Lines: ${lines.length}`,
          },
        });

        return created;
      }, { timeout: 15000 });

      res.status(201).json({ success: true, data: transfer });
    } catch (error) {
      console.error('Error creating transfer:', error);
      res.status(500).json({ error: 'Failed to create transfer', details: error });
    }
  }

  /**
   * Create an outbound transfer (Grinding → SFG Warehouse).
   * Step 6: SFG, byproduct, scrap sent from grinding to SFG warehouse.
   */
  static async createOutboundTransfer(req: Request, res: Response) {
    try {
      const { fromLocationId, toLocationId, lines, notes } = req.body;

      if (!fromLocationId || !toLocationId || !Array.isArray(lines) || lines.length === 0) {
        res.status(400).json({ error: 'fromLocationId, toLocationId, and lines are required' });
        return;
      }

      // Generate transfer number: TRF-OUT-YYYYMMDD-XXXX
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `TRF-OUT-${dateStr}-`;
      const lastTransfer = await prisma.materialTransfer.findFirst({
        where: { transferNumber: { startsWith: prefix } },
        orderBy: { transferNumber: 'desc' },
      });
      let seq = 1;
      if (lastTransfer?.transferNumber) {
        const lastSeq = parseInt(lastTransfer.transferNumber.replace(prefix, ''), 10);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
      }
      const transferNumber = `${prefix}${String(seq).padStart(4, '0')}`;

      const transfer = await prisma.$transaction(async (tx) => {
        const created = await tx.materialTransfer.create({
          data: {
            transferNumber,
            direction: 'OUTBOUND_FROM_GRINDING',
            fromLocationId,
            toLocationId,
            status: 'SENT',
            sentById: req.user?.id || 'system',
            sentAt: new Date(),
            notes: notes || null,
            lines: {
              create: lines.map((line: any) => ({
                lineType: line.lineType, // SFG, BYPRODUCT, SCRAP
                rawMaterialId: line.rawMaterialId || null,
                productName: line.productName || null,
                skuCode: line.skuCode || null,
                quantity: Number(line.quantity),
                unitOfMeasurement: line.unitOfMeasurement || 'kg',
                batchNumber: line.batchNumber || null,
                cleaningLotId: line.cleaningLotId || null,
                numberOfBags: line.numberOfBags != null ? Number(line.numberOfBags) : null,
                bagSizeKg: line.bagSizeKg != null ? Number(line.bagSizeKg) : 25,
                totalPackedQty: line.totalPackedQty != null ? Number(line.totalPackedQty) : null,
                totalPackedUnit: line.totalPackedUnit || null,
              })),
            },
          },
          include: {
            lines: true,
            fromLocation: true,
            toLocation: true,
          },
        });

        await tx.transactionLog.create({
          data: {
            type: 'OUTBOUND_TRANSFER_SENT',
            entity: 'MaterialTransfer',
            entityId: created.id,
            userId: req.user?.id || 'system',
            description: `Outbound transfer ${transferNumber} sent from ${created.fromLocation.name} to ${created.toLocation.name}. Lines: ${lines.length}`,
          },
        });

        return created;
      }, { timeout: 15000 });

      res.status(201).json({ success: true, data: transfer });
    } catch (error) {
      console.error('Error creating outbound transfer:', error);
      res.status(500).json({ error: 'Failed to create outbound transfer', details: error });
    }
  }

  /**
   * Accept a transfer.
   * Step 2: production supervisor accepts inbound.
   * Step 7: warehouse supervisor accepts outbound.
   */
  static async acceptTransfer(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const transfer = await prisma.materialTransfer.findUnique({
        where: { id },
        include: { lines: true, fromLocation: true, toLocation: true },
      });

      if (!transfer) {
        res.status(404).json({ error: 'Transfer not found' });
        return;
      }

      if (transfer.status !== 'SENT') {
        res.status(400).json({ error: `Transfer is already ${transfer.status}` });
        return;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.materialTransfer.update({
          where: { id },
          data: {
            status: 'ACCEPTED',
            acceptedById: req.user?.id || 'system',
            acceptedAt: new Date(),
          },
          include: { lines: true, fromLocation: true, toLocation: true },
        });

        const logType = result.direction === 'INBOUND_TO_GRINDING'
          ? 'TRANSFER_ACCEPTED'
          : 'OUTBOUND_TRANSFER_ACCEPTED';

        await tx.transactionLog.create({
          data: {
            type: logType,
            entity: 'MaterialTransfer',
            entityId: result.id,
            userId: req.user?.id || 'system',
            description: `Transfer ${result.transferNumber} accepted at ${result.toLocation.name}`,
          },
        });

        return result;
      }, { timeout: 15000 });

      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error accepting transfer:', error);
      res.status(500).json({ error: 'Failed to accept transfer', details: error });
    }
  }

  /**
   * Reject a transfer.
   */
  static async rejectTransfer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;

      const transfer = await prisma.materialTransfer.findUnique({
        where: { id },
        include: { fromLocation: true, toLocation: true },
      });

      if (!transfer) {
        res.status(404).json({ error: 'Transfer not found' });
        return;
      }

      if (transfer.status !== 'SENT') {
        res.status(400).json({ error: `Transfer is already ${transfer.status}` });
        return;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.materialTransfer.update({
          where: { id },
          data: {
            status: 'REJECTED',
            acceptedById: req.user?.id || 'system',
            acceptedAt: new Date(),
            rejectionReason: rejectionReason || null,
          },
          include: { lines: true, fromLocation: true, toLocation: true },
        });

        await tx.transactionLog.create({
          data: {
            type: 'TRANSFER_REJECTED',
            entity: 'MaterialTransfer',
            entityId: result.id,
            userId: req.user?.id || 'system',
            description: `Transfer ${result.transferNumber} rejected. Reason: ${rejectionReason || 'N/A'}`,
          },
        });

        return result;
      }, { timeout: 15000 });

      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error rejecting transfer:', error);
      res.status(500).json({ error: 'Failed to reject transfer', details: error });
    }
  }

  /**
   * Get all transfers with filters.
   * Query params: status, toLocationId, fromLocationId, direction
   */
  static async getTransfers(req: Request, res: Response) {
    try {
      const { status, toLocationId, fromLocationId, direction } = req.query;
      const where: any = {};
      if (status) where.status = status;
      if (toLocationId) where.toLocationId = toLocationId;
      if (fromLocationId) where.fromLocationId = fromLocationId;
      if (direction) where.direction = direction;

      const transfers = await prisma.materialTransfer.findMany({
        where,
        include: {
          lines: true,
          fromLocation: true,
          toLocation: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: transfers });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch transfers', details: error });
    }
  }

  /**
   * Get a single transfer by ID.
   */
  static async getTransferById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const transfer = await prisma.materialTransfer.findUnique({
        where: { id },
        include: {
          lines: true,
          fromLocation: true,
          toLocation: true,
        },
      });
      if (!transfer) {
        res.status(404).json({ error: 'Transfer not found' });
        return;
      }
      res.json({ success: true, data: transfer });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch transfer', details: error });
    }
  }
}
