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
  Plus,
  Trash2,
  ClipboardList,
  Target,
  Scale,
  Sparkles,
  Boxes,
  Cog,
  Settings,
  Gauge,
  Users,
  Activity
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

const UNIT_OPTIONS = ['KG', 'Ton', 'gram', 'Boxes', 'Pcs', 'Bags'].map(u => ({ value: u, label: u }));
const LAMINATE_UNIT_OPTIONS = ['KG', 'Ton', 'gram'].map(u => ({ value: u, label: u }));

const NewFGProductionEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // General State
  const [locations, setLocations] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
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

  // Step 2: Auto allocation
  const [allocations, setAllocations] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
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

  /* ─── Trigger BOM fetch when inputs change ─── */
  useEffect(() => {
    if (selectedBomId && productionQty && productionQty > 0 && selectedLocationId) {
      fetchBomItems(selectedBomId, productionQty, productionUnit, selectedLocationId);
    } else {
      setConsumptionLines([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBomId, productionQty, productionUnit, selectedLocationId]);

  /* ─── Helper: Get last product for a given machine ─── */
  const getLastProductForMachine = (machineId: string): string => {
    for (const entry of previousEntries) {
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

  /* ─── Helper: Get SFG consumption info ─── */
  const getSfgConsumptionInfo = (): { transferNumbers: string[] } => {
    const transferNumbers: string[] = [];
    for (const transfer of sfgTransfers) {
      if (!transferNumbers.includes(transfer.transferNumber)) {
        transferNumbers.push(transfer.transferNumber);
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

  const getLaminateAvailable = () => {
     const laminateStock = consumptionLines.find(
         (line) => !line.isSFG && line.rawMaterialName?.toLowerCase().includes('laminate')
     ) || consumptionLines.find((line) => !line.isSFG);
     return {
        qty: laminateStock?.currentStockQty || 0,
        unit: laminateStock?.currentStockUnit || 'KG'
     };
  };

  /* ─── Packaging Transfer helpers ─── */
  const getPkgConsumptionInfo = (): { transferNumbers: string[] } => {
    const transferNumbers: string[] = [];
    for (const transfer of pkgTransfers) {
      if (!transferNumbers.includes(transfer.transferNumber)) {
        transferNumbers.push(transfer.transferNumber);
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

  const getPkgOptionsForRow = (currentIndex: number) => {
     return getPkgConsumptionInfo().transferNumbers.filter(t => {
        if (allocations[currentIndex]?.pkgTransferNumber === t) return true;

        // Require backend confirmation that the packaging batch is still available
        // (i.e. prior saved FG batches haven't fully consumed it). The backend only
        // populates availableSfgBatches on packaging lines with remainingQuantity > 0.
        const batch = findPkgBatchByTransfer(t);
        if (!batch || (batch.remainingQuantity || 0) <= 0) return false;

        // Allow splitting a packaging batch across multiple machine rows: only hide
        // once the sum of qty allocated in other rows equals/exceeds the backend
        // remaining qty (fully exhausted within this form).
        const availGrams = toGrams(batch.remainingQuantity || 0, batch.unit || 'KG');
        let usedGrams = 0;
        allocations.forEach((alloc, i) => {
           if (i !== currentIndex && alloc.pkgTransferNumber === t) {
             usedGrams += toGrams(alloc.laminateConsumptionQty || 0, alloc.laminateConsumptionUnit || 'KG');
           }
        });
        return (availGrams - usedGrams) > 0;
     }).map(t => {
        const info = getPkgTransferAvailable(t);
        return { value: t, label: `${t} — ${info.productName || 'Packaging'}` };
     });
  };

  const getRemainingPkgTransferForRow = (transferNumber: string, currentIndex: number) => {
      if (!transferNumber) return { qty: 0, unit: 'KG' };
      const avail = getPkgTransferAvailable(transferNumber);
      const availGrams = toGrams(avail.qty, avail.unit);
      let usedGrams = 0;
      allocations.forEach((alloc, i) => {
         if (i !== currentIndex && alloc.pkgTransferNumber === transferNumber) {
             usedGrams += toGrams(alloc.laminateConsumptionQty || 0, alloc.laminateConsumptionUnit || 'KG');
         }
      });
      const remGrams = Math.max(0, availGrams - usedGrams);
      return { qty: remGrams / 1000, unit: 'KG' };
  };

  /* ─── Create a blank allocation for a machine ─── */
  const createBlankAllocation = (machine: any) => {
    const lastProduct = getLastProductForMachine(machine.id);
    const selectedBom = boms.find(b => b.id === selectedBomId);
    
    const laminateLine = consumptionLines.find(
      (line) => !line.isSFG && line.rawMaterialName?.toLowerCase().includes('laminate')
    ) || consumptionLines.find((line) => !line.isSFG);

    return {
      machineId: machine.id,
      machine,
      allocatedQty: null as any,
      allocatedUnit: productionUnit,
      productName: selectedBom?.productName || lastProduct || '',
      instulationCapacity: machine.capacityQty || 0,
      instulationCapacityUnit: machine.capacityUnit === 'BOXES_PER_SHIFT' ? 'Boxes/Shift' : machine.capacityUnit,
      laminateConsumptionQty: null as any,
      laminateConsumptionUnit: laminateLine?.unit || 'KG',
      pkgTransferNumber: null as any,
      sfgConsumptionQty: null as any,
      sfgConsumptionUnit: 'KG', // Fixed to KG
      sfgTransferNumber: null as any,
      manPower: true,
      notes: '',
    };
  };

  /* ─── Initialize Allocations (1 machine initially) ─── */
  const initializeAllocations = () => {
    if (!productionQty || machines.length === 0) return;

    // Filter machines by selected location
    const locationName = locations.find(l => l.id === selectedLocationId)?.name || '';
    const availableMachines = machines.filter(m => m.location === locationName || !m.location);
    const mList = availableMachines.length > 0 ? availableMachines : machines;

    if (mList.length > 0) {
      setAllocations([createBlankAllocation(mList[0])]);
    } else {
      setAllocations([]);
    }
  };

  const addMachine = () => {
    const locationName = locations.find(l => l.id === selectedLocationId)?.name || '';
    const availableMachines = machines.filter(m => m.location === locationName || !m.location);
    const mList = availableMachines.length > 0 ? availableMachines : machines;
    
    // Auto-select the next available machine if possible
    const usedIds = allocations.map(a => a.machineId);
    let nextMachine = mList.find(m => !usedIds.includes(m.id));
    if (!nextMachine && mList.length > 0) nextMachine = mList[0];

    if (nextMachine) {
      setAllocations(prev => [...prev, createBlankAllocation(nextMachine)]);
    }
  };

  const removeMachine = (index: number) => {
    setAllocations(prev => prev.filter((_, i) => i !== index));
  };

  const updateAllocationField = (index: number, field: string, value: any) => {
    setAllocations((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };

      // Update machine dependent details if machine changed
      if (field === 'machineId') {
        const m = machines.find(mac => mac.id === value);
        if (m) {
          next[index].machine = m;
          next[index].instulationCapacity = m.capacityQty || 0;
          next[index].instulationCapacityUnit = m.capacityUnit === 'BOXES_PER_SHIFT' ? 'Boxes/Shift' : m.capacityUnit;
          next[index].productName = boms.find(b => b.id === selectedBomId)?.productName || getLastProductForMachine(m.id) || '';
        }
      }

      return next;
    });
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

    initializeAllocations();
    setStep(1);
  };

  /* ─── Submit (Creates both Batch & Entry) ─── */
  const handleSubmit = async () => {
    const activeAllocations = allocations.filter(a => (Number(a.sfgConsumptionQty) || 0) > 0 || a.sfgTransferNumber);
    const totalAllocatedGrams = activeAllocations.reduce((s, a) => s + toGrams(Number(a.sfgConsumptionQty) || 0, 'KG'), 0);
    
    if (totalAllocatedGrams <= 0) {
      message.error('Please assign production to at least one machine by entering SFG Consumption quantity.');
      return;
    }

    // Validate unique machines
    const usedMachineIds = new Set();
    for (const a of activeAllocations) {
       if (!a.machineId) continue;
       if (usedMachineIds.has(a.machineId)) {
          message.error(`Machine ${a.machine?.machineId || a.machine?.name} is selected multiple times.`);
          return;
       }
       usedMachineIds.add(a.machineId);
    }

    // Build consumption payload directly from what machine rows have
    const payloadConsumptions: any[] = [];

    // 1) Non-SFG, non-Packaging items (general stock from other warehouses)
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

    // 2) Packaging lines — group by PKG transfer number from machine rows so the
    //    backend can correctly decrement remaining qty on future production entries.
    //    Each (packaging material, transfer number) pair gets its own consumption
    //    record with sourceType: 'PKG_TRANSFER'.
    const packagingLines = consumptionLines.filter(c => c.isPackaging);
    for (const pkgLine of packagingLines) {
       const pkgByTransfer: Record<string, number> = {};
       for (const a of activeAllocations) {
          const trf = a.pkgTransferNumber;
          const qtyGrams = toGrams(Number(a.laminateConsumptionQty) || 0, a.laminateConsumptionUnit || 'KG');
          if (trf && qtyGrams > 0) {
             pkgByTransfer[trf] = (pkgByTransfer[trf] || 0) + qtyGrams;
          }
       }

       const unitFactor = UNIT_TO_GRAMS[pkgLine.unit] ?? UNIT_TO_GRAMS[pkgLine.unit?.toLowerCase()] ?? 1000;
       for (const [trf, totalGrams] of Object.entries(pkgByTransfer)) {
          const qtyInBomUnit = unitFactor > 0 ? totalGrams / unitFactor : 0;
          if (qtyInBomUnit > 0) {
             payloadConsumptions.push({
                rawMaterialId: pkgLine.rawMaterialId,
                rawMaterialName: pkgLine.rawMaterialName,
                expectedQuantity: pkgLine.expectedQuantity,
                actualQuantity: qtyInBomUnit,
                unit: pkgLine.unit,
                sourceType: 'PKG_TRANSFER',
                batchNumber: trf,
                dispatchId: '',
             });
          }
       }
    }

    // 3) SFG lines — group by transfer number from machine rows
    const sfgLine = consumptionLines.find(c => c.isSFG);
    if (sfgLine) {
       // Group SFG consumption by transfer number
       const sfgByTransfer: Record<string, number> = {};
       for (const a of activeAllocations) {
          const trf = a.sfgTransferNumber;
          const qty = Number(a.sfgConsumptionQty) || 0;
          if (trf && qty > 0) {
             sfgByTransfer[trf] = (sfgByTransfer[trf] || 0) + qty;
          }
       }

       for (const [trf, totalKg] of Object.entries(sfgByTransfer)) {
          payloadConsumptions.push({
             rawMaterialId: sfgLine.rawMaterialId,
             rawMaterialName: sfgLine.rawMaterialName,
             expectedQuantity: sfgLine.expectedQuantity,
             actualQuantity: totalKg, 
             unit: 'KG',
             sourceType: 'SFG_BATCH',
             batchNumber: trf,
             dispatchId: '',
          });
       }

       // If no SFG transfers were selected but user entered SFG qty, use the first available transfer
       if (Object.keys(sfgByTransfer).length === 0) {
          const totalSfgKg = activeAllocations.reduce((s, a) => s + (Number(a.sfgConsumptionQty) || 0), 0);
          if (totalSfgKg > 0) {
             const firstTransfer = sfgLine.batchNumber || sfgTransfers[0]?.transferNumber;
             if (firstTransfer) {
                payloadConsumptions.push({
                   rawMaterialId: sfgLine.rawMaterialId,
                   rawMaterialName: sfgLine.rawMaterialName,
                   expectedQuantity: sfgLine.expectedQuantity,
                   actualQuantity: totalSfgKg, 
                   unit: 'KG',
                   sourceType: 'SFG_BATCH',
                   batchNumber: firstTransfer,
                   dispatchId: sfgLine.dispatchId || '',
                });
             } else {
                message.error('No SFG Transfer batch selected. Please select an SFG Transfer for each machine.');
                return;
             }
          }
       }
    }

    if (payloadConsumptions.length === 0) {
       message.error('No consumption data to submit. Please ensure materials are configured.');
       return;
    }

    setSubmitting(true);
    try {
      // 1. Create FG Batch First
      const batchRes = await api.post(API_ROUTES.RAW.CREATE_FG_BATCH, {
        bomId: selectedBomId,
        productionQty,
        productionUnit,
        notes: "Auto-created from Production Entry Flow",
        consumptions: payloadConsumptions,
      });
      
      const newBatchId = batchRes.data?.data?.id;

      // 2. Accept the Batch instantly (so it can be used for production)
      await api.put(API_ROUTES.RAW.ACCEPT_FG_BATCH(newBatchId));

      // 3. Create FG Production Entry
      const payloadAllocations = activeAllocations.filter(a => (Number(a.sfgConsumptionQty) || 0) > 0);
      await api.post(API_ROUTES.RAW.CREATE_FG_PRODUCTION_ENTRY, {
        fgBatchId: newBatchId,
        notes,
        machineEntries: payloadAllocations.map((a) => ({
          machineId: a.machine.id,
          allocatedQty: a.sfgConsumptionQty || 0,
          productName: a.productName,
          instulationCapacity: a.instulationCapacity,
          instulationCapacityUnit: a.instulationCapacityUnit,
          laminateConsumptionQty: a.laminateConsumptionQty || 0,
          laminateConsumptionUnit: a.laminateConsumptionUnit,
          sfgConsumptionQty: a.sfgConsumptionQty,
          sfgConsumptionUnit: a.sfgConsumptionUnit,
          manPower: a.manPower,
          notes: (a.sfgTransferNumber ? `SFG Transfer: ${a.sfgTransferNumber}` : '') + (a.sfgTransferNumber && a.notes ? ` | ` : '') + (a.notes || ''),
        })),
      });

      message.success('Production Entry and Allocations created successfully!');
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

  const getSfgOptionsForRow = (currentIndex: number) => {
     return getSfgConsumptionInfo().transferNumbers.filter(t => {
        // If it's the currently selected one for this row, always show it
        if (allocations[currentIndex]?.sfgTransferNumber === t) return true;

        // Require backend confirmation that the batch is still available (i.e.
        // prior saved FG batches haven't fully consumed it). The backend only
        // populates availableSfgBatches for batches with remainingQuantity > 0.
        const batch = findSfgBatchByTransfer(t);
        if (!batch || (batch.remainingQuantity || 0) <= 0) return false;

        // Allow splitting a batch across multiple machine rows: only hide the
        // batch once the sum of qty allocated in other rows equals/exceeds the
        // backend remaining qty (fully exhausted in this form).
        const availGrams = toGrams(batch.remainingQuantity || 0, batch.unit || 'KG');
        let usedGrams = 0;
        allocations.forEach((alloc, i) => {
           if (i !== currentIndex && alloc.sfgTransferNumber === t) {
             usedGrams += toGrams(alloc.sfgConsumptionQty || 0, alloc.sfgConsumptionUnit || 'KG');
           }
        });
        return (availGrams - usedGrams) > 0;
     }).map(t => ({ value: t, label: t }));
  };

  const getRemainingSfgTransferForRow = (transferNumber: string, currentIndex: number) => {
      if (!transferNumber) return { qty: 0, unit: 'KG' };
      const avail = getSfgTransferAvailable(transferNumber);
      const availGrams = toGrams(avail.qty, avail.unit);
      let usedGrams = 0;
      allocations.forEach((alloc, i) => {
         if (i !== currentIndex && alloc.sfgTransferNumber === transferNumber) {
             usedGrams += toGrams(alloc.sfgConsumptionQty || 0, alloc.sfgConsumptionUnit || 'KG');
         }
      });
      const remGrams = Math.max(0, availGrams - usedGrams);
      // Convert back to KG
      return { qty: remGrams / 1000, unit: 'KG' };
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

                {/* Loading Indicator for Quantity Calculation */}
                {loadingItems && (
                   <div className="mt-8 flex flex-col justify-center items-center py-8 border border-dashed border-emerald-300 rounded-md bg-gradient-to-br from-emerald-50/40 to-teal-50/30">
                      <div className="relative w-12 h-12 mb-3">
                        <div className="absolute inset-0 rounded-full border-[3px] border-emerald-200" />
                        <div className="absolute inset-0 rounded-full border-[3px] border-emerald-500 border-t-transparent animate-spin" />
                        <Boxes size={16} className="absolute inset-0 m-auto text-emerald-600" />
                      </div>
                      <p className="text-sm font-semibold text-emerald-700 animate-pulse">Calculating material requirements and available stock...</p>
                   </div>
                )}

                {/* Empty State */}
                {!loadingItems && consumptionLines.length === 0 && (
                  <div className="mt-6 flex flex-col items-center justify-center py-10 border border-dashed border-border rounded-md bg-muted/10">
                    <div className="p-3 rounded-full bg-muted/40 mb-3">
                      <Package size={28} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">No materials calculated yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Fill in all three fields above to see material requirements</p>
                  </div>
                )}

                {/* Items Required Suggestion */}
                {!loadingItems && consumptionLines.length > 0 && (
                   <div className="mt-6">
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
                                  // Sum remaining quantity across ALL accepted SFG transfers for this material
                                  // at the selected FG Packaging location — not just the first batch.
                                  const totalSfgAvailable = (line.availableSfgBatches || []).reduce(
                                     (sum: number, b: any) => sum + (b.remainingQuantity || 0),
                                     0
                                  );
                                  const sfgUnit = line.availableSfgBatches?.[0]?.unit || line.unit;
                                  const sfgBatchCount = line.availableSfgBatches?.length || 0;
                                  return (
                                  <tr key={idx} className="hover:bg-muted/30">
                                     <td className="px-4 py-3 font-semibold text-sm">{line.rawMaterialName}</td>
                                     <td className="px-4 py-3 text-center">
                                       {line.isSFG ? <Truck size={14} className="inline text-violet-500 mr-1"/> : <Database size={14} className="inline text-blue-500 mr-1"/>}
                                       <span className="text-xs font-bold">{line.isSFG ? 'SFG TRANSFER' : 'STOCK'}</span>
                                     </td>
                                     <td className="px-4 py-3 text-right font-bold text-amber-600">{line.expectedQuantity} {line.unit}</td>
                                     <td className="px-4 py-3 text-right">
                                        {line.isSFG ? (
                                           sfgBatchCount > 0 ? (
                                              <div className="flex flex-col items-end">
                                                 <span className={totalSfgAvailable >= line.expectedQuantity ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                                                    {Number(totalSfgAvailable.toFixed(3)).toLocaleString()} {sfgUnit}
                                                 </span>
                                                 <span className="text-[10px] text-muted-foreground">
                                                    across {sfgBatchCount} transfer{sfgBatchCount > 1 ? 's' : ''}
                                                 </span>
                                              </div>
                                           ) : (
                                              <span className="text-red-500 font-bold text-xs">No Transfer Available</span>
                                           )
                                        ) : (
                                           <span className={line.currentStockQty >= line.expectedQuantity ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                                              {line.currentStockQty.toLocaleString()} {line.currentStockUnit}
                                           </span>
                                        )}
                                     </td>
                                  </tr>
                                  );
                               })}
                            </tbody>
                         </table>
                      </div>
                   </div>
                )}
                
              </motion.div>
            )}

            {/* STEP 2: Machine Assignment - Row Layout */}
            {step === 1 && (
              <motion.div key="step-1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-6 md:p-8 space-y-4">
                {/* Animated Section Header */}
                <div className="relative overflow-hidden rounded-md border border-blue-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-violet-50/60 p-5 shadow-sm">
                  {/* Decorative animated background cogs */}
                  <motion.div
                    className="absolute -right-8 -top-8 text-blue-200/40"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  >
                    <Cog size={140} strokeWidth={1.2} />
                  </motion.div>
                  <motion.div
                    className="absolute -left-6 -bottom-10 text-indigo-200/40"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
                  >
                    <Settings size={110} strokeWidth={1.2} />
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
                        Machine Assignment & Allocation
                      </h2>
                      <p className="text-sm text-muted-foreground mt-0.5">Add machines and assign production quantities</p>
                    </div>

                    {/* Live stats pill */}
                    <div className="hidden md:flex items-center gap-3">
                      <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-white/80 backdrop-blur px-3 py-2 shadow-sm">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        >
                          <Cog size={14} className="text-blue-600" />
                        </motion.div>
                        <span className="text-xs font-bold text-blue-700">{allocations.length} Machine{allocations.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-white/80 backdrop-blur px-3 py-2 shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-700">
                          {allocations.filter(a => a.machineId).length} Configured
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table Header */}
                <div className="w-full overflow-x-auto pb-4">
                   <div className="min-w-[1100px] border border-border rounded-md bg-gradient-to-br from-slate-50/30 via-card to-blue-50/20 shadow-sm">
                     {/* Headings */}
                     <div className="grid grid-cols-12 gap-3 p-3 bg-gradient-to-r from-blue-50 via-indigo-50/60 to-violet-50/60 border-b border-border items-center">
                        <div className="text-[10px] font-bold text-indigo-700 uppercase col-span-2 flex items-center gap-1"><Factory size={11} /> Machine Details</div>
                        <div className="text-[10px] font-bold text-violet-700 uppercase col-span-2 flex items-center gap-1"><Users size={11} /> Man Power & Status</div>
                        <div className="text-[10px] font-bold text-emerald-600 uppercase col-span-3 flex items-center gap-1"><Truck size={11} /> SFG Consumption & TRF #</div>
                        <div className="text-[10px] font-bold text-blue-600 uppercase col-span-2 flex items-center gap-1"><Package size={11} /> Packaging Consumption</div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase col-span-2">Row Notes</div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase col-span-1 text-center">Action</div>
                     </div>

                     {/* Rows */}
                     <div className="divide-y divide-border">
                        {allocations.map((alloc, idx) => {
                          const isActive = !!alloc.machineId;
                          const isRunning = isActive && alloc.manPower && (alloc.sfgConsumptionQty > 0 || alloc.laminateConsumptionQty > 0);
                          return (
                           <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.04 }}
                              className={`relative grid grid-cols-12 gap-3 p-3 items-start transition-all ${isRunning ? 'bg-gradient-to-r from-emerald-50/30 via-card to-blue-50/20' : isActive ? 'bg-gradient-to-r from-blue-50/20 to-transparent' : 'bg-card'} hover:shadow-inner`}
                           >
                              {/* Row Index Badge */}
                              <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-sm overflow-hidden">
                                <div className={`h-full w-full ${isRunning ? 'bg-gradient-to-b from-emerald-400 to-emerald-600' : isActive ? 'bg-gradient-to-b from-blue-400 to-indigo-500' : 'bg-muted'}`} />
                              </div>

                              {/* Machine Selection (Col 1-2) */}
                              <div className="col-span-2 space-y-2 pl-1">
                                <div className="relative">
                                  <Select
                                    className="w-full font-bold [&_.ant-select-selector]:rounded-sm"
                                    value={alloc.machineId || undefined}
                                    onChange={v => updateAllocationField(idx, 'machineId', v)}
                                    options={machines.map(m => ({ value: m.id, label: m.name }))}
                                    placeholder="Select Machine"
                                  />
                                  {/* Animated machine indicator */}
                                  <div className="absolute -left-2 -top-2 z-10">
                                    <motion.div
                                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 shadow-md ${isRunning ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 border-white' : isActive ? 'bg-gradient-to-br from-blue-400 to-indigo-600 border-white' : 'bg-muted border-border'}`}
                                      animate={isRunning ? { scale: [1, 1.08, 1] } : {}}
                                      transition={isRunning ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : {}}
                                    >
                                      <motion.div
                                        animate={isActive ? { rotate: 360 } : {}}
                                        transition={isActive ? { duration: isRunning ? 3 : 6, repeat: Infinity, ease: 'linear' } : {}}
                                      >
                                        <Cog size={12} className="text-white" />
                                      </motion.div>
                                    </motion.div>
                                  </div>
                                </div>
                                {alloc.machine && (
                                   <motion.div
                                     initial={{ opacity: 0, height: 0 }}
                                     animate={{ opacity: 1, height: 'auto' }}
                                     className="text-xs text-muted-foreground bg-gradient-to-br from-slate-50 to-blue-50/50 p-2 rounded-sm border border-blue-100 shadow-sm"
                                   >
                                      <div className="flex justify-between items-center"><span className="opacity-70 flex items-center gap-1"><Factory size={9} /> M/C No:</span> <span className="font-mono font-bold text-blue-700">{alloc.machine.machineId}</span></div>
                                      <div className="flex justify-between items-center"><span className="opacity-70 flex items-center gap-1"><Gauge size={9} /> Speed:</span> <span className="font-semibold">{alloc.machine.machineSpeed || 'N/A'}</span></div>
                                      <div className="flex justify-between items-center"><span className="opacity-70 flex items-center gap-1"><Boxes size={9} /> Capacity:</span> <span className="font-semibold">{alloc.instulationCapacity} {getCapacityLabel(alloc.machine.capacityUnit)}</span></div>
                                   </motion.div>
                                )}
                              </div>

                              {/* Man Power (Col 3-4) */}
                              <div className="col-span-2 space-y-2 flex flex-col justify-start">
                                 <div className={`p-2 border rounded-sm flex items-center justify-between transition-all ${alloc.manPower ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-50 to-emerald-50/30 shadow-sm' : 'border-red-500/30 bg-gradient-to-r from-red-50 to-red-50/30'}`}>
                                    <div className="flex items-center gap-1.5">
                                      <motion.div
                                        animate={alloc.manPower ? { scale: [1, 1.15, 1] } : {}}
                                        transition={alloc.manPower ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : {}}
                                      >
                                        <Users size={12} className={alloc.manPower ? 'text-emerald-700' : 'text-red-700'} />
                                      </motion.div>
                                      <span className={`text-[11px] font-bold ${alloc.manPower ? 'text-emerald-700' : 'text-red-700'}`}>Man Power</span>
                                    </div>
                                    <Switch size="small" checked={alloc.manPower} onChange={c => updateAllocationField(idx, 'manPower', c)} />
                                 </div>
                                 {/* Status badge */}
                                 <div className={`flex items-center gap-1.5 px-2 py-1 rounded-sm border text-[10px] font-bold ${isRunning ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-300 text-emerald-800' : isActive ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200 text-blue-800' : 'bg-muted/30 border-border text-muted-foreground'}`}>
                                    <Activity size={10} className={isRunning ? 'animate-pulse' : ''} />
                                    <span>{isRunning ? 'RUNNING' : isActive ? 'CONFIGURED' : 'IDLE'}</span>
                                 </div>
                                 <div className="text-[10px] font-bold text-violet-700 opacity-90 truncate bg-gradient-to-r from-violet-50 to-violet-100/30 p-1.5 rounded-sm border border-violet-100" title={alloc.productName}>
                                    Product: {alloc.productName || 'N/A'}
                                 </div>
                              </div>

                              {/* SFG Consumption (Col 5-7) */}
                              <div className="col-span-3 space-y-2">
                                 <Select
                                   placeholder="Select TRF #"
                                   value={alloc.sfgTransferNumber || undefined}
                                   onChange={v => updateAllocationField(idx, 'sfgTransferNumber', v)}
                                   options={getSfgOptionsForRow(idx)}
                                   className="w-full text-xs [&_.ant-select-selector]:rounded-sm font-semibold"
                                   allowClear
                                 />
                                 <div className="flex gap-1">
                                    <InputNumber 
                                     min={0} precision={3} 
                                     value={alloc.sfgConsumptionQty} 
                                     onChange={v => updateAllocationField(idx, 'sfgConsumptionQty', v)} 
                                     className="w-full font-semibold [&_.ant-input-number-input]:rounded-sm border-emerald-500/50" 
                                     placeholder="Allocate Qty" 
                                    />
                                    <div className="flex items-center justify-center font-bold text-muted-foreground text-xs bg-muted px-3 rounded-sm border border-border">
                                       KG
                                    </div>
                                 </div>
                                 <div className="text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-sm border border-border mt-1">
                                     Available: <span className="font-bold text-emerald-600">{getRemainingSfgTransferForRow(alloc.sfgTransferNumber, idx).qty} {getRemainingSfgTransferForRow(alloc.sfgTransferNumber, idx).unit}</span>
                                 </div>
                              </div>

                              {/* Laminate / Packaging Consumption (Col 8-9) */}
                              <div className="col-span-2 space-y-2">
                                <Select
                                  placeholder="Select PKG TRF #"
                                  value={alloc.pkgTransferNumber || undefined}
                                  onChange={v => updateAllocationField(idx, 'pkgTransferNumber', v)}
                                  options={getPkgOptionsForRow(idx)}
                                  className="w-full text-xs [&_.ant-select-selector]:rounded-sm font-semibold"
                                  allowClear
                                />
                                <div className="flex gap-1 h-[32px]">
                                  <InputNumber 
                                    min={0} precision={3} 
                                    value={alloc.laminateConsumptionQty} 
                                    onChange={v => updateAllocationField(idx, 'laminateConsumptionQty', v)} 
                                    className="w-full font-semibold [&_.ant-input-number-input]:rounded-sm" 
                                    placeholder="Qty" 
                                  />
                                  <Select
                                    value={alloc.laminateConsumptionUnit}
                                    onChange={v => updateAllocationField(idx, 'laminateConsumptionUnit', v)}
                                    options={LAMINATE_UNIT_OPTIONS}
                                    className="w-[75px] shrink-0 [&_.ant-select-selector]:rounded-sm font-semibold"
                                  />
                                </div>
                                <div className="text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-sm border border-border mt-1">
                                    Available: <span className="font-bold text-blue-600">{getRemainingPkgTransferForRow(alloc.pkgTransferNumber, idx).qty} {getRemainingPkgTransferForRow(alloc.pkgTransferNumber, idx).unit}</span>
                                </div>
                              </div>

                              {/* Row Notes (Col 10-11) */}
                              <div className="col-span-2">
                                 <Input.TextArea size="small" placeholder="Row notes..." value={alloc.notes} onChange={e => updateAllocationField(idx, 'notes', e.target.value)} className="text-xs min-h-[64px] rounded-sm" />
                              </div>

                              {/* Action (Col 12) */}
                              <div className="col-span-1 flex justify-center items-center h-full pt-1">
                                 <Button danger type="text" onClick={() => removeMachine(idx)} disabled={allocations.length === 1} icon={<Trash2 size={16} />} className="rounded-sm hover:bg-red-50" />
                              </div>
                           </motion.div>
                          );
                        })}
                     </div>
                   </div>
                </div>

                <Button type="dashed" onClick={addMachine} icon={<Plus size={16} />} className="group w-full h-12 rounded-md border-2 border-dashed border-blue-200 bg-gradient-to-r from-blue-50/30 via-indigo-50/20 to-violet-50/30 text-blue-600 font-bold hover:border-blue-500 hover:text-blue-700 hover:shadow-md transition-all">
                   Add Machine Row
                </Button>

                <div className="space-y-2 mt-6 border-t border-border pt-4">
                  <label className="text-sm font-bold text-foreground">Global Notes (optional)</label>
                  <Input.TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="General supervisor notes..." className="rounded-sm" />
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
