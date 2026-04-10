"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseOrderController = void 0;
const prisma_1 = require("../../generated/prisma");
const prisma = new prisma_1.PrismaClient();
class PurchaseOrderController {
    static async resolveWarehouseIdFromLocationId(locationId) {
        const location = await prisma.location.findUnique({ where: { id: locationId } });
        if (!location)
            return null;
        const locationMarker = `LOC:${location.id}`;
        const existingWarehouse = await prisma.warehouse.findFirst({
            where: { location: locationMarker },
            select: { id: true },
        });
        if (existingWarehouse)
            return existingWarehouse.id;
        const createdWarehouse = await prisma.warehouse.create({
            data: {
                name: location.name,
                location: locationMarker,
            },
            select: { id: true },
        });
        return createdWarehouse.id;
    }
    static async resolveLocationIdFromInput(locationId, warehouseId) {
        if (locationId) {
            const location = await prisma.location.findUnique({ where: { id: locationId } });
            return location && location.enabled ? location.id : null;
        }
        if (!warehouseId)
            return null;
        const warehouse = await prisma.warehouse.findUnique({
            where: { id: warehouseId },
            select: { id: true, name: true, location: true },
        });
        if (!warehouse)
            return null;
        if (warehouse.location?.startsWith('LOC:')) {
            const mappedLocationId = warehouse.location.replace('LOC:', '');
            const mappedLocation = await prisma.location.findUnique({ where: { id: mappedLocationId } });
            if (mappedLocation)
                return mappedLocation.id;
        }
        const code = `LOC-${Date.now()}`;
        const createdLocation = await prisma.location.create({
            data: {
                code,
                name: warehouse.name,
                type: 'WAREHOUSE',
                enabled: true,
            },
            select: { id: true },
        });
        await prisma.warehouse.update({
            where: { id: warehouse.id },
            data: { location: `LOC:${createdLocation.id}` },
        });
        return createdLocation.id;
    }
    // Create a new purchase order with items
    static async createPurchaseOrder(req, res) {
        try {
            const { vendorId, orderDate, expectedDate, items } = req.body;
            const poNumber = `PO-${Date.now()}`;
            const purchaseOrder = await prisma.purchaseOrder.create({
                data: {
                    poNumber,
                    vendorId,
                    orderDate: new Date(orderDate),
                    expectedDate: new Date(expectedDate),
                    status: 'Created',
                    items: {
                        create: items.map((item) => ({
                            rawMaterialId: item.rawMaterialId,
                            quantityOrdered: item.quantityOrdered,
                            quantityUnit: item.quantityUnit || 'KG',
                            rate: item.rate,
                            status: 'PENDING',
                            totalReceived: 0,
                        })),
                    },
                },
                include: { items: true },
            });
            await prisma.transactionLog.create({
                data: {
                    type: 'CREATE',
                    entity: 'PurchaseOrder',
                    entityId: purchaseOrder.id,
                    userId: req.user?.id || 'system',
                    description: `Created purchase order: ${poNumber}`,
                },
            });
            res.status(201).json(purchaseOrder);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to create purchase order', details: error });
        }
    }
    // Get all purchase orders (with optional filter by vendor or status)
    static async getPurchaseOrders(req, res) {
        try {
            const { vendorId, status } = req.query;
            const where = {};
            if (vendorId)
                where.vendorId = vendorId;
            if (status)
                where.status = status;
            const purchaseOrders = await prisma.purchaseOrder.findMany({
                where,
                include: {
                    vendor: true,
                    items: {
                        include: {
                            rawMaterial: true,
                            receivals: {
                                include: {
                                    bags: true,
                                    warehouse: true,
                                },
                                orderBy: { receivedDate: 'desc' },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
            // Auto-correct stale statuses
            const corrections = [];
            for (const po of purchaseOrders) {
                for (const item of po.items) {
                    let correctStatus = null;
                    if (item.totalReceived >= item.quantityOrdered && item.status !== 'RECEIVED') {
                        correctStatus = 'RECEIVED';
                    }
                    else if (item.totalReceived > 0 && item.totalReceived < item.quantityOrdered && item.status === 'PENDING') {
                        correctStatus = 'PARTIALLY_RECEIVED';
                    }
                    if (correctStatus) {
                        item.status = correctStatus;
                        corrections.push(prisma.purchaseOrderItem.update({
                            where: { id: item.id },
                            data: { status: correctStatus },
                        }));
                    }
                }
            }
            if (corrections.length > 0) {
                await Promise.all(corrections).catch(() => { });
            }
            res.json(purchaseOrders);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch purchase orders', details: error });
        }
    }
    // Get a single purchase order by ID
    static async getPurchaseOrderById(req, res) {
        try {
            const { id } = req.params;
            const purchaseOrder = await prisma.purchaseOrder.findUnique({
                where: { id },
                include: {
                    vendor: true,
                    items: {
                        include: {
                            rawMaterial: true,
                            receivals: {
                                include: {
                                    bags: true,
                                    warehouse: true,
                                },
                                orderBy: { receivedDate: 'desc' },
                            },
                        },
                    },
                },
            });
            if (!purchaseOrder) {
                res.status(404).json({ error: 'Purchase order not found' });
                return;
            }
            res.json(purchaseOrder);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch purchase order', details: error });
        }
    }
    // Update purchase order status or details
    static async updatePurchaseOrder(req, res) {
        try {
            const { id } = req.params;
            const { status, expectedDate } = req.body;
            const purchaseOrder = await prisma.purchaseOrder.update({
                where: { id },
                data: {
                    status,
                    expectedDate: expectedDate ? new Date(expectedDate) : undefined,
                },
            });
            await prisma.transactionLog.create({
                data: {
                    type: 'UPDATE',
                    entity: 'PurchaseOrder',
                    entityId: purchaseOrder.id,
                    userId: req.user?.id || 'system',
                    description: `Updated purchase order: ${purchaseOrder.poNumber}`,
                },
            });
            res.json(purchaseOrder);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to update purchase order', details: error });
        }
    }
    // Receive items for a purchase order item (partial or full)
    static async updatePurchaseOrderItem(req, res) {
        try {
            const { itemId } = req.params;
            const { warehouseId, locationId, weightMode, bags, totalWeight, numberOfBags, notes, finalizeWithoutReceival, } = req.body;
            // 1. Fetch the current item with its receivals
            const item = await prisma.purchaseOrderItem.findUnique({
                where: { id: itemId },
                include: {
                    receivals: true,
                    rawMaterial: true,
                    purchaseOrder: true,
                },
            });
            if (!item) {
                res.status(404).json({ error: 'Purchase order item not found' });
                return;
            }
            // 2. If already RECEIVED, block further receiving
            if (item.status === 'RECEIVED') {
                res.status(400).json({
                    error: 'This item has already been fully received. No further receiving is allowed.',
                });
                return;
            }
            // If client requests to finalize without creating a receival entry
            if (finalizeWithoutReceival) {
                const updatedItem = await prisma.purchaseOrderItem.update({
                    where: { id: itemId },
                    data: { status: 'RECEIVED' },
                    include: {
                        rawMaterial: true,
                        purchaseOrder: true,
                        receivals: { include: { bags: true, warehouse: true }, orderBy: { receivedDate: 'desc' } },
                    },
                });
                // Transaction log (non-blocking)
                if (req.user?.id) {
                    try {
                        await prisma.transactionLog.create({
                            data: {
                                type: 'RECEIVE',
                                entity: 'PurchaseOrderItem',
                                entityId: item.id,
                                userId: req.user.id,
                                description: `Marked as RECEIVED without additional receival for PO: ${item.purchaseOrder.poNumber}, Material: ${item.rawMaterial.name}.`,
                            },
                        });
                    }
                    catch (logError) {
                        console.warn('Failed to create transaction log:', logError);
                    }
                }
                res.json(updatedItem);
                return;
            }
            const effectiveLocationId = await PurchaseOrderController.resolveLocationIdFromInput(locationId, warehouseId);
            if (!effectiveLocationId) {
                res.status(400).json({ error: 'locationId or a valid warehouseId is required' });
                return;
            }
            const effectiveWarehouseId = await PurchaseOrderController.resolveWarehouseIdFromLocationId(effectiveLocationId);
            if (!effectiveWarehouseId) {
                res.status(400).json({ error: 'Unable to resolve warehouse mapping for selected location' });
                return;
            }
            // 3. Calculate weight for this receival
            let receivalWeight = 0;
            let bagData = [];
            if (weightMode === 'INDIVIDUAL') {
                if (!bags || !Array.isArray(bags) || bags.length === 0) {
                    res.status(400).json({ error: 'bags array is required for INDIVIDUAL weight mode' });
                    return;
                }
                receivalWeight = bags.reduce((sum, b) => sum + (b.bagWeight || 0), 0);
                bagData = bags.map((b, idx) => ({
                    bagNo: b.bagNo || idx + 1,
                    bagWeight: b.bagWeight,
                }));
            }
            else {
                if (!totalWeight || totalWeight <= 0) {
                    res.status(400).json({ error: 'totalWeight is required for TOTAL weight mode' });
                    return;
                }
                receivalWeight = totalWeight;
                if (numberOfBags && numberOfBags > 0) {
                    const weightPerBag = totalWeight / numberOfBags;
                    bagData = Array.from({ length: numberOfBags }, (_, i) => ({
                        bagNo: i + 1,
                        bagWeight: parseFloat(weightPerBag.toFixed(2)),
                    }));
                }
            }
            const newTotalReceived = item.totalReceived + receivalWeight;
            // 4. Determine the final status based on quantity comparison
            let finalStatus;
            if (newTotalReceived >= item.quantityOrdered) {
                finalStatus = 'RECEIVED';
            }
            else if (newTotalReceived > 0) {
                finalStatus = 'PARTIALLY_RECEIVED';
            }
            else {
                finalStatus = 'PENDING';
            }
            // 5. Create the receival entry in a transaction (30s timeout for remote DB)
            const result = await prisma.$transaction(async (tx) => {
                const receivalEntry = await tx.receivalEntry.create({
                    data: {
                        purchaseOrderItemId: itemId,
                        locationId: effectiveLocationId,
                        warehouseId: effectiveWarehouseId,
                        weightMode: weightMode === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'TOTAL',
                        totalWeight: receivalWeight,
                        notes,
                        bags: bagData.length > 0
                            ? { create: bagData }
                            : undefined,
                    },
                    include: { bags: true, warehouse: true },
                });
                const updatedItem = await tx.purchaseOrderItem.update({
                    where: { id: itemId },
                    data: {
                        totalReceived: newTotalReceived,
                        status: finalStatus,
                    },
                    include: {
                        rawMaterial: true,
                        purchaseOrder: true,
                        receivals: {
                            include: { bags: true, warehouse: true },
                            orderBy: { receivedDate: 'desc' },
                        },
                    },
                });
                const currentStock = await tx.currentStock.findUnique({
                    where: {
                        rawMaterialId_warehouseId: {
                            rawMaterialId: item.rawMaterialId,
                            warehouseId: effectiveWarehouseId,
                        },
                    },
                });
                if (currentStock) {
                    await tx.currentStock.update({
                        where: {
                            rawMaterialId_warehouseId: {
                                rawMaterialId: item.rawMaterialId,
                                warehouseId: effectiveWarehouseId,
                            },
                        },
                        data: {
                            currentQuantity: { increment: receivalWeight },
                            quantityUnit: item.quantityUnit || 'KG',
                        },
                    });
                }
                else {
                    await tx.currentStock.create({
                        data: {
                            rawMaterialId: item.rawMaterialId,
                            warehouseId: effectiveWarehouseId,
                            currentQuantity: receivalWeight,
                            quantityUnit: item.quantityUnit || 'KG',
                        },
                    });
                }
                await tx.stockEntry.create({
                    data: {
                        rawMaterialId: item.rawMaterialId,
                        warehouseId: effectiveWarehouseId,
                        quantity: receivalWeight,
                        entryType: 'IN',
                        referenceId: receivalEntry.id,
                        status: 'Received',
                    },
                });
                // Transaction log (non-blocking)
                if (req.user?.id) {
                    try {
                        await tx.transactionLog.create({
                            data: {
                                type: 'RECEIVE',
                                entity: 'PurchaseOrderItem',
                                entityId: item.id,
                                userId: req.user.id,
                                description: `Received ${receivalWeight} for PO: ${item.purchaseOrder.poNumber}, Material: ${item.rawMaterial.name}. Status: ${finalStatus}. Mode: ${weightMode}`,
                            },
                        });
                    }
                    catch (logError) {
                        console.warn('Failed to create transaction log:', logError);
                    }
                }
                return updatedItem;
            }, { timeout: 30000, maxWait: 10000 });
            res.json(result);
        }
        catch (error) {
            console.error('Error receiving purchase order item:', error);
            res.status(500).json({
                error: 'Failed to receive purchase order item',
                message: error?.message || 'Unknown error',
                code: error?.code,
            });
        }
    }
    // Get receival history for a specific item
    static async getReceivalHistory(req, res) {
        try {
            const { itemId } = req.params;
            const receivals = await prisma.receivalEntry.findMany({
                where: { purchaseOrderItemId: itemId },
                include: {
                    bags: true,
                    warehouse: true,
                },
                orderBy: { receivedDate: 'desc' },
            });
            res.json(receivals);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch receival history', details: error });
        }
    }
    // Get all current stock items
    static async getAllPurchaseOrderItems(req, res) {
        try {
            const stocks = await prisma.currentStock.findMany({
                include: {
                    rawMaterial: true,
                    warehouse: true,
                },
                orderBy: { lastUpdated: 'desc' },
            });
            const result = stocks.map((stock) => ({
                rawMaterialId: stock.rawMaterialId,
                materialName: stock.rawMaterial.name,
                warehouseId: stock.warehouseId,
                warehouseName: stock.warehouse.name,
                currentQuantity: stock.currentQuantity,
                lastUpdated: stock.lastUpdated,
                unitOfMeasurement: stock.quantityUnit || stock.rawMaterial.unitOfMeasurement,
                quantityUnit: stock.quantityUnit,
            }));
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch current stock', details: error });
        }
    }
    static async getReceivedRawMaterials(req, res) {
        try {
            const receivedItems = await prisma.purchaseOrderItem.findMany({
                where: {
                    status: { in: ['RECEIVED', 'PARTIALLY_RECEIVED'] },
                },
                include: {
                    rawMaterial: true,
                    purchaseOrder: {
                        include: {
                            vendor: true,
                        },
                    },
                },
                orderBy: {
                    purchaseOrder: {
                        orderDate: 'desc',
                    },
                },
            });
            const uniqueRawMaterials = Array.from(new Map(receivedItems.map((item) => [
                item.rawMaterial.id,
                {
                    id: item.rawMaterial.id,
                    name: item.rawMaterial.name,
                    skuCode: item.rawMaterial.skuCode,
                    category: item.rawMaterial.category,
                    unitOfMeasurement: item.rawMaterial.unitOfMeasurement,
                },
            ])).values());
            res.json(uniqueRawMaterials);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch received raw materials', details: error });
        }
    }
    // Get vendors from received orders
    static async getVendorsFromReceivedOrders(req, res) {
        try {
            const receivedOrders = await prisma.purchaseOrder.findMany({
                where: {
                    items: {
                        some: {
                            status: { in: ['RECEIVED', 'PARTIALLY_RECEIVED'] },
                        },
                    },
                },
                include: {
                    vendor: true,
                },
                distinct: ['vendorId'],
            });
            const uniqueVendors = Array.from(new Map(receivedOrders.map((order) => [
                order.vendor.id,
                {
                    id: order.vendor.id,
                    name: order.vendor.name,
                    vendorCode: order.vendor.vendorCode,
                },
            ])).values());
            res.json(uniqueVendors);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch vendors from received orders', details: error });
        }
    }
    // Delete a purchase order
    static async deletePurchaseOrder(req, res) {
        try {
            const { id } = req.params;
            const po = await prisma.purchaseOrder.findUnique({
                where: { id },
                include: { items: { include: { receivals: true } } },
            });
            if (!po) {
                res.status(404).json({ error: 'Purchase order not found' });
                return;
            }
            const hasReceivals = po.items.some((item) => item.receivals.length > 0);
            if (hasReceivals) {
                res.status(400).json({ error: 'Cannot delete a purchase order that has received items' });
                return;
            }
            await prisma.$transaction(async (tx) => {
                await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
                await tx.purchaseOrder.delete({ where: { id } });
                await tx.transactionLog.create({
                    data: {
                        type: 'DELETE',
                        entity: 'PurchaseOrder',
                        entityId: id,
                        userId: req.user?.id || 'system',
                        description: `Deleted purchase order: ${po.poNumber}`,
                    },
                });
            });
            res.json({ message: 'Purchase order deleted successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to delete purchase order', details: error });
        }
    }
}
exports.PurchaseOrderController = PurchaseOrderController;
