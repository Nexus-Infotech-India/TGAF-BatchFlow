import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
const prisma = new PrismaClient();

export class VendorController {
  // Create a new vendor
  static async createVendor(req: Request, res: Response) {
    try {
      const {
        name,
        address,
        contactPerson,
        contactNumber,
        email,
        bankName,
        accountHolder,
        accountNo,
      } = req.body;

      // Generate a unique vendor code (e.g., VEND-<timestamp>)
      const vendorCode = `VEND-${Date.now()}`;

      const vendor = await prisma.vendor.create({
        data: {
          vendorCode,
          name,
          address,
          contactPerson,
          contactNumber,
          email,
          bankName,
          accountHolder,
          accountNo,
          enabled: true,
        },
      });

      await prisma.transactionLog.create({
        data: {
          type: 'CREATE',
          entity: 'Vendor',
          entityId: vendor.id,
          userId: req.user?.id || 'system',
          description: `Created vendor: ${vendor.name}\nDetails: ${JSON.stringify(vendor, null, 2)}`,
        },
      });

      res.status(201).json(vendor);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create vendor', details: error });
    }
  }

  // Get all vendors (with optional filter for enabled/disabled)
  static async getVendors(req: Request, res: Response) {
    try {
      const { enabled } = req.query;
      const where: any = {};
      if (enabled !== undefined) {
        where.enabled = enabled === 'true';
      }
      const vendors = await prisma.vendor.findMany({ where });
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch vendors', details: error });
    }
  }

  // Get a single vendor by ID
  static async getVendorById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const vendor = await prisma.vendor.findUnique({ where: { id } });
      if (!vendor) {
        res.status(404).json({ error: 'Vendor not found' });
        return;
      }
      res.json(vendor);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch vendor', details: error });
    }
  }

  // Update vendor details
  static async updateVendor(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        name,
        address,
        contactPerson,
        contactNumber,
        email,
        bankName,
        accountHolder,
        accountNo,
        enabled,
      } = req.body;

      const vendor = await prisma.vendor.update({
        where: { id },
        data: {
          name,
          address,
          contactPerson,
          contactNumber,
          email,
          bankName,
          accountHolder,
          accountNo,
          enabled,
        },
      });

      await prisma.transactionLog.create({
        data: {
          type: 'UPDATE',
          entity: 'Vendor',
          entityId: vendor.id,
          userId: req.user?.id || 'system',
          description: `Updated vendor: ${vendor.name}\nDetails: ${JSON.stringify(vendor, null, 2)}`,
        },
      });

      res.json(vendor);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update vendor', details: error });
    }
  }

  // Enable or disable a vendor
  static async setVendorStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { enabled } = req.body;
      const vendor = await prisma.vendor.update({
        where: { id },
        data: { enabled: Boolean(enabled) },
      });
      await prisma.transactionLog.create({
        data: {
          type: 'UPDATE',
          entity: 'Vendor',
          entityId: vendor.id,
          userId: req.user?.id || 'system',
          description: `Set vendor status: ${vendor.name} (enabled: ${vendor.enabled})\nDetails: ${JSON.stringify(vendor, null, 2)}`,
        },
      });
      res.json(vendor);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update vendor status', details: error });
    }
  }
}