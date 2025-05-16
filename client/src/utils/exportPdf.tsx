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