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
  FileCheck
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
    if (!entry.qualityReport) {
      message.warning('No quality report available for this entry');
      return;
    }

    const { qualityReport } = entry;
    const reportDate = new Date(qualityReport.createdAt).toLocaleDateString();
    
    const paramRows = qualityReport.parameters.map((p: any) =>
      `<tr>
         <td style="padding:10px 14px;border:1px solid #e2e8f0;color:#1e293b;font-size:13px;">${p.parameter}</td>
         <td style="padding:10px 14px;border:1px solid #e2e8f0;color:#64748b;font-size:13px;">${p.standard}</td>
         <td style="padding:10px 14px;border:1px solid #e2e8f0;color:#0f172a;font-size:13px;font-weight:600;">${p.result}</td>
       </tr>`
    ).join('');

    const html = `
      <html><head><title>FG Quality Report - ${qualityReport.reportNumber}</title>
      <style>
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        body { font-family: 'Inter', system-ui, sans-serif; margin: 0; padding: 40px; color: #0f172a; background: #fff; }
        .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #f1f5f9; }
        .header h1 { margin: 0 0 10px 0; color: #1e293b; font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 40px; }
        .info-item { background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .info-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px; }
        .info-value { font-size: 14px; color: #0f172a; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
        th { background-color: #f8fafc; color: #475569; padding: 12px 14px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center; color: #94a3b8; font-size: 11px; font-weight: 500; }
      </style></head><body>
      <div class="header">
        <h1>FG Quality Report</h1>
        <div style="color: #64748b; font-size: 14px;">Report #: <span style="color: #0f172a; font-weight: 600;">${qualityReport.reportNumber}</span></div>
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
        <div class="info-item">
          <div class="info-label">Creation Date</div>
          <div class="info-value">${reportDate}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Allocation ID</div>
          <div class="info-value">${entry.entryNumber}</div>
        </div>
      </div>
      <table>
        <thead>
          <tr><th>Parameter</th><th>Standard</th><th>Result</th></tr>
        </thead>
        <tbody>
          ${paramRows}
        </tbody>
      </table>
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
    
    if (entry.qualityReport) {
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
                              Batch: {entry.fgBatch.batchNumber}
                            </span>
                          )}
                          {entry.machineName && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-700 flex items-center gap-1">
                              <Cpu size={9} /> {entry.machineName}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {entry.fgProductName} • {new Date(entry.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Target Indicator */}
                      <div className="text-right hidden sm:block">
                        <div className="text-sm font-bold text-foreground">{entry.targetQty} {entry.targetUnit}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest text-right">Target</div>
                      </div>

                      {/* Actual Indicator if completed */}
                      {entry.status === 'COMPLETED' && (
                        <div className="text-right hidden sm:block">
                          <div className={`text-sm font-bold ${entry.totalActualFg >= entry.targetQty * 0.95 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {entry.totalActualFg || 0} {entry.targetUnit}
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-widest text-right">Actual</div>
                        </div>
                      )}

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
                              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Machine Allocation Details</div>
                              {(() => {
                                const m = entry.machineEntries[0];
                                return (
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-card p-4 rounded-lg border border-border">
                                    <div>
                                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Machine</div>
                                      <div className="text-sm font-semibold flex items-center gap-1.5">
                                        <Cpu size={12} className="text-amber-500" />
                                        {m.machine?.name || entry.machineName || 'Unknown'}
                                        <span className="text-[10px] text-muted-foreground">({m.machine?.machineId || ''})</span>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Allocated</div>
                                      <div className="text-sm font-bold text-foreground">{m.allocatedQty || 0} {m.allocatedUnit}</div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-emerald-600 uppercase tracking-wider mb-1">Today Achievement</div>
                                      <div className="text-sm font-bold text-emerald-600">
                                        {m.todayAchieve || (entry.status === 'COMPLETED' ? '0' : '-')}
                                        {entry.status === 'COMPLETED' && <span className="text-xs text-emerald-600/50 ml-1">Boxes</span>}
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
                                );
                              })()}
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
        {viewQualityEntry && viewQualityEntry.qualityReport && (
          <div>
            <div className="flex items-center gap-3 mb-6 bg-amber-500/10 p-5 rounded-xl border border-amber-500/20">
              <div className="p-3 bg-amber-500 rounded-lg shadow-lg shadow-amber-500/20">
                <FileCheck size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-foreground m-0">FG Quality Details</h3>
                <p className="text-sm text-amber-600 font-semibold m-0 mt-1">Report #: {viewQualityEntry.qualityReport.reportNumber}</p>
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

            <div className="border border-border rounded-xl overflow-hidden shadow-sm bg-card">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Parameter</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Standard</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-amber-600 uppercase tracking-wider">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {viewQualityEntry.qualityReport.parameters.map((p: any, idx: number) => (
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
