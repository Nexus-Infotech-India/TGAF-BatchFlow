import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
const prisma = new PrismaClient();

export class TransferController {
  /**
   * Create an inbound transfer (Warehouse → Grinding).
   * Step 1: warehouse sends cleaned RM to grinding production location.
   * 
   * For SFG_TO_PRODUCTION direction:
   *   Instead of creating new MaterialTransferLine rows, we UPDATE the
   *   existing outbound transfer lines (from OUTBOUND_FROM_GRINDING).
   *   - Deduct bags/quantity from the source line
   *   - Record the transferred quantity in transferredQuantity/transferredUnit
   *   The new MaterialTransfer record still gets created (to track the movement),
   *   but uses references to the source lines.
   */
  static async createTransfer(req: Request, res: Response) {
    try {
      const { fromLocationId, toLocationId, lines, notes, direction } = req.body;

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

      // ═══════════════════════════════════════════════════════════════
      // SFG_TO_PRODUCTION: Update source outbound lines in-place
      // ═══════════════════════════════════════════════════════════════
      if (direction === 'SFG_TO_PRODUCTION') {
        const transfer = await prisma.$transaction(async (tx) => {
          // For each line in the request, handle based on lineType
          const lineCreates: any[] = [];

          for (const line of lines) {
            // ── PACKAGING_MATERIAL lines: simply record qty + unit ──
            if (line.lineType === 'PACKAGING_MATERIAL') {
              const transferQty = Number(line.quantity || 0);
              if (transferQty <= 0) continue;

              lineCreates.push({
                lineType: 'PACKAGING_MATERIAL',
                rawMaterialId: line.rawMaterialId || null,
                productName: line.productName || null,
                skuCode: line.skuCode || null,
                quantity: transferQty,
                unitOfMeasurement: line.unitOfMeasurement || 'KG',
                batchNumber: null,
                cleaningLotId: null,
                transferredQuantity: transferQty,
                transferredUnit: line.unitOfMeasurement || 'KG',
                numberOfBags: line.numberOfBags != null ? Number(line.numberOfBags) : null,
                bagSizeKg: line.bagSizeKg != null ? Number(line.bagSizeKg) : null,
              });
              continue;
            }

            // ── SFG lines: existing deduction logic ──
            const batchNumber = line.batchNumber; // This is the source transfer number
            const transferBags = Number(line.numberOfBags || 0);
            const transferQty = Number(line.quantity || 0);

            if (!batchNumber) {
              throw new Error('batchNumber (source transfer number) is required for SFG lines');
            }

            // Find the source outbound transfer by its transfer number
            const sourceTransfer = await tx.materialTransfer.findUnique({
              where: { transferNumber: batchNumber },
              include: { lines: true },
            });

            if (!sourceTransfer) {
              throw new Error(`Source transfer ${batchNumber} not found`);
            }

            // Find the matching SFG line for this raw material in the source transfer
            const sourceRmId = line.rawMaterialId;
            const sourceProductName = line.productName;
            const sourceLine = sourceTransfer.lines.find(
              (sl) => sl.lineType === 'SFG' && (
                (sl.rawMaterialId && sl.rawMaterialId === sourceRmId) ||
                (!sl.rawMaterialId && sl.productName === sourceRmId) ||
                (sl.productName === sourceProductName) ||
                (sl.rawMaterialId === sourceProductName)
              )
            );

            if (!sourceLine) {
              throw new Error(`No SFG line found in ${batchNumber} for rawMaterialId=${sourceRmId} or productName=${sourceProductName}`);
            }

            // Calculate existing transferred amounts
            const existingTransferredQty = Number(sourceLine.transferredQuantity || 0);

            // The incoming transferQty is always in KG from the frontend.
            // Convert to match the source line's unit for consistent tracking.
            const sourceUnit = (sourceLine.unitOfMeasurement || '').toLowerCase();
            let transferQtyInSourceUnit = transferQty;
            if (sourceUnit === 'ton' || sourceUnit === 'mt') {
              transferQtyInSourceUnit = transferQty / 1000; // KG -> Ton
            }

            // Update the source line: add to transferred quantity
            const newTransferredQty = existingTransferredQty + transferQtyInSourceUnit;

            await tx.materialTransferLine.update({
              where: { id: sourceLine.id },
              data: {
                transferredQuantity: Math.round(newTransferredQty * 1000) / 1000,
                transferredUnit: sourceLine.unitOfMeasurement || 'KG',
              },
            });

            // Still create line entries in the new transfer for tracking purposes
            lineCreates.push({
              lineType: 'SFG',
              rawMaterialId: sourceRmId || null,
              productName: line.productName || null,
              skuCode: line.skuCode || null,
              quantity: transferQty,
              unitOfMeasurement: 'KG',
              batchNumber: batchNumber,
              cleaningLotId: null,
              transferredQuantity: transferQty,
              transferredUnit: 'KG',
              numberOfBags: transferBags > 0 ? transferBags : null,
              bagSizeKg: line.bagSizeKg != null ? Number(line.bagSizeKg) : 25,
            });
          }

          if (lineCreates.length === 0) {
            throw new Error('No valid transfer lines to create');
          }

          const created = await tx.materialTransfer.create({
            data: {
              transferNumber,
              direction: 'SFG_TO_PRODUCTION',
              fromLocationId,
              toLocationId,
              status: 'SENT',
              sentById: req.user?.id || 'system',
              sentAt: new Date(),
              notes: notes || null,
              lines: {
                create: lineCreates,
              },
            },
            include: {
              lines: true,
              fromLocation: true,
              toLocation: true,
            },
          });

          // Determine what was transferred for logging
          const sfgCount = lineCreates.filter((l: any) => l.lineType === 'SFG').length;
          const pkgCount = lineCreates.filter((l: any) => l.lineType === 'PACKAGING_MATERIAL').length;
          const desc = `Material dispatch ${transferNumber} from ${created.fromLocation.name} to ${created.toLocation.name}. SFG: ${sfgCount} lines, Packaging: ${pkgCount} lines.`;

          // Transaction log
          await tx.transactionLog.create({
            data: {
              type: 'MATERIAL_DISPATCH_SENT',
              entity: 'MaterialTransfer',
              entityId: created.id,
              userId: req.user?.id || 'system',
              description: desc,
            },
          });

          return created;
        }, { timeout: 15000 });

        res.status(201).json({ success: true, data: transfer });
        return;
      }

      // ═══════════════════════════════════════════════════════════════
      // Non-SFG_TO_PRODUCTION: Original behavior — create new lines
      // ═══════════════════════════════════════════════════════════════
      const transfer = await prisma.$transaction(async (tx) => {
        const lineCreates: any[] = lines.map((line: any) => ({
          lineType: line.lineType || 'RAW_MATERIAL',
          rawMaterialId: line.rawMaterialId || null,
          productName: line.productName || null,
          skuCode: line.skuCode || null,
          quantity: Number(line.quantity),
          unitOfMeasurement: line.unitOfMeasurement || 'kg',
          batchNumber: line.batchNumber || null,
          cleaningLotId: line.cleaningLotId || null,
          transferredQuantity: line.transferredQuantity != null ? Number(line.transferredQuantity) : Number(line.quantity),
          transferredUnit: line.transferredUnit || line.unitOfMeasurement || 'kg',
          numberOfBags: line.numberOfBags != null ? Number(line.numberOfBags) : null,
          bagSizeKg: line.bagSizeKg != null ? Number(line.bagSizeKg) : 25,
        }));

        const created = await tx.materialTransfer.create({
          data: {
            transferNumber,
            direction: direction || 'INBOUND_TO_GRINDING',
            fromLocationId,
            toLocationId,
            status: 'SENT',
            sentById: req.user?.id || 'system',
            sentAt: new Date(),
            notes: notes || null,
            lines: {
              create: lineCreates,
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
                looseQty: line.looseQty != null ? Number(line.looseQty) : 0,
                totalPackedQty: line.totalPackedQty != null ? Number(line.totalPackedQty) : null,
                totalPackedUnit: line.totalPackedUnit || null,
                // Initialize transferredQuantity as 0 for outbound lines
                transferredQuantity: 0,
                transferredUnit: line.unitOfMeasurement || 'kg',
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

        // Loose SFG ledger: every SFG line with looseQty > 0 deposits that loose
        // quantity into the destination location's running ledger.
        if (result.direction === 'OUTBOUND_FROM_GRINDING') {
          for (const line of result.lines) {
            const loose = Number(line.looseQty || 0);
            if (line.lineType !== 'SFG' || loose <= 0) continue;
            await tx.looseStockLedger.create({
              data: {
                locationId: result.toLocationId,
                rawMaterialId: line.rawMaterialId || null,
                skuCode: line.skuCode || null,
                productName: line.productName || null,
                unitOfMeasurement: line.unitOfMeasurement || 'KG',
                delta: loose,
                reason: 'TRANSFER_ACCEPT',
                sourceTransferId: result.id,
                notes: `Loose remainder from transfer ${result.transferNumber}`,
              },
            });
          }
        }

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
        include: { fromLocation: true, toLocation: true, lines: true },
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
        // If this is an SFG_TO_PRODUCTION transfer being rejected,
        // we need to reverse the deduction from the source outbound lines
        if (transfer.direction === 'SFG_TO_PRODUCTION') {
          for (const line of transfer.lines) {
            // Only reverse SFG lines (packaging lines don't deduct from a source)
            if (line.lineType !== 'SFG' || !line.batchNumber) continue;

            // Find the source outbound transfer
            const sourceTransfer = await tx.materialTransfer.findUnique({
              where: { transferNumber: line.batchNumber },
              include: { lines: true },
            });

            if (sourceTransfer) {
              // Match by rawMaterialId or productName (outbound lines may have rawMaterialId=NULL)
              const sourceLine = sourceTransfer.lines.find(
                (sl) => sl.lineType === 'SFG' && (
                  (sl.rawMaterialId && sl.rawMaterialId === line.rawMaterialId) ||
                  (!sl.rawMaterialId && sl.productName === line.rawMaterialId) ||
                  (sl.productName === line.productName)
                )
              );

              if (sourceLine) {
                // Reverse the transferred quantity
                // The dispatch line quantity is in KG, convert to source unit
                const currentTransferred = Number(sourceLine.transferredQuantity || 0);
                let reversalQty = Number(line.transferredQuantity || line.quantity || 0);
                const sourceUnit = (sourceLine.unitOfMeasurement || '').toLowerCase();
                const lineUnit = (line.unitOfMeasurement || '').toLowerCase();
                // If dispatch line is KG but source is Ton, convert
                if ((lineUnit === 'kg' || lineUnit === '') && (sourceUnit === 'ton' || sourceUnit === 'mt')) {
                  reversalQty = reversalQty / 1000;
                }
                const newTransferred = Math.max(0, currentTransferred - reversalQty);

                await tx.materialTransferLine.update({
                  where: { id: sourceLine.id },
                  data: {
                    transferredQuantity: Math.round(newTransferred * 1000) / 1000,
                  },
                });
              }
            }
          }
        }

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
   * GET /raw/transfers/sfg-warehouse-stock
   * Returns aggregated SFG stock currently sitting in SFG warehouse locations.
   * Stock comes from ACCEPTED OUTBOUND_FROM_GRINDING transfers,
   * minus quantities already dispatched via the transferredQuantity field on
   * the source outbound lines, and FGBatch consumptions.
   */
  static async getSfgWarehouseStock(req: Request, res: Response) {
    try {
      // 1) All accepted outbound transfers (Grinding -> SFG Warehouse)
      const outboundTransfers = await prisma.materialTransfer.findMany({
        where: {
          direction: 'OUTBOUND_FROM_GRINDING',
          status: 'ACCEPTED',
        },
        include: {
          lines: true,
          toLocation: true,
          fromLocation: true,
        },
      });

      // 2) FGBatch consumptions from SFG batches
      const pastConsumptions = await prisma.fGBatchConsumption.findMany({
        where: {
          sourceType: 'SFG_BATCH',
          batchNumber: { not: null },
        },
        select: {
          batchNumber: true,
          actualQuantity: true,
          rawMaterialId: true,
        },
      });

      // Build consumed map from FGBatch consumptions: transferNumber -> rawMaterialId -> qty
      const fgConsumedMap: Record<string, Record<string, number>> = {};
      for (const c of pastConsumptions) {
        if (!c.batchNumber) continue;
        if (!fgConsumedMap[c.batchNumber]) fgConsumedMap[c.batchNumber] = {};
        if (!fgConsumedMap[c.batchNumber][c.rawMaterialId]) fgConsumedMap[c.batchNumber][c.rawMaterialId] = 0;
        fgConsumedMap[c.batchNumber][c.rawMaterialId] += c.actualQuantity;
      }

      // 3) Pre-fetch all SFG dispatch lines from SFG_TO_PRODUCTION transfers in one query
      //    to build a bag-count map (batchNumber+rawMaterialId -> totalBags)
      const allSfgDispatchLines = await prisma.materialTransferLine.findMany({
        where: {
          lineType: 'SFG',
          batchNumber: { not: null },
          transfer: {
            direction: 'SFG_TO_PRODUCTION',
            status: { in: ['SENT', 'ACCEPTED'] },
          },
        },
        select: {
          batchNumber: true,
          rawMaterialId: true,
          numberOfBags: true,
        },
      });

      // Build dispatch bags map: batchNumber -> rawMaterialId -> totalBags
      const dispatchBagsMap: Record<string, Record<string, number>> = {};
      for (const dl of allSfgDispatchLines) {
        if (!dl.batchNumber) continue;
        const rmId = dl.rawMaterialId || '';
        if (!dispatchBagsMap[dl.batchNumber]) dispatchBagsMap[dl.batchNumber] = {};
        if (!dispatchBagsMap[dl.batchNumber][rmId]) dispatchBagsMap[dl.batchNumber][rmId] = 0;
        dispatchBagsMap[dl.batchNumber][rmId] += Number(dl.numberOfBags || 0);
      }

      // 4) Build batch-wise stock from accepted outbound SFG lines.
      const itemMap: Record<string, {
        rawMaterialId: string;
        productName: string;
        skuCode: string;
        unit: string;
        warehouseLocation: string;
        warehouseLocationId: string;
        totalAvailableQty: number;
        totalAvailableBags: number;
        batches: Array<{
          sourceTransferId: string;
          sourceTransferNumber: string;
          batchNumber: string;
          acceptedAt: Date | null;
          unit: string;
          receivedQty: number;
          consumedByFGQty: number;
          transferredQty: number;
          availableQty: number;
          receivedBags: number;
          transferredBags: number;
          availableBags: number;
          bagSizeKg: number;
        }>;
      }> = {};

      for (const transfer of outboundTransfers) {
        for (const line of transfer.lines) {
          if (line.lineType !== 'SFG') continue;

          const rmId = line.rawMaterialId || line.productName || '';
          if (!rmId) continue;

          const itemKey = `${rmId}__${transfer.toLocation?.id || ''}`;

          if (!itemMap[itemKey]) {
            itemMap[itemKey] = {
              rawMaterialId: rmId,
              productName: line.productName || '',
              skuCode: line.skuCode || '',
              unit: line.unitOfMeasurement,
              warehouseLocation: transfer.toLocation?.name || '',
              warehouseLocationId: transfer.toLocation?.id || '',
              totalAvailableQty: 0,
              totalAvailableBags: 0,
              batches: [],
            };
          }

          const fgConsumed = fgConsumedMap[transfer.transferNumber]?.[rmId] || 0;
          // transferredQuantity is tracked directly on the source line
          const transferredQty = Number(line.transferredQuantity || 0);
          const availableQty = Math.max(
            0,
            Math.round((line.quantity - fgConsumed - transferredQty) * 1000) / 1000,
          );

          const receivedBags = line.numberOfBags || 0;
          const bagSizeKg = line.bagSizeKg || 25;
          // Get transferred bags from pre-built map
          const transferredBags = dispatchBagsMap[transfer.transferNumber]?.[rmId] || 0;
          const availableBags = Math.max(0, receivedBags - transferredBags);

          if (availableQty <= 0) continue;

          itemMap[itemKey].totalAvailableQty = Math.round((itemMap[itemKey].totalAvailableQty + availableQty) * 1000) / 1000;
          itemMap[itemKey].totalAvailableBags += availableBags;
          itemMap[itemKey].batches.push({
            sourceTransferId: transfer.id,
            sourceTransferNumber: transfer.transferNumber,
            batchNumber: transfer.transferNumber,
            acceptedAt: transfer.acceptedAt || null,
            unit: line.unitOfMeasurement,
            receivedQty: Math.round(line.quantity * 1000) / 1000,
            consumedByFGQty: Math.round(fgConsumed * 1000) / 1000,
            transferredQty: Math.round(transferredQty * 1000) / 1000,
            availableQty,
            receivedBags,
            transferredBags,
            availableBags,
            bagSizeKg,
          });
        }
      }

      const stockItems = Object.values(itemMap).map(item => ({
        ...item,
        batches: item.batches.sort((a, b) => {
          const aTime = a.acceptedAt ? new Date(a.acceptedAt).getTime() : 0;
          const bTime = b.acceptedAt ? new Date(b.acceptedAt).getTime() : 0;
          return aTime - bTime;
        }),
      })).filter(item => item.totalAvailableQty > 0);

      res.json({ success: true, data: stockItems });
    } catch (error) {
      console.error('Error fetching SFG warehouse stock:', error);
      res.status(500).json({ error: 'Failed to fetch SFG warehouse stock', details: error });
    }
  }

  /**
   * GET /raw/transfers/outbound-stock-details
   * Returns detailed per-line view of outbound transfers showing
   * original qty, transferred qty, and remaining qty for each SFG line.
   */
  static async getOutboundStockDetails(req: Request, res: Response) {
    try {
      const outboundTransfers = await prisma.materialTransfer.findMany({
        where: {
          direction: 'OUTBOUND_FROM_GRINDING',
          status: 'ACCEPTED',
        },
        include: {
          lines: true,
          toLocation: true,
          fromLocation: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const details = outboundTransfers.map((transfer) => ({
        transferId: transfer.id,
        transferNumber: transfer.transferNumber,
        fromLocation: transfer.fromLocation?.name,
        toLocation: transfer.toLocation?.name,
        acceptedAt: transfer.acceptedAt,
        lines: transfer.lines
          .filter((l) => l.lineType === 'SFG')
          .map((line) => ({
            lineId: line.id,
            productName: line.productName,
            skuCode: line.skuCode,
            rawMaterialId: line.rawMaterialId,
            originalQty: line.quantity,
            transferredQty: Number(line.transferredQuantity || 0),
            remainingQty: Math.max(0, line.quantity - Number(line.transferredQuantity || 0)),
            unit: line.unitOfMeasurement,
            transferredUnit: line.transferredUnit,
            originalBags: line.numberOfBags || 0,
            bagSizeKg: line.bagSizeKg || 25,
          })),
      }));

      res.json({ success: true, data: details });
    } catch (error) {
      console.error('Error fetching outbound stock details:', error);
      res.status(500).json({ error: 'Failed to fetch outbound stock details', details: error });
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
  /**
   * GET /raw/transfers/packaging-stock
   * Returns packaging materials available at a given location.
   * Looks at ACCEPTED SFG_TO_PRODUCTION transfers that have PACKAGING_MATERIAL lines,
   * minus any already consumed by FGBatch consumptions.
   */
  static async getPackagingStock(req: Request, res: Response) {
    try {
      const { locationId } = req.query;

      // 1) Find all accepted transfers at this location with packaging lines
      const whereClause: any = {
        direction: 'SFG_TO_PRODUCTION',
        status: 'ACCEPTED',
      };
      if (locationId) {
        whereClause.toLocationId = locationId as string;
      }

      const transfers = await prisma.materialTransfer.findMany({
        where: whereClause,
        include: {
          lines: true,
          toLocation: true,
          fromLocation: true,
        },
        orderBy: { acceptedAt: 'desc' },
      });

      // 2) Pull already-consumed packaging material from FGBatch consumptions
      const pastConsumptions = await prisma.fGBatchConsumption.findMany({
        where: {
          sourceType: 'PKG_TRANSFER',
          batchNumber: { not: null },
        },
        select: {
          batchNumber: true,
          actualQuantity: true,
          rawMaterialId: true,
        },
      });

      const consumedMap: Record<string, Record<string, number>> = {};
      for (const c of pastConsumptions) {
        if (!c.batchNumber) continue;
        if (!consumedMap[c.batchNumber]) consumedMap[c.batchNumber] = {};
        if (!consumedMap[c.batchNumber][c.rawMaterialId]) consumedMap[c.batchNumber][c.rawMaterialId] = 0;
        consumedMap[c.batchNumber][c.rawMaterialId] += c.actualQuantity;
      }

      // 3) Build per-material stock aggregation
      const itemMap: Record<string, {
        rawMaterialId: string;
        productName: string;
        skuCode: string;
        unit: string;
        totalAvailableQty: number;
        batches: Array<{
          transferNumber: string;
          transferId: string;
          acceptedAt: Date | null;
          unit: string;
          receivedQty: number;
          consumedQty: number;
          availableQty: number;
        }>;
      }> = {};

      for (const transfer of transfers) {
        for (const line of transfer.lines) {
          if (line.lineType !== 'PACKAGING_MATERIAL') continue;
          const rmId = line.rawMaterialId || '';
          if (!rmId) continue;

          if (!itemMap[rmId]) {
            itemMap[rmId] = {
              rawMaterialId: rmId,
              productName: line.productName || '',
              skuCode: line.skuCode || '',
              unit: line.unitOfMeasurement,
              totalAvailableQty: 0,
              batches: [],
            };
          }

          const consumed = consumedMap[transfer.transferNumber]?.[rmId] || 0;
          const available = Math.max(0, Math.round((line.quantity - consumed) * 1000) / 1000);
          if (available <= 0) continue;

          itemMap[rmId].totalAvailableQty = Math.round((itemMap[rmId].totalAvailableQty + available) * 1000) / 1000;
          itemMap[rmId].batches.push({
            transferNumber: transfer.transferNumber,
            transferId: transfer.id,
            acceptedAt: transfer.acceptedAt,
            unit: line.unitOfMeasurement,
            receivedQty: Math.round(line.quantity * 1000) / 1000,
            consumedQty: Math.round(consumed * 1000) / 1000,
            availableQty: available,
          });
        }
      }

      const stockItems = Object.values(itemMap).filter(i => i.totalAvailableQty > 0);
      res.json({ success: true, data: stockItems });
    } catch (error) {
      console.error('Error fetching packaging stock:', error);
      res.status(500).json({ error: 'Failed to fetch packaging stock', details: error });
    }
  }

  /**
   * GET /raw/transfers/loose-stock?locationId=...
   * Returns current loose SFG availability per (locationId, rawMaterialId).
   * Computed as SUM(delta) over the LooseStockLedger.
   */
  static async getLooseStock(req: Request, res: Response) {
    try {
      const { locationId } = req.query;
      const where: any = {};
      if (typeof locationId === 'string' && locationId.length > 0) where.locationId = locationId;

      const rows = await prisma.looseStockLedger.findMany({
        where,
        include: { location: true },
      });

      // Aggregate per (locationId, rawMaterialId or productName)
      const map = new Map<string, {
        locationId: string;
        locationName: string;
        rawMaterialId: string | null;
        skuCode: string | null;
        productName: string | null;
        unit: string;
        available: number;
      }>();

      for (const r of rows) {
        const key = `${r.locationId}__${r.rawMaterialId || r.skuCode || r.productName || ''}`;
        if (!map.has(key)) {
          map.set(key, {
            locationId: r.locationId,
            locationName: r.location?.name || '',
            rawMaterialId: r.rawMaterialId,
            skuCode: r.skuCode,
            productName: r.productName,
            unit: r.unitOfMeasurement || 'KG',
            available: 0,
          });
        }
        const entry = map.get(key)!;
        entry.available += Number(r.delta || 0);
      }

      const data = Array.from(map.values())
        .map(e => ({ ...e, available: Math.round(e.available * 1000) / 1000 }))
        .filter(e => e.available > 0);

      res.json({ success: true, data });
    } catch (error) {
      console.error('Error fetching loose stock:', error);
      res.status(500).json({ error: 'Failed to fetch loose stock', details: error });
    }
  }

  /**
   * POST /raw/transfers/loose-stock/rebag
   * Body: { locationId, rawMaterialId?, skuCode?, productName?, bagsToForm, bagSizeKg }
   * Converts looseQty into bagged inventory by:
   *  - Inserting a negative LooseStockLedger row (REBAG) for bagsToForm × bagSizeKg
   *  - Creating a synthetic OUTBOUND_FROM_GRINDING transfer with the rebagged qty
   *    at the same location, so the bagged stock is visible to downstream consumers.
   */
  static async rebagLooseStock(req: Request, res: Response) {
    try {
      const { locationId, rawMaterialId, skuCode, productName, bagsToForm, bagSizeKg } = req.body || {};
      const bags = Number(bagsToForm);
      const bagKg = Number(bagSizeKg) || 25;

      if (!locationId || !bags || bags <= 0) {
        res.status(400).json({ error: 'locationId and a positive bagsToForm are required' });
        return;
      }

      // Compute current available loose for the (location, material) key
      const where: any = { locationId };
      if (rawMaterialId) where.rawMaterialId = rawMaterialId;
      else if (skuCode) where.skuCode = skuCode;
      else if (productName) where.productName = productName;

      const rows = await prisma.looseStockLedger.findMany({ where });
      const available = rows.reduce((s, r) => s + Number(r.delta || 0), 0);
      const consumeKg = bags * bagKg;

      if (consumeKg > available + 1e-6) {
        res.status(400).json({
          error: `Insufficient loose stock. Available: ${Math.round(available * 1000) / 1000} KG, Requested: ${consumeKg} KG`,
        });
        return;
      }

      const location = await prisma.location.findUnique({ where: { id: locationId } });
      if (!location) {
        res.status(400).json({ error: 'Location not found' });
        return;
      }

      // Generate a synthetic outbound transfer number for the re-bag
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `TRF-REBAG-${dateStr}-`;
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

      const result = await prisma.$transaction(async (tx) => {
        // 1) Insert the negative loose ledger entry
        await tx.looseStockLedger.create({
          data: {
            locationId,
            rawMaterialId: rawMaterialId || null,
            skuCode: skuCode || null,
            productName: productName || null,
            unitOfMeasurement: 'KG',
            delta: -consumeKg,
            reason: 'REBAG',
            notes: `Re-bagged ${bags} bag(s) × ${bagKg} KG into ${transferNumber}`,
          },
        });

        // 2) Create a synthetic ACCEPTED OUTBOUND_FROM_GRINDING transfer
        //    at this location so the bagged qty becomes visible to consumers.
        const created = await tx.materialTransfer.create({
          data: {
            transferNumber,
            direction: 'OUTBOUND_FROM_GRINDING',
            fromLocationId: locationId,
            toLocationId: locationId,
            status: 'ACCEPTED',
            sentById: req.user?.id || 'system',
            sentAt: new Date(),
            acceptedById: req.user?.id || 'system',
            acceptedAt: new Date(),
            notes: `Re-bagged from loose stock at ${location.name}`,
            lines: {
              create: [{
                lineType: 'SFG',
                rawMaterialId: rawMaterialId || null,
                productName: productName || null,
                skuCode: skuCode || null,
                quantity: consumeKg,
                unitOfMeasurement: 'KG',
                numberOfBags: bags,
                bagSizeKg: bagKg,
                looseQty: 0,
                transferredQuantity: 0,
                transferredUnit: 'KG',
              }],
            },
          },
          include: { lines: true },
        });

        await tx.transactionLog.create({
          data: {
            type: 'LOOSE_REBAG',
            entity: 'MaterialTransfer',
            entityId: created.id,
            userId: req.user?.id || 'system',
            description: `Re-bagged ${bags} × ${bagKg} KG = ${consumeKg} KG of ${productName || skuCode || rawMaterialId || 'SFG'} at ${location.name}`,
          },
        });

        return { transfer: created, consumedKg: consumeKg, newAvailable: Math.round((available - consumeKg) * 1000) / 1000 };
      }, { timeout: 15000 });

      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Error re-bagging loose stock:', error);
      res.status(500).json({ error: 'Failed to re-bag loose stock', details: error });
    }
  }

  /**
   * GET /raw/transfers/packaging-source-stock
   * Returns available packaging-material stock at the source side:
   * sum of received quantities (from PurchaseOrderItem receivals)
   * minus quantities already transferred out via MaterialTransferLine (PACKAGING_MATERIAL).
   * Optionally filtered by `locationId` (source location of the receival / outbound transfer).
   */
  static async getPackagingSourceStock(req: Request, res: Response) {
    try {
      const { locationId } = req.query;
      const locId = typeof locationId === 'string' && locationId.length > 0 ? locationId : null;

      const poItems = await prisma.purchaseOrderItem.findMany({
        where: { rawMaterial: { category: 'PACKAGING_MATERIAL' } },
        include: {
          rawMaterial: true,
          receivals: locId ? { where: { locationId: locId } } : true,
        },
      });

      const stockMap: Record<string, {
        rawMaterialId: string;
        productName: string;
        skuCode: string;
        unit: string;
        totalReceived: number;
        totalTransferredOut: number;
        available: number;
      }> = {};

      for (const item of poItems) {
        const rmId = item.rawMaterialId;
        const received = (item.receivals || []).reduce((sum, r) => sum + (r.totalWeight || 0), 0);
        if (received <= 0) continue;
        if (!stockMap[rmId]) {
          stockMap[rmId] = {
            rawMaterialId: rmId,
            productName: item.rawMaterial.name,
            skuCode: item.rawMaterial.skuCode,
            unit: item.rawMaterial.unitOfMeasurement || 'KG',
            totalReceived: 0,
            totalTransferredOut: 0,
            available: 0,
          };
        }
        stockMap[rmId].totalReceived += received;
      }

      const transferWhere: any = {};
      if (locId) transferWhere.fromLocationId = locId;
      const transfers = await prisma.materialTransfer.findMany({
        where: transferWhere,
        include: { lines: { where: { lineType: 'PACKAGING_MATERIAL' } } },
      });
      for (const t of transfers) {
        for (const line of t.lines) {
          const rmId = line.rawMaterialId;
          if (!rmId || !stockMap[rmId]) continue;
          stockMap[rmId].totalTransferredOut += line.quantity || 0;
        }
      }

      const data = Object.values(stockMap).map(s => ({
        ...s,
        totalReceived: Math.round(s.totalReceived * 1000) / 1000,
        totalTransferredOut: Math.round(s.totalTransferredOut * 1000) / 1000,
        available: Math.max(0, Math.round((s.totalReceived - s.totalTransferredOut) * 1000) / 1000),
      }));

      res.json({ success: true, data });
    } catch (error) {
      console.error('Error fetching packaging source stock:', error);
      res.status(500).json({ error: 'Failed to fetch packaging source stock', details: error });
    }
  }
}
