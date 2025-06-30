import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
const prisma = new PrismaClient();

export class CleaningJobController {
  // Create a new cleaning job
  static async createCleaningJob(req: Request, res: Response) {
    try {
      const {
        rawMaterialId,
        fromWarehouseId,
        toWarehouseId,
        quantity,
        status,
        startedAt,
        finishedAt,
      } = req.body;

      const cleaningJob = await prisma.cleaningJob.create({
        data: {
          rawMaterialId,
          fromWarehouseId,
          toWarehouseId,
          quantity,
          status,
          startedAt: new Date(startedAt),
          finishedAt: finishedAt ? new Date(finishedAt) : undefined,
        },
      });

      res.status(201).json(cleaningJob);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create cleaning job', details: error });
    }
  }

  // Get all cleaning jobs
  static async getCleaningJobs(req: Request, res: Response) {
    try {
      const cleaningJobs = await prisma.cleaningJob.findMany({
        include: { rawMaterial: true, fromWarehouse: true, toWarehouse: true },
      });
      res.json(cleaningJobs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch cleaning jobs', details: error });
    }
  }

  // Get a single cleaning job by ID
  static async getCleaningJobById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const cleaningJob = await prisma.cleaningJob.findUnique({
        where: { id },
        include: { rawMaterial: true, fromWarehouse: true, toWarehouse: true },
      });
      if (!cleaningJob) {
         res.status(404).json({ error: 'Cleaning job not found' });
      }
      res.json(cleaningJob);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch cleaning job', details: error });
    }
  }

  // Update cleaning job
  static async updateCleaningJob(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        quantity,
        status,
        startedAt,
        finishedAt,
      } = req.body;

      const cleaningJob = await prisma.cleaningJob.update({
        where: { id },
        data: {
          quantity,
          status,
          startedAt: startedAt ? new Date(startedAt) : undefined,
          finishedAt: finishedAt ? new Date(finishedAt) : undefined,
        },
      });

      res.json(cleaningJob);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update cleaning job', details: error });
    }
  }
}