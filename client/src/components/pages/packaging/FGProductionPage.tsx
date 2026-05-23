import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, message, Dropdown, Modal } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Cpu,
  Plus,
  CheckCircle,
  Layers,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Settings2,
  Clock,
  PlayCircle,
  MoreVertical,
  Download,
  Eye,
  FileCheck,
  FileText
} from 'lucide-react';

const PAGE_SIZE = 10;

/* ─── Component ─── */
const FGProductionPage: React.FC = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewQualityEntry, setViewQualityEntry] = useState<any>(null);
  const [page, setPage] = useState(1);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_FG_PRODUCTION_ENTRIES);
      setEntries(res.data?.data || []);
    } catch {
      message.error('Failed to load production entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const totalEntries = entries.length;
  const pendingEntries = entries.filter((e) => e.status === 'PENDING').length;
  const completedEntries = entries.filter((e) => e.status === 'COMPLETED').length;

  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));
  const pagedEntries = entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDownloadReport = (entry: any) => {
    const reports = entry.qualityReports || [];
    if (reports.length === 0) {
      message.warning('No quality report available for this entry');
      return;
    }

    // Merge all machine quality reports into one print view
    const allParamSections = reports.map((qualityReport: any) => {
      const reportDate = new Date(qualityReport.createdAt).toLocaleDateString();
      const machineLabel = qualityReport.machineName ? ` — ${qualityReport.machineName}` : '';

      const paramRows = qualityReport.parameters.map((p: any) =>
        `<tr>
           <td style="padding:10px 14px;border:1px solid #e2e8f0;color:#1e293b;font-size:13px;">${p.parameter}</td>
           <td style="padding:10px 14px;border:1px solid #e2e8f0;color:#64748b;font-size:13px;">${p.standard}</td>
           <td style="padding:10px 14px;border:1px solid #e2e8f0;color:#0f172a;font-size:13px;font-weight:600;">${p.result}</td>
         </tr>`
      ).join('');

      return `
        <div style="margin-bottom: 30px;">
          <div style="background: #f8fafc; padding: 10px 14px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 12px; font-size: 14px; font-weight: 600; color: #1e293b;">
            Report #: ${qualityReport.reportNumber}${machineLabel} <span style="color:#64748b;font-size:12px;">• ${reportDate}</span>
          </div>
          <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
            <thead>
              <tr><th style="background-color:#f8fafc;color:#475569;padding:12px 14px;text-align:left;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e2e8f0;">Parameter</th><th style="background-color:#f8fafc;color:#475569;padding:12px 14px;text-align:left;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e2e8f0;">Standard</th><th style="background-color:#f8fafc;color:#475569;padding:12px 14px;text-align:left;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e2e8f0;">Result</th></tr>
            </thead>
            <tbody>${paramRows}</tbody>
          </table>
        </div>
      `;
    }).join('');

    const html = `
      <html><head><title>FG Quality Report - ${entry.entryNumber}</title>
      <style>
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        body { font-family: 'Inter', system-ui, sans-serif; margin: 0; padding: 40px; color: #0f172a; background: #fff; }
        .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #f1f5f9; }
        .header h1 { margin: 0 0 10px 0; color: #1e293b; font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 40px; }
        .info-item { background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .info-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px; }
        .info-value { font-size: 14px; color: #0f172a; font-weight: 600; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center; color: #94a3b8; font-size: 11px; font-weight: 500; }
      </style></head><body>
      <div class="header">
        <h1>FG Quality Report</h1>
        <div style="color: #64748b; font-size: 14px;">Entry: <span style="color: #0f172a; font-weight: 600;">${entry.entryNumber}</span> • ${reports.length} machine${reports.length > 1 ? 's' : ''}</div>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Batch Number</div>
          <div class="info-value">${entry.fgBatch?.batchNumber || '-'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Product Name</div>
          <div class="info-value">${entry.fgProductName}</div>
        </div>
      </div>
      ${allParamSections}
      <div class="footer">
        Generated by TGAF BatchFlow &copy; ${new Date().getFullYear()} &middot; Printed on ${new Date().toLocaleString()}
      </div>
      </body></html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const handleDownloadProductionReport = (entry: any) => {
    const allMachines = entry.machineEntries || [];
    if (allMachines.length === 0) {
      message.warning('No machine data available for this entry');
      return;
    }

    const entryDate = new Date(entry.createdAt).toLocaleDateString('en-GB');

    /* Build one detail-table + downtime-table per machine */
    const machineSections = allMachines.map((me: any, idx: number) => {
      const machine = me.machine || {};
      const capacityLabel = machine.capacityUnit === 'BOXES_PER_SHIFT' ? 'Cartons/Shift' : (machine.capacityUnit || '');

      const downtimeRows = (me.downtimeRecords || []).map((dt: any) =>
        `<tr>
           <td style="border:1px solid #000;padding:6px 10px;font-size:12px;">${dt.stopTime || '-'}</td>
           <td style="border:1px solid #000;padding:6px 10px;font-size:12px;">${dt.startTime || '-'}</td>
           <td style="border:1px solid #000;padding:6px 10px;font-size:12px;">${dt.breakdownReason || '-'}</td>
           <td style="border:1px solid #000;padding:6px 10px;font-size:12px;">${dt.remark || '-'}</td>
         </tr>`
      ).join('') || `<tr><td colspan="4" style="border:1px solid #000;padding:8px;text-align:center;color:#999;font-size:11px;">No downtime records</td></tr>`;

      const pageBreak = idx < allMachines.length - 1 ? 'style="page-break-after: always;"' : '';

      return `
      <div ${pageBreak}>
        <div class="machine-badge">Machine ${idx + 1} of ${allMachines.length} — ${machine.name || me.machineName || '-'} (${machine.machineId || '-'})${me.machineBatchId ? ` | Batch: ${me.machineBatchId}` : ''}</div>

        <table class="header-table">
          <tr>
            <td rowspan="3" style="width:180px;text-align:center;vertical-align:middle;">
              <div style="font-size:18px;font-weight:bold;color:#2d5016;">Goodearth</div>
              <div style="font-size:10px;color:#666;">Agriventures</div>
            </td>
            <td colspan="4" class="company">TG AGRI FARM LIMITED</td>
          </tr>
          <tr>
            <td colspan="4" class="subtitle">Packing Machine Utilization, DPR & Wastage Record</td>
          </tr>
          <tr>
            <td colspan="2"><span class="label">Page Number:</span> <span class="value">${entry.entryNumber}</span></td>
            <td colspan="2"><span class="label">Date of Number:</span> <span class="value">${entry.entryNumber}</span></td>
          </tr>
          <tr>
            <td><span class="label">Location:</span></td>
            <td class="value">${machine.location || '-'}</td>
            <td><span class="label">Capacity:</span></td>
            <td class="value">${machine.capacityQty || '-'} ${capacityLabel}</td>
            <td><span class="label">Department:</span></td>
            <td class="value">Production</td>
          </tr>
          <tr>
            <td><span class="label">M/c Name & Co:</span></td>
            <td class="value">${machine.name || '-'} (${machine.machineId || '-'})</td>
            <td><span class="label">Achieve:</span></td>
            <td class="value">${me.todayAchieve || '-'} Boxes</td>
            <td><span class="label">Date:</span></td>
            <td class="value">${entryDate}</td>
          </tr>
          <tr>
            <td><span class="label">Product Name:</span></td>
            <td class="value">${entry.fgProductName || '-'}</td>
            <td><span class="label">Powder Wastage KG:</span></td>
            <td class="value">${me.powderWastageKg != null ? me.powderWastageKg + ' KG' : '-'}</td>
            <td><span class="label">Manpower:</span></td>
            <td class="value">${me.manPowerCount || '-'}</td>
          </tr>
          <tr>
            <td><span class="label">Pack Size:</span></td>
            <td class="value">${me.productName || entry.fgProductName || '-'}</td>
            <td><span class="label">Laminate Wastage KG:</span></td>
            <td class="value">${me.laminateWastageKg != null ? Number(me.laminateWastageKg).toFixed(2) + ' KG' : '-'}</td>
            <td><span class="label">Shift:</span></td>
            <td class="value">${me.shift || '-'}</td>
          </tr>
          <tr>
            <td><span class="label">Batch No:</span></td>
            <td class="value">${entry.fgBatch?.batchNumber || '-'}</td>
            <td><span class="label">Powder Wastage %:</span></td>
            <td class="value">${me.powderWastagePercentage != null ? me.powderWastagePercentage + '%' : '-'}</td>
            <td><span class="label">M/c Utilized:</span></td>
            <td class="value">${me.machineUtilizedHrs != null ? me.machineUtilizedHrs + ' minutes' : '-'}</td>
          </tr>
          <tr>
            <td><span class="label">Allocated Qty:</span></td>
            <td class="value">${me.allocatedQty || '-'} ${me.allocatedUnit || ''}</td>
            <td><span class="label">Laminate Wastage %:</span></td>
            <td class="value">${me.laminateWastagePercentage != null ? me.laminateWastagePercentage + '%' : '-'}</td>
            <td><span class="label">Non Utilized:</span></td>
            <td class="value">${me.machineNotUtilizedHrs != null ? me.machineNotUtilizedHrs + ' minutes' : '-'}</td>
          </tr>
        </table>

        <div class="section-title">Down Time Status</div>
        <table class="dt-table">
          <thead>
            <tr>
              <th style="width:15%">Stop Time</th>
              <th style="width:15%">Start Time</th>
              <th style="width:45%">Break Down</th>
              <th style="width:25%">Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${downtimeRows}
            ${Array(Math.max(0, 5 - (me.downtimeRecords?.length || 0))).fill('<tr><td style="border:1px solid #000;padding:10px;">&nbsp;</td><td style="border:1px solid #000;padding:10px;">&nbsp;</td><td style="border:1px solid #000;padding:10px;">&nbsp;</td><td style="border:1px solid #000;padding:10px;">&nbsp;</td></tr>').join('')}
          </tbody>
        </table>
      </div>`;
    }).join('');

    const html = `
      <html><head><title>Production Report - ${entry.entryNumber}</title>
      <style>
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { margin: 15mm; } }
        body { font-family: 'Arial', sans-serif; margin: 0; padding: 30px; color: #000; background: #fff; }
        .machine-badge { background: #1e293b; color: #fff; font-size: 13px; font-weight: bold; padding: 8px 16px; border-radius: 6px; margin-bottom: 12px; margin-top: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        .header-table { width: 100%; border-collapse: collapse; border: 2px solid #000; margin-bottom: 0; }
        .header-table td { border: 1px solid #000; padding: 6px 10px; font-size: 12px; }
        .header-table .company { font-size: 16px; font-weight: bold; text-align: center; }
        .header-table .subtitle { font-size: 11px; font-weight: bold; text-align: center; text-transform: uppercase; }
        .header-table .label { font-weight: bold; font-size: 11px; color: #333; white-space: nowrap; width: 120px; }
        .header-table .value { font-size: 13px; font-weight: 600; color: #000; }
        .section-title { font-size: 14px; font-weight: bold; margin: 20px 0 8px 0; border-bottom: 2px solid #000; padding-bottom: 4px; }
        .dt-table { width: 100%; border-collapse: collapse; border: 2px solid #000; }
        .dt-table th { border: 1px solid #000; padding: 8px 10px; font-size: 11px; text-transform: uppercase; font-weight: bold; background: #f0f0f0; text-align: left; }
        .dt-table td { border: 1px solid #000; padding: 6px 10px; }
        .footer { margin-top: 30px; font-size: 10px; color: #666; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; }
      </style></head><body>
      ${machineSections}
      <div class="footer">
        Generated by TGAF BatchFlow &copy; ${new Date().getFullYear()} &middot; Printed on ${new Date().toLocaleString()}
      </div>
      </body></html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const getDropdownMenuItems = (entry: any) => {
    const items = [];
    
    if (entry.status === 'COMPLETED' && entry.machineEntries?.length > 0) {
      items.push({
        key: 'download-production',
        icon: <FileText size={16} />,
        label: 'Download Production Report',
        onClick: (e: any) => { e.domEvent.stopPropagation(); handleDownloadProductionReport(entry); }
      });
    }

    if ((entry.qualityReports || []).length > 0) {
      items.push({
        key: 'view-quality',
        icon: <Eye size={16} />,
        label: 'View Quality Report',
        onClick: (e: any) => { e.domEvent.stopPropagation(); setViewQualityEntry(entry); }
      });
      items.push({
        key: 'download-quality',
        icon: <Download size={16} />,
        label: 'Download Quality Report',
        onClick: (e: any) => { e.domEvent.stopPropagation(); handleDownloadReport(entry); }
      });
    }

    if (items.length === 0) {
      items.push({
        key: 'no-actions',
        label: <span className="text-muted-foreground text-xs italic">No actions available</span>,
        disabled: true
      });
    }

    return { items };
  };

  return (
    <motion.div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          className="bg-card rounded-2xl border border-border overflow-hidden"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                <Settings2 className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">FG Production Allocation</h1>
                <p className="text-muted-foreground text-sm">
                  View and manage machine-wise FG production allocations
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Total Entries</p>
                <p className="text-2xl font-bold text-indigo-600">{totalEntries}</p>
                <div className="flex items-center mt-1">
                  <Layers size={12} className="text-indigo-500 mr-1" />
                  <span className="text-xs text-indigo-500 font-medium">All production allocations</span>
                </div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Pending Allocations</p>
                <p className="text-2xl font-bold text-amber-600">{pendingEntries}</p>
                <div className="flex items-center mt-1">
                  <PlayCircle size={12} className="text-amber-500 mr-1" />
                  <span className="text-xs text-amber-500 font-medium">Awaiting output entry</span>
                </div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Completed Entries</p>
                <p className="text-2xl font-bold text-emerald-600">{completedEntries}</p>
                <div className="flex items-center mt-1">
                  <CheckCircle size={12} className="text-emerald-500 mr-1" />
                  <span className="text-xs text-emerald-500 font-medium">Fully processed</span>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="flex justify-end gap-3">
              <Button
                type="primary"
                icon={<Plus size={14} />}
                onClick={() => navigate('/packaging/new-production-entry')}
                className="rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                New Allocation Entry
              </Button>
            </div>

            {/* Entries List */}
            <div className="space-y-3">
              {loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="inline-block w-8 h-8 border-[3px] rounded-full animate-spin mb-3" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
                  <p className="text-sm">Loading production entries…</p>
                </div>
              )}

              {!loading && entries.length === 0 && (
                <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
                  <Package className="mx-auto mb-3 opacity-40" size={36} />
                  <p className="text-lg font-medium">No production allocations found</p>
                  <p className="text-sm">Create a new allocation entry to assign machines.</p>
                </div>
              )}

              {!loading && pagedEntries.map(entry => (
                <motion.div
                  key={entry.id}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${entry.status === 'COMPLETED' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                        <Cpu size={16} className={entry.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-600'} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold font-mono text-primary flex items-center gap-2">
                          {entry.entryNumber}
                          {entry.fgBatch?.batchNumber && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-700">
                              
                            </span>
                          )}
                          {entry.machineName ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-700 flex items-center gap-1">
                              <Cpu size={9} /> {entry.machineName}
                            </span>
                          ) : entry.machineEntries && entry.machineEntries.length > 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-700 flex items-center gap-1">
                              <Cpu size={9} />
                              {entry.machineEntries.length === 1
                                ? entry.machineEntries[0].machineName
                                : `${entry.machineEntries.length} machines`}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {entry.fgProductName} • {new Date(entry.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Target Indicator — derive cartons from BOM outputQuantity */}
                      {(() => {
                        const bomOut = Number(entry.bom?.outputQuantity || 0);
                        const targetCartons = bomOut > 0 ? Math.round((Number(entry.targetQty) || 0) / bomOut) : null;
                        // Prefer totalAchievedBoxes (sum of operator-entered todayAchieve in cartons)
                        // since totalActualFg may still reflect the originally-allocated FG weight.
                        const achievedFromBoxes = Number(entry.totalAchievedBoxes || 0);
                        const actualCartons = achievedFromBoxes > 0
                          ? achievedFromBoxes
                          : (bomOut > 0 ? Math.round((Number(entry.totalActualFg) || 0) / bomOut) : null);
                        const isOnTarget = targetCartons != null && actualCartons != null
                          ? actualCartons >= targetCartons * 0.95
                          : false;
                        return (
                          <>
                            <div className="text-right hidden sm:block">
                              <div className="text-sm font-bold text-foreground">
                                {targetCartons != null ? `${targetCartons} cartons` : `${entry.targetQty} ${entry.targetUnit}`}
                              </div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-widest text-right">Target</div>
                            </div>

                            {entry.status === 'COMPLETED' && (
                              <div className="text-right hidden sm:block">
                                <div className={`text-sm font-bold ${isOnTarget ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  {actualCartons != null ? `${actualCartons} cartons` : `${entry.totalActualFg || 0} ${entry.targetUnit}`}
                                </div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-widest text-right">Actual</div>
                              </div>
                            )}
                          </>
                        );
                      })()}

                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        entry.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}>
                        {entry.status === 'COMPLETED' ? <CheckCircle size={10} className="mr-1" /> : <Clock size={10} className="mr-1" />}
                        {entry.status}
                      </span>
                      {expandedId === entry.id ? (
                        <ChevronDown size={16} className="text-muted-foreground ml-2" />
                      ) : (
                        <ChevronRight size={16} className="text-muted-foreground ml-2" />
                      )}
                      
                      {/* Vertical dots menu for actions */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <Dropdown menu={getDropdownMenuItems(entry)} placement="bottomRight" trigger={['click']}>
                          <div className="p-1.5 ml-1 rounded-md hover:bg-muted/80 cursor-pointer text-muted-foreground transition-colors self-center flex items-center justify-center h-8 w-8">
                            <MoreVertical size={18} />
                          </div>
                        </Dropdown>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedId === entry.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border p-4 bg-muted/20">
                          {entry.machineEntries && entry.machineEntries.length > 0 ? (
                            <div>
                              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Machine Allocation Details ({entry.machineEntries.length})
                              </div>
                              <div className="space-y-2">
                                {entry.machineEntries.map((m: any) => (
                                  <div key={m.id} className="bg-card p-4 rounded-lg border border-border">
                                    {m.machineBatchId && (
                                      <div className="mb-2">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/10 text-violet-700 border border-violet-200 font-mono">
                                          {m.machineBatchId}
                                        </span>
                                      </div>
                                    )}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Machine</div>
                                      <div className="text-sm font-semibold flex items-center gap-1.5">
                                        <Cpu size={12} className="text-amber-500" />
                                        {m.machine?.name || m.machineName || 'Unknown'}
                                        <span className="text-[10px] text-muted-foreground">({m.machine?.machineId || ''})</span>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Allocated</div>
                                      <div className="text-sm font-bold text-foreground">
                                        {(() => {
                                          const bomOut = Number(entry.bom?.outputQuantity || 0);
                                          if (bomOut > 0) {
                                            const cartons = Math.round((Number(m.allocatedQty) || 0) / bomOut);
                                            return `${cartons} cartons`;
                                          }
                                          return `${m.allocatedQty || 0} ${m.allocatedUnit}`;
                                        })()}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-emerald-600 uppercase tracking-wider mb-1">Today Achievement</div>
                                      <div className="text-sm font-bold text-emerald-600">
                                        {m.todayAchieve != null ? m.todayAchieve : (entry.status === 'COMPLETED' ? 0 : '-')}
                                        {entry.status === 'COMPLETED' && <span className="text-xs text-emerald-600/50 ml-1">cartons</span>}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-amber-600 uppercase tracking-wider mb-1">Laminate Wastage</div>
                                      <div className="text-sm font-semibold text-amber-600">
                                        {m.laminateWastageKg || (entry.status === 'COMPLETED' ? '0' : '-')}
                                        {entry.status === 'COMPLETED' && (
                                          <span className="text-xs text-amber-600/50 ml-1">
                                            Kg ({m.laminateWastagePercentage || '0'}%)
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground text-sm">
                              No machine mapping found for this entry.
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalEntries > PAGE_SIZE && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalEntries)} of {totalEntries}
                </p>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-border hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => setPage(n)} className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-colors ${page === n ? 'bg-amber-600 text-white border-amber-600' : 'border-border hover:bg-muted/40 text-foreground'}`}>
                      {n}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border border-border hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <Modal
        open={viewQualityEntry !== null}
        onCancel={() => setViewQualityEntry(null)}
        footer={null}
        width={750}
        closeIcon={<div className="bg-muted hover:bg-muted/80 p-1.5 rounded-md transition-colors"><MoreVertical className="hidden" /></div>}
        title={null}
        className="quality-modal"
      >
        {viewQualityEntry && (viewQualityEntry.qualityReports || []).length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6 bg-amber-500/10 p-5 rounded-xl border border-amber-500/20">
              <div className="p-3 bg-amber-500 rounded-lg shadow-lg shadow-amber-500/20">
                <FileCheck size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-foreground m-0">FG Quality Details</h3>
                <p className="text-sm text-amber-600 font-semibold m-0 mt-1">
                  {viewQualityEntry.qualityReports.length} Machine Report{viewQualityEntry.qualityReports.length > 1 ? 's' : ''}
                </p>
              </div>
              <Button
                type="primary"
                icon={<Download size={16} />}
                onClick={() => handleDownloadReport(viewQualityEntry)}
                className="bg-amber-500 border-amber-500 h-10 px-4 rounded-lg font-semibold hover:bg-amber-600"
              >
                Download PDF
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-muted/30 p-4 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Batch Number</p>
                <p className="text-foreground font-semibold text-sm">{viewQualityEntry.fgBatch?.batchNumber || '-'}</p>
              </div>
              <div className="bg-muted/30 p-4 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Product Name</p>
                <p className="text-foreground font-semibold text-sm">{viewQualityEntry.fgProductName}</p>
              </div>
            </div>

            {/* Render quality reports per machine */}
            <div className="space-y-4">
              {viewQualityEntry.qualityReports.map((report: any, rIdx: number) => (
                <div key={report.id} className="border border-border rounded-xl overflow-hidden shadow-sm bg-card">
                  <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu size={14} className="text-blue-500" />
                      <span className="font-bold text-sm text-foreground">{report.machineName || `Machine ${rIdx + 1}`}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{report.reportNumber}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-muted/20 border-b border-border">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Parameter</th>
                          <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Standard</th>
                          <th className="px-5 py-3 text-left text-xs font-bold text-amber-600 uppercase tracking-wider">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {report.parameters.map((p: any, idx: number) => (
                          <tr key={idx} className="hover:bg-muted/20 transition-colors">
                            <td className="px-5 py-3.5 text-sm font-semibold text-foreground">{p.parameter}</td>
                            <td className="px-5 py-3.5 text-sm text-muted-foreground">{p.standard}</td>
                            <td className="px-5 py-3.5 text-sm font-bold text-emerald-600">
                              {p.result || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        .quality-modal .ant-modal-content {
          border-radius: 20px;
          padding: 24px;
        }
      `}</style>
    </motion.div>
  );
};

export default FGProductionPage;
