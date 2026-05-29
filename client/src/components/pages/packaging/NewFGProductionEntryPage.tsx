import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, InputNumber, Input, message, Steps, Select, Switch, Modal } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Package,
  Factory,
  CheckCircle,
  MapPin,
  Database,
  Truck,
  ClipboardList,
  Target,
  Boxes,
  Cog,
  Gauge,
  Users,
  Search,
  Plus,
  X,
  AlertCircle
} from 'lucide-react';

const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

interface PkgEntry {
  id: string;
  transferNumber: string | null;
  rawMaterialId: string | null;
  productName: string | null;
  skuCode: string | null;
  qty: number | null;
  unit: string;
}

// One SFG lot drawn by a machine. A machine may split its required SFG across
// several lots when no single transfer has enough remaining.
interface SfgEntry {
  id: string;
  transferNumber: string | null;
  qty: number | null;
}

interface MachineAllocation {
  id: string;
  machineId: string;
  manPower: boolean;
  sfgEntries: SfgEntry[];
  pkgEntries: PkgEntry[];
  notes: string;
}

const MAX_PKG_PER_MACHINE = 3;

const newPkgEntry = (): PkgEntry => ({
  id: genId(),
  transferNumber: null,
  rawMaterialId: null,
  productName: null,
  skuCode: null,
  qty: null,
  unit: 'KG',
});

const newSfgEntry = (): SfgEntry => ({
  id: genId(),
  transferNumber: null,
  qty: null,
});

// Sum of a row's SFG lots, in KG.
const rowSfgKg = (a: MachineAllocation): number =>
  a.sfgEntries.reduce((s, e) => s + (Number(e.qty) || 0), 0);

const newEmptyAllocation = (): MachineAllocation => ({
  id: genId(),
  machineId: '',
  manPower: true,
  sfgEntries: [newSfgEntry()],
  pkgEntries: [newPkgEntry()],
  notes: '',
});

/* ─── Unit conversion helpers ─── */
const UNIT_TO_GRAMS: Record<string, number> = {
  gram: 1, grams: 1, g: 1,
  kg: 1000, KG: 1000, Kg: 1000,
  ton: 1_000_000, Ton: 1_000_000, TON: 1_000_000,
};
function toGrams(qty: number, unit: string): number {
  const factor = UNIT_TO_GRAMS[unit] ?? UNIT_TO_GRAMS[unit.toLowerCase()] ?? 1;
  return qty * factor;
}

/* ─── Clean quantity formatter ─── */
function formatQty(val: number): string {
  // Round to 3 meaningful decimals, strip trailing zeros
  const rounded = Number(val.toFixed(3));
  return rounded.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

const LAMINATE_UNIT_OPTIONS = ['KG', 'Ton', 'gram'].map(u => ({ value: u, label: u }));

const NON_WEIGHT_UNITS = new Set(['piece', 'pieces', 'pcs', 'boxes', 'bags', 'packets', 'rolls', 'sheets', 'units']);
const isNonWeightUnit = (u?: string | null) => !!u && NON_WEIGHT_UNITS.has(u.toLowerCase());

const NewFGProductionEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // General State
  const [locations, setLocations] = useState<any[]>([]);
  const [, setMachines] = useState<any[]>([]);
  const [boms, setBoms] = useState<any[]>([]);
  const [fetchingBase, setFetchingBase] = useState(true);

  // Step 1: Selection & Planning
  // Input is in CARTONS. We derive productionQty (weight) = cartons × BOM.outputQuantity.
  // 1 BOM execution = 1 carton, so cartons is also the BOM scale factor.
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedBomId, setSelectedBomId] = useState('');
  const [plannedCartons, setPlannedCartons] = useState<number | null>(null);
  // productionQty / productionUnit are derived from plannedCartons × BOM output.
  // We still keep them in state because downstream consumption + submit payloads use them.
  const [productionQty, setProductionQty] = useState<number | null>(null);
  const [productionUnit, setProductionUnit] = useState('KG');

  // Toggle to fall back to today's manual machine editor if the operator wants to override.
  const [manualOverride, setManualOverride] = useState(false);

  // Materials & Consumptions
  const [consumptionLines, setConsumptionLines] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);

  // Step 2: Multi-machine allocation
  const [allocations, setAllocations] = useState<MachineAllocation[]>([newEmptyAllocation()]);
  const [outputMachines, setOutputMachines] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);


  // SFG transfers for SFG consumption column
  const [sfgTransfers, setSfgTransfers] = useState<any[]>([]);

  /* ─── Fetch Base Data ─── */
  useEffect(() => {
    const fetchBase = async () => {
      setFetchingBase(true);
      try {
        const [locRes, mchRes, bomRes] = await Promise.all([
          api.get(API_ROUTES.RAW.GET_LOCATIONS),
          api.get(API_ROUTES.MACHINE.GET_MACHINES),
          api.get(API_ROUTES.RAW.GET_FG_BOMS),
        ]);
        const locData = locRes.data;
        const allLocations: any[] = Array.isArray(locData) ? locData : locData?.data || [];
        // FG production happens on the production floor only — restrict to that location.
        const prodFloors = allLocations.filter(
          (l) => (l?.name || '').toLowerCase().trim() === 'production floor'
        );
        setLocations(prodFloors);
        if (prodFloors.length > 0) {
          setSelectedLocationId(prodFloors[0].id);
        }
        setMachines(mchRes.data?.data || []);
        setBoms(bomRes.data?.data || []);
      } catch (err) {
        message.error('Failed to load initial data');
      } finally {
        setFetchingBase(false);
      }
    };
    fetchBase();
  }, []);

  /* ─── Fetch machines that have production output records ─── */
  useEffect(() => {
    const fetchOutputMachines = async () => {
      try {
        const res = await api.get(API_ROUTES.MACHINE.GET_MACHINES_WITH_OUTPUT);
        console.log('Machines with output response:', res.data);
        setOutputMachines(res.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch machines with output:', err);
        setOutputMachines([]);
      }
    };
    fetchOutputMachines();
  }, []);


  /* ─── Fetch SFG & Packaging transfers (accepted) for the selected location ─── */
  useEffect(() => {
    if (!selectedLocationId) return;
    const fetchTransfers = async () => {
      try {
        const res = await api.get(API_ROUTES.RAW.GET_TRANSFERS, {
          params: { direction: 'SFG_TO_PRODUCTION', status: 'ACCEPTED' }
        });
        const transfers = res.data?.data || res.data || [];
        const filtered = Array.isArray(transfers)
          ? transfers.filter((t: any) => t.toLocationId === selectedLocationId)
          : [];
        // Split into SFG-only and Packaging-only based on lineType
        const sfgOnly = filtered.filter((t: any) =>
          t.lines?.some((l: any) => !l.lineType || l.lineType === 'SFG')
        ).map((t: any) => ({
          ...t,
          lines: t.lines?.filter((l: any) => !l.lineType || l.lineType === 'SFG') || []
        }));
        setSfgTransfers(sfgOnly);
      } catch {
        setSfgTransfers([]);
      }
    };
    fetchTransfers();
  }, [selectedLocationId]);

  /* ─── Fetch BOM Items and Stock ─── */
  const fetchBomItems = async (bomId: string, qty: number, unit: string, locationId: string) => {
    if (!bomId || !qty || !locationId) return;
    setLoadingItems(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_FG_BOM_ITEMS, {
        params: { bomId, productionQty: qty, productionUnit: unit, locationId }
      });
      if (res.data?.items) {
        const lines = res.data.items.map((item: any) => {
          let sourceType = 'STOCK';
          let batchNumber = '';
          let dispatchId = '';

          if (item.isSFG) {
            sourceType = 'SFG_BATCH';
            if (item.availableSfgBatches && item.availableSfgBatches.length > 0) {
              const b = item.availableSfgBatches[0];
              batchNumber = b.batchNumber;
              dispatchId = b.dispatchId;
            }
          }

          return {
            rawMaterialId: item.rawMaterialId,
            rawMaterialName: item.rawMaterialName,
            skuCode: item.skuCode,
            isSFG: item.isSFG,
            isPackaging: item.isPackaging,
            expectedQuantity: item.expectedQuantity,
            actualQuantity: item.expectedQuantity,
            unit: item.displayUnit,
            sourceType,
            batchNumber,
            dispatchId,
            availableSfgBatches: item.availableSfgBatches || [],
            currentStockQty: item.currentStockQty || 0,
            currentStockUnit: item.currentStockUnit || item.displayUnit,
          };
        });
        setConsumptionLines(lines);

        // Removed packaging master fetch
      }
    } catch (err) {
      message.error('Failed to load BOM items');
    }
    setLoadingItems(false);
  };

  /* ─── Reset availability when inputs change ─── */
  useEffect(() => {
    setShowAvailability(false);
    setConsumptionLines([]);
  }, [selectedBomId, productionQty, productionUnit, selectedLocationId]);

  /* ─── Re-derive productionQty from cartons whenever the BOM changes ─── */
  useEffect(() => {
    const bom = boms.find((b) => b.id === selectedBomId);
    if (!bom || !plannedCartons || plannedCartons <= 0) {
      return;
    }
    setProductionQty(Number((plannedCartons * bom.outputQuantity).toFixed(3)));
    setProductionUnit(bom.unitOfMeasurement || 'KG');
  }, [selectedBomId, boms, plannedCartons]);

  /* ─── Handle Check Availability button click ─── */
  const handleCheckAvailability = () => {
    if (!selectedBomId || !productionQty || productionQty <= 0 || !selectedLocationId) {
      message.warning('Please fill in Location, Target BOM, and Production Quantity first.');
      return;
    }
    setShowAvailability(true);
    fetchBomItems(selectedBomId, productionQty, productionUnit, selectedLocationId);
  };


  /* ─── Helper: Look up a batch (with remaining qty already net of prior consumption)
     from consumptionLines for a given transfer number. Returns null if the transfer
     has been fully consumed by prior FG batches (backend excludes it) or isn't
     relevant to any BOM material in the current plan. ─── */
  const findSfgBatchByTransfer = (transferNumber: string): any | null => {
    for (const line of consumptionLines) {
      if (!line?.isSFG) continue;
      const batch = (line.availableSfgBatches || []).find(
        (b: any) => b?.transferNumber === transferNumber
      );
      if (batch) return batch;
    }
    return null;
  };

  /* ─── Helper: Get SFG consumption info — only transfers with available qty > 0 ─── */
  const getSfgConsumptionInfo = (): { transferNumbers: string[] } => {
    const transferNumbers: string[] = [];
    // Primary: use BOM-computed available batches (has accurate remainingQuantity)
    for (const line of consumptionLines) {
      if (!line?.isSFG) continue;
      for (const batch of (line.availableSfgBatches || [])) {
        if (batch?.transferNumber && (batch.remainingQuantity || 0) > 0 && !transferNumbers.includes(batch.transferNumber)) {
          transferNumbers.push(batch.transferNumber);
        }
      }
    }
    // Fallback: if no consumption lines loaded yet, use raw transfers
    if (transferNumbers.length === 0 && consumptionLines.length === 0) {
      for (const transfer of sfgTransfers) {
        if (!transferNumbers.includes(transfer.transferNumber)) {
          transferNumbers.push(transfer.transferNumber);
        }
      }
    }
    return { transferNumbers };
  };

  /* ─── Helper: Get Available Transfer Stock ─── */
  const getSfgTransferAvailable = (transferNumber: string) => {
     if (!transferNumber) return { qty: 0, unit: 'KG' };
     // Prefer the backend-computed remaining qty (already net of past allocations)
     const batch = findSfgBatchByTransfer(transferNumber);
     if (batch) {
       return { qty: batch.remainingQuantity || 0, unit: batch.unit || 'KG' };
     }
     // Fallback to raw transfer qty if consumption data is unavailable
     const transfer = sfgTransfers.find(t => t.transferNumber === transferNumber);
     if (!transfer) return { qty: 0, unit: 'KG' };
     let sum = 0;
     let un = 'KG';
     transfer.lines?.forEach((l: any) => {
         sum += l.quantity || 0;
         un = l.unitOfMeasurement || 'KG';
     });
     return { qty: sum, unit: un };
  };

  /* ─── Packaging Transfer helpers ─── */

  /** All (transfer × pkgLine) pairs available across the BOM's packaging lines.
   *  Each option corresponds to ONE packaging material from ONE transfer batch. */
  interface PkgOption {
    transferNumber: string;
    rawMaterialId: string;
    productName: string;
    skuCode: string;
    unit: string;
    remainingQty: number; // remaining qty net of prior FG batch consumptions (from backend)
  }
  const getPkgOptions = (): PkgOption[] => {
    const out: PkgOption[] = [];
    const seen = new Set<string>();
    for (const line of consumptionLines) {
      if (!line?.isPackaging) continue;
      for (const batch of (line.availableSfgBatches || [])) {
        if (!batch?.transferNumber) continue;
        if ((batch.remainingQuantity || 0) <= 0) continue;
        const rmId = line.rawMaterialId;
        const key = `${batch.transferNumber}__${rmId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          transferNumber: batch.transferNumber,
          rawMaterialId: rmId,
          productName: line.rawMaterialName,
          skuCode: line.skuCode || '',
          unit: batch.unit || line.unit || 'KG',
          remainingQty: batch.remainingQuantity || 0,
        });
      }
    }
    return out;
  };

  /** Returns remaining qty (in the line's display unit) for a (transfer × rawMaterial)
   *  pair, accounting only for allocations on rows ABOVE the given row. This gives a
   *  sequential / waterfall view: machine 1 sees the full base, machine 2 sees base
   *  minus machine 1's take, machine 3 sees base minus machines 1+2, etc. — which
   *  matches how the machines actually run.
   *  Non-weight units (Piece etc.) are counted directly without any KG conversion. */
  const getPkgRemainingFor = (rowId: string, transferNumber: string, rawMaterialId: string) => {
    const opt = getPkgOptions().find(o => o.transferNumber === transferNumber && o.rawMaterialId === rawMaterialId);
    if (!opt) return { qty: 0, unit: 'KG' };

    const optUnit = opt.unit || 'KG';
    const currentIdx = allocations.findIndex(a => a.id === rowId);
    // Rows above this one ("prior" machines) deduct from this row's available.
    // If rowId is unknown (e.g. transient), treat it as last — all current rows count.
    const priorRows = currentIdx === -1 ? allocations : allocations.slice(0, currentIdx);

    // Non-weight (Piece, Box, etc.): count directly in the unit itself.
    if (isNonWeightUnit(optUnit)) {
      const used = priorRows.reduce((sum, a) => {
        let rowUsed = 0;
        for (const p of a.pkgEntries) {
          if (p.transferNumber === transferNumber && p.rawMaterialId === rawMaterialId && p.qty != null) {
            rowUsed += Number(p.qty) || 0;
          }
        }
        return sum + rowUsed;
      }, 0);
      const remaining = Math.max(0, opt.remainingQty - used);
      return { qty: Math.floor(remaining), unit: optUnit };
    }

    // Weight-based: normalize prior rows' qty to KG so different weight units sum correctly.
    const usedKg = priorRows.reduce((sum, a) => {
      let rowUsed = 0;
      for (const p of a.pkgEntries) {
        if (p.transferNumber === transferNumber && p.rawMaterialId === rawMaterialId && p.qty != null) {
          rowUsed += toGrams(Number(p.qty), p.unit || 'KG') / 1000;
        }
      }
      return sum + rowUsed;
    }, 0);

    const totalAvailKg =
      optUnit.toLowerCase() === 'kg' ? opt.remainingQty : toGrams(opt.remainingQty, optUnit) / 1000;
    const remainingKg = Math.max(0, totalAvailKg - usedKg);

    if (optUnit.toLowerCase() === 'kg') {
      return { qty: Number(remainingKg.toFixed(3)), unit: 'KG' };
    }
    const factor = UNIT_TO_GRAMS[optUnit] ?? UNIT_TO_GRAMS[optUnit.toLowerCase()] ?? 1000;
    return { qty: Number(((remainingKg * 1000) / factor).toFixed(3)), unit: optUnit };
  };

  /** Max qty for a PKG entry, in the entry's own unit. */
  const getPkgEntryMax = (
    rowId: string,
    transferNumber: string | null,
    rawMaterialId: string | null,
    entryUnit: string
  ): number | undefined => {
    if (!transferNumber || !rawMaterialId) return undefined;
    const remaining = getPkgRemainingFor(rowId, transferNumber, rawMaterialId);

    // Non-weight: cap at the integer count remaining; no cross-unit conversion possible.
    if (isNonWeightUnit(remaining.unit) || isNonWeightUnit(entryUnit)) {
      return remaining.qty;
    }
    const remainingGrams = toGrams(remaining.qty, remaining.unit);
    const rowFactor = UNIT_TO_GRAMS[entryUnit] ?? UNIT_TO_GRAMS[entryUnit.toLowerCase()] ?? 1000;
    return Number((remainingGrams / rowFactor).toFixed(3));
  };

  /* ─── Allocation row helpers ─── */
  const updateAllocation = (id: string, patch: Partial<MachineAllocation>) => {
    setAllocations(prev => prev.map(a => (a.id === id ? { ...a, ...patch } : a)));
  };
  const addAllocation = () => {
    setAllocations(prev => [...prev, newEmptyAllocation()]);
  };
  const removeAllocation = (id: string) => {
    setAllocations(prev => (prev.length === 1 ? prev : prev.filter(a => a.id !== id)));
  };

  /* ─── Per-row PKG entry helpers ─── */
  const updatePkgEntry = (rowId: string, entryId: string, patch: Partial<PkgEntry>) => {
    setAllocations(prev => prev.map(a => {
      if (a.id !== rowId) return a;
      return { ...a, pkgEntries: a.pkgEntries.map(p => (p.id === entryId ? { ...p, ...patch } : p)) };
    }));
  };
  const addPkgEntry = (rowId: string) => {
    setAllocations(prev => prev.map(a => {
      if (a.id !== rowId) return a;
      if (a.pkgEntries.length >= MAX_PKG_PER_MACHINE) return a;
      return { ...a, pkgEntries: [...a.pkgEntries, newPkgEntry()] };
    }));
  };
  const removePkgEntry = (rowId: string, entryId: string) => {
    setAllocations(prev => prev.map(a => {
      if (a.id !== rowId) return a;
      if (a.pkgEntries.length === 1) return a;
      return { ...a, pkgEntries: a.pkgEntries.filter(p => p.id !== entryId) };
    }));
  };

  /* ─── Per-row SFG entry helper ─── */
  // SFG lots are produced automatically by the auto-allocator (split across
  // transfers as needed). The user can fine-tune a lot's transfer/qty here, but
  // lots are not manually added or removed.
  const updateSfgEntry = (rowId: string, entryId: string, patch: Partial<SfgEntry>) => {
    setAllocations(prev => prev.map(a => {
      if (a.id !== rowId) return a;
      return { ...a, sfgEntries: a.sfgEntries.map(e => (e.id === entryId ? { ...e, ...patch } : e)) };
    }));
  };

  const handleMachineSelectForRow = (rowId: string, machineId: string) => {
    if (!machineId) {
      updateAllocation(rowId, { machineId: '' });
      return;
    }
    const m = outputMachines.find(mac => mac.id === machineId);
    if (!m) return;
    if (m.hasPendingAllocation) {
      Modal.warning({
        title: 'Machine Has Pending Work',
        content: `${m.name} already has an active allocation (${m.pendingEntryNumber || 'N/A'}) that is still pending output recording.${m.pendingProductName ? ' Product: ' + m.pendingProductName + '.' : ''} Please complete the existing production output first, or select a different machine.`,
        okText: 'OK',
        centered: true,
      });
      return;
    }
    updateAllocation(rowId, { machineId });
  };

  /* Machines available for a given row: free machines, excluding ones used in
     other rows. The row's own machineId is always included so the dropdown
     keeps showing the current selection. */
  const availableMachinesForRow = (rowId: string) => {
    const usedIds = new Set(
      allocations.filter(a => a.id !== rowId && a.machineId).map(a => a.machineId)
    );
    return outputMachines.filter(m => !m.hasPendingAllocation && !usedIds.has(m.id));
  };

  /* Plan qty is auto-split via per-row SFG consumption — sum (in KG) must match. */
  const planQtyKg = productionQty != null ? toGrams(productionQty, productionUnit) / 1000 : 0;
  const totalAllocatedKg = allocations.reduce(
    (sum, a) => sum + rowSfgKg(a),
    0
  );
  const allocationDelta = Number((totalAllocatedKg - planQtyKg).toFixed(3));
  const allocationsMatchPlan = Math.abs(allocationDelta) < 0.001;
  const planProductName = boms.find(b => b.id === selectedBomId)?.productName || '';

  /* ─── Live remaining helpers (UI-only — DB is updated only on submit) ─── */

  /* Walk SFG lots in (row order, then entry order) and sum the KG of every lot
     sequenced strictly BEFORE the given lot. Optionally filter to one transfer.
     This sequential / waterfall view is used to (a) show per-lot remaining in the
     dropdown and (b) cap each lot's input so it can't exceed transfer/plan stock.
     Sibling lots on the same machine are counted, so a machine can split its
     required SFG across several transfers without double-spending. */
  const sfgKgUsedBeforeEntry = (
    rowId: string,
    entryId: string,
    transferNumber?: string,
  ): number => {
    let used = 0;
    for (const a of allocations) {
      const isCurrentRow = a.id === rowId;
      for (const e of a.sfgEntries) {
        if (isCurrentRow && e.id === entryId) return used; // reached the target lot
        if (transferNumber && e.transferNumber !== transferNumber) continue;
        used += Number(e.qty) || 0;
      }
    }
    return used;
  };

  /* Remaining KG of a transfer available to a specific SFG lot (net of every lot
     sequenced before it, including sibling lots on the same machine). */
  const getSfgRemainingForEntry = (rowId: string, entryId: string, transferNumber: string) => {
    const totalAvail = getSfgTransferAvailable(transferNumber).qty;
    const used = sfgKgUsedBeforeEntry(rowId, entryId, transferNumber);
    return Math.max(0, Number((totalAvail - used).toFixed(3)));
  };

  /* Remaining KG of the plan available to a specific SFG lot (net of every lot
     sequenced before it across all machines). */
  const planRemainingForEntry = (rowId: string, entryId: string): number => {
    const used = sfgKgUsedBeforeEntry(rowId, entryId);
    return Math.max(0, Number((planQtyKg - used).toFixed(3)));
  };

  /* Per-lot SFG max: capped by both transfer remaining and plan remaining. */
  const getEntrySfgMaxKg = (rowId: string, entryId: string, transferNumber: string | null): number | undefined => {
    const planLeft = planRemainingForEntry(rowId, entryId);
    if (!transferNumber) return planLeft || undefined;
    const transferLeft = getSfgRemainingForEntry(rowId, entryId, transferNumber);
    return Math.min(transferLeft, planLeft);
  };

  /* ─── Auto-allocator: distribute cartons across free machines, largest first ─── */
  // Pure function over (cartons, machines). Returns a deterministic plan of
  // { machineId, cartons } rows. Invariants:
  //   - sum(plan.cartons) === cartons  (when feasible)
  //   - each row.cartons <= machine.capacityQty
  //   - machines used in capacity-desc order; no row with 0 cartons.
  const autoAllocateCartons = (
    cartons: number,
    machines: any[]
  ): { machineId: string; cartons: number }[] => {
    const free = machines
      .filter((m) => !m.hasPendingAllocation && Number(m.capacityQty) > 0)
      .sort((a, b) => Number(b.capacityQty) - Number(a.capacityQty));

    let remaining = cartons;
    const plan: { machineId: string; cartons: number }[] = [];
    for (const m of free) {
      if (remaining <= 0) break;
      const cap = Math.floor(Number(m.capacityQty) || 0);
      const take = Math.min(remaining, cap);
      if (take > 0) {
        plan.push({ machineId: m.id, cartons: take });
        remaining -= take;
      }
    }
    return plan;
  };

  /* ─── Build per-machine allocation rows from an auto plan ─── */
  // For each machine slot, derive:
  //   - sfgEntries: one (or more) SfgEntry drawn greedily from transfers with the
  //     most remaining first. If no single transfer has enough for the machine's
  //     required SFG, it splits across multiple transfers.
  //   - pkgEntries: one (or more) PkgEntry per BOM packaging line, drawn greedily
  //     from transfers with the most remaining first. If no single transfer has
  //     enough for the line's qty, splits across multiple transfers.
  // Running `pkgUsed` / `sfgUsed` maps track in-progress consumption across all
  // machines so machine N respects what machines 1..N-1 already took.
  const buildAllocationsFromPlan = (
    plan: { machineId: string; cartons: number }[]
  ): MachineAllocation[] => {
    const sfgLine = consumptionLines.find((l) => l.isSFG);
    const pkgLines = consumptionLines.filter((l) => l.isPackaging);
    const totalCartons = plan.reduce((s, p) => s + p.cartons, 0) || 1;

    const pkgUsed = new Map<string, number>(); // key = `${transferNumber}::${rawMaterialId}`
    const sfgUsed = new Map<string, number>(); // key = transferNumber (KG)

    return plan.map((p) => {
      const share = p.cartons / totalCartons;

      // ── SFG: split the machine's required qty across batches when needed ──
      const sfgKg = sfgLine
        ? Math.round((Number(sfgLine.expectedQuantity) || 0) * share * 1000) / 1000
        : 0;

      const sfgEntries: SfgEntry[] = [];
      if (sfgLine?.availableSfgBatches?.length && sfgKg > 0) {
        let need = sfgKg;
        const batches = sfgLine.availableSfgBatches
          .map((b: any) => ({
            ...b,
            effRemaining: (b.remainingQuantity || 0) - (sfgUsed.get(b.transferNumber) || 0),
          }))
          .filter((b: any) => b.effRemaining > 0)
          .sort((a: any, b: any) => b.effRemaining - a.effRemaining); // largest first

        while (need > 1e-6 && batches.length > 0) {
          const b = batches[0];
          const take = Number(Math.min(need, b.effRemaining).toFixed(3));
          sfgEntries.push({ id: genId(), transferNumber: b.transferNumber, qty: take });
          sfgUsed.set(b.transferNumber, (sfgUsed.get(b.transferNumber) || 0) + take);
          b.effRemaining -= take;
          need = Number((need - take).toFixed(3));
          if (b.effRemaining <= 1e-6) batches.shift();
        }

        // Couldn't fully cover from any batch — leave the shortfall as an unfilled
        // lot so the user can see the gap and pick something manually.
        if (need > 1e-6) {
          sfgEntries.push({ id: genId(), transferNumber: null, qty: Number(need.toFixed(3)) });
        }
      }

      // ── Packaging: split across batches when needed ──
      const pkgEntries: PkgEntry[] = [];
      for (const pl of pkgLines) {
        let need = Math.round((Number(pl.expectedQuantity) || 0) * share * 1000) / 1000;
        if (need <= 0) continue;

        const batches = (pl.availableSfgBatches || [])
          .map((b: any) => {
            const key = `${b.transferNumber}::${pl.rawMaterialId}`;
            return {
              ...b,
              key,
              effRemaining: (b.remainingQuantity || 0) - (pkgUsed.get(key) || 0),
            };
          })
          .filter((b: any) => b.effRemaining > 0)
          .sort((a: any, b: any) => b.effRemaining - a.effRemaining); // largest first

        while (need > 0 && batches.length > 0) {
          const b = batches[0];
          const take = Math.min(need, b.effRemaining);
          const takeRounded = Number(take.toFixed(3));
          pkgEntries.push({
            id: genId(),
            transferNumber: b.transferNumber,
            rawMaterialId: pl.rawMaterialId,
            productName: pl.rawMaterialName,
            skuCode: pl.skuCode || null,
            qty: takeRounded,
            unit: pl.unit || b.unit || 'KG',
          });
          pkgUsed.set(b.key, (pkgUsed.get(b.key) || 0) + takeRounded);
          b.effRemaining -= takeRounded;
          need = Number((need - takeRounded).toFixed(3));
          if (b.effRemaining <= 1e-6) batches.shift();
        }

        // Couldn't fully cover from any batch — leave the shortfall as an unfilled
        // entry so the user can see the gap and pick something manually.
        if (need > 1e-6) {
          pkgEntries.push({
            id: genId(),
            transferNumber: null,
            rawMaterialId: pl.rawMaterialId,
            productName: pl.rawMaterialName,
            skuCode: pl.skuCode || null,
            qty: Number(need.toFixed(3)),
            unit: pl.unit || 'KG',
          });
        }
      }

      return {
        id: genId(),
        machineId: p.machineId,
        manPower: true,
        sfgEntries: sfgEntries.length > 0 ? sfgEntries : [newSfgEntry()],
        pkgEntries: pkgEntries.length > 0 ? pkgEntries : [newPkgEntry()],
        notes: '',
      };
    });
  };

  const proceedToMachineAllocation = () => {
    if (!selectedLocationId || !selectedBomId || !productionQty || !plannedCartons) {
      message.error('Please complete all planning fields');
      return;
    }

    // Validate material availability up-front (existing checks).
    for (const item of consumptionLines) {
       if (item.isSFG) {
          if (!item.availableSfgBatches || item.availableSfgBatches.length === 0) {
             message.error(`No SFG transfer data available for ${item.rawMaterialName} at this location`);
             return;
          }
          const totalSfgAvail = item.availableSfgBatches.reduce((s: number, b: any) => s + b.remainingQuantity, 0);
          if (totalSfgAvail < item.expectedQuantity) {
             message.error(`Insufficient SFG stock for ${item.rawMaterialName}. Required: ${item.expectedQuantity} ${item.unit}, Available: ${totalSfgAvail} ${item.availableSfgBatches[0]?.unit || 'KG'}`);
             return;
          }
       } else {
          if (item.currentStockQty < item.expectedQuantity) {
             message.error(`Insufficient general stock for ${item.rawMaterialName}. Required: ${item.expectedQuantity} ${item.unit}, Available: ${item.currentStockQty} ${item.currentStockUnit}`);
             return;
          }
       }
    }

    // Capacity check: free machines must collectively cover the plan.
    const freeMachines = outputMachines.filter((m) => !m.hasPendingAllocation && Number(m.capacityQty) > 0);
    const totalFreeCapacity = freeMachines.reduce((s, m) => s + Math.floor(Number(m.capacityQty) || 0), 0);
    if (totalFreeCapacity < plannedCartons) {
      message.error(`Insufficient machine capacity: planned ${plannedCartons} cartons but only ${totalFreeCapacity} carton-slots free. Release a machine or reduce the plan.`);
      return;
    }

    // Generate the auto-allocation and seed Step 2.
    const plan = autoAllocateCartons(plannedCartons, outputMachines);
    if (plan.length === 0) {
      message.error('Auto-allocation failed: no free machines available.');
      return;
    }
    const newAllocations = buildAllocationsFromPlan(plan);
    setAllocations(newAllocations);
    setManualOverride(false);
    setStep(1);
  };

  /* ─── Submit — multi-machine: one FG Batch with N machine entries ─── */
  const handleSubmit = async () => {
    if (allocations.length === 0) {
      message.error('Add at least one machine allocation.');
      return;
    }

    // Per-row required fields
    for (let i = 0; i < allocations.length; i++) {
      const a = allocations[i];
      if (!a.machineId) {
        message.error(`Row ${i + 1}: select a machine.`);
        return;
      }
      // Each SFG lot must be fully filled (transfer + qty); at least one is required.
      const filledSfg = a.sfgEntries.filter(e => e.transferNumber && e.qty && e.qty > 0);
      if (filledSfg.length === 0) {
        message.error(`Row ${i + 1}: add at least one SFG lot with a transfer and quantity.`);
        return;
      }
      for (const e of a.sfgEntries) {
        if (e.transferNumber && (!e.qty || e.qty <= 0)) {
          message.error(`Row ${i + 1}: enter a quantity for SFG lot ${e.transferNumber}.`);
          return;
        }
        if (!e.transferNumber && e.qty && e.qty > 0) {
          message.error(`Row ${i + 1}: select an SFG transfer for the lot with quantity ${formatQty(e.qty)} KG.`);
          return;
        }
      }
      // Disallow the same transfer twice on one machine — it would double-count stock.
      const seenSfg = new Set<string>();
      for (const e of filledSfg) {
        if (seenSfg.has(e.transferNumber!)) {
          message.error(`Row ${i + 1}: SFG transfer ${e.transferNumber} is selected more than once. Combine it into a single lot.`);
          return;
        }
        seenSfg.add(e.transferNumber!);
      }
    }

    if (totalAllocatedKg > planQtyKg + 0.001) {
      message.error(
        `Total allocated (${formatQty(totalAllocatedKg)} KG) exceeds planned production (${formatQty(planQtyKg)} KG). Reduce a row before submitting.`
      );
      return;
    }
    if (!allocationsMatchPlan) {
      message.error(
        `Total allocated (${formatQty(totalAllocatedKg)} KG) must equal planned production (${formatQty(planQtyKg)} KG).`
      );
      return;
    }

    // Per-transfer SFG availability check (summed across every lot on every row)
    const sfgPerTransfer: Record<string, number> = {};
    for (const a of allocations) {
      for (const e of a.sfgEntries) {
        if (e.transferNumber && e.qty && e.qty > 0) {
          sfgPerTransfer[e.transferNumber] =
            (sfgPerTransfer[e.transferNumber] || 0) + (Number(e.qty) || 0);
        }
      }
    }
    for (const [trf, used] of Object.entries(sfgPerTransfer)) {
      const avail = getSfgTransferAvailable(trf);
      if (used > avail.qty + 0.001) {
        message.error(
          `SFG transfer ${trf}: total allocated (${formatQty(used)} KG) exceeds available (${formatQty(avail.qty)} ${avail.unit}).`
        );
        return;
      }
    }

    // Per-(transfer, rawMaterial) PKG availability check.
    // Weight units are normalized to KG; non-weight units (Piece/Box/etc.) are counted directly.
    const pkgUsedPerKey: Record<string, { used: number; unit: string; isCount: boolean }> = {};
    const pkgOpts = getPkgOptions();
    for (const a of allocations) {
      for (const p of a.pkgEntries) {
        if (!p.transferNumber || !p.rawMaterialId || !p.qty) continue;
        const key = `${p.transferNumber}__${p.rawMaterialId}`;
        const opt = pkgOpts.find(o => o.transferNumber === p.transferNumber && o.rawMaterialId === p.rawMaterialId);
        const lineUnit = opt?.unit || p.unit || 'KG';
        const isCount = isNonWeightUnit(lineUnit);
        if (!pkgUsedPerKey[key]) pkgUsedPerKey[key] = { used: 0, unit: lineUnit, isCount };
        if (isCount) {
          pkgUsedPerKey[key].used += Number(p.qty) || 0;
        } else {
          pkgUsedPerKey[key].used += toGrams(Number(p.qty), p.unit || 'KG') / 1000;
        }
      }
    }
    for (const [key, agg] of Object.entries(pkgUsedPerKey)) {
      const [trf, rmId] = key.split('__');
      const opt = pkgOpts.find(o => o.transferNumber === trf && o.rawMaterialId === rmId);
      if (!opt) continue;
      const avail = agg.isCount
        ? opt.remainingQty
        : (opt.unit.toLowerCase() === 'kg' ? opt.remainingQty : toGrams(opt.remainingQty, opt.unit) / 1000);
      const dispUnit = agg.isCount ? agg.unit : 'KG';
      if (agg.used > avail + 0.001) {
        message.error(
          `${opt.productName} (${trf}): total allocated (${formatQty(agg.used)} ${dispUnit}) exceeds available (${formatQty(avail)} ${dispUnit}).`
        );
        return;
      }
    }

    // Build batch consumptions
    const payloadConsumptions: any[] = [];

    // 1) General-stock items: aggregated at batch level (BOM expected qty)
    const otherLines = consumptionLines.filter(c => !c.isSFG && !c.isPackaging);
    for (const line of otherLines) {
      payloadConsumptions.push({
        rawMaterialId: line.rawMaterialId,
        rawMaterialName: line.rawMaterialName,
        expectedQuantity: line.expectedQuantity,
        actualQuantity: line.expectedQuantity,
        unit: line.unit,
        sourceType: 'STOCK',
        batchNumber: '',
        dispatchId: '',
      });
    }

    // 2) SFG lines: one record per (sfgRawMaterial × transfer) summed across rows
    const sfgLine = consumptionLines.find(c => c.isSFG);
    if (sfgLine) {
      for (const [trf, qty] of Object.entries(sfgPerTransfer)) {
        if (qty > 0) {
          payloadConsumptions.push({
            rawMaterialId: sfgLine.rawMaterialId,
            rawMaterialName: sfgLine.rawMaterialName,
            expectedQuantity: sfgLine.expectedQuantity,
            actualQuantity: qty,
            unit: 'KG',
            sourceType: 'SFG_BATCH',
            batchNumber: trf,
            dispatchId: '',
          });
        }
      }
    }

    // 3) Packaging consumption: one record per (rawMaterial × transfer)
    //    aggregated from every PKG entry on every allocation, converted to that
    //    line's BOM unit so backend deduction matches.
    const packagingLines = consumptionLines.filter(c => c.isPackaging);
    const packagingLineByRmId: Record<string, any> = {};
    for (const pl of packagingLines) packagingLineByRmId[pl.rawMaterialId] = pl;

    const pkgAgg: Record<string, { transfer: string; line: any; qtyInBomUnit: number }> = {};
    for (const a of allocations) {
      for (const p of a.pkgEntries) {
        if (!p.transferNumber || !p.rawMaterialId || !p.qty || p.qty <= 0) continue;
        const pkgLine = packagingLineByRmId[p.rawMaterialId];
        if (!pkgLine) continue;

        // For non-weight units (Piece/Box/etc.), pass the count through unchanged.
        // For weight units, convert through grams so the BOM unit aligns.
        let qtyInBomUnit: number;
        if (isNonWeightUnit(pkgLine.unit) || isNonWeightUnit(p.unit)) {
          qtyInBomUnit = Number(p.qty) || 0;
        } else {
          const qtyGrams = toGrams(Number(p.qty), p.unit || 'KG');
          const unitFactor =
            UNIT_TO_GRAMS[pkgLine.unit] ??
            UNIT_TO_GRAMS[pkgLine.unit?.toLowerCase()] ??
            1000;
          qtyInBomUnit = unitFactor > 0 ? qtyGrams / unitFactor : 0;
        }
        if (qtyInBomUnit <= 0) continue;

        const key = `${p.transferNumber}__${p.rawMaterialId}`;
        if (!pkgAgg[key]) {
          pkgAgg[key] = { transfer: p.transferNumber, line: pkgLine, qtyInBomUnit: 0 };
        }
        pkgAgg[key].qtyInBomUnit += qtyInBomUnit;
      }
    }
    for (const { transfer, line, qtyInBomUnit } of Object.values(pkgAgg)) {
      payloadConsumptions.push({
        rawMaterialId: line.rawMaterialId,
        rawMaterialName: line.rawMaterialName,
        expectedQuantity: line.expectedQuantity,
        actualQuantity: qtyInBomUnit,
        unit: line.unit,
        sourceType: 'PKG_TRANSFER',
        batchNumber: transfer,
        dispatchId: '',
      });
    }

    if (payloadConsumptions.length === 0) {
      message.error('No consumption data to submit. Please ensure materials are configured.');
      return;
    }

    // Convert each row's SFG qty (KG) into the plan's production unit so the
    // backend's "sum of allocatedQty == fgBatch.productionQty" check passes.
    const planUnitFactor =
      UNIT_TO_GRAMS[productionUnit] ??
      UNIT_TO_GRAMS[productionUnit.toLowerCase()] ??
      1000;
    const kgToPlanUnit = (kg: number) => (kg * 1000) / planUnitFactor;

    // Build per-machine allocation payload for the production entry
    const machineAllocations = allocations.map(a => {
      const m = outputMachines.find(om => om.id === a.machineId);
      // List every SFG lot this machine drew from (with its qty) in the notes.
      const sfgLots = a.sfgEntries.filter(e => e.transferNumber && e.qty && e.qty > 0);
      const transferNote = sfgLots.length
        ? `SFG Transfer: ${sfgLots.map(e => `${e.transferNumber} (${formatQty(Number(e.qty))} KG)`).join(', ')}`
        : '';
      const combinedNotes =
        transferNote + (transferNote && a.notes ? ' | ' : '') + (a.notes || '');
      const sfgKg = rowSfgKg(a);

      // Detailed per-PKG breakdown for this machine
      const packagingConsumptions = a.pkgEntries
        .filter(p => p.transferNumber && p.rawMaterialId && p.qty && p.qty > 0)
        .map(p => ({
          rawMaterialId: p.rawMaterialId,
          transferNumber: p.transferNumber,
          productName: p.productName,
          skuCode: p.skuCode,
          quantity: Number(p.qty),
          unitOfMeasurement: p.unit || 'KG',
        }));

      // Aggregate laminate qty in KG for the legacy single-field columns.
      // Non-weight units (Piece/etc.) are skipped — they have no KG equivalent.
      const aggLaminateKg = packagingConsumptions.reduce((s, p) => {
        if (isNonWeightUnit(p.unitOfMeasurement)) return s;
        return s + toGrams(Number(p.quantity), p.unitOfMeasurement) / 1000;
      }, 0);

      return {
        machineId: a.machineId,
        allocatedQty: kgToPlanUnit(sfgKg),
        productName: planProductName,
        instulationCapacity: m?.capacityQty || 0,
        instulationCapacityUnit:
          m?.capacityUnit === 'BOXES_PER_SHIFT' ? 'Cartons/Shift' : m?.capacityUnit,
        laminateConsumptionQty: aggLaminateKg,
        laminateConsumptionUnit: 'KG',
        sfgConsumptionQty: sfgKg,
        sfgConsumptionUnit: 'KG',
        manPower: a.manPower,
        notes: combinedNotes,
        packagingConsumptions,
      };
    });

    setSubmitting(true);
    try {
      const batchRes = await api.post(API_ROUTES.RAW.CREATE_FG_BATCH, {
        bomId: selectedBomId,
        productionQty,
        productionUnit,
        notes: 'Auto-created from Production Entry Flow',
        consumptions: payloadConsumptions,
      });
      const newBatchId = batchRes.data?.data?.id;

      await api.put(API_ROUTES.RAW.ACCEPT_FG_BATCH(newBatchId));

      await api.post(API_ROUTES.RAW.CREATE_FG_PRODUCTION_ENTRY, {
        fgBatchId: newBatchId,
        machineAllocations,
      });

      message.success(
        `Production Entry created with ${machineAllocations.length} machine${machineAllocations.length > 1 ? 's' : ''}.`
      );
      navigate('/packaging/fg-production');
    } catch (err: any) {
      console.error('[Make Allocation] Error:', err?.response?.data || err);
      const errorMsg = err?.response?.data?.error || 'Failed to complete production entry';
      Modal.error({
        title: 'Allocation Failed',
        content: errorMsg,
        okText: 'OK',
        centered: true,
      });
    }
    setSubmitting(false);
  };

  const stepItems = [
    { title: 'Location & Planning', icon: <MapPin size={16} /> },
    { title: 'Machine Assignment', icon: <Factory size={16} /> },
  ];

  const getCapacityLabel = (unit: string) => {
    if (unit === 'BOXES_PER_SHIFT') return 'Cartons/Shift';
    if (unit === 'KG_PER_SHIFT') return 'KG/Shift';
    if (unit === 'TON_PER_SHIFT') return 'Ton/Shift';
    return unit;
  };

  return (
    <motion.div className="min-h-screen bg-gradient-to-br from-emerald-50/40 via-background to-teal-50/30 p-4 md:p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-4 flex items-center gap-3">
          <Button
            icon={<ArrowLeft size={18} />}
            onClick={() => navigate('/packaging/fg-production')}
            className="rounded-sm border-emerald-200 hover:border-emerald-400"
          />
          <h1 className="text-2xl font-bold text-emerald-700">New Production Plan</h1>
        </div>

        <motion.div className="bg-card rounded-sm p-4 mb-6 border border-border shadow-sm">
          <Steps current={step} items={stepItems.map((s, i) => ({
             title: <span className="text-xs font-semibold">{s.title}</span>,
             icon: <div className={`w-8 h-8 flex items-center justify-center rounded-sm ${i <= step ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>{i < step ? <CheckCircle size={16} /> : s.icon}</div>
          }))} />
        </motion.div>

        <motion.div className="bg-card rounded-sm border border-border shadow-md overflow-hidden">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Planning */}
            {step === 0 && (
              <motion.div key="step-0" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-6 md:p-8 space-y-6">

                {/* Section Header */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-sm bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
                    <ClipboardList size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Planning Details</h2>
                    <p className="text-sm text-muted-foreground">Choose where, what, and how much to produce</p>
                  </div>
                </div>

                {/* Form Card */}
                <div className="rounded-xl border border-border bg-card p-5 md:p-7 shadow-sm space-y-6">
                  {/* Location + Target product */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Field 1: Location */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 font-bold text-[11px]">01</span>
                        <MapPin size={15} className="text-emerald-600" />
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Production Location</label>
                      </div>
                      <Select
                        className="w-full rounded-sm" size="large" placeholder="Production Floor"
                        value={selectedLocationId || undefined}
                        onChange={setSelectedLocationId}
                        options={locations.map(l => ({ value: l.id, label: l.name }))}
                        loading={fetchingBase}
                        disabled
                      />
                      <p className="mt-1.5 text-[11px] text-muted-foreground">FG production is locked to the Production Floor location.</p>
                    </div>

                    {/* Field 2: Target BOM */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-100 text-violet-700 font-bold text-[11px]">02</span>
                        <Target size={15} className="text-violet-600" />
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target FG Item (BOM)</label>
                      </div>
                      <Select
                        className="w-full rounded-sm" size="large" placeholder="Select Product"
                        value={selectedBomId || undefined} onChange={setSelectedBomId}
                        options={boms.map(b => ({ value: b.id, label: b.productName }))}
                        loading={fetchingBase}
                      />
                      <p className="mt-1.5 text-[11px] text-muted-foreground">Finished good you want to produce</p>
                    </div>
                  </div>

                  <div className="h-px w-full bg-border" />

                  {/* Field 3: Planned Production (in CARTONS) */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-amber-700 font-bold text-[11px]">03</span>
                      <Boxes size={15} className="text-amber-600" />
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Planned Cartons</label>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <InputNumber
                          min={1}
                          step={1}
                          precision={0}
                          className="w-full font-semibold rounded-sm"
                          size="large"
                          value={plannedCartons}
                          onChange={(v) => {
                            const n = v != null ? Math.max(0, Math.floor(Number(v))) : null;
                            setPlannedCartons(n);
                            // Derive weight: 1 carton = 1 BOM execution → cartons × outputQuantity in BOM's unit.
                            const bom = boms.find((b) => b.id === selectedBomId);
                            if (bom && n) {
                              setProductionQty(Number((n * bom.outputQuantity).toFixed(3)));
                              setProductionUnit(bom.unitOfMeasurement || 'KG');
                            } else {
                              setProductionQty(null);
                            }
                          }}
                          placeholder="E.g. 100"
                        />
                        <span className="text-xs text-muted-foreground font-semibold whitespace-nowrap">cartons</span>
                      </div>
                      <Button
                        type="primary"
                        size="large"
                        onClick={handleCheckAvailability}
                        loading={loadingItems}
                        disabled={!selectedLocationId || !selectedBomId || !plannedCartons || plannedCartons <= 0}
                        className="rounded-sm font-bold shadow-md border-0 whitespace-nowrap"
                        style={{ background: (!selectedLocationId || !selectedBomId || !plannedCartons || plannedCartons <= 0) ? undefined : 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
                        icon={<Search size={16} />}
                      >
                        Check Availability
                      </Button>
                    </div>
                    {/* Derived weight preview */}
                    {plannedCartons && selectedBomId && (() => {
                      const bom = boms.find((b) => b.id === selectedBomId);
                      if (!bom) return null;
                      return (
                        <p className="mt-2 text-[11px] text-emerald-700 font-medium">
                          {plannedCartons} cartons × {bom.outputQuantity} {bom.unitOfMeasurement} per carton = <span className="font-bold">{Number((plannedCartons * bom.outputQuantity).toFixed(3))} {bom.unitOfMeasurement}</span> total
                        </p>
                      );
                    })()}
                    <p className="mt-1 text-[11px] text-muted-foreground">1 carton = 1 BOM execution. Material requirements scale automatically.</p>
                  </div>

                  {/* Plan Summary */}
                  {selectedLocationId && selectedBomId && plannedCartons && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-emerald-600" />
                        <span className="text-xs font-bold uppercase text-emerald-700">Plan Ready</span>
                      </div>
                      <div className="h-4 w-px bg-emerald-200" />
                      <div className="flex items-center gap-1.5 text-xs text-emerald-800">
                        <MapPin size={12} />
                        <span className="font-semibold">{locations.find(l => l.id === selectedLocationId)?.name}</span>
                      </div>
                      <div className="h-4 w-px bg-emerald-200" />
                      <div className="flex items-center gap-1.5 text-xs text-emerald-800">
                        <Package size={12} />
                        <span className="font-semibold">{boms.find(b => b.id === selectedBomId)?.productName}</span>
                      </div>
                      <div className="h-4 w-px bg-emerald-200" />
                      <div className="flex items-center gap-1.5 text-xs text-emerald-800">
                        <Boxes size={12} />
                        <span className="font-semibold">{plannedCartons} cartons</span>
                        {productionQty != null && (
                          <span className="text-emerald-700/70">({productionQty} {productionUnit})</span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Items Required Suggestion — shown only after clicking Check Availability */}
                <AnimatePresence mode="wait">
                {showAvailability && loadingItems && (
                   <motion.div
                      key="loading-availability"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-8 flex flex-col justify-center items-center py-8 border border-dashed border-emerald-300 rounded-md bg-gradient-to-br from-emerald-50/40 to-teal-50/30"
                   >
                      <div className="relative w-12 h-12 mb-3">
                        <div className="absolute inset-0 rounded-full border-[3px] border-emerald-200" />
                        <div className="absolute inset-0 rounded-full border-[3px] border-emerald-500 border-t-transparent animate-spin" />
                        <Boxes size={16} className="absolute inset-0 m-auto text-emerald-600" />
                      </div>
                      <p className="text-sm font-semibold text-emerald-700 animate-pulse">Calculating material requirements and available stock...</p>
                   </motion.div>
                )}
                {showAvailability && !loadingItems && consumptionLines.length > 0 && (
                   <motion.div
                      className="mt-6"
                      key="material-requirements"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                   >
                      <h3 className="text-lg font-bold text-foreground mb-4 border-b border-border pb-2">Material Requirements & Availability</h3>
                      <div className="bg-card border border-border rounded-sm overflow-hidden shadow-sm">
                         <table className="min-w-full">
                            <thead className="bg-muted/50 border-b border-border">
                               <tr>
                                 <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Material</th>
                                 <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Source</th>
                                 <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Required</th>
                                 <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Available</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                               {consumptionLines.map((line, idx) => {
                                  const totalSfgAvailable = (line.availableSfgBatches || []).reduce(
                                     (sum: number, b: any) => sum + (b.remainingQuantity || 0),
                                     0
                                  );
                                  const sfgUnit = line.availableSfgBatches?.[0]?.unit || line.unit;
                                  const sfgBatchCount = line.availableSfgBatches?.length || 0;
                                  const isSufficient = line.isSFG
                                    ? totalSfgAvailable >= line.expectedQuantity
                                    : line.currentStockQty >= line.expectedQuantity;
                                  return (
                                  <motion.tr
                                     key={`${line.rawMaterialId}-${idx}`}
                                     className="hover:bg-muted/30"
                                     initial={{ opacity: 0, x: -20 }}
                                     animate={{ opacity: 1, x: 0 }}
                                     transition={{ duration: 0.35, delay: idx * 0.08, ease: 'easeOut' }}
                                  >
                                     <td className="px-4 py-3 font-semibold text-sm">{line.rawMaterialName}</td>
                                     <td className="px-4 py-3 text-center">
                                       {line.isSFG ? <Truck size={14} className="inline text-violet-500 mr-1"/> : <Database size={14} className="inline text-blue-500 mr-1"/>}
                                       <span className="text-xs font-bold">{line.isSFG ? 'SFG TRANSFER' : 'STOCK'}</span>
                                     </td>
                                     <td className="px-4 py-3 text-right">
                                        <motion.span
                                           className="font-bold text-amber-600"
                                           key={`req-${line.rawMaterialId}-${line.expectedQuantity}`}
                                           initial={{ opacity: 0, scale: 0.8 }}
                                           animate={{ opacity: 1, scale: 1 }}
                                           transition={{ duration: 0.3, delay: idx * 0.08 + 0.15 }}
                                        >
                                           {formatQty(line.expectedQuantity)} {line.unit}
                                        </motion.span>
                                     </td>
                                     <td className="px-4 py-3 text-right">
                                        <motion.div
                                           key={`avail-${line.rawMaterialId}-${line.isSFG ? totalSfgAvailable : line.currentStockQty}`}
                                           initial={{ opacity: 0, scale: 0.8 }}
                                           animate={{ opacity: 1, scale: 1 }}
                                           transition={{ duration: 0.3, delay: idx * 0.08 + 0.2 }}
                                        >
                                        {line.isSFG ? (
                                           sfgBatchCount > 0 ? (
                                              <div className="flex flex-col items-end">
                                                 <span className={isSufficient ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                                                    {formatQty(totalSfgAvailable)} {sfgUnit}
                                                 </span>
                                                 <span className="text-[10px] text-muted-foreground">
                                                    across {sfgBatchCount} transfer{sfgBatchCount > 1 ? 's' : ''}
                                                 </span>
                                              </div>
                                           ) : (
                                              <span className="text-red-500 font-bold text-xs">No Transfer Available</span>
                                           )
                                        ) : (
                                           <span className={isSufficient ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                                              {formatQty(line.currentStockQty)} {line.currentStockUnit}
                                           </span>
                                        )}
                                        </motion.div>
                                     </td>
                                  </motion.tr>
                                  );
                               })}
                            </tbody>
                         </table>
                      </div>
                   </motion.div>
                )}
                </AnimatePresence>
                
              </motion.div>
            )}

            {/* STEP 2: Multi-Machine Allocation */}
            {step === 1 && (
              <motion.div key="step-1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-6 md:p-8 space-y-6">
                {/* Section Header */}
                <div className="relative overflow-hidden rounded-md border border-blue-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-violet-50/60 p-5 shadow-sm">
                  <motion.div
                    className="absolute -right-8 -top-8 text-blue-200/40"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  >
                    <Cog size={140} strokeWidth={1.2} />
                  </motion.div>

                  <div className="relative flex items-center gap-4">
                    <motion.div
                      className="p-3 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md"
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Factory size={24} className="text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                        Machine Selection & Allocation
                      </h2>
                      <p className="text-sm text-muted-foreground mt-0.5">Split the planned production across one or more free machines</p>
                    </div>
                  </div>
                </div>

                {/* Allocation Totals Bar */}
                <div className={`flex flex-wrap items-center gap-3 rounded-md border px-4 py-3 ${allocationsMatchPlan ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/60'}`}>
                  <div className="flex items-center gap-2">
                    {allocationsMatchPlan ? (
                      <CheckCircle size={16} className="text-emerald-600" />
                    ) : (
                      <AlertCircle size={16} className="text-amber-600" />
                    )}
                    <span className={`text-xs font-bold uppercase ${allocationsMatchPlan ? 'text-emerald-700' : 'text-amber-700'}`}>
                      Allocated {formatQty(totalAllocatedKg)} / {formatQty(planQtyKg)} KG
                    </span>
                  </div>
                  {!allocationsMatchPlan && (
                    <span className="text-xs font-semibold text-amber-700">
                      {allocationDelta > 0
                        ? `Over by ${formatQty(allocationDelta)} KG`
                        : `Remaining ${formatQty(-allocationDelta)} KG`}
                    </span>
                  )}
                  {planProductName && (
                    <span className="text-[11px] text-muted-foreground">
                      Product: <span className="font-semibold">{planProductName}</span>
                    </span>
                  )}
                  <div className="ml-auto text-[11px] text-muted-foreground">
                    {allocations.length} machine{allocations.length > 1 ? 's' : ''} added
                  </div>
                </div>

                {outputMachines.length === 0 ? (
                  <div className="p-4 border border-amber-200 rounded-md bg-amber-50/50 text-sm text-amber-700 font-semibold flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>
                      No machines found in the master. Add machines via Masters → Machine Master before allocating production.
                    </span>
                  </div>
                ) : outputMachines.filter(m => !m.hasPendingAllocation).length === 0 ? (
                  <div className="p-4 border border-amber-200 rounded-md bg-amber-50/50 text-sm text-amber-700 space-y-2">
                    <div className="flex items-start gap-2 font-semibold">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <span>
                        No free machines. Every machine ({outputMachines.length}) has a pending production entry. Record output (or remove) the entries below before allocating new work.
                      </span>
                    </div>
                    <ul className="ml-7 text-xs font-medium space-y-0.5">
                      {outputMachines.filter(m => m.hasPendingAllocation).map(m => (
                        <li key={m.id}>
                          <span className="font-bold">{m.name}</span> ({m.machineId}) — blocked by{' '}
                          <span className="font-mono">{m.pendingEntryNumber || 'unknown entry'}</span>
                          {m.pendingProductName ? <> · {m.pendingProductName}</> : null}
                        </li>
                      ))}
                    </ul>
                    <div className="ml-7 text-xs">
                      Go to <span className="font-semibold">FG Production → Production Output Entry</span> to complete any of these.
                    </div>
                  </div>
                ) : null}

                {/* Auto-allocation Summary + Override Toggle */}
                <div className="rounded-md border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-emerald-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                        {manualOverride ? 'Manual Override Active' : 'Auto-Allocation'}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        — {plannedCartons || 0} cartons across {allocations.length} machine{allocations.length > 1 ? 's' : ''} (largest free machine first)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (manualOverride) {
                          // Switching back to auto — rebuild from plan
                          if (plannedCartons) {
                            const plan = autoAllocateCartons(plannedCartons, outputMachines);
                            setAllocations(buildAllocationsFromPlan(plan));
                          }
                          setManualOverride(false);
                        } else {
                          setManualOverride(true);
                        }
                      }}
                      className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm border transition-colors ${
                        manualOverride
                          ? 'border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600'
                          : 'border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {manualOverride ? 'Reset to Auto' : 'Override Allocation'}
                    </button>
                  </div>

                  {!manualOverride && (
                    <div className="overflow-x-auto rounded-sm border border-emerald-100 bg-white">
                      <table className="w-full text-sm">
                        <thead className="bg-emerald-50/70 border-b border-emerald-100">
                          <tr>
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-emerald-700">Machine</th>
                            <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-emerald-700">Capacity</th>
                            <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-emerald-700">Cartons Assigned</th>
                            <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-emerald-700">SFG (KG)</th>
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-emerald-700">Packaging</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-100/70">
                          {allocations.map((row) => {
                            const m = outputMachines.find((mm) => mm.id === row.machineId);
                            return (
                              <tr key={row.id} className="hover:bg-emerald-50/40">
                                <td className="px-3 py-2">
                                  <div className="font-semibold text-foreground">{m?.name || '—'}</div>
                                  <div className="text-[10px] text-muted-foreground font-mono">{m?.machineId || ''}</div>
                                </td>
                                <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                                  {m?.capacityQty || 0} cartons/shift
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <span className="font-extrabold text-emerald-700">
                                    {(() => {
                                      // Derive cartons from the row's total SFG / sfg-per-carton, OR from BOM
                                      const bom = boms.find((b) => b.id === selectedBomId);
                                      const sfgLine = consumptionLines.find((l) => l.isSFG);
                                      if (!bom || !sfgLine || !plannedCartons) return '—';
                                      // Sum of sfgKg = sfgLine.expectedQuantity (total for plan)
                                      // → cartons for this row = (row SFG total / total) × plannedCartons
                                      const totalSfg = Number(sfgLine.expectedQuantity) || 0;
                                      const rowSfg = rowSfgKg(row);
                                      if (totalSfg <= 0) return '—';
                                      return Math.round((rowSfg / totalSfg) * plannedCartons);
                                    })()}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-right text-xs">
                                  {rowSfgKg(row) > 0 ? `${formatQty(rowSfgKg(row))} KG` : '—'}
                                </td>
                                <td className="px-3 py-2 text-xs">
                                  {row.pkgEntries.filter((p) => p.qty && p.qty > 0).length === 0 ? (
                                    <span className="text-muted-foreground">—</span>
                                  ) : (
                                    <div className="flex flex-col gap-0.5">
                                      {row.pkgEntries
                                        .filter((p) => p.qty && p.qty > 0)
                                        .map((p) => (
                                          <span key={p.id} className="text-foreground">
                                            <span className="font-semibold">{p.qty} {p.unit}</span>
                                            <span className="text-muted-foreground"> · {p.productName}</span>
                                          </span>
                                        ))}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <p className="text-[11px] text-muted-foreground">
                    {manualOverride
                      ? 'You can change machines and quantities below. Click "Reset to Auto" to re-run the auto-allocator.'
                      : 'The largest free machine is filled first; any remainder spills to the next machine. Tap "Override Allocation" to edit.'}
                  </p>
                </div>

                {/* Allocation Rows — visible only in manual override mode */}
                {manualOverride && (
                <>
                <div className="space-y-4">
                  {allocations.map((row, idx) => {
                    const machineOpts = availableMachinesForRow(row.id);
                    const selectedMachine = outputMachines.find(m => m.id === row.machineId);
                    return (
                      <motion.div
                        key={row.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-md border border-border bg-card shadow-sm"
                      >
                        {/* Card Header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20 rounded-t-md">
                          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-blue-100 text-blue-700 font-bold text-xs">
                            {idx + 1}
                          </div>
                          <span className="text-sm font-bold text-foreground">
                            Machine Allocation
                          </span>
                          {selectedMachine && (
                            <span className="px-2 py-0.5 rounded-sm text-[11px] bg-emerald-500/10 text-emerald-700 font-semibold">
                              {selectedMachine.name}
                            </span>
                          )}
                          <div className="ml-auto">
                            <Button
                              icon={<X size={14} />}
                              size="small"
                              danger
                              disabled={allocations.length === 1}
                              onClick={() => removeAllocation(row.id)}
                              className="rounded-sm"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 space-y-4">
                          {/* Machine + Man Power */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                            <div>
                              <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-1.5">
                                <Factory size={12} className="text-blue-600" /> Machine
                              </label>
                              <Select
                                className="w-full [&_.ant-select-selector]:rounded-sm"
                                value={row.machineId || undefined}
                                onChange={(val: string) => handleMachineSelectForRow(row.id, val)}
                                placeholder="Choose a free machine..."
                                size="large"
                                showSearch
                                allowClear
                                onClear={() => updateAllocation(row.id, { machineId: '' })}
                                filterOption={(input, option) => (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())}
                                notFoundContent={machineOpts.length === 0 ? 'No free machines left' : undefined}
                              >
                                {machineOpts.map(m => (
                                  <Select.Option key={m.id} value={m.id} label={`${m.name} (${m.machineId})`}>
                                    {m.name} ({m.machineId})
                                  </Select.Option>
                                ))}
                              </Select>
                              {selectedMachine && (
                                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground bg-muted/20 rounded-sm border border-border p-2">
                                  <div className="flex items-center gap-1"><Factory size={11} /> <span className="font-mono font-semibold">{selectedMachine.machineId}</span></div>
                                  <div className="flex items-center gap-1"><Gauge size={11} /> {selectedMachine.machineSpeed || 'N/A'}</div>
                                  <div className="flex items-center gap-1"><Boxes size={11} /> {selectedMachine.capacityQty} {getCapacityLabel(selectedMachine.capacityUnit)}</div>
                                  <div className="flex items-center gap-1"><MapPin size={11} /> {selectedMachine.location || 'N/A'}</div>
                                </div>
                              )}
                            </div>

                            <div className={`p-2.5 border rounded-sm flex items-center justify-between transition-all ${row.manPower ? 'border-emerald-500/40 bg-emerald-50/40' : 'border-red-500/30 bg-red-50/40'}`}>
                              <div className="flex items-center gap-2">
                                <Users size={13} className={row.manPower ? 'text-emerald-700' : 'text-red-700'} />
                                <span className={`text-xs font-bold ${row.manPower ? 'text-emerald-700' : 'text-red-700'}`}>Man Power</span>
                              </div>
                              <Switch checked={row.manPower} onChange={v => updateAllocation(row.id, { manPower: v })} />
                            </div>
                          </div>

                          {/* SFG & Packaging Consumption per row */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
                            {/* SFG — auto-allocated; splits across lots automatically when one transfer can't cover the machine's required qty */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 uppercase">
                                  <Truck size={12} /> SFG Consumption
                                </label>
                                {row.sfgEntries.length > 1 && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {row.sfgEntries.length} lots (auto)
                                  </span>
                                )}
                              </div>
                              {row.sfgEntries.map((e) => {
                                const allTransfers = getSfgConsumptionInfo().transferNumbers;
                                // Exclude transfers already chosen by other lots on this row.
                                const chosen = new Set(
                                  row.sfgEntries
                                    .filter(x => x.id !== e.id && x.transferNumber)
                                    .map(x => x.transferNumber)
                                );
                                const visibleTransfers = allTransfers.filter(
                                  t => !chosen.has(t) || t === e.transferNumber
                                );
                                return (
                                  <div key={e.id} className="border border-emerald-100 rounded-sm p-2 bg-emerald-50/30 space-y-1.5">
                                    <Select
                                      placeholder="Select SFG Batch"
                                      value={e.transferNumber || undefined}
                                      onChange={v => updateSfgEntry(row.id, e.id, { transferNumber: v || null, qty: null })}
                                      options={visibleTransfers.map(t => {
                                        const remaining = getSfgRemainingForEntry(row.id, e.id, t);
                                        return { value: t, label: `${t} — ${formatQty(remaining)} KG remaining` };
                                      })}
                                      className="w-full text-sm [&_.ant-select-selector]:rounded-sm"
                                      allowClear
                                    />
                                    <div className="flex gap-2">
                                      <InputNumber
                                        min={0}
                                        precision={3}
                                        max={getEntrySfgMaxKg(row.id, e.id, e.transferNumber)}
                                        value={e.qty}
                                        onChange={v => updateSfgEntry(row.id, e.id, { qty: v })}
                                        className="w-full [&_.ant-input-number-input]:rounded-sm"
                                        placeholder="Allocate Qty"
                                        size="middle"
                                        disabled={!e.transferNumber}
                                      />
                                      <div className="flex items-center justify-center font-bold text-muted-foreground text-xs bg-muted px-3 rounded-sm border border-border">KG</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Packaging — up to 3 entries per machine */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-blue-700 flex items-center gap-1.5 uppercase">
                                  <Package size={12} /> Packaging Consumption
                                </label>
                                <span className="text-[10px] text-muted-foreground">
                                  {row.pkgEntries.length}/{MAX_PKG_PER_MACHINE}
                                </span>
                              </div>
                              {row.pkgEntries.map((p, pIdx) => {
                                const pkgOpts = getPkgOptions();
                                // Exclude options already chosen on this row by other PKG entries
                                const chosenKeys = new Set(
                                  row.pkgEntries
                                    .filter((x, i) => i !== pIdx && x.transferNumber && x.rawMaterialId)
                                    .map(x => `${x.transferNumber}__${x.rawMaterialId}`)
                                );
                                const visibleOpts = pkgOpts.filter(o => !chosenKeys.has(`${o.transferNumber}__${o.rawMaterialId}`));
                                return (
                                  <div key={p.id} className="border border-blue-100 rounded-sm p-2 bg-blue-50/30 space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <Select
                                        placeholder="Select PKG Batch"
                                        value={p.transferNumber && p.rawMaterialId ? `${p.transferNumber}__${p.rawMaterialId}` : undefined}
                                        onChange={v => {
                                          if (!v) {
                                            updatePkgEntry(row.id, p.id, { transferNumber: null, rawMaterialId: null, productName: null, skuCode: null, qty: null });
                                            return;
                                          }
                                          const opt = pkgOpts.find(o => `${o.transferNumber}__${o.rawMaterialId}` === v);
                                          if (opt) {
                                            updatePkgEntry(row.id, p.id, {
                                              transferNumber: opt.transferNumber,
                                              rawMaterialId: opt.rawMaterialId,
                                              productName: opt.productName,
                                              skuCode: opt.skuCode,
                                              unit: opt.unit,
                                              qty: null,
                                            });
                                          }
                                        }}
                                        options={visibleOpts.map(o => {
                                          const remaining = getPkgRemainingFor(row.id, o.transferNumber, o.rawMaterialId);
                                          return {
                                            value: `${o.transferNumber}__${o.rawMaterialId}`,
                                            label: `${o.transferNumber} — ${o.productName} (${formatQty(remaining.qty)} ${remaining.unit} remaining)`,
                                          };
                                        })}
                                        className="flex-1 text-sm [&_.ant-select-selector]:rounded-sm"
                                        allowClear
                                      />
                                      {row.pkgEntries.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => removePkgEntry(row.id, p.id)}
                                          className="p-1 rounded-sm text-muted-foreground hover:text-red-500 hover:bg-red-50"
                                          title="Remove this packaging entry"
                                        >
                                          <X size={14} />
                                        </button>
                                      )}
                                    </div>
                                    <div className="flex gap-2">
                                      <InputNumber
                                        min={0}
                                        precision={3}
                                        max={getPkgEntryMax(row.id, p.transferNumber, p.rawMaterialId, p.unit)}
                                        value={p.qty}
                                        onChange={v => updatePkgEntry(row.id, p.id, { qty: v })}
                                        className="w-full [&_.ant-input-number-input]:rounded-sm"
                                        placeholder="Qty"
                                        size="middle"
                                        disabled={!p.transferNumber}
                                      />
                                      <Select
                                        value={p.unit}
                                        onChange={v => updatePkgEntry(row.id, p.id, { unit: v })}
                                        options={isNonWeightUnit(p.unit) ? [{ value: p.unit, label: p.unit }] : LAMINATE_UNIT_OPTIONS}
                                        disabled={isNonWeightUnit(p.unit)}
                                        className="w-[80px] shrink-0 [&_.ant-select-selector]:rounded-sm"
                                        size="middle"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                              {row.pkgEntries.length < MAX_PKG_PER_MACHINE && (
                                <button
                                  type="button"
                                  onClick={() => addPkgEntry(row.id)}
                                  className="w-full py-1.5 rounded-sm border border-dashed border-blue-300 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                  + Add Packaging Material
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Notes */}
                          <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase">Notes (optional)</label>
                            <Input.TextArea
                              rows={2}
                              value={row.notes}
                              onChange={e => updateAllocation(row.id, { notes: e.target.value })}
                              placeholder="Notes for this machine..."
                              className="rounded-sm mt-1"
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Add Row */}
                <div className="flex justify-center">
                  <Button
                    icon={<Plus size={16} />}
                    size="large"
                    onClick={addAllocation}
                    disabled={availableMachinesForRow('').length === 0}
                    className="rounded-sm font-semibold border-dashed"
                  >
                    Add Machine Allocation
                  </Button>
                </div>
                </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="px-6 py-5 border-t border-border bg-muted/10 flex items-center justify-between">
            <Button size="large" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="rounded-sm font-semibold"><ArrowLeft size={16} className="mr-1 inline" /> Back</Button>
            {step < 1 ? (
              <Button type="primary" size="large" onClick={proceedToMachineAllocation} className="rounded-sm px-6 font-bold shadow-md" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}>Next Step <ArrowRight size={16} className="ml-1 inline" /></Button>
            ) : (
              <Button
                type="primary"
                size="large"
                loading={submitting}
                onClick={handleSubmit}
                disabled={!allocationsMatchPlan}
                className="rounded-sm px-8 font-bold shadow-md"
                style={
                  allocationsMatchPlan
                    ? { background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }
                    : undefined
                }
              >
                <CheckCircle size={18} className="mr-2 inline" /> Make Allocation
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default NewFGProductionEntryPage;
