import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '../../generated/prisma';

const prisma = new PrismaClient();

export class RMQualityController {
    // Create RM Quality Report
    static async createQualityReport(req: Request, res: Response): Promise<void> {
        try {
            const { rawMaterialName, variety, supplier, grn, parameters } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                 res.status(401).json({ error: 'User not authenticated' });
                return;
            }

            const qualityReport = await prisma.rMQualityReport.create({
                data: {
                    rawMaterialName,
                    variety,
                    supplier,
                    grn,
                    createdById: userId,
                    parameters: {
                        create: parameters.map((param: any) => ({
                            parameter: param.parameter,
                            standard: param.standard,
                            result: param.result,
                        })),
                    },
                },
                include: {
                    parameters: true,
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            res.status(201).json({
                success: true,
                data: qualityReport,
                message: 'RM Quality Report created successfully',
            });
        } catch (error) {
            console.error('Error creating RM Quality Report:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create RM Quality Report',
            });
        }
    }

    // Get all RM Quality Reports
    static async getQualityReports(req: Request, res: Response) {
        try {
            const { page = 1, limit = 10, search = '' } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            const where = search
                ? {
                    OR: [
                        { rawMaterialName: { contains: search as string, mode: Prisma.QueryMode.insensitive } },
                        { variety: { contains: search as string, mode: Prisma.QueryMode.insensitive } },
                        { supplier: { contains: search as string, mode: Prisma.QueryMode.insensitive } },
                        { grn: { contains: search as string, mode: Prisma.QueryMode.insensitive } },
                    ],
                }
                : {};

            const [reports, total] = await Promise.all([
                prisma.rMQualityReport.findMany({
                    where,
                    skip,
                    take: Number(limit),
                    include: {
                        parameters: true,
                        createdBy: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.rMQualityReport.count({ where }),
            ]);

            res.json({
                success: true,
                data: reports,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            });
        } catch (error) {
            console.error('Error fetching RM Quality Reports:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch RM Quality Reports',
            });
        }
    }

    // Get single RM Quality Report
    static async getQualityReportById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const report = await prisma.rMQualityReport.findUnique({
                where: { id },
                include: {
                    parameters: true,
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            if (!report) {
                 res.status(404).json({
                    success: false,
                    error: 'RM Quality Report not found',
                });
                return;
            }

            res.json({
                success: true,
                data: report,
            });
        } catch (error) {
            console.error('Error fetching RM Quality Report:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch RM Quality Report',
            });
        }
    }

    // Update RM Quality Report
    static async updateQualityReport(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { rawMaterialName, variety, supplier, grn, parameters } = req.body;

            // First, delete existing parameters
            await prisma.rMQualityParameter.deleteMany({
                where: { reportId: id },
            });

            // Update report and create new parameters
            const updatedReport = await prisma.rMQualityReport.update({
                where: { id },
                data: {
                    rawMaterialName,
                    variety,
                    supplier,
                    grn,
                    parameters: {
                        create: parameters.map((param: any) => ({
                            parameter: param.parameter,
                            standard: param.standard,
                            result: param.result,
                        })),
                    },
                },
                include: {
                    parameters: true,
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            res.json({
                success: true,
                data: updatedReport,
                message: 'RM Quality Report updated successfully',
            });
        } catch (error) {
            console.error('Error updating RM Quality Report:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update RM Quality Report',
            });
        }
    }

    // Delete RM Quality Report
    static async deleteQualityReport(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await prisma.rMQualityReport.delete({
                where: { id },
            });

            res.json({
                success: true,
                message: 'RM Quality Report deleted successfully',
            });
        } catch (error) {
            console.error('Error deleting RM Quality Report:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete RM Quality Report',
            });
        }
    }

    // Export RM Quality Report as PDF
    static async exportQualityReport(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const report = await prisma.rMQualityReport.findUnique({
                where: { id },
                include: {
                    parameters: true,
                    createdBy: {
                        select: {
                            name: true,
                        },
                    },
                },
            });

            if (!report) {
                 res.status(404).json({
                    success: false,
                    error: 'RM Quality Report not found',
                });
                return;
            }

            // Here you would implement PDF generation logic
            // For now, we'll return the data for frontend PDF generation
            res.json({
                success: true,
                data: report,
                message: 'Report data ready for export',
            });
        } catch (error) {
            console.error('Error exporting RM Quality Report:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to export RM Quality Report',
            });
        }
    }
}