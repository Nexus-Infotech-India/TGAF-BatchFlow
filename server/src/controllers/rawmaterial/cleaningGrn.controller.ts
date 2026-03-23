import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export class CleaningGrnController {
    private static extractLocationIdFromWarehouseField(warehouseLocationField?: string | null): string | null {
        if (!warehouseLocationField) return null;
        if (!warehouseLocationField.startsWith('LOC:')) return null;
        const locationId = warehouseLocationField.replace('LOC:', '').trim();
        return locationId || null;
    }

    private static convertWeight(val: number, fromU: string, toU: string): number {
        const f = fromU.toLowerCase();
        const t = toU.toLowerCase();
        if (f === t) return val;
        let valInKg = val;
        if (f === 'gram' || f === 'grams') valInKg = val / 1000;
        else if (f === 'ton' || f === 'tons') valInKg = val * 1000;
        
        if (t === 'gram' || t === 'grams') return valInKg * 1000;
        else if (t === 'ton' || t === 'tons') return valInKg / 1000;
        
        return valInKg;
    }

    private static async resolveWarehouseIdFromLocationId(locationId: string): Promise<string | null> {
        const location = await prisma.location.findUnique({ where: { id: locationId } });
        if (!location || !location.enabled) return null;

        const locationMarker = `LOC:${location.id}`;

        const mappedWarehouse = await prisma.warehouse.findFirst({
            where: { location: locationMarker },
            select: { id: true },
        });

        if (mappedWarehouse) return mappedWarehouse.id;

        const legacyWarehouse = await prisma.warehouse.findFirst({
            where: { name: location.name },
            select: { id: true },
        });

        if (legacyWarehouse) {
            await prisma.warehouse.update({
                where: { id: legacyWarehouse.id },
                data: { location: locationMarker },
            });
            return legacyWarehouse.id;
        }

        const createdWarehouse = await prisma.warehouse.create({
            data: {
                name: location.name,
                location: locationMarker,
            },
            select: { id: true },
        });

        return createdWarehouse.id;
    }

    private static async getLocationNameMapFromGrns(grns: any[]): Promise<Map<string, string>> {
        const locationIds = new Set<string>();

        for (const grn of grns) {
            for (const receival of grn.purchaseOrderItem?.receivals || []) {
                if (receival.locationId) locationIds.add(receival.locationId);
                const mappedFromWarehouse = CleaningGrnController.extractLocationIdFromWarehouseField(receival.warehouse?.location);
                if (mappedFromWarehouse) locationIds.add(mappedFromWarehouse);
            }

            for (const job of grn.cleaningJobs || []) {
                const fromLocationId = CleaningGrnController.extractLocationIdFromWarehouseField(job.fromWarehouse?.location);
                const toLocationId = CleaningGrnController.extractLocationIdFromWarehouseField(job.toWarehouse?.location);
                if (fromLocationId) locationIds.add(fromLocationId);
                if (toLocationId) locationIds.add(toLocationId);
            }
        }

        if (locationIds.size === 0) return new Map<string, string>();

        const locations = await prisma.location.findMany({
            where: { id: { in: Array.from(locationIds) } },
            select: { id: true, name: true },
        });

        return new Map(locations.map((l) => [l.id, l.name]));
    }

    /**
     * Get all GRNs with their materials for cleaning
     * Returns GRN details along with received quantity & how much has been transferred to cleaning
     */
    static async getGRNsForCleaning(req: Request, res: Response): Promise<void> {
        try {
            const grns = await prisma.gRNbyPo.findMany({
                where: {
                    purchaseOrderItem: {
                        rawMaterial: {
                            subcategory: 'Spice',
                        },
                    },
                },
                include: {
                    purchaseOrder: { include: { vendor: true } },
                    purchaseOrderItem: {
                        include: {
                            rawMaterial: true,
                            receivals: {
                                include: { bags: true, warehouse: true, location: true },
                            },
                        },
                    },
                    qualityReport: { include: { parameters: true } },
                    createdBy: { select: { id: true, name: true, email: true } },
                    cleaningJobs: {
                        include: {
                            fromWarehouse: true,
                            toWarehouse: true,
                            cleaningLots: true,
                        },
                    },
                    cleaningLots: {
                        include: {
                            warehouse: true,
                            cleaningJob: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            const locationNameMap = await CleaningGrnController.getLocationNameMapFromGrns(grns);

            // Calculate transfer details for each GRN
            const result = grns.map((grn) => {
                const totalReceived = grn.purchaseOrderItem.totalReceived || 0;
                const totalTransferred = grn.cleaningJobs.reduce(
                    (sum, job) => sum + job.quantity,
                    0
                );
                const leftQuantity = Math.max(totalReceived - totalTransferred, 0);

                // Check if all cleaning jobs for this GRN are finished
                const allJobsFinished =
                    grn.cleaningJobs.length > 0 &&
                    grn.cleaningJobs.every((job) => job.status === 'Cleaned' || job.status === 'Finished');

                return {
                    ...grn,
                    purchaseOrderItem: {
                        ...grn.purchaseOrderItem,
                        receivals: (grn.purchaseOrderItem?.receivals || []).map((receival: any) => {
                            const fallbackFromWarehouseLocationId = CleaningGrnController.extractLocationIdFromWarehouseField(receival.warehouse?.location);
                            const effectiveFromLocationId = receival.locationId || fallbackFromWarehouseLocationId;
                            const effectiveFromLocationName = effectiveFromLocationId
                                ? locationNameMap.get(effectiveFromLocationId) || receival.warehouse?.name || null
                                : receival.warehouse?.name || null;

                            return {
                                ...receival,
                                fromLocation: effectiveFromLocationId
                                    ? { id: effectiveFromLocationId, name: effectiveFromLocationName }
                                    : null,
                            };
                        }),
                    },
                    cleaningJobs: (grn.cleaningJobs || []).map((job: any) => {
                        const fromLocationId = CleaningGrnController.extractLocationIdFromWarehouseField(job.fromWarehouse?.location);
                        const toLocationId = CleaningGrnController.extractLocationIdFromWarehouseField(job.toWarehouse?.location);

                        return {
                            ...job,
                            fromLocation: fromLocationId
                                ? { id: fromLocationId, name: locationNameMap.get(fromLocationId) || job.fromWarehouse?.name || null }
                                : null,
                            toLocation: toLocationId
                                ? { id: toLocationId, name: locationNameMap.get(toLocationId) || job.toWarehouse?.name || null }
                                : null,
                        };
                    }),
                    totalReceived,
                    totalTransferred,
                    leftQuantity,
                    allJobsFinished,
                };
            });

            res.json({ success: true, data: result });
        } catch (error) {
            console.error('Error fetching GRNs for cleaning:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch GRNs for cleaning' });
        }
    }

    /**
     * Get materials for a specific GRN by GRN number (or id)
     */
    static async getGRNMaterialsByGrnNumber(req: Request, res: Response): Promise<void> {
        try {
            const { grnNumber } = req.params;

            const grn = await prisma.gRNbyPo.findFirst({
                where: {
                    OR: [{ grnNumber }, { id: grnNumber }],
                },
                include: {
                    purchaseOrder: { include: { vendor: true } },
                    purchaseOrderItem: {
                        include: {
                            rawMaterial: true,
                            receivals: {
                                include: { bags: true, warehouse: true, location: true },
                            },
                        },
                    },
                    qualityReport: { include: { parameters: true } },
                    createdBy: { select: { id: true, name: true, email: true } },
                    cleaningJobs: {
                        include: {
                            fromWarehouse: true,
                            toWarehouse: true,
                            rawMaterial: true,
                            cleaningLots: {
                                include: { warehouse: true },
                            },
                        },
                    },
                    cleaningLots: {
                        include: {
                            warehouse: true,
                            cleaningJob: true,
                        },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });

            if (!grn) {
                res.status(404).json({ success: false, error: 'GRN not found' });
                return;
            }

            const locationNameMap = await CleaningGrnController.getLocationNameMapFromGrns([grn]);

            const totalReceived = grn.purchaseOrderItem.totalReceived || 0;
            const totalTransferred = grn.cleaningJobs.reduce(
                (sum, job) => sum + job.quantity,
                0
            );
            const leftQuantity = Math.max(totalReceived - totalTransferred, 0);

            const allJobsFinished =
                grn.cleaningJobs.length > 0 &&
                grn.cleaningJobs.every((job) => job.status === 'Cleaned' || job.status === 'Finished');

            res.json({
                success: true,
                data: {
                    ...grn,
                    purchaseOrderItem: {
                        ...grn.purchaseOrderItem,
                        receivals: (grn.purchaseOrderItem?.receivals || []).map((receival: any) => {
                            const fallbackFromWarehouseLocationId = CleaningGrnController.extractLocationIdFromWarehouseField(receival.warehouse?.location);
                            const effectiveFromLocationId = receival.locationId || fallbackFromWarehouseLocationId;
                            const effectiveFromLocationName = effectiveFromLocationId
                                ? locationNameMap.get(effectiveFromLocationId) || receival.warehouse?.name || null
                                : receival.warehouse?.name || null;

                            return {
                                ...receival,
                                fromLocation: effectiveFromLocationId
                                    ? { id: effectiveFromLocationId, name: effectiveFromLocationName }
                                    : null,
                            };
                        }),
                    },
                    cleaningJobs: (grn.cleaningJobs || []).map((job: any) => {
                        const fromLocationId = CleaningGrnController.extractLocationIdFromWarehouseField(job.fromWarehouse?.location);
                        const toLocationId = CleaningGrnController.extractLocationIdFromWarehouseField(job.toWarehouse?.location);

                        return {
                            ...job,
                            fromLocation: fromLocationId
                                ? { id: fromLocationId, name: locationNameMap.get(fromLocationId) || job.fromWarehouse?.name || null }
                                : null,
                            toLocation: toLocationId
                                ? { id: toLocationId, name: locationNameMap.get(toLocationId) || job.toWarehouse?.name || null }
                                : null,
                        };
                    }),
                    totalReceived,
                    totalTransferred,
                    leftQuantity,
                    allJobsFinished,
                },
            });
        } catch (error) {
            console.error('Error fetching GRN materials:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch GRN materials' });
        }
    }

    /**
     * Create a GRN-wise cleaning transfer with lot number generation
     * Takes: grnId, warehouseId (destination), quantity
     * Generates a lot number, creates cleaning job + cleaning lot
     */
    static async createGRNCleaningTransfer(req: Request, res: Response): Promise<void> {
        try {
            const { grnId, toWarehouseId, toLocationId, quantity } = req.body;

            if (!grnId || (!toWarehouseId && !toLocationId) || !quantity || quantity <= 0) {
                res.status(400).json({ error: 'grnId, toLocationId (or toWarehouseId), and a positive quantity are required' });
                return;
            }

            const effectiveToWarehouseId: string | null = toWarehouseId || (toLocationId ? await CleaningGrnController.resolveWarehouseIdFromLocationId(toLocationId) : null);

            if (!effectiveToWarehouseId) {
                res.status(400).json({ error: 'Could not resolve destination warehouse from toLocationId' });
                return;
            }

            // Fetch GRN with item details
            const grn = await prisma.gRNbyPo.findUnique({
                where: { id: grnId },
                include: {
                    purchaseOrderItem: {
                        include: {
                            rawMaterial: true,
                            receivals: { include: { warehouse: true, location: true } },
                        },
                    },
                    cleaningJobs: true,
                },
            });

            if (!grn) {
                res.status(404).json({ error: 'GRN not found' });
                return;
            }

            const rawMaterialId = grn.purchaseOrderItem.rawMaterialId;
            const totalReceived = grn.purchaseOrderItem.totalReceived || 0;
            const totalTransferred = grn.cleaningJobs.reduce(
                (sum, job) => sum + job.quantity,
                0
            );
            const leftQuantity = totalReceived - totalTransferred;

            if (quantity > leftQuantity) {
                res.status(400).json({
                    error: `Transfer quantity (${quantity}) exceeds available quantity (${leftQuantity})`,
                });
                return;
            }

            // Determine fromWarehouseId (the warehouse where the material was received)
            const latestReceival = grn.purchaseOrderItem.receivals[0];
            if (!latestReceival) {
                res.status(400).json({ error: 'No receival entry found for this GRN' });
                return;
            }

            let fromWarehouseId: string | null = latestReceival.warehouseId ?? null;
            if (!fromWarehouseId && latestReceival.locationId) {
                fromWarehouseId = await CleaningGrnController.resolveWarehouseIdFromLocationId(latestReceival.locationId);
            }

            if (!fromWarehouseId) {
                res.status(400).json({
                    error: 'Could not resolve source warehouse from receival entry location',
                });
                return;
            }

            // Generate cleaning job ID
            const lastJob = await prisma.cleaningJob.findFirst({
                orderBy: { id: 'desc' },
                where: { id: { startsWith: 'CJ' } },
            });
            let nextJobNumber = 1;
            if (lastJob && /^CJ\d+$/.test(lastJob.id)) {
                nextJobNumber = parseInt(lastJob.id.replace('CJ', ''), 10) + 1;
            }
            const newJobId = `CJ${String(nextJobNumber).padStart(5, '0')}`;

            // Generate lot number: LOT-GRNXXXX-YYYYMMDD-XXXX
            const today = new Date();
            const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
            const grnSuffix = grn.grnNumber.replace(/[^A-Z0-9]/gi, '').slice(-6);
            const lotPrefix = `LOT-${grnSuffix}-${dateStr}-`;

            const lastLot = await prisma.cleaningLot.findFirst({
                where: { lotNumber: { startsWith: lotPrefix } },
                orderBy: { lotNumber: 'desc' },
            });
            let lotSeq = 1;
            if (lastLot) {
                const lastSeq = parseInt(lastLot.lotNumber.replace(lotPrefix, ''), 10);
                if (!isNaN(lastSeq)) lotSeq = lastSeq + 1;
            }
            const lotNumber = `${lotPrefix}${String(lotSeq).padStart(4, '0')}`;

            // Transaction: create cleaning job, cleaning lot, update stock
            const result = await prisma.$transaction(async (tx) => {
                // Create cleaning job
                const cleaningJob = await tx.cleaningJob.create({
                    data: {
                        id: newJobId,
                        rawMaterialId,
                        fromWarehouseId,
                        toWarehouseId: effectiveToWarehouseId,
                        quantity,
                        status: 'Sent',
                        startedAt: new Date(),
                        grnId,
                    },
                });

                // Create cleaning lot
                const cleaningLot = await tx.cleaningLot.create({
                    data: {
                        lotNumber,
                        cleaningJobId: cleaningJob.id,
                        grnId,
                        rawMaterialId,
                        warehouseId: effectiveToWarehouseId,
                        quantity,
                        status: 'Active',
                    },
                });

                // Decrement current stock from source warehouse
                await tx.currentStock.update({
                    where: {
                        rawMaterialId_warehouseId: {
                            rawMaterialId,
                            warehouseId: fromWarehouseId,
                        },
                    },
                    data: {
                        currentQuantity: { decrement: quantity },
                    },
                });

                // Create transaction log
                if (req.user?.id) {
                    await tx.transactionLog.create({
                        data: {
                            type: 'CLEANING_TRANSFER',
                            entity: 'CleaningJob',
                            entityId: cleaningJob.id,
                            userId: req.user.id,
                            description: `GRN-wise cleaning transfer: ${quantity} from warehouse to cleaning. GRN: ${grn.grnNumber}, Lot: ${lotNumber}`,
                        },
                    });
                }

                return { cleaningJob, cleaningLot };
            }, { timeout: 30000 });

            // Fetch the full result with relations
            const fullResult = await prisma.cleaningLot.findUnique({
                where: { id: result.cleaningLot.id },
                include: {
                    cleaningJob: {
                        include: { fromWarehouse: true, toWarehouse: true, rawMaterial: true },
                    },
                    grn: true,
                    warehouse: true,
                },
            });

            res.status(201).json({
                success: true,
                data: fullResult,
                message: `Cleaning transfer created. Lot Number: ${lotNumber}`,
            });
        } catch (error) {
            console.error('Error creating GRN cleaning transfer:', error);
            res.status(500).json({ success: false, error: 'Failed to create cleaning transfer' });
        }
    }

    /**
     * Finish cleaning for a specific cleaning job (under a GRN)
     */
    static async finishCleaning(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { stoneWastageQty, stoneWastageUnit, seedWastageQty, seedWastageUnit } = req.body;

            const cleaningJob = await prisma.cleaningJob.findUnique({
                where: { id },
                include: {
                    cleaningLots: {
                        include: {
                            grn: { select: { grnNumber: true } },
                        },
                    },
                    rawMaterial: true,
                },
            });

            if (!cleaningJob) {
                res.status(404).json({ error: 'Cleaning job not found' });
                return;
            }

            const parsedStoneWastageQty = stoneWastageQty ? parseFloat(stoneWastageQty) : 0;
            const parsedStoneWastageUnit = stoneWastageUnit || 'kg';
            const parsedSeedWastageQty = seedWastageQty ? parseFloat(seedWastageQty) : 0;
            const parsedSeedWastageUnit = seedWastageUnit || 'kg';

            const nativeUnit = cleaningJob.rawMaterial?.unitOfMeasurement || 'kg';
            const baseStoneWastage = CleaningGrnController.convertWeight(parsedStoneWastageQty, parsedStoneWastageUnit, nativeUnit);
            const baseSeedWastage = CleaningGrnController.convertWeight(parsedSeedWastageQty, parsedSeedWastageUnit, nativeUnit);

            // Calculate wastage percentage and type
            const totalWastage = baseStoneWastage + baseSeedWastage;
            const transferQty = cleaningJob.quantity || 1; // avoid division by zero
            const wastagePercentage = parseFloat(((totalWastage / transferQty) * 100).toFixed(2));
            // ≤3% => Normal Loss, >3% => Abnormal Loss
            const wastageType = wastagePercentage > 3 ? 'Abnormal Loss' : 'Normal Loss';

            // Look up the dedicated Seed Wastage SKU from Material Master
            let seedWastageSku = 'SEED-WASTAGE';
            if (parsedSeedWastageQty > 0) {
                const seedWastageProduct = await prisma.rawMaterialProduct.findFirst({
                    where: {
                        OR: [
                            { name: { contains: 'Seed Wastage', mode: 'insensitive' } },
                            { name: { contains: 'seed wastage', mode: 'insensitive' } },
                        ]
                    },
                    select: { skuCode: true }
                });
                if (seedWastageProduct) {
                    seedWastageSku = seedWastageProduct.skuCode;
                }
            }

            await prisma.$transaction(async (tx) => {
                // Update cleaning job status + persist stone & seed wastage fields + wastage %
                const jobQty = cleaningJob.quantity || 0;
                const jobCleanedQty = Math.max(0, jobQty - baseStoneWastage - baseSeedWastage);

                await tx.cleaningJob.update({
                    where: { id },
                    data: {
                        status: 'Cleaned',
                        finishedAt: new Date(),
                        stoneWastageQty: parsedStoneWastageQty,
                        stoneWastageUnit: parsedStoneWastageUnit,
                        seedWastageQty: parsedSeedWastageQty,
                        seedWastageUnit: parsedSeedWastageUnit,
                        cleanedQuantity: jobCleanedQty,
                        cleanedQuantityUnit: nativeUnit,
                        wastagePercentage,
                        wastageType,
                    },
                });

                // Update lot status + persist wastage on each lot (lot-wise tracking)
                // Calculate cleaned quantity per lot = lot quantity - stone wastage - seed wastage
                for (const lot of cleaningJob.cleaningLots) {
                    const lotQty = lot.quantity || 0;
                    const cleanedQty = Math.max(0, lotQty - baseStoneWastage - baseSeedWastage);

                    // Calculate lot-level wastage percentage
                    const lotTotalWastage = baseStoneWastage + baseSeedWastage;
                    const lotWastagePercentage = parseFloat(((lotTotalWastage / (lotQty || 1)) * 100).toFixed(2));
                    const lotWastageType = lotWastagePercentage > 3 ? 'Abnormal Loss' : 'Normal Loss';

                    await tx.cleaningLot.update({
                        where: { id: lot.id },
                        data: {
                            status: 'Cleaned',
                            cleanedQuantity: cleanedQty,
                            cleanedQuantityUnit: nativeUnit,
                            stoneWastageQty: parsedStoneWastageQty,
                            stoneWastageUnit: parsedStoneWastageUnit,
                            seedWastageQty: parsedSeedWastageQty,
                            seedWastageUnit: parsedSeedWastageUnit,
                            wastagePercentage: lotWastagePercentage,
                            wastageType: lotWastageType,
                        },
                    });

                    // Create SeedWastageRecord for each lot if seed wastage > 0
                    if (parsedSeedWastageQty > 0) {
                        await tx.seedWastageRecord.create({
                            data: {
                                lotNumber: lot.lotNumber,
                                grnNumber: lot.grn?.grnNumber || '',
                                skuCode: seedWastageSku,
                                quantity: parsedSeedWastageQty,
                                allocatedQuantity: 0,
                                restWastage: parsedSeedWastageQty,
                                unit: parsedSeedWastageUnit,
                                source: 'cleaning',
                            },
                        });
                    }
                }

                // Create transaction log
                if (req.user?.id) {
                    await tx.transactionLog.create({
                        data: {
                            type: 'CLEANING_FINISHED',
                            entity: 'CleaningJob',
                            entityId: cleaningJob.id,
                            userId: req.user.id,
                            description: `Cleaning finished for job ${cleaningJob.id}. Stone Wastage: ${parsedStoneWastageQty} ${parsedStoneWastageUnit}, Seed Wastage: ${parsedSeedWastageQty} ${parsedSeedWastageUnit}`,
                        },
                    });
                }
            }, { timeout: 30000 });

            // Fetch updated job
            const updatedJob = await prisma.cleaningJob.findUnique({
                where: { id },
                include: {
                    rawMaterial: true,
                    fromWarehouse: true,
                    toWarehouse: true,
                    cleaningLots: { include: { warehouse: true } },
                },
            });

            res.json({ success: true, data: updatedJob, message: 'Cleaning finished successfully' });
        } catch (error) {
            console.error('Error finishing cleaning:', error);
            res.status(500).json({ success: false, error: 'Failed to finish cleaning' });
        }
    }



    /**
     * Get all cleaning lots (optionally filter by grnId)
     */
    static async getCleaningLots(req: Request, res: Response): Promise<void> {
        try {
            const { grnId } = req.query;
            const where: any = {};
            if (grnId) where.grnId = grnId;

            const lots = await prisma.cleaningLot.findMany({
                where,
                include: {
                    cleaningJob: {
                        include: {
                            fromWarehouse: true,
                            toWarehouse: true,
                            rawMaterial: true,
                        },
                    },
                    grn: true,
                    warehouse: true,
                    rawMaterial: true,
                },
                orderBy: { createdAt: 'desc' },
            });

            res.json({ success: true, data: lots });
        } catch (error) {
            console.error('Error fetching cleaning lots:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch cleaning lots' });
        }
    }
}
