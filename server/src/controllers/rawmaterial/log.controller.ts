import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
const prisma = new PrismaClient();

export class TransactionLogController {
  // Get all transaction logs, with optional filters
  static async getAllTransactionLogs(req: Request, res: Response) {
    try {
      const { entity, type, userId } = req.query;
      const where: any = {};
      if (entity) where.entity = entity;
      if (type) where.type = type;
      if (userId) where.userId = userId;

      const logs = await prisma.transactionLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { user: true }, // To get user details
      });

      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch transaction logs', details: error });
    }
  }
}