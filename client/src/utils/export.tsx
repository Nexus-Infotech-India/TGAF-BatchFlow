import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface ExportBatchData {
  batchNumber: string;
  productName: string;
  dateOfProduction: string;
  bestBeforeDate: string;
  sampleAnalysisStarted: string;
  sampleAnalysisCompleted: string;
  parameters: {
    category: string;
    name: string;
    standardValue: string;
    unit: string;
    result: string;
    remark?: string;
  }[];
  customerInfo?: {
    name: string;
    address: string;
  };
}

export const exportToCertificateOfAnalysis = async (data: ExportBatchData): Promise<void> => {
  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Certificate of Analysis');

  // Set column widths
  worksheet.columns = [
    { width: 20 },  // A
    { width: 15 },  // B
    { width: 10 },  // C
    { width: 15 },  // D
    { width: 20 },  // E
  ];

  // Company header
  const titleRow = worksheet.addRow(['TG Agri Farms Limited']);
  titleRow.font = { bold: true, size: 16, color: { argb: 'C00000' } };
  titleRow.alignment = { horizontal: 'center' };
  worksheet.mergeCells('A1:E1');

  // Registration and address
  const regRow = worksheet.addRow(['RC1280656']);
  regRow.font = { size: 11 };
  regRow.alignment = { horizontal: 'center' };
  worksheet.mergeCells('A2:E2');

  const addressRow1 = worksheet.addRow(['44, Eric Moore Road, Surulere,']);
  addressRow1.font = { size: 11 };
  addressRow1.alignment = { horizontal: 'center' };
  worksheet.mergeCells('A3:E3');

  const addressRow2 = worksheet.addRow(['Lagos,Nigeria']);
  addressRow2.font = { size: 11 };
  addressRow2.alignment = { horizontal: 'center' };
  worksheet.mergeCells('A4:E4');

  // Certificate title
  const certificateRow = worksheet.addRow(['Certificate Of Analysis']);
  certificateRow.font = { bold: true, size: 14, underline: true };
  certificateRow.alignment = { horizontal: 'center' };
  worksheet.mergeCells('A5:E5');

  // Add a blank row
  worksheet.addRow([]);

  // Customer information
  const customerName = data.customerInfo?.name || 'Unilever Nigeria Plc,';
  const customerAddress = data.customerInfo?.address || '20, Agbara Industrial Estate road Wing B, Agbara, Nigeria';
  
  worksheet.addRow(['Issued to']);
  worksheet.addRow([customerName]);
  worksheet.addRow([customerAddress]);

  // Add a blank row
  worksheet.addRow([]);

  // Product information
  worksheet.addRow(['Product name:', data.productName]);
  worksheet.addRow(['Date of production:', formatDate(data.dateOfProduction)]);
  worksheet.addRow(['Best Before date:', formatDate(data.bestBeforeDate)]);
  worksheet.addRow(['Batch number:', data.batchNumber]);
  worksheet.addRow(['Sample analysis Started:', formatDate(data.sampleAnalysisStarted)]);
  worksheet.addRow(['Sample analysis completed:', formatDate(data.sampleAnalysisCompleted)]);

  // Add a blank row
  worksheet.addRow([]);

  // Parameters table headers
  const tableHeaders = ['Technical data', 'Standard', 'Units', 'Result', 'Remark'];
  const headerRow = worksheet.addRow(tableHeaders);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F2F2F2' }
    };
  });

  // Group parameters by category
  const categories = Array.from(new Set(data.parameters.map(p => p.category)));

  // Add parameters by category
  categories.forEach(category => {
    // Category row
    const categoryRow = worksheet.addRow([category]);
    categoryRow.getCell(1).font = { bold: true };
    categoryRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    worksheet.mergeCells(`A${worksheet.rowCount}:E${worksheet.rowCount}`);
    categoryRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E6E6E6' }
    };

    // Parameters in this category
    const params = data.parameters.filter(p => p.category === category);
    params.forEach(param => {
      const paramRow = worksheet.addRow([
        param.name,
        param.standardValue,
        param.unit,
        param.result,
        param.remark || ''
      ]);
      paramRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
  });

  // Add signature section
  worksheet.addRow([]);
  worksheet.addRow(['Authorized QC persons:']);
  worksheet.addRow([]);
  
  const signatoryName = 'MAYOWA JOLAOSHO';
  const signatoryTitle = '(For TG Agri Farms)';
  worksheet.addRow([signatoryName]);
  worksheet.addRow([signatoryTitle]);

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `COA_${data.batchNumber}_${formatDateForFilename(data.dateOfProduction)}.xlsx`);
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
};

// Helper function for filename
const formatDateForFilename = (dateString: string): string => {
  if (!dateString) return 'NA';
  const date = new Date(dateString);
  return `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
};