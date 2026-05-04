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
  Scale,
  Sparkles,
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

interface MachineAllocation {
  id: string;
  machineId: string;
  manPower: boolean;
  sfgTransferNumber: string | null;
  sfgConsumptionQty: number | null;
  pkgTransferNumber: string | null;
  laminateConsumptionQty: number | null;
  laminateConsumptionUnit: string;
  notes: string;
}

const newEmptyAllocation = (): MachineAllocation => ({
  id: genId(),
  machineId: '',
  manPower: true,
  sfgTransferNumber: null,
  sfgConsumptionQty: null,
  pkgTransferNumber: null,
  laminateConsumptionQty: null,
  laminateConsumptionUnit: 'KG',
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

const NewFGProductionEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // General State
  const [locations, setLocations] = useState<any[]>([]);
  const [, setMachines] = useState<any[]>([]);
  const [boms, setBoms] = useState<any[]>([]);
  const [fetchingBase, setFetchingBase] = useState(true);

  // Step 1: Selection & Planning
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedBomId, setSelectedBomId] = useState('');
  const [productionQty, setProductionQty] = useState<number | null>(null);
  const [productionUnit, setProductionUnit] = useState('KG');

  // Materials & Consumptions
  const [consumptionLines, setConsumptionLines] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);

  // Step 2: Multi-machine allocation
  const [allocations, setAllocations] = useState<MachineAllocation[]>([newEmptyAllocation()]);
  const [outputMachines, setOutputMachines] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Previous production entries for "Product" column
  const [previousEntries, setPreviousEntries] = useState<any[]>([]);

  // SFG transfers for SFG consumption column
  const [sfgTransfers, setSfgTransfers] = useState<any[]>([]);
  // Packaging transfers for Laminate/Packaging consumption column
  const [pkgTransfers, setPkgTransfers] = useState<any[]>([]);

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
        setLocations(Array.isArray(locData) ? locData : locData?.data || []);
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

  /* ─── Fetch previous production entries for product info ─── */
  useEffect(() => {
    const fetchPrevEntries = async () => {
      try {
        const res = await api.get(API_ROUTES.RAW.GET_FG_PRODUCTION_ENTRIES);
        setPreviousEntries(res.data?.data || []);
      } catch {
        /* ignore */
      }
    };
    fetchPrevEntries();
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
        const pkgOnly = filtered.filter((t: any) =>
          t.lines?.some((l: any) => l.lineType === 'PACKAGING_MATERIAL')
        ).map((t: any) => ({
          ...t,
          lines: t.lines?.filter((l: any) => l.lineType === 'PACKAGING_MATERIAL') || []
        }));
        setSfgTransfers(sfgOnly);
        setPkgTransfers(pkgOnly);
      } catch {
        setSfgTransfers([]);
        setPkgTransfers([]);
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

  /* ─── Handle Check Availability button click ─── */
  const handleCheckAvailability = () => {
    if (!selectedBomId || !productionQty || productionQty <= 0 || !selectedLocationId) {
      message.warning('Please fill in Location, Target BOM, and Production Quantity first.');
      return;
    }
    setShowAvailability(true);
    fetchBomItems(selectedBomId, productionQty, productionUnit, selectedLocationId);
  };

  /* ─── Helper: Get last product for a given machine ─── */
  const getLastProductForMachine = (machineId: string): string => {
    for (const entry of previousEntries) {
      // Check new direct machineId on FGProductionEntry
      if (entry.machineId === machineId) {
        return entry.fgProductName || '';
      }
      // Check old machineEntries relation
      if (entry.machineEntries) {
        const machineEntry = entry.machineEntries.find((me: any) => me.machineId === machineId);
        if (machineEntry) {
          return entry.fgProductName || machineEntry.productName || '';
        }
      }
    }
    return '';
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
  const findPkgBatchByTransfer = (transferNumber: string): any | null => {
    for (const line of consumptionLines) {
      if (!line?.isPackaging) continue;
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
  const getPkgConsumptionInfo = (): { transferNumbers: string[] } => {
    const transferNumbers: string[] = [];
    // Primary: use BOM-computed available batches (has accurate remainingQuantity)
    for (const line of consumptionLines) {
      if (!line?.isPackaging) continue;
      for (const batch of (line.availableSfgBatches || [])) {
        if (batch?.transferNumber && (batch.remainingQuantity || 0) > 0 && !transferNumbers.includes(batch.transferNumber)) {
          transferNumbers.push(batch.transferNumber);
        }
      }
    }
    // Fallback: if no consumption lines loaded yet, use raw transfers
    if (transferNumbers.length === 0 && consumptionLines.length === 0) {
      for (const transfer of pkgTransfers) {
        if (!transferNumbers.includes(transfer.transferNumber)) {
          transferNumbers.push(transfer.transferNumber);
        }
      }
    }
    return { transferNumbers };
  };

  const getPkgTransferAvailable = (transferNumber: string) => {
     if (!transferNumber) return { qty: 0, unit: 'KG', productName: '' };
     // Prefer the backend-computed remaining qty (already net of past allocations)
     const batch = findPkgBatchByTransfer(transferNumber);
     const transfer = pkgTransfers.find(t => t.transferNumber === transferNumber);
     // Pull product name from raw transfer lines if present
     let name = '';
     transfer?.lines?.forEach((l: any) => { name = l.productName || name; });
     if (batch) {
       return { qty: batch.remainingQuantity || 0, unit: batch.unit || 'KG', productName: name };
     }
     // Fallback to raw transfer qty if consumption data is unavailable
     if (!transfer) return { qty: 0, unit: 'KG', productName: '' };
     let sum = 0;
     let un = 'KG';
     transfer.lines?.forEach((l: any) => {
         sum += l.quantity || 0;
         un = l.unitOfMeasurement || 'KG';
     });
     return { qty: sum, unit: un, productName: name };
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
    (sum, a) => sum + (Number(a.sfgConsumptionQty) || 0),
    0
  );
  const allocationDelta = Number((totalAllocatedKg - planQtyKg).toFixed(3));
  const allocationsMatchPlan = Math.abs(allocationDelta) < 0.001;
  const planProductName = boms.find(b => b.id === selectedBomId)?.productName || '';

  /* ─── Live remaining helpers (UI-only — DB is updated only on submit) ─── */

  /* SFG transfer KG already consumed by OTHER rows (excludes the given row).
     Used to (a) show remaining qty per transfer in the dropdown/caption,
     and (b) cap the InputNumber max so a row can't exceed transfer stock. */
  const sfgKgUsedByOtherRows = (rowId: string, transferNumber: string): number => {
    if (!transferNumber) return 0;
    return allocations
      .filter(a => a.id !== rowId && a.sfgTransferNumber === transferNumber)
      .reduce((s, a) => s + (Number(a.sfgConsumptionQty) || 0), 0);
  };

  /* Remaining KG of an SFG transfer after accounting for everything other rows
     have already allocated to that transfer. */
  const getSfgRemainingForRow = (rowId: string, transferNumber: string) => {
    const totalAvail = getSfgTransferAvailable(transferNumber).qty;
    const used = sfgKgUsedByOtherRows(rowId, transferNumber);
    return Math.max(0, Number((totalAvail - used).toFixed(3)));
  };

  /* Remaining KG of plan after other rows' SFG consumption. */
  const planRemainingForRow = (rowId: string): number => {
    const otherSum = allocations
      .filter(a => a.id !== rowId)
      .reduce((s, a) => s + (Number(a.sfgConsumptionQty) || 0), 0);
    return Math.max(0, Number((planQtyKg - otherSum).toFixed(3)));
  };

  /* Per-row SFG max: capped by both transfer remaining and plan remaining. */
  const getRowSfgMaxKg = (rowId: string, transferNumber: string | null): number | undefined => {
    const planLeft = planRemainingForRow(rowId);
    if (!transferNumber) return planLeft || undefined;
    const transferLeft = getSfgRemainingForRow(rowId, transferNumber);
    return Math.min(transferLeft, planLeft);
  };

  /* PKG transfer KG already consumed by OTHER rows (excludes the given row).
     Each row's laminate qty is in its own unit; we normalize to KG via toGrams. */
  const pkgKgUsedByOtherRows = (rowId: string, transferNumber: string): number => {
    if (!transferNumber) return 0;
    return allocations
      .filter(a => a.id !== rowId && a.pkgTransferNumber === transferNumber)
      .reduce(
        (s, a) =>
          s +
          (a.laminateConsumptionQty != null
            ? toGrams(Number(a.laminateConsumptionQty), a.laminateConsumptionUnit || 'KG') / 1000
            : 0),
        0
      );
  };

  /* Remaining qty of a PKG transfer (in transfer's own unit, typically KG)
     after accounting for everything other rows have allocated. */
  const getPkgRemainingForRow = (rowId: string, transferNumber: string) => {
    const info = getPkgTransferAvailable(transferNumber);
    const totalAvailKg =
      info.unit && info.unit !== 'KG'
        ? toGrams(info.qty, info.unit) / 1000
        : info.qty;
    const usedKg = pkgKgUsedByOtherRows(rowId, transferNumber);
    const remainingKg = Math.max(0, totalAvailKg - usedKg);
    // Convert back into transfer's display unit
    if (info.unit && info.unit !== 'KG') {
      const factor =
        UNIT_TO_GRAMS[info.unit] ?? UNIT_TO_GRAMS[info.unit.toLowerCase()] ?? 1000;
      return { qty: Number(((remainingKg * 1000) / factor).toFixed(3)), unit: info.unit };
    }
    return { qty: Number(remainingKg.toFixed(3)), unit: 'KG' };
  };

  /* Per-row laminate max in the row's selected unit. */
  const getRowLaminateMax = (
    rowId: string,
    transferNumber: string | null,
    rowUnit: string
  ): number | undefined => {
    if (!transferNumber) return undefined;
    const remaining = getPkgRemainingForRow(rowId, transferNumber);
    // remaining is in transfer's unit (typically KG); convert to row's unit
    const remainingGrams = toGrams(remaining.qty, remaining.unit);
    const rowFactor =
      UNIT_TO_GRAMS[rowUnit] ?? UNIT_TO_GRAMS[rowUnit.toLowerCase()] ?? 1000;
    return Number((remainingGrams / rowFactor).toFixed(3));
  };

  const proceedToMachineAllocation = () => {
    if (!selectedLocationId || !selectedBomId || !productionQty) {
      message.error('Please complete all planning fields');
      return;
    }
    
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
      if (!a.sfgConsumptionQty || a.sfgConsumptionQty <= 0) {
        message.error(`Row ${i + 1}: enter the SFG consumption quantity.`);
        return;
      }
      if (!a.sfgTransferNumber) {
        message.error(`Row ${i + 1}: select an SFG transfer.`);
        return;
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

    // Per-transfer SFG availability check
    const sfgPerTransfer: Record<string, number> = {};
    for (const a of allocations) {
      if (a.sfgTransferNumber) {
        sfgPerTransfer[a.sfgTransferNumber] =
          (sfgPerTransfer[a.sfgTransferNumber] || 0) + (Number(a.sfgConsumptionQty) || 0);
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

    // Per-transfer PKG availability check (normalize all rows to KG)
    const pkgKgPerTransfer: Record<string, number> = {};
    for (const a of allocations) {
      if (!a.pkgTransferNumber) continue;
      const rowKg =
        a.laminateConsumptionQty != null
          ? toGrams(Number(a.laminateConsumptionQty), a.laminateConsumptionUnit || 'KG') / 1000
          : 0;
      pkgKgPerTransfer[a.pkgTransferNumber] =
        (pkgKgPerTransfer[a.pkgTransferNumber] || 0) + rowKg;
    }
    for (const [trf, usedKg] of Object.entries(pkgKgPerTransfer)) {
      const info = getPkgTransferAvailable(trf);
      const availKg =
        info.unit && info.unit !== 'KG'
          ? toGrams(info.qty, info.unit) / 1000
          : info.qty;
      if (usedKg > availKg + 0.001) {
        message.error(
          `Packaging transfer ${trf}: total allocated (${formatQty(usedKg)} KG) exceeds available (${formatQty(availKg)} KG).`
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

    // 3) Packaging lines: per pkgLine, one record per (pkgRawMaterial × transfer)
    //    summed across rows, with each row's qty converted to that line's BOM unit.
    const packagingLines = consumptionLines.filter(c => c.isPackaging);
    for (const pkgLine of packagingLines) {
      const pkgPerTransfer: Record<string, number> = {};
      for (const a of allocations) {
        if (!a.pkgTransferNumber) continue;
        const rowQty = Number(a.laminateConsumptionQty) || 0;
        if (rowQty <= 0) continue;
        const qtyGrams = toGrams(rowQty, a.laminateConsumptionUnit || 'KG');
        const unitFactor =
          UNIT_TO_GRAMS[pkgLine.unit] ??
          UNIT_TO_GRAMS[pkgLine.unit?.toLowerCase()] ??
          1000;
        const qtyInBomUnit = unitFactor > 0 ? qtyGrams / unitFactor : 0;
        if (qtyInBomUnit > 0) {
          pkgPerTransfer[a.pkgTransferNumber] =
            (pkgPerTransfer[a.pkgTransferNumber] || 0) + qtyInBomUnit;
        }
      }
      for (const [trf, qty] of Object.entries(pkgPerTransfer)) {
        payloadConsumptions.push({
          rawMaterialId: pkgLine.rawMaterialId,
          rawMaterialName: pkgLine.rawMaterialName,
          expectedQuantity: pkgLine.expectedQuantity,
          actualQuantity: qty,
          unit: pkgLine.unit,
          sourceType: 'PKG_TRANSFER',
          batchNumber: trf,
          dispatchId: '',
        });
      }
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
      const transferNote = a.sfgTransferNumber ? `SFG Transfer: ${a.sfgTransferNumber}` : '';
      const combinedNotes =
        transferNote + (transferNote && a.notes ? ' | ' : '') + (a.notes || '');
      const sfgKg = Number(a.sfgConsumptionQty) || 0;
      return {
        machineId: a.machineId,
        allocatedQty: kgToPlanUnit(sfgKg),
        productName: planProductName,
        instulationCapacity: m?.capacityQty || 0,
        instulationCapacityUnit:
          m?.capacityUnit === 'BOXES_PER_SHIFT' ? 'Boxes/Shift' : m?.capacityUnit,
        laminateConsumptionQty: Number(a.laminateConsumptionQty) || 0,
        laminateConsumptionUnit: a.laminateConsumptionUnit,
        sfgConsumptionQty: sfgKg,
        sfgConsumptionUnit: 'KG',
        manPower: a.manPower,
        notes: combinedNotes,
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
    if (unit === 'BOXES_PER_SHIFT') return 'Boxes/Shift';
    if (unit === 'KG_PER_SHIFT') return 'KG/Shift';
    if (unit === 'TON_PER_SHIFT') return 'Ton/Shift';
    return unit;
  };

  return (
    <motion.div className="min-h-screen bg-gradient-to-br from-emerald-50/40 via-background to-teal-50/30 p-4 md:p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="relative mb-6 overflow-hidden rounded-md border border-emerald-100 bg-gradient-to-r from-white via-emerald-50/50 to-teal-50/60 shadow-sm">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-teal-400/10 blur-3xl" />
          <div className="relative flex items-center gap-4 p-5 md:p-6">
            <Button
              icon={<ArrowLeft size={18} />}
              onClick={() => navigate('/packaging/fg-production')}
              className="rounded-sm shadow-sm border-emerald-200 hover:border-emerald-400"
              size="large"
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
              <Sparkles size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                New Production Plan
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Select location, plan raw materials, and allocate to machines</p>
            </div>
            <div className="hidden md:flex items-center gap-2 rounded-md border border-emerald-200 bg-white/70 backdrop-blur px-3 py-2 shadow-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-700">Step {step + 1} of {stepItems.length}</span>
            </div>
          </div>
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
                <div className="relative rounded-md border border-border bg-gradient-to-br from-emerald-50/40 via-card to-teal-50/30 p-5 md:p-6 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Field 1: Location */}
                    <div className="group rounded-md border border-border bg-card p-4 shadow-sm transition-all hover:border-emerald-400 hover:shadow-md">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-emerald-100 text-emerald-700 font-bold text-xs">01</div>
                        <MapPin size={16} className="text-emerald-600" />
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Production Location</label>
                      </div>
                      <Select
                        className="w-full rounded-sm" size="large" placeholder="E.g. Packaging Area"
                        value={selectedLocationId || undefined} onChange={setSelectedLocationId}
                        options={locations.map(l => ({ value: l.id, label: l.name }))}
                        loading={fetchingBase}
                      />
                      <p className="mt-2 text-[11px] text-muted-foreground">Where the production will take place</p>
                    </div>

                    {/* Field 2: Target BOM */}
                    <div className="group rounded-md border border-border bg-card p-4 shadow-sm transition-all hover:border-emerald-400 hover:shadow-md">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-violet-100 text-violet-700 font-bold text-xs">02</div>
                        <Target size={16} className="text-violet-600" />
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target FG Item (BOM)</label>
                      </div>
                      <Select
                        className="w-full rounded-sm" size="large" placeholder="Select Product"
                        value={selectedBomId || undefined} onChange={setSelectedBomId}
                        options={boms.map(b => ({ value: b.id, label: b.productName }))}
                        loading={fetchingBase}
                      />
                      <p className="mt-2 text-[11px] text-muted-foreground">Finished good you want to produce</p>
                    </div>

                    {/* Field 3: Planned Production */}
                    <div className="md:col-span-2 group rounded-md border border-border bg-card p-4 shadow-sm transition-all hover:border-emerald-400 hover:shadow-md">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-amber-100 text-amber-700 font-bold text-xs">03</div>
                        <Scale size={16} className="text-amber-600" />
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Planned Production</label>
                      </div>
                      <div className="flex items-center gap-3">
                        <InputNumber min={0.001} step={1} className="w-full font-semibold rounded-sm" size="large" value={productionQty} onChange={setProductionQty} placeholder="E.g. 500" />
                        <Select className="w-32 rounded-sm" size="large" value={productionUnit} onChange={setProductionUnit} options={['KG', 'Ton', 'gram'].map(u => ({ value: u, label: u }))} />
                        <Button
                          type="primary"
                          size="large"
                          onClick={handleCheckAvailability}
                          loading={loadingItems}
                          disabled={!selectedLocationId || !selectedBomId || !productionQty || productionQty <= 0}
                          className="rounded-sm font-bold shadow-md border-0 whitespace-nowrap"
                          style={{ background: (!selectedLocationId || !selectedBomId || !productionQty || productionQty <= 0) ? undefined : 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
                          icon={<Search size={16} />}
                        >
                          Check Availability
                        </Button>
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground">Planned output quantity for this batch</p>
                    </div>
                  </div>

                  {/* Plan Summary */}
                  {selectedLocationId && selectedBomId && productionQty && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-5 flex flex-wrap items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50/60 px-4 py-3"
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
                        <span className="font-semibold">{productionQty} {productionUnit}</span>
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

                {/* Allocation Rows */}
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
                            {/* SFG */}
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 uppercase">
                                <Truck size={12} /> SFG Consumption
                              </label>
                              <Select
                                placeholder="Select SFG Batch"
                                value={row.sfgTransferNumber || undefined}
                                onChange={v => updateAllocation(row.id, { sfgTransferNumber: v, sfgConsumptionQty: null })}
                                options={getSfgConsumptionInfo().transferNumbers.map(t => {
                                  const remaining = getSfgRemainingForRow(row.id, t);
                                  return { value: t, label: `${t} — ${formatQty(remaining)} KG remaining` };
                                })}
                                className="w-full text-sm [&_.ant-select-selector]:rounded-sm"
                                allowClear
                              />
                              <div className="flex gap-2">
                                <InputNumber
                                  min={0}
                                  precision={3}
                                  max={getRowSfgMaxKg(row.id, row.sfgTransferNumber)}
                                  value={row.sfgConsumptionQty}
                                  onChange={v => updateAllocation(row.id, { sfgConsumptionQty: v })}
                                  className="w-full [&_.ant-input-number-input]:rounded-sm"
                                  placeholder="Allocate Qty"
                                  size="large"
                                  disabled={!row.sfgTransferNumber}
                                />
                                <div className="flex items-center justify-center font-bold text-muted-foreground text-xs bg-muted px-3 rounded-sm border border-border">KG</div>
                              </div>
                              {row.sfgTransferNumber && (
                                <div className="text-[11px] text-muted-foreground space-y-0.5">
                                  
                                </div>
                              )}
                            </div>

                            {/* Packaging */}
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-blue-700 flex items-center gap-1.5 uppercase">
                                <Package size={12} /> Packaging Consumption
                              </label>
                              <Select
                                placeholder="Select PKG Batch"
                                value={row.pkgTransferNumber || undefined}
                                onChange={v => updateAllocation(row.id, { pkgTransferNumber: v, laminateConsumptionQty: null })}
                                options={getPkgConsumptionInfo().transferNumbers.map(t => {
                                  const info = getPkgTransferAvailable(t);
                                  const remaining = getPkgRemainingForRow(row.id, t);
                                  return { value: t, label: `${t} — ${info.productName || 'Packaging'} (${formatQty(remaining.qty)} ${remaining.unit} remaining)` };
                                })}
                                className="w-full text-sm [&_.ant-select-selector]:rounded-sm"
                                allowClear
                              />
                              <div className="flex gap-2">
                                <InputNumber
                                  min={0}
                                  precision={3}
                                  max={getRowLaminateMax(row.id, row.pkgTransferNumber, row.laminateConsumptionUnit)}
                                  value={row.laminateConsumptionQty}
                                  onChange={v => updateAllocation(row.id, { laminateConsumptionQty: v })}
                                  className="w-full [&_.ant-input-number-input]:rounded-sm"
                                  placeholder="Qty"
                                  size="large"
                                  disabled={!row.pkgTransferNumber}
                                />
                                <Select
                                  value={row.laminateConsumptionUnit}
                                  onChange={v => updateAllocation(row.id, { laminateConsumptionUnit: v })}
                                  options={LAMINATE_UNIT_OPTIONS}
                                  className="w-[80px] shrink-0 [&_.ant-select-selector]:rounded-sm"
                                />
                              </div>
                              {row.pkgTransferNumber && (() => {
                                const pkgRemaining = getPkgRemainingForRow(row.id, row.pkgTransferNumber);
                                // Compute remaining after THIS row's own consumption
                                const rowQtyKg = row.laminateConsumptionQty != null
                                  ? toGrams(Number(row.laminateConsumptionQty), row.laminateConsumptionUnit || 'KG') / 1000
                                  : 0;
                                const remainingKgBeforeRow = pkgRemaining.unit !== 'KG'
                                  ? toGrams(pkgRemaining.qty, pkgRemaining.unit) / 1000
                                  : pkgRemaining.qty;
                                const afterThisEntryKg = Math.max(0, Number((remainingKgBeforeRow - rowQtyKg).toFixed(3)));
                                // Convert back to transfer's display unit
                                let afterThisEntryDisplay = afterThisEntryKg;
                                let afterThisEntryUnit = 'KG';
                                if (pkgRemaining.unit && pkgRemaining.unit !== 'KG') {
                                  const factor = UNIT_TO_GRAMS[pkgRemaining.unit] ?? UNIT_TO_GRAMS[pkgRemaining.unit.toLowerCase()] ?? 1000;
                                  afterThisEntryDisplay = Number(((afterThisEntryKg * 1000) / factor).toFixed(3));
                                  afterThisEntryUnit = pkgRemaining.unit;
                                }
                                return (
                                  <div className="text-[11px] text-muted-foreground space-y-0.5">
                                    
                                  </div>
                                );
                              })()}
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
