"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FGPackagingController = void 0;
const prisma_1 = require("../../generated/prisma");
const prisma = new prisma_1.PrismaClient();
class FGPackagingController {
    // Get all FG Packaging settings, with product relation
    static async getFGPackagingSettings(req, res) {
        try {
            const settings = await prisma.fGPackagingMaster.findMany({
                include: {
                    rawMaterial: true,
                },
            });
            res.json({ success: true, data: settings });
        }
        catch (error) {
            console.error('Error fetching FG Packaging settings:', error);
            res.status(500).json({ error: 'Failed to fetch FG Packaging settings' });
        }
    }
    // Get packaging info for a specific product ID
    static async getFGPackagingByProductId(req, res) {
        try {
            const { productId } = req.params;
            const setting = await prisma.fGPackagingMaster.findUnique({
                where: { rawMaterialId: productId },
                include: { rawMaterial: true },
            });
            if (!setting) {
                res.status(404).json({ error: 'Packaging setting not found for this product' });
                return;
            }
            res.json({ success: true, data: setting });
        }
        catch (error) {
            console.error('Error fetching packaging setting by product ID:', error);
            res.status(500).json({ error: 'Failed to fetch' });
        }
    }
    // Create or Update packaging setting for a product (UPSERT)
    static async upsertFGPackagingSetting(req, res) {
        try {
            const { rawMaterialId, packetSize, packetUnit, cartonCapacity } = req.body;
            if (!rawMaterialId || !packetSize || !packetUnit || !cartonCapacity) {
                res.status(400).json({ error: 'All fields are required.' });
                return;
            }
            // Ensure product exists and is a FINISHED_GOOD (optional check, but good for data integrity)
            const product = await prisma.rawMaterialProduct.findUnique({
                where: { id: rawMaterialId }
            });
            if (!product) {
                res.status(404).json({ error: 'Product not found.' });
                return;
            }
            const upsertedSetting = await prisma.fGPackagingMaster.upsert({
                where: { rawMaterialId },
                update: {
                    packetSize: Number(packetSize),
                    packetUnit,
                    cartonCapacity: Number(cartonCapacity),
                },
                create: {
                    rawMaterialId,
                    packetSize: Number(packetSize),
                    packetUnit,
                    cartonCapacity: Number(cartonCapacity),
                },
            });
            res.status(201).json({ success: true, data: upsertedSetting });
        }
        catch (error) {
            console.error('Error saving FG Packaging setting:', error);
            res.status(500).json({ error: 'Failed to save FG Packaging setting' });
        }
    }
    // Delete a packaging setting
    static async deleteFGPackagingSetting(req, res) {
        try {
            const { id } = req.params;
            await prisma.fGPackagingMaster.delete({
                where: { id },
            });
            res.json({ success: true, message: 'Deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting packaging setting:', error);
            res.status(500).json({ error: 'Failed to delete' });
        }
    }
}
exports.FGPackagingController = FGPackagingController;
