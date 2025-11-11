import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '../../generated/prisma';
import ExcelJS from 'exceljs';
import puppeteer from 'puppeteer';

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

    // Export RM Quality Report as excel
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

            // Format based on requested export type
            const exportType = req.query.format || 'excel';

            if (exportType === 'excel') {
                // Create Excel workbook and worksheet
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('RM Quality Report');

                // Set column widths
                worksheet.columns = [
                    { header: '', key: 'attribute', width: 20 },
                    { header: '', key: 'value', width: 30 }
                ];

                // Style for headers
                const headerStyle = {
                    font: { bold: true, size: 14, color: { argb: '4472C4' } },
                    fill: {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'EBF1DE' } // Light yellow like the image
                    }
                };

                // Add title
                const titleRow = worksheet.addRow(['RM Quality Report', '']);
                titleRow.font = { bold: true, size: 16 };
                titleRow.getCell(1).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'EBF1DE' } // Light yellow background
                };
                worksheet.mergeCells('A1:B1');
                titleRow.height = 30;
                titleRow.alignment = { vertical: 'middle', horizontal: 'center' };

                // Add empty row
                worksheet.addRow([]);

                // Add basic information
                worksheet.addRow(['Raw Material', report.rawMaterialName]).font = { bold: true };
                worksheet.addRow(['Variety', report.variety]);
                worksheet.addRow(['Supplier', report.supplier]);
                worksheet.addRow(['GRN', report.grn]);
                worksheet.addRow(['Date of Receipt', new Date(report.dateOfReport).toLocaleDateString()]);
                worksheet.addRow(['Created By', report.createdBy?.name || '']);

                // Add empty row
                worksheet.addRow([]);

                // Add Certificate of Analysis header
                const certHeader = worksheet.addRow(['Certificate of Analysis', '']);
                certHeader.font = { bold: true, size: 14 };
                certHeader.getCell(1).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'EBF1DE' } // Light yellow
                };
                worksheet.mergeCells(`A${certHeader.number}:B${certHeader.number}`);

                // Add parameters table header
                const paramsHeaderRow = worksheet.addRow(['Parameter', 'Standard', 'Result']);
                paramsHeaderRow.font = { bold: true };
                worksheet.getColumn(3).width = 25; // Set width for Result column

                // Add border to parameter headers
                ['A', 'B', 'C'].forEach(col => {
                    worksheet.getCell(`${col}${paramsHeaderRow.number}`).border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                    worksheet.getCell(`${col}${paramsHeaderRow.number}`).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'EBF1DE' }
                    };
                });

                // Add parameters
                report.parameters.forEach(param => {
                    const paramRow = worksheet.addRow([param.parameter, param.standard, param.result]);

                    // Add borders to cells
                    ['A', 'B', 'C'].forEach(col => {
                        worksheet.getCell(`${col}${paramRow.number}`).border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                    });
                });

                // Set content type and attachment header
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename=RM_Quality_Report_${report.id}.xlsx`);

                // Write to response stream
                await workbook.xlsx.write(res);
                res.end();
            } else {
                // Default: Return data for frontend PDF generation
                res.json({
                    success: true,
                    data: report,
                    message: 'Report data ready for export',
                });
            }
        } catch (error) {
            console.error('Error exporting RM Quality Report:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to export RM Quality Report',
            });
        }
    }

    // Export all RM Quality Reports as single Excel file
    static async exportAllQualityReports(req: Request, res: Response): Promise<void> {
        try {
            const reports = await prisma.rMQualityReport.findMany({
                include: {
                    parameters: true,
                    createdBy: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            if (reports.length === 0) {
                res.status(404).json({
                    success: false,
                    error: 'No quality reports found to export',
                });
                return;
            }

            // Get all unique parameters for table columns
            const allParameters = new Set<string>();
            reports.forEach(report => {
                report.parameters.forEach(param => {
                    allParameters.add(param.parameter);
                });
            });
            const parametersList = Array.from(allParameters);

            // Build HTML string for the PDF with hierarchical table
            const html = `
        <html>
        <head>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Arial', sans-serif; 
                    margin: 20px; 
                    background: #f9f9f9;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                h1 { 
                    font-size: 28px; 
                    color: #1a1a1a;
                    margin-bottom: 10px;
                }
                .date {
                    font-size: 12px;
                    color: #666;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 20px;
                    background: white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                /* Header styling */
                thead tr:nth-child(1) th {
                    background: #2c3e50;
                    color: white;
                    padding: 12px 6px;
                    font-weight: bold;
                    font-size: 13px;
                    text-align: center;
                    border: 1px solid #34495e;
                }
                
                thead tr:nth-child(2) th {
                    background: #34495e;
                    color: white;
                    padding: 10px 6px;
                    font-weight: bold;
                    font-size: 12px;
                    text-align: center;
                    border: 1px solid #445566;
                }
                
                /* Data rows */
                tbody tr {
                    border-bottom: 1px solid #ddd;
                }
                
                tbody tr:nth-child(odd) {
                    background: #f5f5f5;
                }
                
                tbody tr:hover {
                    background: #e8f4f8;
                }
                
                td {
                    padding: 10px 6px;
                    font-size: 11px;
                    border: 1px solid #ddd;
                    text-align: center;
                }
                
                /* First column styling */
                td:first-child,
                th:first-child {
                    text-align: left;
                    padding-left: 10px;
                }
                
                /* Parameter columns */
                .param-std, .param-res {
                    background: #ecf0f1;
                    font-weight: 500;
                }
                
                .param-std {
                    color: #16a085;
                }
                
                .param-res {
                    color: #c0392b;
                }
                
                /* Info columns */
                .info-col {
                    font-weight: 500;
                    color: #2c3e50;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>RM Quality Reports</h1>
                <div class="date">Generated on ${new Date().toLocaleDateString('en-IN')}</div>
            </div>
            
            <table>
                <thead>
                    <!-- Row 1: Main column groups -->
                    <tr>
                        <th rowspan="2" style="vertical-align: middle;">GRN</th>
                        <th rowspan="2" style="vertical-align: middle;">Raw Material</th>
                        <th rowspan="2" style="vertical-align: middle;">Variety</th>
                        <th rowspan="2" style="vertical-align: middle;">Supplier</th>
                        <th rowspan="2" style="vertical-align: middle;">Date</th>
                        ${parametersList.map(param => `
                            <th colspan="2" style="text-align: center;">${param}</th>
                        `).join('')}
                    </tr>
                    
                    <!-- Row 2: Standard and Result sub-headers -->
                    <tr>
                        ${parametersList.map(param => `
                            <th class="param-std">Standard</th>
                            <th class="param-res">Result</th>
                        `).join('')}
                    </tr>
                </thead>
                
                <tbody>
                    ${reports.map(report => `
                        <tr>
                            <td class="info-col">${report.grn}</td>
                            <td class="info-col">${report.rawMaterialName}</td>
                            <td class="info-col">${report.variety}</td>
                            <td class="info-col">${report.supplier}</td>
                            <td class="info-col">${new Date(report.dateOfReport).toLocaleDateString('en-IN')}</td>
                            ${parametersList.map(param => {
                const paramData = report.parameters.find(p => p.parameter === param);
                return `
                                    <td class="param-std">${paramData?.standard || '-'}</td>
                                    <td class="param-res">${paramData?.result || '-'}</td>
                                `;
            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
        `;

            // Launch Puppeteer and generate PDF
            const browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                landscape: true, // Use landscape for wide tables
                margin: { top: '15px', bottom: '15px', left: '15px', right: '15px' },
            });
            await browser.close();

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename=RM_Quality_Reports_${new Date().toISOString().split('T')[0]}.pdf`
            );
            res.send(pdfBuffer);
        } catch (error) {
            console.error('Error exporting all RM Quality Reports:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to export RM Quality Reports',
            });
        }
    }
    
}
