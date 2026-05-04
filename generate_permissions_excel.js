const ExcelJS = require('./server/node_modules/exceljs');
const path = require('path');

async function generatePermissionsExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'TGAF-BatchFlow';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Assign Permissions - Access Control', {
    properties: { tabColor: { argb: '4F46E5' } },
    views: [{ state: 'frozen', ySplit: 2 }],
  });

  // ── Column definitions ─────────────────────────────────────────────
  ws.columns = [
    { header: 'Sr. No.', key: 'sr', width: 8 },
    { header: 'Module', key: 'module', width: 28 },
    { header: 'Key Responsibility Area (KRA)', key: 'kra', width: 45 },
    { header: 'Description', key: 'description', width: 55 },
    { header: 'Stake Holder Name', key: 'stakeholder', width: 25 },
    { header: 'Access Level', key: 'access', width: 18 },
  ];

  // ── Data rows ─────────────────────────────────────────────────────
  const data = [
    // ── Purchase Order & Receival ──
    {
      module: 'Purchase Order & Receival',
      kra: 'Create Purchase Order (PO)',
      description: 'Create multi-item purchase orders with vendor selection, expected delivery dates, and per-item rates',
      stakeholder: '',
      access: 'Create / Edit',
    },
    {
      module: 'Purchase Order & Receival',
      kra: 'Approve / Review Purchase Order',
      description: 'Review and approve purchase orders before sending to vendors',
      stakeholder: '',
      access: 'Approve / Reject',
    },
    {
      module: 'Purchase Order & Receival',
      kra: 'Accept Raw Material (Receival)',
      description: 'Receive materials per PO item with bag-wise or total weight mode at warehouse',
      stakeholder: '',
      access: 'Create',
    },
    {
      module: 'Purchase Order & Receival',
      kra: 'Send PO Email to Vendor',
      description: 'Email purchase order details to vendor for order confirmation',
      stakeholder: '',
      access: 'Execute',
    },

    // ── Raw Material Quality ──
    {
      module: 'Raw Material Quality',
      kra: 'Raw Material QC (Quality Report)',
      description: 'Create quality reports against received raw materials — log parameter, result, and standard values',
      stakeholder: '',
      access: 'Create / Edit',
    },
    {
      module: 'Raw Material Quality',
      kra: 'Export / Email RM Quality Reports',
      description: 'Export quality reports to Excel or email them to stakeholders',
      stakeholder: '',
      access: 'Execute',
    },

    // ── GRN ──
    {
      module: 'GRN Generation',
      kra: 'Generate GRN (Goods Received Note)',
      description: 'Generate formal GRN linked to quality report and PO with truck, delivery, and bag/pack info',
      stakeholder: '',
      access: 'Create',
    },
    {
      module: 'GRN Generation',
      kra: 'View / Delete GRN',
      description: 'View GRN listing and delete GRN if downstream operations have not started',
      stakeholder: '',
      access: 'View / Delete',
    },

    // ── Cleaning ──
    {
      module: 'Cleaning & Lot Management',
      kra: 'Transfer to Cleaning',
      description: 'Initiate GRN-wise cleaning jobs from received raw materials',
      stakeholder: '',
      access: 'Create',
    },
    {
      module: 'Cleaning & Lot Management',
      kra: 'Accept Cleaning Material',
      description: 'Accept incoming material at cleaning location and start the cleaning process',
      stakeholder: '',
      access: 'Accept',
    },
    {
      module: 'Cleaning & Lot Management',
      kra: 'Dispatch Cleaned Material',
      description: 'Complete cleaning job — record cleaned qty, wastage (stone/seed), and generate cleaning lot',
      stakeholder: '',
      access: 'Create / Execute',
    },
    {
      module: 'Cleaning & Lot Management',
      kra: 'Accept Cleaned Material',
      description: 'Accept cleaned material lots at destination warehouse for downstream processing',
      stakeholder: '',
      access: 'Accept',
    },

    // ── Grinding Dispatch ──
    {
      module: 'Grinding Dispatch',
      kra: 'Create Grinding Dispatch',
      description: 'Send cleaned lots from source location to grinding location with lot-level allocation',
      stakeholder: '',
      access: 'Create',
    },
    {
      module: 'Grinding Dispatch',
      kra: 'Accept / Reject Grinding Dispatch',
      description: 'Receiving location reviews dispatch and accepts or rejects with reason',
      stakeholder: '',
      access: 'Approve / Reject',
    },

    // ── SFG Processing & Production ──
    {
      module: 'SFG Processing & Production',
      kra: 'Create Processing Batch',
      description: 'Select cleaned lots, allocate quantities, and start SFG processing batch',
      stakeholder: '',
      access: 'Create',
    },
    {
      module: 'SFG Processing & Production',
      kra: 'Production Entry (SFG Output)',
      description: 'Record SFG output, by-products, scrap, and finished goods from processing batch',
      stakeholder: '',
      access: 'Create / Edit',
    },
    {
      module: 'SFG Processing & Production',
      kra: 'Stock Verification (SFG)',
      description: 'Supervisory verification of processed SFG stock before outbound transfer',
      stakeholder: '',
      access: 'Verify / Approve',
    },
    {
      module: 'SFG Processing & Production',
      kra: 'Production Posting (SFG)',
      description: 'Post production linked to BOM — record actual vs expected consumption and output',
      stakeholder: '',
      access: 'Create',
    },

    // ── Material Transfers ──
    {
      module: 'Material Transfers',
      kra: 'Create Material Transfer',
      description: 'Transfer materials between locations (Warehouse → Grinding, SFG → Packaging, etc.)',
      stakeholder: '',
      access: 'Create',
    },
    {
      module: 'Material Transfers',
      kra: 'Accept / Reject Material Transfer',
      description: 'Receiving location confirms or rejects incoming material transfer with reason',
      stakeholder: '',
      access: 'Approve / Reject',
    },

    // ── FG Batch ──
    {
      module: 'FG Batch Management',
      kra: 'Create FG Batch',
      description: 'Create Finished Good batch — select BOM, set production qty, allocate SFG consumption',
      stakeholder: '',
      access: 'Create',
    },
    {
      module: 'FG Batch Management',
      kra: 'Approve / Reject FG Batch',
      description: 'Accept or reject FG batch before production begins',
      stakeholder: '',
      access: 'Approve / Reject',
    },

    // ── FG Production ──
    {
      module: 'FG Production',
      kra: 'FG Production Entry (Machine-wise)',
      description: 'Create production entry — assign machines, allocate quantities, set per-machine metrics',
      stakeholder: '',
      access: 'Create / Edit',
    },
    {
      module: 'FG Production',
      kra: 'FG Production Output Entry',
      description: 'Record actual machine-wise output — FG produced, laminate/powder wastage, downtime, shift data',
      stakeholder: '',
      access: 'Create / Edit',
    },

    // ── FG Quality ──
    {
      module: 'FG Quality Check',
      kra: 'Submit FG Quality Report',
      description: 'Attach quality parameters to completed FG production entry for quality assessment',
      stakeholder: '',
      access: 'Create',
    },

    // ── FG Verification & Dispatch ──
    {
      module: 'FG Verification & Dispatch',
      kra: 'Dispatch for Verification',
      description: 'Send completed production entries for supervisor / QA verification before dispatch',
      stakeholder: '',
      access: 'Create',
    },
    {
      module: 'FG Verification & Dispatch',
      kra: 'Verify / Reject FG Production',
      description: 'Verify or reject FG production with verification number — view metrics and approve dispatch',
      stakeholder: '',
      access: 'Verify / Reject',
    },

    // ── Stock & Inventory ──
    {
      module: 'Stock & Inventory',
      kra: 'View Current Stock',
      description: 'Real-time stock levels per raw material per warehouse with distribution view',
      stakeholder: '',
      access: 'View',
    },
    {
      module: 'Stock & Inventory',
      kra: 'Stock Entry / Adjustment',
      description: 'Manual stock IN/OUT entries with reference IDs for traceability',
      stakeholder: '',
      access: 'Create / Edit',
    },

    // ── Bill of Materials ──
    {
      module: 'Bill of Materials (BOM)',
      kra: 'Create / Manage BOM',
      description: 'Define recipes — SFG product, output quantity, ingredient list with quantities and units',
      stakeholder: '',
      access: 'Create / Edit',
    },

    // ── Master Data ──
    {
      module: 'Master Data Management',
      kra: 'Manage Raw Material Products',
      description: 'Create/edit SKU-coded products with categories, variety, UOM, and reorder levels',
      stakeholder: '',
      access: 'Create / Edit',
    },
    {
      module: 'Master Data Management',
      kra: 'Manage Vendors',
      description: 'Create/edit vendor directory — contact details, banking info, enable/disable',
      stakeholder: '',
      access: 'Create / Edit',
    },
    {
      module: 'Master Data Management',
      kra: 'Manage Locations / Warehouses',
      description: 'Create/edit facility locations (Warehouse, Cleaning, Grinding, SFG, FG Packaging)',
      stakeholder: '',
      access: 'Create / Edit',
    },
    {
      module: 'Master Data Management',
      kra: 'Manage Machine Master',
      description: 'Create/edit packaging line machines with capacity, speed, and location',
      stakeholder: '',
      access: 'Create / Edit',
    },

    // ── QC Lab ──
    {
      module: 'QC Lab (Batch Management)',
      kra: 'Create QC Batch (Maker)',
      description: 'Create lab batch with product, GRN number, lot number, and enter test parameter values',
      stakeholder: '',
      access: 'Create / Edit',
    },
    {
      module: 'QC Lab (Batch Management)',
      kra: 'Verify QC Batch (Checker)',
      description: 'Review and approve/reject lab batch — maker-checker workflow',
      stakeholder: '',
      access: 'Approve / Reject',
    },
    {
      module: 'QC Lab (Batch Management)',
      kra: 'Generate QC Certificate',
      description: 'Auto-generate quality certificate from approved batches',
      stakeholder: '',
      access: 'Execute',
    },

    // ── User Management ──
    {
      module: 'User & Role Management',
      kra: 'Manage Users',
      description: 'Create, update, and manage system users with role assignments',
      stakeholder: '',
      access: 'Create / Edit',
    },
    {
      module: 'User & Role Management',
      kra: 'Manage Roles & Permissions',
      description: 'Define roles and assign granular page-level and action-level permissions',
      stakeholder: '',
      access: 'Create / Edit',
    },

    // ── Standards ──
    {
      module: 'Standards & Parameters',
      kra: 'Manage Standards & Parameters',
      description: 'Define standard categories, parameters, methodologies, and unit of measurements for QC',
      stakeholder: '',
      access: 'Create / Edit',
    },

    // ── Logs ──
    {
      module: 'Logs & Activity Tracking',
      kra: 'View Transaction / Activity Logs',
      description: 'View RECEIVE, TRANSFER, PRODUCTION, DISPATCH logs with user attribution and filters',
      stakeholder: '',
      access: 'View',
    },
  ];

  // ── Title Row ──────────────────────────────────────────────────────
  ws.insertRow(1, []);
  ws.mergeCells('A1:F1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'TGAF-BatchFlow — Assign Permissions / Access Control Matrix';
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 36;

  // ── Header Row styling (row 2) ─────────────────────────────────────
  const headerRow = ws.getRow(2);
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '374151' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: '9CA3AF' } },
      bottom: { style: 'thin', color: { argb: '9CA3AF' } },
      left: { style: 'thin', color: { argb: '9CA3AF' } },
      right: { style: 'thin', color: { argb: '9CA3AF' } },
    };
  });
  headerRow.height = 28;

  // ── Add data rows ──────────────────────────────────────────────────
  const moduleColors = {
    'Purchase Order & Receival': 'EEF2FF',
    'Raw Material Quality': 'FEF3C7',
    'GRN Generation': 'ECFDF5',
    'Cleaning & Lot Management': 'FFF7ED',
    'Grinding Dispatch': 'FDF2F8',
    'SFG Processing & Production': 'EFF6FF',
    'Material Transfers': 'F5F3FF',
    'FG Batch Management': 'FEF2F2',
    'FG Production': 'FFFBEB',
    'FG Quality Check': 'F0FDF4',
    'FG Verification & Dispatch': 'ECFEFF',
    'Stock & Inventory': 'FFF1F2',
    'Bill of Materials (BOM)': 'F0F9FF',
    'Master Data Management': 'FEFCE8',
    'QC Lab (Batch Management)': 'FAF5FF',
    'User & Role Management': 'FFF7ED',
    'Standards & Parameters': 'F1F5F9',
    'Logs & Activity Tracking': 'F8FAFC',
  };

  data.forEach((item, idx) => {
    const row = ws.addRow({
      sr: idx + 1,
      module: item.module,
      kra: item.kra,
      description: item.description,
      stakeholder: item.stakeholder,
      access: item.access,
    });

    const bgColor = moduleColors[item.module] || 'FFFFFF';

    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Calibri', size: 10.5 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'D1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
        left: { style: 'thin', color: { argb: 'D1D5DB' } },
        right: { style: 'thin', color: { argb: 'D1D5DB' } },
      };

      // Center-align Sr. No. and Access Level
      if (colNum === 1 || colNum === 6) {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      }

      // Bold the KRA column
      if (colNum === 3) {
        cell.font = { name: 'Calibri', size: 10.5, bold: true };
      }

      // Highlight Stakeholder column (empty — to be filled)
      if (colNum === 5) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE7' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'F59E0B' } },
          bottom: { style: 'thin', color: { argb: 'F59E0B' } },
          left: { style: 'thin', color: { argb: 'F59E0B' } },
          right: { style: 'thin', color: { argb: 'F59E0B' } },
        };
      }
    });

    row.height = 30;
  });

  // ── Merge module cells for same module ────────────────────────────
  // (Optional: leave unmerged for easier editing)

  // ── Add a legend / note at the bottom ─────────────────────────────
  const lastDataRow = ws.lastRow.number;
  ws.addRow([]);
  const noteRow = ws.addRow([]);
  ws.mergeCells(`A${noteRow.number}:F${noteRow.number}`);
  const noteCell = ws.getCell(`A${noteRow.number}`);
  noteCell.value = '⚠️  Please fill the "Stake Holder Name" column (highlighted in yellow) with the name of the person/role responsible for each Key Responsibility Area.';
  noteCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'B45309' } };
  noteCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } };
  noteCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  ws.getRow(noteRow.number).height = 24;

  // ── Access Level Legend ─────────────────────────────────────────
  const legendRow = ws.addRow([]);
  ws.mergeCells(`A${legendRow.number}:F${legendRow.number}`);
  const legendCell = ws.getCell(`A${legendRow.number}`);
  legendCell.value = 'Access Levels:  Create = Can create new records  |  Edit = Can modify existing records  |  Approve/Reject = Can authorize or decline  |  Verify = Can verify and confirm  |  Execute = Can trigger actions (email, export)  |  View = Read-only access';
  legendCell.font = { name: 'Calibri', size: 9.5, color: { argb: '6B7280' } };
  legendCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  ws.getRow(legendRow.number).height = 22;

  // ── Auto-filter ───────────────────────────────────────────────────
  ws.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: lastDataRow, column: 6 },
  };

  // ── Print setup ───────────────────────────────────────────────────
  ws.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };

  // ── Save ──────────────────────────────────────────────────────────
  const outputPath = path.join(__dirname, 'TGAF_BatchFlow_Permissions_Access_Control.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log(`✅ Excel file generated: ${outputPath}`);
}

generatePermissionsExcel().catch(console.error);
