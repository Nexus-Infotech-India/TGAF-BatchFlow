import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
const prisma = new PrismaClient();

export class FGVerificationController {
  /**
   * POST /fg-verification/dispatch
   * Dispatches a completed FG production entry to a warehouse location.
   * Only transfers the packet count — not byproduct or scrap.
   */
  static async dispatchToWarehouse(req: Request, res: Response): Promise<void> {
    try {
      const { productionEntryId, toLocationId, notes } = req.body;

      if (!productionEntryId || !toLocationId) {
        res.status(400).json({ error: 'productionEntryId and toLocationId are required' });
        return;
      }

      // Fetch the production entry
      const entry = await prisma.fGProductionEntry.findUnique({
        where: { id: productionEntryId },
        include: { fgBatch: true },
      });

      if (!entry) {
        res.status(404).json({ error: 'Production entry not found' });
        return;
      }

      if (entry.status !== 'COMPLETED') {
        res.status(400).json({ error: 'Only completed production entries can be dispatched' });
        return;
      }

      // Fetch location name
      const location = await prisma.location.findUnique({ where: { id: toLocationId } });
      if (!location) {
        res.status(404).json({ error: 'Location not found' });
        return;
      }

      // Generate verification number: FGV-YYYYMMDD-XXXX
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `FGV-${dateStr}-`;
      const last = await prisma.fGProductionVerification.findFirst({
        where: { verificationNumber: { startsWith: prefix } },
        orderBy: { verificationNumber: 'desc' },
      });
      let seq = 1;
      if (last?.verificationNumber) {
        const lastSeq = parseInt(last.verificationNumber.replace(prefix, ''), 10);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
      }
      const verificationNumber = `${prefix}${String(seq).padStart(4, '0')}`;

      const verification = await prisma.$transaction(async (tx) => {
        const created = await tx.fGProductionVerification.create({
          data: {
            verificationNumber,
            productionEntryId: entry.id,
            entryNumber: entry.entryNumber,
            fgProductName: entry.fgProductName,
            totalPackets: entry.totalActualPackets,
            totalCartons: entry.totalActualCartons,
            packetSize: entry.packetSize,
            packetUnit: entry.packetUnit,
            cartonCapacity: entry.cartonCapacity,
            toLocationId,
            toLocationName: location.name,
            status: 'PENDING',
            notes: notes || null,
            dispatchedById: (req as any).user?.id || 'system',
            dispatchedAt: new Date(),
          },
        });

        await tx.transactionLog.create({
          data: {
            type: 'FG_DISPATCH',
            entity: 'FGProductionVerification',
            entityId: created.id,
            userId: (req as any).user?.id || 'system',
            description: `FG dispatch ${verificationNumber}: ${entry.fgProductName} (${entry.totalActualPackets} packets${entry.totalActualCartons ? `, ${entry.totalActualCartons} cartons` : ''}) to ${location.name}`,
          },
        });

        return created;
      }, { timeout: 15000 });

      res.status(201).json({ success: true, data: verification });
    } catch (error) {
      console.error('Error dispatching FG to warehouse:', error);
      res.status(500).json({ error: 'Failed to dispatch FG to warehouse', details: error });
    }
  }

  /**
   * GET /fg-verification
   * Returns all FG production verifications.
   */
  static async getVerifications(req: Request, res: Response): Promise<void> {
    try {
      const verifications = await prisma.fGProductionVerification.findMany({
        include: { productionEntry: true },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: verifications });
    } catch (error) {
      console.error('Error fetching FG verifications:', error);
      res.status(500).json({ error: 'Failed to fetch FG verifications', details: error });
    }
  }

  /**
   * PUT /fg-verification/:id/accept
   * Accepts an incoming FG production verification.
   */
  static async acceptVerification(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const record = await prisma.fGProductionVerification.findUnique({ where: { id } });
      if (!record) {
        res.status(404).json({ error: 'Verification record not found' });
        return;
      }
      if (record.status !== 'PENDING') {
        res.status(400).json({ error: `Verification is already ${record.status}` });
        return;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.fGProductionVerification.update({
          where: { id },
          data: {
            status: 'ACCEPTED',
            verifiedById: (req as any).user?.id || 'system',
            verifiedAt: new Date(),
          },
        });

        await tx.transactionLog.create({
          data: {
            type: 'FG_VERIFICATION_ACCEPTED',
            entity: 'FGProductionVerification',
            entityId: result.id,
            userId: (req as any).user?.id || 'system',
            description: `FG verification ${result.verificationNumber} accepted at ${result.toLocationName}`,
          },
        });

        return result;
      }, { timeout: 15000 });

      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error accepting FG verification:', error);
      res.status(500).json({ error: 'Failed to accept verification', details: error });
    }
  }

  /**
   * PUT /fg-verification/:id/reject
   * Rejects an incoming FG production verification.
   */
  static async rejectVerification(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;

      const record = await prisma.fGProductionVerification.findUnique({ where: { id } });
      if (!record) {
        res.status(404).json({ error: 'Verification record not found' });
        return;
      }
      if (record.status !== 'PENDING') {
        res.status(400).json({ error: `Verification is already ${record.status}` });
        return;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.fGProductionVerification.update({
          where: { id },
          data: {
            status: 'REJECTED',
            rejectionReason: rejectionReason || null,
            verifiedById: (req as any).user?.id || 'system',
            verifiedAt: new Date(),
          },
        });

        await tx.transactionLog.create({
          data: {
            type: 'FG_VERIFICATION_REJECTED',
            entity: 'FGProductionVerification',
            entityId: result.id,
            userId: (req as any).user?.id || 'system',
            description: `FG verification ${result.verificationNumber} rejected. Reason: ${rejectionReason || 'N/A'}`,
          },
        });

        return result;
      }, { timeout: 15000 });

      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error rejecting FG verification:', error);
      res.status(500).json({ error: 'Failed to reject verification', details: error });
    }
  }
}
