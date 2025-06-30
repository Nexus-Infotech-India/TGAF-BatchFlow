import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
const prisma = new PrismaClient();

export class ProcessingJobController {
  // Create a new processing job
  static async createProcessingJob(req: Request, res: Response) {
    try {
      const {
        inputRawMaterialId,
        outputSkuId,
        quantityInput,
        quantityOutput,
        conversionRatio,
        startedAt,
        finishedAt,
        status,
      } = req.body;

      const processingJob = await prisma.processingJob.create({
        data: {
          inputRawMaterialId,
          outputSkuId,
          quantityInput,
          quantityOutput,
          conversionRatio,
          startedAt: new Date(startedAt),
          finishedAt: finishedAt ? new Date(finishedAt) : undefined,
          status,
        },
      });

      res.status(201).json(processingJob);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create processing job', details: error });
    }
  }

  // Get all processing jobs
  static async getProcessingJobs(req: Request, res: Response) {
    try {
      const processingJobs = await prisma.processingJob.findMany({
        include: { inputRawMaterial: true, outputSku: true },
      });
      res.json(processingJobs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch processing jobs', details: error });
    }
  }

  // Get a single processing job by ID
  static async getProcessingJobById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const processingJob = await prisma.processingJob.findUnique({
        where: { id },
        include: { inputRawMaterial: true, outputSku: true },
      });
      if (!processingJob) {
         res.status(404).json({ error: 'Processing job not found' });
      }
      res.json(processingJob);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch processing job', details: error });
    }
  }

  // Update processing job
  static async updateProcessingJob(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        quantityInput,
        quantityOutput,
        conversionRatio,
        startedAt,
        finishedAt,
        status,
      } = req.body;

      const processingJob = await prisma.processingJob.update({
        where: { id },
        data: {
          quantityInput,
          quantityOutput,
          conversionRatio,
          startedAt: startedAt ? new Date(startedAt) : undefined,
          finishedAt: finishedAt ? new Date(finishedAt) : undefined,
          status,
        },
      });

      res.json(processingJob);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update processing job', details: error });
    }
  }
}