import React, { useEffect, useState } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, Modal, Select, Input, InputNumber, message } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Cpu,
  Plus,
  Trash2,
  CheckCircle,
  Layers,
  AlertTriangle,
  Recycle,
  ChevronDown,
  ChevronRight,
  Settings2,
} from 'lucide-react';

const { Option } = Select;

/* ─── Types ─── */
interface BOMItem {
  id: string;
  rawMaterialName: string;
  rawMaterialId: string;
  quantity: number;
  unit: string;
  type: string; // SFG | PACKING
}

interface BOM {
  id: string;
  finishedProductName: string;
  finishedProductId: string;
  batchSize: number;
  batchUnit: string;
  items: BOMItem[];
}

interface Location {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface MachineEntry {
  machineName: string;
  machineLocationId: string;
  fgProduced: number;
  fgUnit: string;
  byproduct: number;
  byproductUnit: string;
  scrap: number;
  scrapUnit: string;
  notes: string;
}

interface ProductionPosting {
  id: string;
  postingNumber: string;
  fgProductName: string;
  totalFgProduced: number;
  totalByproduct: number;
  totalScrap: number;
  unit: string;
  status: string;
  createdAt: string;
  machineEntries: MachineEntry[];
}

/* ─── Component ─── */
const FGProductionPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [boms, setBoms] = useState<BOM[]>([]);
  const [postings, setPostings] = useState<ProductionPosting[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Production modal
  const [modal, setModal] = useState<{
    visible: boolean;
    step: number;
    selectedBomId: string;
    packagingLocationId: string;
    machineEntries: MachineEntry[];
    sfgUsed: { productName: string; quantity: number; unit: string }[];
    packingUsed: { productName: string; quantity: number; unit: string }[];
    loading: boolean;
  }>({
    visible: false,
    step: 0,
    selectedBomId: '',
    packagingLocationId: '',
    machineEntries: [],
    sfgUsed: [],
    packingUsed: [],
    loading: false,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [locRes, bomRes] = await Promise.all([
        api.get(API_ROUTES.RAW.GET_LOCATIONS),
        api.get(API_ROUTES.RAW.GET_BOMS),
      ]);
      setLocations(locRes.data || []);
      setBoms(bomRes.data?.data || bomRes.data || []);
    } catch {
      message.error('Failed to load data');
    }
    setLoading(false);
  };

  const fetchPostings = async () => {
    try {
      const res = await api.get(API_ROUTES.RAW.GET_PRODUCTION_POSTINGS, {
        params: { type: 'PACKAGING' },
      });
      setPostings(res.data?.data || []);
    } catch { /* silently */ }
  };

  useEffect(() => {
    fetchData();
    fetchPostings();
  }, []);

  const machineLocations = locations.filter(l => l.type === 'MACHINE' || l.type === 'PACKAGING_MACHINE');
  const packagingLocations = locations.filter(l => l.type === 'PACKAGING' || l.type === 'PACKAGING_PRODUCTION');

  const selectedBom = boms.find(b => b.id === modal.selectedBomId);

  const openModal = () => {
    setModal({
      visible: true,
      step: 0,
      selectedBomId: '',
      packagingLocationId: '',
      machineEntries: [{
        machineName: 'Machine 1',
        machineLocationId: '',
        fgProduced: 0,
        fgUnit: 'KG',
        byproduct: 0,
        byproductUnit: 'KG',
        scrap: 0,
        scrapUnit: 'KG',
        notes: '',
      }],
      sfgUsed: [],
      packingUsed: [],
      loading: false,
    });
  };

  const addMachine = () => {
    const num = modal.machineEntries.length + 1;
    setModal(p => ({
      ...p,
      machineEntries: [...p.machineEntries, {
        machineName: `Machine ${num}`,
        machineLocationId: '',
        fgProduced: 0,
        fgUnit: 'KG',
        byproduct: 0,
        byproductUnit: 'KG',
        scrap: 0,
        scrapUnit: 'KG',
        notes: '',
      }],
    }));
  };

  const removeMachine = (idx: number) => {
    setModal(p => ({
      ...p,
      machineEntries: p.machineEntries.filter((_, i) => i !== idx),
    }));
  };

  const updateMachine = (idx: number, field: string, value: any) => {
    setModal(p => ({
      ...p,
      machineEntries: p.machineEntries.map((m, i) => i === idx ? { ...m, [field]: value } : m),
    }));
  };

  const handleSelectBom = (bomId: string) => {
    const bom = boms.find(b => b.id === bomId);
    if (!bom) return;

    const sfgItems = (bom.items || []).filter(i => i.type === 'SFG' || i.type === 'RAW_MATERIAL');
    const packItems = (bom.items || []).filter(i => i.type === 'PACKING' || i.type === 'PACKAGING');

    setModal(p => ({
      ...p,
      selectedBomId: bomId,
      sfgUsed: sfgItems.map(i => ({ productName: i.rawMaterialName, quantity: i.quantity, unit: i.unit })),
      packingUsed: packItems.map(i => ({ productName: i.rawMaterialName, quantity: i.quantity, unit: i.unit })),
    }));
  };

  const handleNextStep = () => {
    if (modal.step === 0 && !modal.selectedBomId) {
      message.error('Please select a FG product (BOM)');
      return;
    }
    if (modal.step === 1 && !modal.packagingLocationId) {
      message.error('Please select the packaging production location');
      return;
    }
    setModal(p => ({ ...p, step: p.step + 1 }));
  };

  const handlePrevStep = () => {
    setModal(p => ({ ...p, step: Math.max(0, p.step - 1) }));
  };

  const handleSubmitProduction = async () => {
    const validMachines = modal.machineEntries.filter(m => m.fgProduced > 0 && m.machineLocationId);
    if (validMachines.length === 0) {
      message.error('At least one machine must have FG output and a location');
      return;
    }
    setModal(p => ({ ...p, loading: true }));
    try {
      await api.post(API_ROUTES.RAW.POST_PRODUCTION, {
        type: 'PACKAGING',
        bomId: modal.selectedBomId,
        packagingLocationId: modal.packagingLocationId,
        sfgUsed: modal.sfgUsed,
        packingUsed: modal.packingUsed,
        machineEntries: validMachines,
      });
      message.success('FG Production entry posted successfully');
      setModal(p => ({ ...p, visible: false, loading: false }));
      fetchPostings();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to post production');
      setModal(p => ({ ...p, loading: false }));
    }
  };

  const totalFg = modal.machineEntries.reduce((s, m) => s + (m.fgProduced || 0), 0);
  const totalByproduct = modal.machineEntries.reduce((s, m) => s + (m.byproduct || 0), 0);
  const totalScrap = modal.machineEntries.reduce((s, m) => s + (m.scrap || 0), 0);

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
                <h1 className="text-2xl font-bold text-foreground">FG Production Entry</h1>
                <p className="text-muted-foreground text-sm">
                  Machine-wise packaging production — SFG → FG with byproduct &amp; scrap tracking
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Available BOMs</p>
                <p className="text-2xl font-bold text-indigo-600">{boms.length}</p>
                <div className="flex items-center mt-1">
                  <Layers size={12} className="text-indigo-500 mr-1" />
                  <span className="text-xs text-indigo-500 font-medium">FG recipes available</span>
                </div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Machine Locations</p>
                <p className="text-2xl font-bold text-amber-600">{machineLocations.length}</p>
                <div className="flex items-center mt-1">
                  <Cpu size={12} className="text-amber-500 mr-1" />
                  <span className="text-xs text-amber-500 font-medium">Packaging machines</span>
                </div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Production Entries</p>
                <p className="text-2xl font-bold text-emerald-600">{postings.length}</p>
                <div className="flex items-center mt-1">
                  <CheckCircle size={12} className="text-emerald-500 mr-1" />
                  <span className="text-xs text-emerald-500 font-medium">Total posted</span>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="flex justify-end">
              <Button
                type="primary"
                icon={<Plus size={14} />}
                onClick={openModal}
                className="rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                New Production Entry
              </Button>
            </div>

            {/* Postings List */}
            <div className="space-y-3">
              {loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="inline-block w-8 h-8 border-[3px] rounded-full animate-spin mb-3" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
                  <p className="text-sm">Loading production entries…</p>
                </div>
              )}

              {!loading && postings.length === 0 && (
                <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
                  <Package className="mx-auto mb-3 opacity-40" size={36} />
                  <p className="text-lg font-medium">No production entries yet</p>
                  <p className="text-sm">Create a new FG production entry to start packaging.</p>
                </div>
              )}

              {!loading && postings.map(posting => (
                <motion.div
                  key={posting.id}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(expandedId === posting.id ? null : posting.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <Cpu size={16} className="text-amber-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold font-mono text-primary">{posting.postingNumber}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {posting.fgProductName} • {new Date(posting.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-bold text-foreground">{posting.totalFgProduced} {posting.unit}</div>
                        <div className="text-[10px] text-muted-foreground">FG Output</div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        <CheckCircle size={10} className="mr-1" /> {posting.status}
                      </span>
                      {expandedId === posting.id ? (
                        <ChevronDown size={16} className="text-muted-foreground" />
                      ) : (
                        <ChevronRight size={16} className="text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedId === posting.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border p-4 bg-muted/20">
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10">
                              <div className="text-[10px] uppercase tracking-widest text-emerald-600 font-semibold mb-1">FG Produced</div>
                              <div className="text-lg font-bold text-emerald-700">{posting.totalFgProduced} {posting.unit}</div>
                            </div>
                            <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
                              <div className="text-[10px] uppercase tracking-widest text-amber-600 font-semibold mb-1">Byproduct</div>
                              <div className="text-lg font-bold text-amber-700">{posting.totalByproduct} {posting.unit}</div>
                            </div>
                            <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/10">
                              <div className="text-[10px] uppercase tracking-widest text-red-600 font-semibold mb-1">Scrap</div>
                              <div className="text-lg font-bold text-red-700">{posting.totalScrap} {posting.unit}</div>
                            </div>
                          </div>

                          {posting.machineEntries && posting.machineEntries.length > 0 && (
                            <div>
                              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Machine-wise Breakdown</div>
                              <table className="min-w-full">
                                <thead>
                                  <tr className="bg-muted/40">
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Machine</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">FG Output</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Byproduct</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Scrap</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                  {posting.machineEntries.map((entry, idx) => (
                                    <tr key={idx} className="hover:bg-muted/30">
                                      <td className="px-3 py-2 text-sm font-medium text-foreground">
                                        <Cpu size={12} className="inline mr-1 text-amber-500" />{entry.machineName}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-right font-semibold text-emerald-600">{entry.fgProduced} {entry.fgUnit}</td>
                                      <td className="px-3 py-2 text-sm text-right text-amber-600">{entry.byproduct} {entry.byproductUnit}</td>
                                      <td className="px-3 py-2 text-sm text-right text-red-600">{entry.scrap} {entry.scrapUnit}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── Production Modal ─── */}
      <Modal
        open={modal.visible}
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <Settings2 className="text-white" size={14} />
            </div>
            <span className="text-lg font-semibold">New FG Production Entry</span>
          </div>
        }
        onCancel={() => setModal(p => ({ ...p, visible: false }))}
        width={900}
        footer={null}
      >
        <div className="space-y-5 mt-4">
          {/* Step indicator */}
          <div className="flex items-center justify-center mb-4 bg-muted/20 p-3 rounded-xl border border-border/50">
            {['Select FG', 'Location', 'Machine Entry', 'Review'].map((label, idx) => (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all duration-300 ${
                    modal.step >= idx
                      ? 'bg-gradient-to-br from-amber-400 to-orange-600 text-white scale-110'
                      : 'bg-white border-2 border-muted text-muted-foreground'
                  }`}>
                    {modal.step > idx ? <CheckCircle size={14} /> : idx + 1}
                  </div>
                  <span className={`text-[10px] font-semibold uppercase ${modal.step >= idx ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                </div>
                {idx < 3 && (
                  <div className={`w-16 h-0.5 mx-2 rounded-full transition-all ${modal.step > idx ? 'bg-amber-500' : 'bg-muted'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step 0: Select FG Product (BOM) */}
          {modal.step === 0 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="text-center mb-4">
                <div className="inline-flex p-3 bg-amber-100 rounded-2xl text-amber-600 mb-2">
                  <Package size={28} />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Select Final Product (FG)</h3>
                <p className="text-sm text-muted-foreground mt-1">Choose which FG is being packed — system will fetch the BOM</p>
              </div>

              <Select
                style={{ width: '100%' }}
                placeholder="Search and select a BOM / FG product"
                size="large"
                value={modal.selectedBomId || undefined}
                onChange={handleSelectBom}
                showSearch
                filterOption={(input, option) => (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())}
              >
                {boms.map(bom => (
                  <Option key={bom.id} value={bom.id}>
                    {bom.finishedProductName} — Batch: {bom.batchSize} {bom.batchUnit}
                  </Option>
                ))}
              </Select>

              {selectedBom && (
                <div className="bg-muted/20 rounded-xl border border-border p-4 mt-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">BOM Requirements</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] font-semibold text-emerald-600 uppercase mb-1">SFG / Raw Materials</div>
                      {modal.sfgUsed.map((item, idx) => (
                        <div key={idx} className="text-sm text-foreground flex justify-between py-0.5">
                          <span>{item.productName}</span>
                          <span className="font-semibold">{item.quantity} {item.unit}</span>
                        </div>
                      ))}
                      {modal.sfgUsed.length === 0 && <div className="text-xs text-muted-foreground">None</div>}
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-blue-600 uppercase mb-1">Packing Materials</div>
                      {modal.packingUsed.map((item, idx) => (
                        <div key={idx} className="text-sm text-foreground flex justify-between py-0.5">
                          <span>{item.productName}</span>
                          <span className="font-semibold">{item.quantity} {item.unit}</span>
                        </div>
                      ))}
                      {modal.packingUsed.length === 0 && <div className="text-xs text-muted-foreground">None</div>}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 1: Packaging Location */}
          {modal.step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-foreground">Select Packaging Production Location</h3>
                <p className="text-sm text-muted-foreground mt-1">Where SFG & packing consumption happens</p>
              </div>
              <Select
                style={{ width: '100%' }}
                placeholder="Select packaging production location"
                size="large"
                value={modal.packagingLocationId || undefined}
                onChange={val => setModal(p => ({ ...p, packagingLocationId: val }))}
                showSearch
                filterOption={(input, option) => (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())}
              >
                {packagingLocations.map(l => (
                  <Option key={l.id} value={l.id}>{l.name} ({l.code})</Option>
                ))}
              </Select>
            </motion.div>
          )}

          {/* Step 2: Machine-wise Production Entry */}
          {modal.step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Machine-wise Production</h3>
                  <p className="text-xs text-muted-foreground">FG output, byproduct & scrap per machine</p>
                </div>
                <Button size="small" icon={<Plus size={12} />} onClick={addMachine}>Add Machine</Button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {modal.machineEntries.map((entry, idx) => (
                  <div key={idx} className="bg-muted/20 rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Cpu size={16} className="text-amber-600" />
                        <Input
                          size="small"
                          value={entry.machineName}
                          onChange={e => updateMachine(idx, 'machineName', e.target.value)}
                          className="w-40 font-semibold"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          size="small"
                          placeholder="Machine Location"
                          value={entry.machineLocationId || undefined}
                          onChange={val => updateMachine(idx, 'machineLocationId', val)}
                          style={{ width: 200 }}
                          showSearch
                          filterOption={(input, option) => (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())}
                        >
                          {machineLocations.map(l => (
                            <Option key={l.id} value={l.id}>{l.name}</Option>
                          ))}
                        </Select>
                        {modal.machineEntries.length > 1 && (
                          <button onClick={() => removeMachine(idx)} className="text-red-400 hover:text-red-600">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                        <div className="text-[10px] uppercase tracking-widest text-emerald-600 font-semibold mb-1 flex items-center gap-1">
                          <Package size={10} /> FG Produced
                        </div>
                        <div className="flex gap-2">
                          <InputNumber
                            size="small"
                            min={0}
                            value={entry.fgProduced}
                            onChange={val => updateMachine(idx, 'fgProduced', val || 0)}
                            className="flex-1"
                          />
                          <Select size="small" value={entry.fgUnit} onChange={val => updateMachine(idx, 'fgUnit', val)} style={{ width: 70 }}>
                            <Option value="KG">KG</Option>
                            <Option value="PCS">PCS</Option>
                            <Option value="Ton">Ton</Option>
                          </Select>
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                        <div className="text-[10px] uppercase tracking-widest text-amber-600 font-semibold mb-1 flex items-center gap-1">
                          <Recycle size={10} /> Byproduct
                        </div>
                        <div className="flex gap-2">
                          <InputNumber
                            size="small"
                            min={0}
                            value={entry.byproduct}
                            onChange={val => updateMachine(idx, 'byproduct', val || 0)}
                            className="flex-1"
                          />
                          <Select size="small" value={entry.byproductUnit} onChange={val => updateMachine(idx, 'byproductUnit', val)} style={{ width: 70 }}>
                            <Option value="KG">KG</Option>
                            <Option value="PCS">PCS</Option>
                          </Select>
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                        <div className="text-[10px] uppercase tracking-widest text-red-600 font-semibold mb-1 flex items-center gap-1">
                          <AlertTriangle size={10} /> Scrap
                        </div>
                        <div className="flex gap-2">
                          <InputNumber
                            size="small"
                            min={0}
                            value={entry.scrap}
                            onChange={val => updateMachine(idx, 'scrap', val || 0)}
                            className="flex-1"
                          />
                          <Select size="small" value={entry.scrapUnit} onChange={val => updateMachine(idx, 'scrapUnit', val)} style={{ width: 70 }}>
                            <Option value="KG">KG</Option>
                            <Option value="PCS">PCS</Option>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Review */}
          {modal.step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="bg-muted/20 p-4 rounded-xl border border-border/50">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">FG Product</div>
                    <div className="text-sm font-bold text-primary">{selectedBom?.finishedProductName || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Machines Used</div>
                    <div className="text-sm font-bold text-foreground">{modal.machineEntries.length}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Consumption Location</div>
                    <div className="text-sm font-bold text-foreground">
                      {locations.find(l => l.id === modal.packagingLocationId)?.name || '-'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/10 text-center">
                  <div className="text-[10px] uppercase tracking-widest text-emerald-600 font-semibold mb-1">Total FG</div>
                  <div className="text-2xl font-bold text-emerald-700">{totalFg}</div>
                  <div className="text-xs text-emerald-600">{modal.machineEntries[0]?.fgUnit || 'KG'}</div>
                </div>
                <div className="bg-amber-500/5 rounded-xl p-4 border border-amber-500/10 text-center">
                  <div className="text-[10px] uppercase tracking-widest text-amber-600 font-semibold mb-1">Total Byproduct</div>
                  <div className="text-2xl font-bold text-amber-700">{totalByproduct}</div>
                  <div className="text-xs text-amber-600">{modal.machineEntries[0]?.byproductUnit || 'KG'}</div>
                </div>
                <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/10 text-center">
                  <div className="text-[10px] uppercase tracking-widest text-red-600 font-semibold mb-1">Total Scrap</div>
                  <div className="text-2xl font-bold text-red-700">{totalScrap}</div>
                  <div className="text-xs text-red-600">{modal.machineEntries[0]?.scrapUnit || 'KG'}</div>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Machine Breakdown</div>
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-muted/40">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Machine</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">FG</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Byproduct</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Scrap</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {modal.machineEntries.map((m, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 text-sm font-medium"><Cpu size={12} className="inline mr-1 text-amber-500" />{m.machineName}</td>
                        <td className="px-3 py-2 text-sm text-right font-semibold text-emerald-600">{m.fgProduced} {m.fgUnit}</td>
                        <td className="px-3 py-2 text-sm text-right text-amber-600">{m.byproduct} {m.byproductUnit}</td>
                        <td className="px-3 py-2 text-sm text-right text-red-600">{m.scrap} {m.scrapUnit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 mt-2 border-t border-border/80">
            <Button size="large" className="rounded-lg" disabled={modal.step === 0} onClick={handlePrevStep}>Back</Button>
            <div className="flex gap-3">
              <Button size="large" className="rounded-lg" onClick={() => setModal(p => ({ ...p, visible: false }))}>Cancel</Button>
              {modal.step < 3 ? (
                <Button
                  size="large"
                  type="primary"
                  onClick={handleNextStep}
                  className="rounded-lg shadow-md font-semibold px-8"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none' }}
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  size="large"
                  type="primary"
                  loading={modal.loading}
                  onClick={handleSubmitProduction}
                  className="rounded-lg shadow-md font-semibold px-6"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                >
                  <CheckCircle className="w-4 h-4 mr-2 inline" /> Post Production
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default FGProductionPage;
