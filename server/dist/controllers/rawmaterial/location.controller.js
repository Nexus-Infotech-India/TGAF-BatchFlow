"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationController = void 0;
const prisma_1 = require("../../generated/prisma");
const prisma = new prisma_1.PrismaClient();
class LocationController {
    // Create a new location
    static async createLocation(req, res) {
        try {
            const { name, type, address, description } = req.body;
            if (!name || !type) {
                res.status(400).json({ error: 'name and type are required' });
                return;
            }
            const code = `LOC-${Date.now()}`;
            const location = await prisma.location.create({
                data: {
                    code,
                    name,
                    type,
                    address: address || null,
                    description: description || null,
                    enabled: true,
                },
            });
            await prisma.transactionLog.create({
                data: {
                    type: 'CREATE',
                    entity: 'Location',
                    entityId: location.id,
                    userId: req.user?.id || 'system',
                    description: `Created location: ${location.name} (${location.code})\nType: ${location.type}\nDetails: ${JSON.stringify(location, null, 2)}`,
                },
            });
            res.status(201).json(location);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to create location', details: error });
        }
    }
    // Get all locations (with optional filters)
    static async getLocations(req, res) {
        try {
            const { enabled, type } = req.query;
            const where = {};
            if (enabled !== undefined) {
                where.enabled = enabled === 'true';
            }
            if (type) {
                where.type = type;
            }
            const locations = await prisma.location.findMany({
                where,
                orderBy: { createdAt: 'desc' },
            });
            res.json(locations);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch locations', details: error });
        }
    }
    // Get a single location by ID
    static async getLocationById(req, res) {
        try {
            const { id } = req.params;
            const location = await prisma.location.findUnique({ where: { id } });
            if (!location) {
                res.status(404).json({ error: 'Location not found' });
                return;
            }
            res.json(location);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch location', details: error });
        }
    }
    // Update location details
    static async updateLocation(req, res) {
        try {
            const { id } = req.params;
            const { name, type, address, description, enabled } = req.body;
            const location = await prisma.location.update({
                where: { id },
                data: {
                    name,
                    type,
                    address,
                    description,
                    enabled,
                },
            });
            await prisma.transactionLog.create({
                data: {
                    type: 'UPDATE',
                    entity: 'Location',
                    entityId: location.id,
                    userId: req.user?.id || 'system',
                    description: `Updated location: ${location.name} (${location.code})\nDetails: ${JSON.stringify(location, null, 2)}`,
                },
            });
            res.json(location);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to update location', details: error });
        }
    }
    // Enable or disable a location
    static async setLocationStatus(req, res) {
        try {
            const { id } = req.params;
            const { enabled } = req.body;
            const location = await prisma.location.update({
                where: { id },
                data: { enabled: Boolean(enabled) },
            });
            await prisma.transactionLog.create({
                data: {
                    type: 'UPDATE',
                    entity: 'Location',
                    entityId: location.id,
                    userId: req.user?.id || 'system',
                    description: `Set location status: ${location.name} (enabled: ${location.enabled})`,
                },
            });
            res.json(location);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to update location status', details: error });
        }
    }
}
exports.LocationController = LocationController;
