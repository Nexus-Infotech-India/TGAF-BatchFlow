import { jsPDF } from 'jspdf';

interface ExportConfig {
  title: string;
  filename: string;
  data: any[] | Record<string, any>;
  columns?: string[];
  orientation?: 'portrait' | 'landscape';
  logo?: string;
  subtitle?: string;
  footer?: string;
  filters?: Record<string, string>;
  groupBy?: string;
  customSections?: CustomSection[];
  isDetailedBatchReport?: boolean; // Special flag for detailed batch reports
}

interface CustomSection {
  title: string;
  content: string;
}

/**
 * Generates a PDF report based on provided data and configuration
 */
export const generatePDF = (config: ExportConfig): void => {
  const {
    title,
    filename,
    data,
    columns = [],
    orientation = 'portrait',
    subtitle,
    footer,
    filters = {},
    customSections = [],
    isDetailedBatchReport = false
  } = config;

  // Initialize PDF document
  const doc = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'a4'
  });
  
  // Set document properties
  doc.setProperties({
    title: title,
    subject: subtitle || title,
    author: 'Batchflow System',
    creator: 'Batchflow'
  });

  // Document dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  // Current Y position tracker
  let yPos = margin;
  
  // Add title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, pageWidth / 2, yPos + 10, { align: 'center' });
  yPos += 15;

  // Add subtitle if provided
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(subtitle, pageWidth / 2, yPos + 5, { align: 'center' });
    yPos += 10;
  }
  
  // Add generation date
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Generated on: ${today}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Add applied filters if any
  if (Object.keys(filters).length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Applied Filters:', margin, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        doc.text(`${key}: ${value}`, margin, yPos);
        yPos += 5;
      }
    });
    yPos += 5; // Extra spacing after filters
  }

  // Add horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Add custom sections at the beginning if any
  customSections.forEach(section => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(section.title, margin, yPos);
    yPos += 7;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    const lines = doc.splitTextToSize(section.content, contentWidth);
    doc.text(lines, margin, yPos);
    yPos += lines.length * 5 + 10;
  });
  
  // Handle detailed batch report
  if (isDetailedBatchReport) {
    if (Array.isArray(data)) {
        renderDetailedBatchReport(doc, data, margin, yPos, contentWidth, pageHeight, pageWidth);
    } else {
        console.error('Data is not an array, cannot render detailed batch report.');
    }
  } else if (Array.isArray(data)) {
    // Regular array data as table
    addTableData(doc, data, columns, margin, yPos, contentWidth);
  }

  // Add footer if provided
  if (footer) {
    // Add footer to all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text(footer, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
  }

  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10);
  }

  // Save the PDF with the given filename
  doc.save(`${filename}.pdf`);
};

/**
 * Renders a detailed batch report with multiple sections per batch
 */
const renderDetailedBatchReport = (
  doc: any, 
  batches: any[], 
  margin: number, 
  startY: number, 
  contentWidth: number,
  pageHeight: number,
  pageWidth: number
) => {
  let yPos = startY;
  
  // For each batch, create a complete section with all details
  batches.forEach((batch, index) => {
    // Add page break before each batch except the first
    if (index > 0) {
      doc.addPage();
      yPos = margin;
    }
    
    // Batch header with number and product
    doc.setFillColor(230, 236, 245);
    doc.rect(margin, yPos, contentWidth, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(40, 50, 60);
    doc.text(`Batch: ${batch.batchNumber} - ${batch.product}`, margin + 5, yPos + 7);
    yPos += 15;
    
    // Basic information table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Basic Information', margin, yPos);
    yPos += 7;
    
    // Create a simple table for basic info
    const basicInfo = [
      { label: 'Production Date', value: batch.productionDate },
      { label: 'Best Before', value: batch.bestBefore },
      { label: 'Status', value: batch.status },
      { label: 'Created By', value: batch.createdBy },
      { label: 'Checked By', value: batch.checkedBy },
      { label: 'Analysis Status', value: batch.analysisStatus }
    ];
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    const infoColWidth = contentWidth / 2;
    let infoRowY = yPos;
    
    basicInfo.forEach((info, i) => {
      // Create two columns layout for basic info
      const xPos = margin + (i % 2 * infoColWidth);
      
      if (i % 2 === 0 && i > 0) {
        infoRowY += 7; // New row
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text(info.label + ':', xPos, infoRowY);
      doc.setFont('helvetica', 'normal');
      doc.text(info.value, xPos + 35, infoRowY);
    });
    
    yPos = infoRowY + 15;
    
    // Check if we need a new page
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }
    
    // Parameter sections by category
    if (batch.parameterCategories && Object.keys(batch.parameterCategories).length > 0) {
      Object.entries(batch.parameterCategories).forEach(([categoryName, parameters]) => {
        // Check if we need a new page
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = margin;
        }
        
        // Category header
        const formattedCategoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
        doc.setFillColor(235, 245, 250);
        doc.rect(margin, yPos, contentWidth, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(`${formattedCategoryName} Parameters`, margin + 3, yPos + 6);
        yPos += 12;
        
        // Parameter table headers
        const paramCols = ['Parameter', 'Value', 'Unit', 'Method'];
        const paramColWidths = [0.35, 0.25, 0.15, 0.25].map(w => contentWidth * w);
        
        // Table header
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPos, contentWidth, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        
        let xOffset = margin;
        paramCols.forEach((col, i) => {
          doc.text(col, xOffset + 3, yPos + 5.5);
          xOffset += paramColWidths[i];
        });
        
        yPos += 8;
        
        // Parameter values
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        (parameters as any[]).forEach((param, i) => {
          // Alternating row colors
          if (i % 2 === 1) {
            doc.setFillColor(248, 248, 248);
            doc.rect(margin, yPos, contentWidth, 8, 'F');
          }
          
          let xOffset = margin;
          
          // Parameter name
          doc.text(param.name, xOffset + 3, yPos + 5.5);
          xOffset += paramColWidths[0];
          
          // Value
          doc.text(param.value, xOffset + 3, yPos + 5.5);
          xOffset += paramColWidths[1];
          
          // Unit
          doc.text(param.unit || '', xOffset + 3, yPos + 5.5);
          xOffset += paramColWidths[2];
          
          // Methodology
          doc.text(param.methodology || 'N/A', xOffset + 3, yPos + 5.5);
          
          yPos += 8;
          
          // Check if we need a new page
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = margin;
          }
        });
        
        yPos += 8; // Extra space after parameter table
      });
    }
    
    // Check if we need a new page
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }
    
    // Standards and methodologies section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Standards & Methodologies', margin, yPos);
    yPos += 7;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Standards
    doc.text('Applied Standards:', margin, yPos);
    const standardsText = batch.standards?.length > 0 
      ? batch.standards.join(', ')
      : 'No standards applied';
    
    const standardsLines = doc.splitTextToSize(standardsText, contentWidth - 30);
    doc.text(standardsLines, margin + 30, yPos);
    yPos += standardsLines.length * 5 + 5;
    
    // Methodologies
    doc.text('Methodologies:', margin, yPos);
    const methodologiesText = batch.methodologies?.length > 0 
      ? batch.methodologies.join(', ')
      : 'No methodologies applied';
    
    const methodologyLines = doc.splitTextToSize(methodologiesText, contentWidth - 30);
    doc.text(methodologyLines, margin + 30, yPos);
    yPos += methodologyLines.length * 5 + 10;
    
    // Check if we need a new page
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }
    
    // Recent activities section
    if (batch.activities && batch.activities.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Recent Activities', margin, yPos);
      yPos += 7;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      // Activity table headers
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos, contentWidth, 8, 'F');
      
      const activityCols = ['Activity', 'Performed By', 'Date'];
      const activityColWidths = [0.6, 0.2, 0.2].map(w => contentWidth * w);
      
      let xOffset = margin;
      activityCols.forEach((col, i) => {
        doc.text(col, xOffset + 3, yPos + 5.5);
        xOffset += activityColWidths[i];
      });
      
      yPos += 8;
      
      // Activity rows
      batch.activities.forEach((activity: any, i: number) => {
        // Alternating colors
        if (i % 2 === 1) {
          doc.setFillColor(248, 248, 248);
          doc.rect(margin, yPos, contentWidth, 8, 'F');
        }
        
        let xOffset = margin;
        
        // Details
        doc.text(activity.details, xOffset + 3, yPos + 5.5);
        xOffset += activityColWidths[0];
        
        // By
        doc.text(activity.by, xOffset + 3, yPos + 5.5);
        xOffset += activityColWidths[1];
        
        // Date
        doc.text(activity.date, xOffset + 3, yPos + 5.5);
        
        yPos += 8;
        
        // Check if we need a new page
        if (yPos > pageHeight - 20 && i < batch.activities.length - 1) {
          doc.addPage();
          yPos = margin;
        }
      });
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Recent Activities', margin, yPos);
      yPos += 7;
      
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.text('No activities recorded for this batch', margin, yPos);
      yPos += 10;
    }
    
    // Add a separator between batches
    if (index < batches.length - 1) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
    }
  });
};

// Helper function to add table data
const addTableData = (
  doc: any, 
  data: any[], 
  columns: string[], 
  x: number, 
  y: number, 
  width: number
): void => {
  if (!data || data.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('No data available', x, y + 10);
    return;
  }

  const rowHeight = 10;
  const columnWidth = width / columns.length;
  let currentY = y;
  
  // Table header
  doc.setFillColor(235, 235, 235);
  doc.rect(x, currentY, width, rowHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  columns.forEach((col, index) => {
    const displayName = col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1');
    doc.text(displayName, x + (columnWidth * index) + 3, currentY + 6);
  });
  
  currentY += rowHeight;
  
  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  // Add rows
  data.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (currentY > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      currentY = 15; // Reset Y position
      
      // Re-add the header on the new page
      doc.setFillColor(235, 235, 235);
      doc.rect(x, currentY, width, rowHeight, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      columns.forEach((col, index) => {
        const displayName = col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1');
        doc.text(displayName, x + (columnWidth * index) + 3, currentY + 6);
      });
      currentY += rowHeight;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
    }
    
    // Add row background (alternate colors)
    if (rowIndex % 2 === 1) {
      doc.setFillColor(245, 245, 245);
      doc.rect(x, currentY, width, rowHeight, 'F');
    }
    
    // Add row data
    columns.forEach((col, colIndex) => {
      const cellValue = row[col] !== undefined && row[col] !== null 
        ? row[col].toString() 
        : 'N/A';
        
      // Truncate and add ellipsis if text is too long
      const maxChars = 30; // This should be adjusted based on column width
      const displayText = cellValue.length > maxChars 
        ? cellValue.substring(0, maxChars) + '...' 
        : cellValue;
        
      doc.text(displayText, x + (columnWidth * colIndex) + 3, currentY + 6);
    });
    
    currentY += rowHeight;
  });
  
  // Add border around table
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(x, y, width, currentY - y);
};

export default generatePDF;

// --- Grinding Dispatch PDF Report ---

interface GrindingDispatchPDFConfig {
  batchNumber: string;
  rawMaterialName: string;
  skuCode: string;
  unit: string;
  fromLocation: string;
  toLocation: string;
  totalQuantity: number;
  status: string;
  sentAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  notes?: string;
  lots: {
    lotId: string;
    material: string;
    cleanedQty: number;
    allocatedQty: number;
    seedWastage: number;
    unit: string;           // Maps to allocated / cleaned unit
    seedWastageUnit?: string;
  }[];
}

export const generateGrindingDispatchPDF = (config: GrindingDispatchPDFConfig): void => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;
  const rowH = 9;

  const hLine = (y: number) => {
    doc.setDrawColor(190, 190, 200); doc.setLineWidth(0.3);
    doc.line(margin, y, margin + contentWidth, y);
  };

  const vLines = (widths: number[], y: number, h: number) => {
    doc.setDrawColor(190, 190, 200); doc.setLineWidth(0.3);
    let x = margin;
    doc.line(x, y, x, y + h);
    widths.forEach(w => { x += w; doc.line(x, y, x, y + h); });
  };

  type CellDef = { text: string; w: number; bold?: boolean; color?: number[]; align?: string };

  const drawRow = (cells: CellDef[], y: number, header = false, stripe = false) => {
    if (header) { doc.setFillColor(50, 50, 68); doc.rect(margin, y, contentWidth, rowH, 'F'); }
    else if (stripe) { doc.setFillColor(245, 246, 252); doc.rect(margin, y, contentWidth, rowH, 'F'); }
    let x = margin;
    const textY = y + rowH / 2 + 1.2;
    cells.forEach(c => {
      doc.setFont('helvetica', header ? 'bold' : c.bold ? 'bold' : 'normal');
      doc.setFontSize(header ? 8 : 8.5);
      const col = header ? [255, 255, 255] : c.color || [40, 40, 55];
      doc.setTextColor(col[0], col[1], col[2]);
      const tx = c.align === 'center' ? x + c.w / 2 : c.align === 'right' ? x + c.w - 4 : x + 4;
      doc.text(c.text, tx, textY, { align: (c.align as any) || 'left' });
      x += c.w;
    });
    hLine(y + rowH);
    vLines(cells.map(c => c.w), y, rowH);
  };

  const fmtDate = (d?: string) => d && !isNaN(Date.parse(d))
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '--';

  // 1. TITLE
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(35, 35, 50);
  doc.text('Grinding Dispatch Report', pageWidth / 2, yPos + 7, { align: 'center' });
  yPos += 12;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(130, 130, 145);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, yPos + 3, { align: 'center' });
  yPos += 8;
  hLine(yPos); yPos += 8;

  // 2. DISPATCH INFO TABLE
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(35, 35, 50);
  doc.text('Dispatch Information', margin, yPos + 5); yPos += 10;

  const lw = 42;
  const vw = contentWidth / 2 - lw;
  const hw = contentWidth / 2;

  const statusColor = config.status === 'ACCEPTED' ? 'Accepted' : config.status === 'REJECTED' ? 'Rejected' : config.status === 'SENT' ? 'Sent' : config.status;

  const kvRows: string[][][] = [
    [['Batch Number', config.batchNumber], ['Status', statusColor]],
    [['Raw Material', config.rawMaterialName], ['SKU Code', config.skuCode]],
    [['From Location', config.fromLocation], ['To Location', config.toLocation]],
    [['Total Quantity', `${config.totalQuantity} ${config.unit}`], ['Sent At', fmtDate(config.sentAt)]],
  ];

  if (config.acceptedAt) {
    kvRows.push([['Accepted At', fmtDate(config.acceptedAt)], ['', '']]);
  }
  if (config.rejectedAt) {
    kvRows.push([['Rejected At', fmtDate(config.rejectedAt)], ['Reason', config.rejectionReason || '-']]);
  }

  // Header row
  doc.setFillColor(50, 50, 68); doc.rect(margin, yPos, contentWidth, rowH, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
  const kvTextY = yPos + rowH / 2 + 1.2;
  doc.text('Field', margin + 4, kvTextY);
  doc.text('Value', margin + lw + 4, kvTextY);
  doc.text('Field', margin + hw + 4, kvTextY);
  doc.text('Value', margin + hw + lw + 4, kvTextY);
  hLine(yPos + rowH); vLines([lw, vw, lw, vw], yPos, rowH); yPos += rowH;

  kvRows.forEach((row, i) => {
    const stripe = i % 2 === 0;
    if (stripe) { doc.setFillColor(245, 246, 252); doc.rect(margin, yPos, contentWidth, rowH, 'F'); }
    const ty = yPos + rowH / 2 + 1.2;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(90, 90, 110);
    doc.text(row[0][0], margin + 4, ty);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(35, 35, 50);
    doc.text(row[0][1], margin + lw + 4, ty);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(90, 90, 110);
    doc.text(row[1][0], margin + hw + 4, ty);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(35, 35, 50);
    doc.text(row[1][1], margin + hw + lw + 4, ty);
    hLine(yPos + rowH); vLines([lw, vw, lw, vw], yPos, rowH); yPos += rowH;
  });

  // Notes
  if (config.notes) {
    yPos += 6;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(90, 90, 110);
    doc.text('Notes:', margin, yPos + 3);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(35, 35, 50);
    const noteLines = doc.splitTextToSize(config.notes, contentWidth - 20);
    doc.text(noteLines, margin + 18, yPos + 3);
    yPos += noteLines.length * 5 + 4;
  }

  yPos += 10;

  // 3. LOT ALLOCATION TABLE
  if (config.lots.length > 0) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(35, 35, 50);
    doc.text('Lot Allocation Details', margin, yPos + 5); yPos += 10;

    const lc = [
      { h: 'Lot ID',          w: contentWidth * 0.25 },
      { h: 'Material',        w: contentWidth * 0.25 },
      { h: 'Allocated Qty',   w: contentWidth * 0.25 },
      { h: 'Seed Wastage',    w: contentWidth * 0.25 },
    ];

    drawRow(lc.map(c => ({ text: c.h, w: c.w, align: 'center' })), yPos, true); yPos += rowH;

    config.lots.forEach((lot, i) => {
      if (yPos + rowH > pageHeight - 20) { doc.addPage(); yPos = margin; }

      drawRow([
        { text: lot.lotId, w: lc[0].w, bold: true },
        { text: lot.material, w: lc[1].w },
        { text: `${lot.allocatedQty} ${lot.unit}`, w: lc[2].w, align: 'center', bold: true },
        { text: lot.seedWastage > 0 ? `${lot.seedWastage} ${lot.seedWastageUnit || lot.unit}` : '--', w: lc[3].w, align: 'center', color: lot.seedWastage > 0 ? [200, 120, 10] : [150, 150, 160] },
      ], yPos, false, i % 2 === 0);
      yPos += rowH;
    });

    // Totals row
    const totalAllocated = config.lots.reduce((s, l) => s + l.allocatedQty, 0);
    const totalSeedWastage = config.lots.reduce((s, l) => s + l.seedWastage, 0);
    const unit = config.lots[0]?.unit || config.unit;
    const seedUnit = config.lots[0]?.seedWastageUnit || unit;

    yPos += 2;
    doc.setFillColor(235, 240, 250); doc.rect(margin, yPos, contentWidth, rowH, 'F');
    drawRow([
      { text: '', w: lc[0].w },
      { text: 'Total', w: lc[1].w, bold: true, align: 'right' },
      { text: `${totalAllocated} ${unit}`, w: lc[2].w, align: 'center', bold: true, color: [5, 100, 75] },
      { text: totalSeedWastage > 0 ? `${totalSeedWastage} ${seedUnit}` : '--', w: lc[3].w, align: 'center', bold: true, color: [200, 120, 10] },
    ], yPos, false, false);
    yPos += rowH;
  }

  // Page numbers
  const np = doc.getNumberOfPages();
  for (let i = 1; i <= np; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(160, 160, 170);
    doc.text(`Page ${i} of ${np}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    doc.text('BatchFlow - Grinding Dispatch Report', margin, pageHeight - 8);
  }

  doc.save(`Dispatch_${config.batchNumber.replace(/[^A-Za-z0-9]/g, '_')}.pdf`);
};

// --- Cleaning History PDF Report ---

interface CleaningHistoryPDFConfig {
  grnNumber: string;
  rawMaterialName: string;
  variety: string;
  supplier: string;
  unit: string;
  totalReceived: number;
  totalTransferred: number;
  leftQuantity: number;
  allJobsFinished: boolean;
  cleaningJobs: {
    id: string;
    quantity: number;
    status: string;
    startedAt: string;
    finishedAt?: string;
    stoneWastageQty?: number;
    stoneWastageUnit?: string;
    seedWastageQty?: number;
    seedWastageUnit?: string;
    wastagePercentage?: number;
    wastageType?: string;
    fromWarehouse: { name: string };
    toWarehouse: { name: string };
    cleaningLots: {
      lotNumber: string;
      quantity: number;
      cleanedQuantity?: number;
      status: string;
      stoneWastageQty?: number;
      seedWastageQty?: number;
      wastagePercentage?: number;
      wastageType?: string;
    }[];
  }[];
}

export const generateCleaningHistoryPDF = (config: CleaningHistoryPDFConfig): void => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;
  const rowH = 9;

  const checkPage = (needed: number) => {
    if (yPos + needed > pageHeight - 20) { doc.addPage(); yPos = margin; }
  };

  const hLine = (y: number) => {
    doc.setDrawColor(190, 190, 200); doc.setLineWidth(0.3);
    doc.line(margin, y, margin + contentWidth, y);
  };

  const vLines = (widths: number[], y: number, h: number) => {
    doc.setDrawColor(190, 190, 200); doc.setLineWidth(0.3);
    let x = margin;
    doc.line(x, y, x, y + h);
    widths.forEach(w => { x += w; doc.line(x, y, x, y + h); });
  };

  type CellDef = { text: string; w: number; bold?: boolean; color?: number[]; align?: string };

  const drawRow = (cells: CellDef[], y: number, header = false, stripe = false) => {
    if (header) { doc.setFillColor(50, 50, 68); doc.rect(margin, y, contentWidth, rowH, 'F'); }
    else if (stripe) { doc.setFillColor(245, 246, 252); doc.rect(margin, y, contentWidth, rowH, 'F'); }
    let x = margin;
    const textY = y + rowH / 2 + 1.2;
    cells.forEach(c => {
      doc.setFont('helvetica', header ? 'bold' : c.bold ? 'bold' : 'normal');
      doc.setFontSize(header ? 8 : 8.5);
      const col = header ? [255, 255, 255] : c.color || [40, 40, 55];
      doc.setTextColor(col[0], col[1], col[2]);
      const tx = c.align === 'center' ? x + c.w / 2 : c.align === 'right' ? x + c.w - 4 : x + 4;
      doc.text(c.text, tx, textY, { align: (c.align as any) || 'left' });
      x += c.w;
    });
    hLine(y + rowH);
    vLines(cells.map(c => c.w), y, rowH);
  };

  // 1. TITLE
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(35, 35, 50);
  doc.text('Cleaning History Report', pageWidth / 2, yPos + 7, { align: 'center' });
  yPos += 12;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(130, 130, 145);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, yPos + 3, { align: 'center' });
  yPos += 8;
  hLine(yPos); yPos += 8;

  // 2. GRN INFO TABLE
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(35, 35, 50);
  doc.text('GRN Information', margin, yPos + 5); yPos += 10;

  const lw = 42;
  const vw = contentWidth / 2 - lw;
  const hw = contentWidth / 2;
  const kvRows: string[][][] = [
    [['GRN Number', config.grnNumber], ['Supplier', config.supplier]],
    [['Material', config.rawMaterialName], ['Variety', config.variety || '-']],
    [['Total Received', `${config.totalReceived} ${config.unit}`], ['Transferred', `${config.totalTransferred} ${config.unit}`]],
    [['Remaining', `${config.leftQuantity} ${config.unit}`], ['Overall Status', config.allJobsFinished ? 'All Cleaned' : 'In Progress']],
  ];

  doc.setFillColor(50, 50, 68); doc.rect(margin, yPos, contentWidth, rowH, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
  const kvTextY = yPos + rowH / 2 + 1.2;
  doc.text('Field', margin + 4, kvTextY);
  doc.text('Value', margin + lw + 4, kvTextY);
  doc.text('Field', margin + hw + 4, kvTextY);
  doc.text('Value', margin + hw + lw + 4, kvTextY);
  hLine(yPos + rowH); vLines([lw, vw, lw, vw], yPos, rowH); yPos += rowH;

  kvRows.forEach((row, i) => {
    const stripe = i % 2 === 0;
    if (stripe) { doc.setFillColor(245, 246, 252); doc.rect(margin, yPos, contentWidth, rowH, 'F'); }
    const ty = yPos + rowH / 2 + 1.2;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(90, 90, 110);
    doc.text(row[0][0], margin + 4, ty);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(35, 35, 50);
    doc.text(row[0][1], margin + lw + 4, ty);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(90, 90, 110);
    doc.text(row[1][0], margin + hw + 4, ty);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(35, 35, 50);
    doc.text(row[1][1], margin + hw + lw + 4, ty);
    hLine(yPos + rowH); vLines([lw, vw, lw, vw], yPos, rowH); yPos += rowH;
  });
  yPos += 14;

  // 3. CLEANING JOBS SUMMARY TABLE
  checkPage(40);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(35, 35, 50);
  doc.text('Cleaning Jobs Summary', margin, yPos + 5); yPos += 10;

  const jc = [
    { h: 'Job ID',       w: contentWidth * 0.10 },
    { h: 'Route',        w: contentWidth * 0.14 },
    { h: 'Started',      w: contentWidth * 0.09 },
    { h: 'Completed',    w: contentWidth * 0.09 },
    { h: 'Transfer Qty', w: contentWidth * 0.09 },
    { h: 'Stone Loss',   w: contentWidth * 0.08 },
    { h: 'Seed Loss',    w: contentWidth * 0.08 },
    { h: 'Cleaned Qty',  w: contentWidth * 0.09 },
    { h: 'Wastage %',    w: contentWidth * 0.08 },
    { h: 'Loss Type',    w: contentWidth * 0.09 },
    { h: 'Status',       w: contentWidth * 0.07 },
  ];

  drawRow(jc.map(c => ({ text: c.h, w: c.w, align: 'center' })), yPos, true); yPos += rowH;

  const toBaseWeight = (val: number, fromU: string, toU: string) => {
    const f = (fromU || 'kg').toLowerCase();
    const t = (toU || 'kg').toLowerCase();
    if (f === t) return val;
    let valInKg = val;
    if (f === 'gram' || f === 'grams') valInKg = val / 1000;
    else if (f === 'ton' || f === 'tons') valInKg = val * 1000;
    if (t === 'gram' || t === 'grams') return valInKg * 1000;
    if (t === 'ton' || t === 'tons') return valInKg / 1000;
    return valInKg;
  };

  config.cleaningJobs.forEach((job, i) => {
    checkPage(rowH + 2);
    const stoneUnit = (job.stoneWastageUnit || 'kg').toUpperCase();
    const seedUnit = (job.seedWastageUnit || 'kg').toUpperCase();
    const stoneInBase = toBaseWeight(job.stoneWastageQty || 0, job.stoneWastageUnit || 'kg', config.unit);
    const seedInBase = toBaseWeight(job.seedWastageQty || 0, job.seedWastageUnit || 'kg', config.unit);
    const totalWasteInBase = stoneInBase + seedInBase;
    const net = Math.max(0, job.quantity - totalWasteInBase);
    const wp = job.wastagePercentage ?? (job.quantity ? parseFloat(((totalWasteInBase / job.quantity) * 100).toFixed(2)) : 0);
    const wt = job.wastageType ?? (wp > 3 ? 'Abnormal Loss' : 'Normal Loss');
    const done = job.status === 'Cleaned';
    const bad = wt === 'Abnormal Loss';
    const wColor = done ? (bad ? [210, 38, 38] : [5, 140, 100]) : [120, 120, 135];
    const sColor = done ? [5, 140, 100] : [200, 120, 0];
    const fmtD = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '--';
    const fmtNet = Number.isInteger(net) ? `${net}` : net.toFixed(2);

    drawRow([
      { text: `LOT-${job.id}`, w: jc[0].w, bold: true },
      { text: `${job.fromWarehouse.name} > ${job.toWarehouse.name}`, w: jc[1].w },
      { text: fmtD(job.startedAt), w: jc[2].w, align: 'center' },
      { text: fmtD(job.finishedAt), w: jc[3].w, align: 'center' },
      { text: `${job.quantity} ${config.unit}`, w: jc[4].w, align: 'center' },
      { text: done ? `${job.stoneWastageQty || 0} ${stoneUnit}` : '--', w: jc[5].w, align: 'center' },
      { text: done ? `${job.seedWastageQty || 0} ${seedUnit}` : '--', w: jc[6].w, align: 'center' },
      { text: done ? `${fmtNet} ${config.unit}` : '--', w: jc[7].w, align: 'center' },
      { text: done ? `${wp}%` : '--', w: jc[8].w, align: 'center', bold: true, color: wColor },
      { text: done ? wt : '--', w: jc[9].w, align: 'center', bold: true, color: wColor },
      { text: job.status, w: jc[10].w, align: 'center', bold: true, color: sColor },
    ], yPos, false, i % 2 === 0);
    yPos += rowH;
  });

  // Fallback
  if (config.cleaningJobs.length === 0) {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(10); doc.setTextColor(150, 150, 160);
    doc.text('No cleaning records found for this GRN.', pageWidth / 2, yPos + 15, { align: 'center' });
  }

  // Page numbers
  const np = doc.getNumberOfPages();
  for (let i = 1; i <= np; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(160, 160, 170);
    doc.text(`Page ${i} of ${np}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    doc.text('BatchFlow - Cleaning History Report', margin, pageHeight - 8);
  }

  doc.save(`Cleaning_History_${config.grnNumber.replace(/[^A-Za-z0-9]/g, '_')}.pdf`);
};