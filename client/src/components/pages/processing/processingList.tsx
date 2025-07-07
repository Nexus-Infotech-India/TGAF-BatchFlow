import React, { useEffect, useState } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, Modal, Input, Select, message } from 'antd';
import { PlusOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, TrendingUp, CheckCircle, FileText } from 'lucide-react';
import UnitSelect from '../../ui/Unitselect';
import { convertToBaseUOM } from '../../../hooks/unit';

const { Option } = Select;

interface CleaningMaterial {
  rawMaterialId: string;
  toWarehouseId: string;
  rawMaterial: { id: string; name: string; unitOfMeasurement: string };
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
  }>({
    visible: false,
    job: undefined,
    byProductQuantity: 0,
    unit: undefined,
    reason: '',
    warehouseId: '',
    loading: false,
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
 const fetchProcessingJobs = async (rawMaterialId: string, toWarehouseId: string) => {
  try {
    const res = await api.get(API_ROUTES.RAW.GET_PROCESSING_JOBS, {
      params: { inputRawMaterialId: rawMaterialId },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
    });
    // Store jobs with composite key
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
      });
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
      unit: job.inputRawMaterial?.unitOfMeasurement, // <-- set default unit
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
      // Prepare byProduct payload
      const byProducts = [
        {
          quantity: editStatusModal.byProductQuantity,
          unit:
            editStatusModal.unit ||
            editStatusModal.job?.inputRawMaterial?.unitOfMeasurement, // <-- send unit
          reason: editStatusModal.reason,
          warehouseId: editStatusModal.warehouseId,
          skuCode: editStatusModal.job.inputRawMaterial?.skuCode || '',
          tag: 'Processing_Waste',
        },
      ];
      // Update processing job status to Finished
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
      // Update status in UI immediately
      setProcessingJobs((prev) => {
        const rmId = editStatusModal.job!.inputRawMaterialId;
        const updated = { ...prev };
        if (updated[rmId]) {
          updated[rmId] = updated[rmId].map((j) =>
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
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow bg-white mt-2 p-2">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <th className="px-2 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wider text-left w-32">
                Processing Job ID
              </th>
              <th className="px-4 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wider text-left">
                Warehouse
              </th>
              <th className="px-4 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">
                Quantity
              </th>
              <th className="px-4 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center">
                Status
              </th>
              <th className="px-4 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center">
                Started At
              </th>
              <th className="px-4 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center">
                Finished At
              </th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-2 text-center text-gray-400 italic"
                >
                  No processing jobs found.
                </td>
              </tr>
            )}
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-blue-50 transition">
                <td className="px-2 py-2 text-xs font-mono text-gray-900 break-all w-32">
                  {job.id}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900">
                  {job.warehouse?.name || '-'}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 text-right">
                  <b>
                    {job.quantityInput}{' '}
                    {job.inputRawMaterial?.unitOfMeasurement || ''}
                  </b>
                </td>
                <td className="px-4 py-2 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200`}
                  >
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
                <td className="px-4 py-2 text-center text-xs text-gray-900">
                  {job.startedAt && !isNaN(Date.parse(job.startedAt))
                    ? new Date(job.startedAt).toLocaleString()
                    : '-'}
                </td>
                <td className="px-4 py-2 text-center text-xs text-gray-900">
                  {job.finishedAt && !isNaN(Date.parse(job.finishedAt))
                    ? new Date(job.finishedAt).toLocaleString()
                    : '-'}
                </td>
                <td className="px-4 py-2 text-center">
                  {/* Existing actions if any */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <motion.div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Package className="text-blue-600" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Cleaned Raw Materials Ready for Processing
                </h1>
                <p className="text-gray-600 text-sm mt-0.5">
                  View and initiate processing jobs for cleaned raw materials
                </p>
              </div>
              <div className="ml-auto flex gap-2">
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={fetchCleaningJobs}
                  className="shadow"
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>
          {/* Unified Stats + Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              {/* Stats Row */}
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <th colSpan={8} className="p-0 border-b-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs font-medium text-gray-600 mb-1">
                          Total Cleaned Jobs
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {totalCleaned}
                        </p>
                        <div className="flex items-center mt-1">
                          <TrendingUp
                            size={10}
                            className="text-blue-500 mr-1"
                          />
                          <span className="text-xs text-blue-600 font-medium">
                            All records
                          </span>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs font-medium text-gray-600 mb-1">
                          Total Quantity
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {totalQuantity} {highestUnit}
                        </p>
                        <div className="flex items-center mt-1">
                          <CheckCircle
                            size={10}
                            className="text-green-500 mr-1"
                          />
                          <span className="text-xs text-green-600 font-medium">
                            Cleaned
                          </span>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs font-medium text-gray-600 mb-1">
                          Processing Jobs
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {totalProcessingJobs}
                        </p>
                        <div className="flex items-center mt-1">
                          <FileText
                            size={10}
                            className="text-purple-500 mr-1"
                          />
                          <span className="text-xs text-purple-600 font-medium">
                            Total jobs
                          </span>
                        </div>
                      </div>
                    </div>
                  </th>
                </tr>
                <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <th className="px-6 py-4"></th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Raw Material
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    To Warehouse
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Quantity
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cleaningJobs.map((record, index) => {
                  const rowKey = record.rawMaterialId + record.toWarehouseId;
                  return (
                    <React.Fragment key={rowKey}>
                      <motion.tr
                        className="hover:bg-gray-50 transition-colors duration-150"
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {record.rawMaterial?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {record.toWarehouse?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <b>
                            {record.availableQuantity}{' '}
                            {record.rawMaterial?.unitOfMeasurement || ''}
                          </b>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-left">
                          <Button
                            type="primary"
                            onClick={() => openModal(record)}
                            disabled={record.availableQuantity === 0}
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
                            className="bg-gray-50"
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
            <span className="text-lg font-semibold text-blue-700">
              Initiate Processing
            </span>
            <div className="text-xs text-gray-500 mt-1">
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
          <div className="text-xs text-gray-500 mb-1">Quantity</div>
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
          <div className="text-xs text-gray-500 mb-1">Warehouse</div>
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
          <div className="text-xs text-gray-500 mb-1">
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
          <div className="text-xs text-gray-500 mb-1">Reason</div>
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
          <div className="text-xs text-gray-500 mb-1">Warehouse</div>
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
