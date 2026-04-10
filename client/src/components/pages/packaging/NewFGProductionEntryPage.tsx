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
  Search
} from 'lucide-react';

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

  // Step 2: Single machine allocation
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [machineProductName, setMachineProductName] = useState('');
  const [sfgTransferNumber, setSfgTransferNumber] = useState<string | null>(null);
  const [sfgConsumptionQty, setSfgConsumptionQty] = useState<number | null>(null);
  const [pkgTransferNumber, setPkgTransferNumber] = useState<string | null>(null);
  const [laminateConsumptionQty, setLaminateConsumptionQty] = useState<number | null>(null);
  const [laminateConsumptionUnit, setLaminateConsumptionUnit] = useState('KG');
  const [machineManPower, setMachineManPower] = useState(true);
  const [machineNotes, setMachineNotes] = useState('');
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

  /* ─── Handle machine selection ─── */
  const handleMachineSelect = (machineId: string) => {
    const m = outputMachines.find(mac => mac.id === machineId);
    if (!m) return;

    // Check if machine has a pending allocation (output not yet recorded)
    if (m.hasPendingAllocation) {
      setSelectedMachineId('');
      setSelectedMachine(null);
      setMachineProductName('');
      message.warning(`${m.name} has a pending allocation (${m.pendingEntryNumber || ''}) — output not yet recorded. Please complete existing work first.`);
      Modal.warning({
        title: 'Machine Has Pending Work',
        content: `${m.name} already has an active allocation (${m.pendingEntryNumber || 'N/A'}) that is still pending output recording.${m.pendingProductName ? ' Product: ' + m.pendingProductName + '.' : ''} Please complete the existing production output first, or select a different machine.`,
        okText: 'OK, I\'ll choose another',
        centered: true,
      });
      return;
    }

    setSelectedMachineId(machineId);
    setSelectedMachine(m);
    const selectedBom = boms.find(b => b.id === selectedBomId);
    setMachineProductName(selectedBom?.productName || getLastProductForMachine(m.id) || '');
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

  /* ─── Submit (Creates both Batch & Entry) — single machine ─── */
  const handleSubmit = async () => {
    if (!selectedMachineId) {
      message.error('Please select a machine for allocation.');
      return;
    }

    const sfgQty = Number(sfgConsumptionQty) || 0;
    if (sfgQty <= 0) {
      message.error('Please enter the SFG Consumption quantity.');
      return;
    }

    // Build consumption payload
    const payloadConsumptions: any[] = [];

    // 1) Non-SFG, non-Packaging items (general stock)
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

    // 2) Packaging lines
    const packagingLines = consumptionLines.filter(c => c.isPackaging);
    for (const pkgLine of packagingLines) {
       if (pkgTransferNumber && (Number(laminateConsumptionQty) || 0) > 0) {
          const qtyGrams = toGrams(Number(laminateConsumptionQty) || 0, laminateConsumptionUnit || 'KG');
          const unitFactor = UNIT_TO_GRAMS[pkgLine.unit] ?? UNIT_TO_GRAMS[pkgLine.unit?.toLowerCase()] ?? 1000;
          const qtyInBomUnit = unitFactor > 0 ? qtyGrams / unitFactor : 0;
          if (qtyInBomUnit > 0) {
             payloadConsumptions.push({
                rawMaterialId: pkgLine.rawMaterialId,
                rawMaterialName: pkgLine.rawMaterialName,
                expectedQuantity: pkgLine.expectedQuantity,
                actualQuantity: qtyInBomUnit,
                unit: pkgLine.unit,
                sourceType: 'PKG_TRANSFER',
                batchNumber: pkgTransferNumber,
                dispatchId: '',
             });
          }
       }
    }

    // 3) SFG lines
    const sfgLine = consumptionLines.find(c => c.isSFG);
    if (sfgLine) {
       const trf = sfgTransferNumber || sfgLine.batchNumber || sfgTransfers[0]?.transferNumber;
       if (trf && sfgQty > 0) {
          payloadConsumptions.push({
             rawMaterialId: sfgLine.rawMaterialId,
             rawMaterialName: sfgLine.rawMaterialName,
             expectedQuantity: sfgLine.expectedQuantity,
             actualQuantity: sfgQty,
             unit: 'KG',
             sourceType: 'SFG_BATCH',
             batchNumber: trf,
             dispatchId: '',
          });
       } else if (sfgQty > 0 && !trf) {
          message.error('No SFG Transfer batch selected. Please select an SFG Transfer.');
          return;
       }
    }

    if (payloadConsumptions.length === 0) {
       message.error('No consumption data to submit. Please ensure materials are configured.');
       return;
    }

    setSubmitting(true);
    try {
      // 1. Create FG Batch
      const batchRes = await api.post(API_ROUTES.RAW.CREATE_FG_BATCH, {
        bomId: selectedBomId,
        productionQty,
        productionUnit,
        notes: "Auto-created from Production Entry Flow",
        consumptions: payloadConsumptions,
      });

      const newBatchId = batchRes.data?.data?.id;

      // 2. Accept the Batch
      await api.put(API_ROUTES.RAW.ACCEPT_FG_BATCH(newBatchId));

      // 3. Create FG Production Entry with single machine
      await api.post(API_ROUTES.RAW.CREATE_FG_PRODUCTION_ENTRY, {
        fgBatchId: newBatchId,
        machineId: selectedMachineId,
        allocatedQty: sfgQty,
        productName: machineProductName,
        instulationCapacity: selectedMachine?.capacityQty || 0,
        instulationCapacityUnit: selectedMachine?.capacityUnit === 'BOXES_PER_SHIFT' ? 'Boxes/Shift' : selectedMachine?.capacityUnit,
        laminateConsumptionQty: laminateConsumptionQty || 0,
        laminateConsumptionUnit: laminateConsumptionUnit,
        sfgConsumptionQty: sfgQty,
        sfgConsumptionUnit: 'KG',
        manPower: machineManPower,
        notes: (sfgTransferNumber ? `SFG Transfer: ${sfgTransferNumber}` : '') + (sfgTransferNumber && machineNotes ? ' | ' : '') + (machineNotes || ''),
      });

      message.success('Production Entry created successfully!');
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

            {/* STEP 2: Single Machine Assignment */}
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
                      <p className="text-sm text-muted-foreground mt-0.5">Select a machine and assign production quantity</p>
                    </div>
                    {selectedMachine && (
                      <div className="hidden md:flex items-center gap-2 rounded-md border border-emerald-200 bg-white/80 backdrop-blur px-3 py-2 shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-700">{selectedMachine.name} Selected</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Machine Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Factory size={14} className="text-blue-600" /> Select Machine
                    </label>
                    {outputMachines.length === 0 ? (
                      <div className="p-4 border border-amber-200 rounded-md bg-amber-50/50 text-sm text-amber-700 font-semibold">
                        No machines with production output records found. Machines must have at least one completed production output to appear here.
                      </div>
                    ) : (
                      <Select
                        className="w-full font-bold [&_.ant-select-selector]:rounded-sm"
                        value={selectedMachineId || undefined}
                        onChange={(val: string) => handleMachineSelect(val)}
                        placeholder="Choose a machine..."
                        size="large"
                        showSearch
                        allowClear
                        onClear={() => { setSelectedMachineId(''); setSelectedMachine(null); setMachineProductName(''); }}
                        filterOption={(input, option) => (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())}
                      >
                        {outputMachines.map(m => (
                          <Select.Option key={m.id} value={m.id} disabled={!!m.hasPendingAllocation} label={`${m.name} (${m.machineId})`}>
                            <div className="flex items-center justify-between">
                              <span>{m.name} ({m.machineId})</span>
                              {m.hasPendingAllocation && (
                                <span style={{ color: '#d97706', fontSize: '11px', fontWeight: 600 }}>
                                  Pending Output
                                </span>
                              )}
                            </div>
                          </Select.Option>
                        ))}
                      </Select>
                    )}

                    {/* Machine Details Card */}
                    {selectedMachine && (
                      <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 p-4 rounded-md border border-blue-100 shadow-sm space-y-2 mt-3 transition-all duration-300">
                        <div className="flex justify-between items-center text-sm"><span className="opacity-70 flex items-center gap-1"><Factory size={12} /> Machine ID:</span> <span className="font-mono font-bold text-blue-700">{selectedMachine.machineId}</span></div>
                        <div className="flex justify-between items-center text-sm"><span className="opacity-70 flex items-center gap-1"><Gauge size={12} /> Speed:</span> <span className="font-semibold">{selectedMachine.machineSpeed || 'N/A'}</span></div>
                        <div className="flex justify-between items-center text-sm"><span className="opacity-70 flex items-center gap-1"><Boxes size={12} /> Capacity:</span> <span className="font-semibold">{selectedMachine.capacityQty} {getCapacityLabel(selectedMachine.capacityUnit)}</span></div>
                        <div className="flex justify-between items-center text-sm"><span className="opacity-70 flex items-center gap-1"><MapPin size={12} /> Location:</span> <span className="font-semibold">{selectedMachine.location || 'N/A'}</span></div>
                      </div>
                    )}
                  </div>

                  {/* Man Power & Product */}
                  <div className="space-y-3">
                    <div className={`p-3 border rounded-md flex items-center justify-between transition-all ${machineManPower ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-50 to-emerald-50/30 shadow-sm' : 'border-red-500/30 bg-gradient-to-r from-red-50 to-red-50/30'}`}>
                      <div className="flex items-center gap-2">
                        <Users size={14} className={machineManPower ? 'text-emerald-700' : 'text-red-700'} />
                        <span className={`text-sm font-bold ${machineManPower ? 'text-emerald-700' : 'text-red-700'}`}>Man Power</span>
                      </div>
                      <Switch checked={machineManPower} onChange={setMachineManPower} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase">Product Name</label>
                      <Input value={machineProductName} onChange={e => setMachineProductName(e.target.value)} placeholder="Product name..." className="mt-1 rounded-sm" />
                    </div>
                  </div>
                </div>

                {/* SFG & Packaging Consumption */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border pt-6">
                  {/* SFG Consumption */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                      <Truck size={14} /> SFG Consumption
                    </label>
                    <Select
                      placeholder="Select SFG Batch"
                      value={sfgTransferNumber || undefined}
                      onChange={v => setSfgTransferNumber(v)}
                      options={getSfgConsumptionInfo().transferNumbers.map(t => {
                        const avail = getSfgTransferAvailable(t);
                        return { value: t, label: `${t} — ${avail.qty} ${avail.unit} available` };
                      })}
                      className="w-full text-sm [&_.ant-select-selector]:rounded-sm font-semibold"
                      allowClear
                    />
                    <div className="flex gap-2">
                      <InputNumber
                        min={0} precision={3}
                        value={sfgConsumptionQty}
                        onChange={v => setSfgConsumptionQty(v)}
                        className="w-full font-semibold [&_.ant-input-number-input]:rounded-sm"
                        placeholder="Allocate Qty"
                        size="large"
                      />
                      <div className="flex items-center justify-center font-bold text-muted-foreground text-sm bg-muted px-4 rounded-sm border border-border">KG</div>
                    </div>
                    {sfgTransferNumber && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-sm border border-border">
                        Available: <span className="font-bold text-emerald-600">{getSfgTransferAvailable(sfgTransferNumber).qty} {getSfgTransferAvailable(sfgTransferNumber).unit}</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Packaging Consumption */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-blue-700 flex items-center gap-2">
                      <Package size={14} /> Packaging Consumption
                    </label>
                    <Select
                      placeholder="Select PKG Batch"
                      value={pkgTransferNumber || undefined}
                      onChange={v => setPkgTransferNumber(v)}
                      options={getPkgConsumptionInfo().transferNumbers.map(t => {
                        const info = getPkgTransferAvailable(t);
                        return { value: t, label: `${t} — ${info.productName || 'Packaging'} (${info.qty} ${info.unit})` };
                      })}
                      className="w-full text-sm [&_.ant-select-selector]:rounded-sm font-semibold"
                      allowClear
                    />
                    <div className="flex gap-2">
                      <InputNumber
                        min={0} precision={3}
                        value={laminateConsumptionQty}
                        onChange={v => setLaminateConsumptionQty(v)}
                        className="w-full font-semibold [&_.ant-input-number-input]:rounded-sm"
                        placeholder="Qty"
                        size="large"
                      />
                      <Select
                        value={laminateConsumptionUnit}
                        onChange={v => setLaminateConsumptionUnit(v)}
                        options={LAMINATE_UNIT_OPTIONS}
                        className="w-[90px] shrink-0 [&_.ant-select-selector]:rounded-sm font-semibold"
                      />
                    </div>
                    {pkgTransferNumber && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-sm border border-border">
                        Available: <span className="font-bold text-blue-600">{getPkgTransferAvailable(pkgTransferNumber).qty} {getPkgTransferAvailable(pkgTransferNumber).unit}</span>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2 border-t border-border pt-4">
                  <label className="text-sm font-bold text-foreground">Notes (optional)</label>
                  <Input.TextArea value={machineNotes} onChange={(e) => setMachineNotes(e.target.value)} placeholder="Production notes..." className="rounded-sm" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="px-6 py-5 border-t border-border bg-muted/10 flex items-center justify-between">
            <Button size="large" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="rounded-sm font-semibold"><ArrowLeft size={16} className="mr-1 inline" /> Back</Button>
            {step < 1 ? (
              <Button type="primary" size="large" onClick={proceedToMachineAllocation} className="rounded-sm px-6 font-bold shadow-md" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}>Next Step <ArrowRight size={16} className="ml-1 inline" /></Button>
            ) : (
              <Button type="primary" size="large" loading={submitting} onClick={handleSubmit} className="rounded-sm px-8 font-bold shadow-md" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}><CheckCircle size={18} className="mr-2 inline" /> Make Allocation</Button>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default NewFGProductionEntryPage;
