import React, { useEffect, useState } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, Modal, Input, Select, message, Switch } from 'antd';
import { PlusOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  TrendingUp,
  CheckCircle,
  FileText,
  Boxes,
  Warehouse,
  Scale,
  Calendar as CalendarIcon,
} from 'lucide-react';
import UnitSelect from '../../ui/Unitselect';
import { convertToBaseUOM } from '../../../hooks/unit';

const { Option } = Select;

interface CleaningMaterial {
  rawMaterialId: string;
  toWarehouseId: string;
  rawMaterial: {
    id: string;
    name: string;
    unitOfMeasurement: string;
    skuCode?: string;
  };
  toWarehouse: { id: string; name: string };
  netQuantity: number;
  availableQuantity: number;
  wastageQuantity: number;
  status: string;
  startedAt?: string;
  finishedAt?: string;
}

interface ProcessingJob {
  id: string;
  inputRawMaterialId: string;
  quantityInput: number;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  warehouse: { id: string; name: string };
  inputRawMaterial?: {
    skuCode: string;
    name: string;
    unitOfMeasurement: string;
  };
}

interface Warehouse {
  id: string;
  name: string;
}

const ProcessingList: React.FC = () => {
  const [cleaningJobs, setCleaningJobs] = useState<CleaningMaterial[]>([]);
  const [, setLoading] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [processingJobs, setProcessingJobs] = useState<
    Record<string, ProcessingJob[]>
  >({});
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [modal, setModal] = useState<{
    visible: boolean;
    job?: CleaningMaterial;
    quantity: number;
    unit?: string;
    warehouseId: string;
    loading: boolean;
  }>({
    visible: false,
    job: undefined,
    quantity: 0,
    unit: undefined,
    warehouseId: '',
    loading: false,
  });

  // Pencil edit modal state
  const [editStatusModal, setEditStatusModal] = useState<{
    visible: boolean;
    job?: ProcessingJob;
    byProductQuantity: number;
    unit?: string;
    reason: string;
    warehouseId: string;
    loading: boolean;
    isReusable?: boolean;
  }>({
    visible: false,
    job: undefined,
    byProductQuantity: 0,
    unit: undefined,
    reason: '',
    warehouseId: '',
    loading: false,
    isReusable: false,
  });

  // Fetch cleaned materials
  const fetchCleaningJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_CLEANED_MATERIALS, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      setCleaningJobs(res.data);
    } catch {
      setCleaningJobs([]);
      message.error('Failed to fetch cleaned jobs');
    }
    setLoading(false);
  };

  // Fetch warehouses
  const fetchWarehouses = async () => {
    try {
      const res = await api.get(API_ROUTES.RAW.GET_WAREHOUSES, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      setWarehouses(res.data);
    } catch {
      message.error('Failed to fetch warehouses');
    }
  };

  // Fetch processing jobs for a cleaned material
  const fetchProcessingJobs = async (
    rawMaterialId: string,
    toWarehouseId: string
  ) => {
    try {
      const res = await api.get(API_ROUTES.RAW.GET_PROCESSING_JOBS, {
        params: { inputRawMaterialId: rawMaterialId },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      setProcessingJobs((prev) => ({
        ...prev,
        [`${rawMaterialId}_${toWarehouseId}`]: res.data,
      }));
    } catch {
      message.error('Failed to fetch processing jobs');
    }
  };

  useEffect(() => {
    fetchCleaningJobs();
    fetchWarehouses();
  }, []);

  // Handle row expand/collapse
  const handleExpand = (expanded: boolean, record: CleaningMaterial) => {
    const rowKey = record.rawMaterialId + record.toWarehouseId;
    if (expanded) {
      setExpandedRowKeys([rowKey]);
      fetchProcessingJobs(record.rawMaterialId, record.toWarehouseId);
    } else {
      setExpandedRowKeys([]);
    }
  };

  // Open modal for initiating processing
  const openModal = (job: CleaningMaterial) => {
    setModal({
      visible: true,
      job,
      quantity: job.availableQuantity,
      unit: job.rawMaterial?.unitOfMeasurement,
      warehouseId: job.toWarehouse.id,
      loading: false,
    });
  };

  // Handle modal submit
  const handleSubmit = async () => {
    if (!modal.job) return;
    if (modal.quantity <= 0) {
      message.error('Quantity must be greater than 0');
      return;
    }
    if (!modal.warehouseId) {
      message.error('Select a warehouse');
      return;
    }
    setModal((prev) => ({ ...prev, loading: true }));
    try {
      await api.post(
        API_ROUTES.RAW.CREATE_PROCESSING_JOB,
        {
          inputRawMaterialId: modal.job.rawMaterial.id,
          quantityInput: modal.quantity,
          unit: modal.unit || modal.job.rawMaterial.unitOfMeasurement,
          startedAt: new Date().toISOString(),
          status: 'In-Progress',
          warehouseId: modal.warehouseId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      message.success('Processing job initiated');
      setModal({
        visible: false,
        job: undefined,
        quantity: 0,
        warehouseId: '',
        loading: false,
      } as any);
      fetchCleaningJobs();
      fetchProcessingJobs(modal.job.rawMaterial.id, modal.job.toWarehouse.id);
    } catch {
      message.error('Failed to initiate processing job');
      setModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Pencil edit: open modal
  const openEditStatusModal = (job: ProcessingJob) => {
    setEditStatusModal({
      visible: true,
      job,
      byProductQuantity: 0,
      unit: job.inputRawMaterial?.unitOfMeasurement,
      reason: '',
      warehouseId: job.warehouse?.id || '',
      loading: false,
    });
  };

  // Pencil edit: submit
  const handleEditStatusSubmit = async () => {
    if (!editStatusModal.job) return;
    if (
      !editStatusModal.byProductQuantity ||
      editStatusModal.byProductQuantity < 0
    ) {
      message.error('Enter by-product/semi-processed quantity');
      return;
    }
    if (!editStatusModal.reason) {
      message.error('Enter a reason');
      return;
    }
    if (!editStatusModal.warehouseId) {
      message.error('Select a warehouse');
      return;
    }
    setEditStatusModal((prev) => ({ ...prev, loading: true }));
    try {
      const byProducts = [
        {
          quantity: editStatusModal.byProductQuantity,
          unit:
            editStatusModal.unit ||
            editStatusModal.job?.inputRawMaterial?.unitOfMeasurement,
          reason: editStatusModal.reason,
          warehouseId: editStatusModal.warehouseId,
          skuCode: editStatusModal.job.inputRawMaterial?.skuCode || '',
          tag: 'Processing_Waste',
        },
      ];
      await api.put(
        API_ROUTES.RAW.UPDATE_PROCESSING_JOB(editStatusModal.job.id),
        {
          status: 'Finished',
          byProducts,
          finishedAt: new Date().toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      setProcessingJobs((prev) => {
        const rmKey = editStatusModal.job!.inputRawMaterialId;
        const updated = { ...prev };
        if (updated[rmKey]) {
          updated[rmKey] = updated[rmKey].map((j) =>
            j.id === editStatusModal.job!.id ? { ...j, status: 'Finished' } : j
          );
        }
        return updated;
      });
      setEditStatusModal({
        visible: false,
        job: undefined,
        byProductQuantity: 0,
        reason: '',
        warehouseId: '',
        loading: false,
      });
      message.success('Processing job marked as Finished');
    } catch {
      message.error('Failed to update status');
      setEditStatusModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Stats
  const unitOrder = ['g', 'kg', 'ton'];
  const allUnits = cleaningJobs
    .map((j) => j.rawMaterial?.unitOfMeasurement || '')
    .filter(Boolean);
  const highestUnit =
    unitOrder
      .slice()
      .reverse()
      .find((unit) => allUnits.includes(unit)) || '';

  const totalQuantity = cleaningJobs.reduce((sum, j) => {
    const unit = j.rawMaterial?.unitOfMeasurement || '';
    if (unit && highestUnit && unit !== highestUnit) {
      return sum + convertToBaseUOM(j.netQuantity, unit, highestUnit);
    }
    return sum + (j.netQuantity || 0);
  }, 0);
  const totalCleaned = cleaningJobs.length;

  const totalProcessingJobs = Object.values(processingJobs).flat().length;

  // Expanded row render: Processing jobs table
  const expandedRowRender = (record: CleaningMaterial) => {
    const jobs =
      processingJobs[`${record.rawMaterialId}_${record.toWarehouseId}`] || [];
    return (
      <div className="overflow-x-auto rounded-xl border border-border bg-card mt-2 p-2">
        <table className="min-w-full divide-y divide-border">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left w-32">
                Processing Job ID
              </th>
              <th className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left">
                Warehouse
              </th>
              <th className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
                Quantity
              </th>
              <th className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                Status
              </th>
              <th className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                Started At
              </th>
              <th className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                Finished At
              </th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-2 text-center text-muted-foreground italic"
                >
                  No processing jobs found.
                </td>
              </tr>
            )}
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-accent transition">
                <td className="px-2 py-2 text-xs font-mono text-foreground break-all w-32">
                  {job.id}
                </td>
                <td className="px-4 py-2 text-sm text-foreground">
                  {job.warehouse?.name || '-'}
                </td>
                <td className="px-4 py-2 text-sm text-foreground text-right">
                  <b>
                    {job.quantityInput}{' '}
                    {job.inputRawMaterial?.unitOfMeasurement || ''}
                  </b>
                </td>
                <td className="px-4 py-2 text-center">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-accent text-foreground border-border">
                    <FileText className="w-4 h-4 mr-1" />
                    {job.status}
                  </span>
                  {job.status !== 'Finished' && (
                    <Button
                      icon={<EditOutlined />}
                      size="small"
                      type="text"
                      style={{ marginLeft: 8 }}
                      onClick={() => openEditStatusModal(job)}
                    />
                  )}
                </td>
                <td className="px-4 py-2 text-center text-xs text-foreground">
                  {job.startedAt && !isNaN(Date.parse(job.startedAt))
                    ? new Date(job.startedAt).toLocaleString()
                    : '-'}
                </td>
                <td className="px-4 py-2 text-center text-xs text-foreground">
                  {job.finishedAt && !isNaN(Date.parse(job.finishedAt))
                    ? new Date(job.finishedAt).toLocaleString()
                    : '-'}
                </td>
                <td className="px-4 py-2 text-center">
                  {/* existing actions if any */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
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
              <div className="p-2 bg-primary rounded-xl">
                <Package className="text-primary-foreground" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Cleaned Raw Materials Ready for Processing
                </h1>
                <p className="text-muted-foreground text-sm">
                  View and initiate processing jobs for cleaned raw materials
                </p>
              </div>
              <div className="ml-auto flex gap-2">
                <Button
                  type="default"
                  icon={<ReloadOutlined />}
                  onClick={fetchCleaningJobs}
                  className="rounded-lg"
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>
          {/* Unified Stats + Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              {/* Stats Row */}
              <thead>
                <tr>
                  <th colSpan={8} className="p-0 border-b-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/50">
                      <div className="bg-card rounded-xl p-4 border border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Total Cleaned Jobs
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {totalCleaned}
                        </p>
                        <div className="flex items-center mt-1">
                          <TrendingUp size={12} className="text-primary mr-1" />
                          <span className="text-xs text-primary font-medium">
                            All records
                          </span>
                        </div>
                      </div>
                      <div className="bg-card rounded-xl p-4 border border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Total Quantity
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {totalQuantity} {highestUnit}
                        </p>
                        <div className="flex items-center mt-1">
                          <Scale size={12} className="text-foreground mr-1" />
                          <span className="text-xs text-foreground/80 font-medium">
                            Cleaned
                          </span>
                        </div>
                      </div>
                      <div className="bg-card rounded-xl p-4 border border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Processing Jobs
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {totalProcessingJobs}
                        </p>
                        <div className="flex items-center mt-1">
                          <Boxes size={12} className="text-foreground mr-1" />
                          <span className="text-xs text-foreground/80 font-medium">
                            Total jobs
                          </span>
                        </div>
                      </div>
                    </div>
                  </th>
                </tr>
                <tr className="bg-muted/50">
                  <th className="px-6 py-4"></th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="inline-flex items-center gap-2">
                      <Package className="w-3.5 h-3.5" />
                      Raw Material
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="inline-flex items-center gap-2">
                      <Warehouse className="w-3.5 h-3.5" />
                      To Warehouse
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="inline-flex items-center gap-2">
                      <Scale className="w-3.5 h-3.5" />
                      Quantity
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {cleaningJobs.map((record, index) => {
                  const rowKey = record.rawMaterialId + record.toWarehouseId;
                  return (
                    <React.Fragment key={rowKey}>
                      <motion.tr
                        className="hover:bg-muted/50 transition-colors duration-150"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <td className="px-2 py-4 whitespace-nowrap text-center">
                          <Button
                            type="text"
                            size="small"
                            icon={
                              expandedRowKeys.includes(rowKey) ? (
                                <ReloadOutlined />
                              ) : (
                                <PlusOutlined />
                              )
                            }
                            onClick={() =>
                              handleExpand(
                                !expandedRowKeys.includes(rowKey),
                                record
                              )
                            }
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {record.rawMaterial?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/80">
                          {record.toWarehouse?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          <b>
                            {record.availableQuantity}{' '}
                            {record.rawMaterial?.unitOfMeasurement || ''}
                          </b>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-primary/10 text-primary border-primary/20">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-left">
                          <Button
                            type="primary"
                            onClick={() => openModal(record)}
                            disabled={record.availableQuantity === 0}
                            className="rounded-lg"
                          >
                            Initiate Processing
                          </Button>
                        </td>
                      </motion.tr>
                      <AnimatePresence>
                        {expandedRowKeys.includes(rowKey) && (
                          <motion.tr
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-muted/50"
                          >
                            <td colSpan={8} className="px-10 py-4">
                              {expandedRowRender(record)}
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Modal for initiating processing */}
      <Modal
        open={modal.visible}
        title={
          <div>
            <span className="text-lg font-semibold text-foreground">
              Initiate Processing
            </span>
            <div className="text-xs text-muted-foreground mt-1">
              {modal.job?.rawMaterial?.name && (
                <>
                  Material: <b>{modal.job.rawMaterial.name}</b>
                </>
              )}
            </div>
          </div>
        }
        onCancel={() =>
          setModal({
            visible: false,
            job: undefined,
            quantity: 0,
            warehouseId: '',
            unit: undefined,
            loading: false,
          })
        }
        onOk={handleSubmit}
        confirmLoading={modal.loading}
        okText="Initiate"
        className="rounded-xl"
      >
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-1">Quantity</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              type="number"
              min={1}
              max={modal.job?.availableQuantity}
              value={modal.quantity}
              onChange={(e) =>
                setModal((prev) => ({
                  ...prev,
                  quantity: Number(e.target.value),
                }))
              }
              placeholder="Enter quantity"
              className="rounded"
              style={{ flex: 2 }}
            />
            <UnitSelect
              value={modal.unit}
              baseUnit={modal.job?.rawMaterial?.unitOfMeasurement}
              onChange={(val) =>
                setModal((prev) => ({
                  ...prev,
                  unit: String(val),
                }))
              }
            />
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Warehouse</div>
          <Select
            style={{ width: '100%' }}
            placeholder="Select warehouse"
            value={modal.warehouseId}
            onChange={(val) =>
              setModal((prev) => ({ ...prev, warehouseId: val }))
            }
            className="rounded"
          >
            {warehouses.map((w) => (
              <Option key={w.id} value={w.id}>
                {w.name}
              </Option>
            ))}
          </Select>
        </div>
      </Modal>

      {/* Modal for editing status (pencil) */}
      <Modal
        open={editStatusModal.visible}
        title="Finish Processing Job"
        onCancel={() =>
          setEditStatusModal({
            visible: false,
            job: undefined,
            byProductQuantity: 0,
            reason: '',
            warehouseId: '',
            loading: false,
          })
        }
        onOk={handleEditStatusSubmit}
        confirmLoading={editStatusModal.loading}
        okText="Finish"
        className="rounded-xl"
      >
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-1">
            By-Product/Semi-Processed Quantity
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              type="number"
              min={0}
              value={editStatusModal.byProductQuantity}
              onChange={(e) =>
                setEditStatusModal((prev) => ({
                  ...prev,
                  byProductQuantity: Number(e.target.value),
                }))
              }
              placeholder="Enter by-product/semi-processed quantity"
              className="rounded"
              style={{ flex: 2 }}
            />
            <UnitSelect
              value={editStatusModal.unit}
              baseUnit={
                editStatusModal.job?.inputRawMaterial?.unitOfMeasurement
              }
              onChange={(val) =>
                setEditStatusModal((prev) => ({
                  ...prev,
                  unit: String(val),
                }))
              }
            />
          </div>
        </div>
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-1">
            Is this by-product reusable?
          </div>
          <Switch
            checked={editStatusModal.isReusable}
            onChange={(checked) =>
              setEditStatusModal((prev) => ({ ...prev, isReusable: checked }))
            }
            checkedChildren="Yes"
            unCheckedChildren="No"
          />
        </div>
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-1">Reason</div>
          <Input
            value={editStatusModal.reason}
            onChange={(e) =>
              setEditStatusModal((prev) => ({
                ...prev,
                reason: e.target.value,
              }))
            }
            placeholder="Enter reason"
            className="rounded"
          />
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Warehouse</div>
          <Select
            style={{ width: '100%' }}
            placeholder="Select warehouse"
            value={editStatusModal.warehouseId}
            onChange={(val) =>
              setEditStatusModal((prev) => ({
                ...prev,
                warehouseId: val,
              }))
            }
            className="rounded"
          >
            {warehouses.map((w) => (
              <Option key={w.id} value={w.id}>
                {w.name}
              </Option>
            ))}
          </Select>
        </div>
      </Modal>
    </motion.div>
  );
};

export default ProcessingList;
