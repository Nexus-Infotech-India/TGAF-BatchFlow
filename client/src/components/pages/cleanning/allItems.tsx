import React, { ReactNode, useEffect, useState } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { Button, Modal, Input, Select, message, Switch } from 'antd';
import { EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  TrendingUp,
  CheckCircle,
  FileText,
  XCircle,
  Warehouse,
  Scale,
  Layers,
} from 'lucide-react';
import { convertToBaseUOM } from '../../../hooks/unit';
import UnitSelect from '../../ui/Unitselect';

const { Option } = Select;

interface StockItem {
  unitOfMeasurement: ReactNode;
  rawMaterialId: string;
  materialName: string;
  warehouseId: string;
  warehouseName: string;
  currentQuantity: number;
  lastUpdated: string;
}

interface CleaningJob {
  id: string;
  rawMaterialId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  status: string;
  startedAt?: string;
  finishedAt?: string;
  toWarehouse: { name: string };
  fromWarehouse: { name: string };
  rawMaterial: {
    id: string;
    skuCode: string;
    name: string;
    category: string;
    unitOfMeasurement: string;
    minReorderLevel: number;
    createdAt: string;
    updatedAt: string;
    vendorId: string | null;
  };
}

interface WarehouseT {
  id: string;
  name: string;
}

const statusColors: Record<string, string> = {
  Cleaned: 'bg-primary/10 text-primary border-primary/20',
  Sent: 'bg-accent text-foreground border-border',
  Pending: 'bg-muted text-foreground border-border',
  Rejected: 'bg-destructive/10 text-destructive border-destructive/30',
};

const statusIcons: Record<string, React.ReactNode> = {
  Cleaned: <CheckCircle className="w-4 h-4 mr-1" />,
  Sent: <FileText className="w-4 h-4 mr-1" />,
  Pending: <TrendingUp className="w-4 h-4 mr-1" />,
  Rejected: <XCircle className="w-4 h-4 mr-1" />,
};

const AllItems: React.FC = () => {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [, setLoading] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [cleaningJobs, setCleaningJobs] = useState<
    Record<string, CleaningJob[]>
  >({});
  const [warehouses, setWarehouses] = useState<WarehouseT[]>([]);
  const [transferModal, setTransferModal] = useState<{
    visible: boolean;
    item?: StockItem;
  }>({ visible: false });
  const [transfer, setTransfer] = useState<{
    quantity: number;
    unit?: string;
    toWarehouseId: string;
  }>({
    quantity: 0,
    unit: undefined,
    toWarehouseId: '',
  });
  const [transferLoading, setTransferLoading] = useState(false);

  // Status update modal state
  const [statusModal, setStatusModal] = useState<{
    visible: boolean;
    job?: CleaningJob;
    leftoverQuantity: number;
    reason: string;
    loading: boolean;
    isReusable?: boolean;
  }>({
    visible: false,
    job: undefined,
    leftoverQuantity: 0,
    reason: '',
    loading: false,
    isReusable: false,
  });

  // Fetch current stock
  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ROUTES.RAW.GET_ALL_PURCHASE_ORDER_ITEMS, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      setStock(res.data);
    } catch (err) {
      message.error('Failed to fetch current stock');
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

  const fetchCleaningJobs = async (
    rawMaterialId: string,
    warehouseId: string
  ) => {
    try {
      const res = await api.get(API_ROUTES.RAW.GET_CLEANING_JOBS, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        params: { rawMaterialId, fromWarehouseId: warehouseId },
      });
      const filteredJobs = res.data.filter(
        (job: CleaningJob) =>
          job.rawMaterialId === rawMaterialId &&
          job.fromWarehouseId === warehouseId
      );
      setCleaningJobs((prev) => ({
        ...prev,
        [`${rawMaterialId}_${warehouseId}`]: filteredJobs,
      }));
    } catch {
      message.error('Failed to fetch cleaning jobs');
    }
  };

  useEffect(() => {
    fetchStock();
    fetchWarehouses();
  }, []);

  // Handle row expand/collapse
  const handleExpand = (expanded: boolean, record: StockItem) => {
    const key = `${record.rawMaterialId}_${record.warehouseId}`;
    if (expanded) {
      setExpandedRowKeys([key]);
      fetchCleaningJobs(record.rawMaterialId, record.warehouseId);
    } else {
      setExpandedRowKeys([]);
    }
  };

  // Handle transfer modal open
  const openTransferModal = (item: StockItem) => {
    setTransferModal({ visible: true, item });
    setTransfer({ quantity: 0, toWarehouseId: '' });
  };

  // Handle transfer submit
  const handleTransfer = async () => {
    if (!transferModal.item) return;
    const uom = (transfer.unit || transferModal.item.unitOfMeasurement || '')
      .toString()
      .toLowerCase()
      .trim();
    const baseUom = (transferModal.item.unitOfMeasurement || '')
      .toString()
      .toLowerCase()
      .trim();
    let baseQuantity = transfer.quantity;

    if (uom !== baseUom) {
      baseQuantity = convertToBaseUOM(transfer.quantity, uom, baseUom);
    }

    if (
      baseQuantity <= 0 ||
      baseQuantity > transferModal.item.currentQuantity
    ) {
      message.error('Invalid quantity');
      return;
    }
    if (!transfer.toWarehouseId) {
      message.error('Select destination warehouse');
      return;
    }
    setTransferLoading(true);
    try {
      await api.post(
        API_ROUTES.RAW.CREATE_CLEANING_JOB,
        {
          rawMaterialId: transferModal.item.rawMaterialId,
          fromWarehouseId: transferModal.item.warehouseId,
          toWarehouseId: transfer.toWarehouseId,
          quantity: transfer.quantity,
          unit:
            transfer.unit || (transferModal.item.unitOfMeasurement as string),
          status: 'Sent',
          startedAt: new Date().toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      message.success('Transfer to cleaning initiated');
      setTransferModal({ visible: false });
      fetchStock();
    } catch {
      message.error('Failed to transfer');
    }
    setTransferLoading(false);
  };

  // Handle status update (mark as Cleaned)
  const openStatusModal = (job: CleaningJob) => {
    setStatusModal({
      visible: true,
      job,
      leftoverQuantity: 0,
      reason: '',
      loading: false,
    });
  };

  const handleStatusUpdate = async () => {
    if (!statusModal.job) return;
    if (
      statusModal.leftoverQuantity < 0 ||
      statusModal.leftoverQuantity > statusModal.job.quantity
    ) {
      message.error('Invalid leftover quantity');
      return;
    }
    setStatusModal((prev) => ({ ...prev, loading: true }));
    try {
      await api.put(
        API_ROUTES.RAW.UPDATE_CLEANING_JOB(statusModal.job.id),
        {
          status: 'Cleaned',
          leftoverQuantity: statusModal.leftoverQuantity,
          reasonCode: statusModal.reason,
          finishedAt: new Date().toISOString(),
          isReusable: statusModal.isReusable,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      message.success('Cleaning job marked as Cleaned');
      setStatusModal({
        visible: false,
        job: undefined,
        leftoverQuantity: 0,
        reason: '',
        loading: false,
      });
      fetchStock();
      if (statusModal.job)
        fetchCleaningJobs(
          statusModal.job.rawMaterialId,
          statusModal.job.fromWarehouseId
        );
    } catch {
      message.error('Failed to update status');
      setStatusModal((prev) => ({ ...prev, loading: false }));
    }
  };
  const unitOrder = ['g', 'kg', 'ton'];

  const allUnits = stock
    .map((s) =>
      typeof s.unitOfMeasurement === 'string' ? s.unitOfMeasurement : ''
    )
    .filter(Boolean);
  const highestUnit =
    unitOrder
      .slice()
      .reverse()
      .find((unit) => allUnits.includes(unit)) || '';

  const totalQuantity = stock.reduce((sum, s) => {
    const unit =
      typeof s.unitOfMeasurement === 'string' ? s.unitOfMeasurement : '';
    if (!unit || !highestUnit) {
      return sum + (s.currentQuantity || 0);
    }
    if (unit !== highestUnit) {
      try {
        return sum + convertToBaseUOM(s.currentQuantity, unit, highestUnit);
      } catch {
        console.warn(`Failed to convert ${unit} to ${highestUnit}`);
        return sum + (s.currentQuantity || 0);
      }
    }
    return sum + (s.currentQuantity || 0);
  }, 0);
  const totalStock = stock.length;

  const totalJobs = Object.values(cleaningJobs).flat().length;
  const cleanedJobs = Object.values(cleaningJobs)
    .flat()
    .filter((j) => j.status === 'Cleaned').length;

  const expandedRowRender = (record: StockItem) => {
    const key = `${record.rawMaterialId}_${record.warehouseId}`;
    const jobs = cleaningJobs[key] || [];
    return (
      <div className="overflow-x-auto rounded-xl border border-border bg-card mt-2 p-2">
        <table className="min-w-full divide-y divide-border">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left w-32">
                Cleaning Job ID
              </th>
              <th className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left">
                To Warehouse
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
                  colSpan={6}
                  className="px-4 py-2 text-center text-muted-foreground italic"
                >
                  No cleaning jobs found.
                </td>
              </tr>
            )}
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-accent transition">
                <td className="px-2 py-2 text-xs font-mono text-foreground break-all w-32">
                  {job.id}
                </td>
                <td className="px-4 py-2 text-sm text-foreground">
                  {job.toWarehouse?.name || '-'}
                </td>
                <td className="px-4 py-2 text-sm text-foreground text-right">
                  {job.quantity} {record.unitOfMeasurement}
                </td>
                <td className="px-4 py-2 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[job.status] || 'bg-muted text-foreground border-border'}`}
                  >
                    {statusIcons[job.status] || null}
                    {job.status}
                    {job.status !== 'Cleaned' && (
                      <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => openStatusModal(job)}
                        style={{ marginLeft: 4, padding: 0, height: 18 }}
                        size="small"
                      />
                    )}
                  </span>
                </td>
                <td className="px-4 py-2 text-center text-xs text-foreground">
                  {job.startedAt && !isNaN(Date.parse(job.startedAt))
                    ? new Date(job.startedAt).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : '-'}
                </td>
                <td className="px-4 py-2 text-center text-xs text-foreground">
                  {job.finishedAt && !isNaN(Date.parse(job.finishedAt))
                    ? new Date(job.finishedAt).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : '-'}
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
                  `Current Stock`
                </h1>
                <p className="text-muted-foreground text-sm">
                  View and manage all raw material stock and cleaning jobs
                </p>
              </div>
              <div className="ml-auto flex gap-2">
                <Button
                  type="default"
                  icon={<ReloadOutlined />}
                  onClick={fetchStock}
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
                  <th colSpan={6} className="p-0 border-b-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50">
                      <div className="bg-card rounded-xl p-4 border border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Total Stock Items
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {totalStock}
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
                            In stock
                          </span>
                        </div>
                      </div>
                      <div className="bg-card rounded-xl p-4 border border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Cleaning Jobs
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {totalJobs}
                        </p>
                        <div className="flex items-center mt-1">
                          <FileText
                            size={12}
                            className="text-foreground mr-1"
                          />
                          <span className="text-xs text-foreground/80 font-medium">
                            Total jobs
                          </span>
                        </div>
                      </div>
                      <div className="bg-card rounded-xl p-4 border border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Cleaned
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {cleanedJobs}
                        </p>
                        <div className="flex items-center mt-1">
                          <CheckCircle
                            size={12}
                            className="text-primary mr-1"
                          />
                          <span className="text-xs text-primary font-medium">
                            Completed
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
                      <Layers className="w-3.5 h-3.5" />
                      Material Name
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="inline-flex items-center gap-2">
                      <Warehouse className="w-3.5 h-3.5" />
                      Warehouse
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="inline-flex items-center gap-2">
                      <Scale className="w-3.5 h-3.5" />
                      Current Quantity
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {stock.map((record, index) => (
                  <React.Fragment
                    key={`${record.rawMaterialId}_${record.warehouseId}`}
                  >
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
                            expandedRowKeys.includes(
                              `${record.rawMaterialId}_${record.warehouseId}`
                            ) ? (
                              <ReloadOutlined />
                            ) : (
                              <PlusOutlined />
                            )
                          }
                          onClick={() =>
                            handleExpand(
                              !expandedRowKeys.includes(
                                `${record.rawMaterialId}_${record.warehouseId}`
                              ),
                              record
                            )
                          }
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {record.materialName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/80">
                        {record.warehouseName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        <b>
                          {record.currentQuantity} {record.unitOfMeasurement}
                        </b>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left">
                        <Button
                          type="primary"
                          onClick={() => openTransferModal(record)}
                          disabled={record.currentQuantity <= 0}
                          className="rounded-lg"
                        >
                          Transfer
                        </Button>
                      </td>
                    </motion.tr>
                    <AnimatePresence>
                      {expandedRowKeys.includes(
                        `${record.rawMaterialId}_${record.warehouseId}`
                      ) && (
                        <motion.tr
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-muted/50"
                        >
                          <td colSpan={5} className="px-10 py-4">
                            {expandedRowRender(record)}
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Transfer Modal */}
      <Modal
        open={transferModal.visible}
        title={
          <div>
            <span className="text-lg font-semibold text-foreground">
              Transfer to Cleaning
            </span>
            <div className="text-xs text-muted-foreground mt-1">
              {transferModal.item?.materialName && (
                <>
                  Material: <b>{transferModal.item.materialName}</b>
                </>
              )}
            </div>
          </div>
        }
        onCancel={() => setTransferModal({ visible: false })}
        onOk={handleTransfer}
        confirmLoading={transferLoading}
        okText="Transfer"
        className="rounded-xl"
      >
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-1">
            Available Quantity
          </div>
          <div className="font-medium text-foreground">
            {transferModal.item?.currentQuantity}{' '}
            {transferModal.item?.unitOfMeasurement}
          </div>
        </div>
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-1">
            Quantity to transfer
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              type="number"
              min={1}
              max={transferModal.item?.currentQuantity}
              value={transfer.quantity}
              onChange={(e) =>
                setTransfer((prev) => ({
                  ...prev,
                  quantity: Number(e.target.value),
                }))
              }
              placeholder="Enter quantity"
              className="rounded"
              style={{ flex: 2 }}
            />
            <UnitSelect
              value={transfer.unit}
              baseUnit={transferModal.item?.unitOfMeasurement as string}
              onChange={(val) =>
                setTransfer((prev) => ({
                  ...prev,
                  unit: String(val),
                }))
              }
            />
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">
            Destination warehouse
          </div>
          <Select
            style={{ width: '100%' }}
            placeholder="Select destination warehouse"
            value={transfer.toWarehouseId}
            onChange={(val) =>
              setTransfer((prev) => ({ ...prev, toWarehouseId: val }))
            }
            className="rounded"
          >
            {warehouses
              .filter((w) => w.id !== transferModal.item?.warehouseId)
              .map((w) => (
                <Option key={w.id} value={w.id}>
                  {w.name}
                </Option>
              ))}
          </Select>
        </div>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        open={statusModal.visible}
        title={
          <div>
            <span className="text-lg font-semibold text-foreground">
              Mark as Cleaned
            </span>
            <div className="text-xs text-muted-foreground mt-1">
              Cleaning Job ID: <b>{statusModal.job?.id}</b>
            </div>
          </div>
        }
        onCancel={() => setStatusModal({ ...statusModal, visible: false })}
        onOk={handleStatusUpdate}
        confirmLoading={statusModal.loading}
        okText="Update"
        className="rounded-xl"
      >
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-1">
            Total Quantity
          </div>
          <div className="font-medium text-foreground">
            {statusModal.job?.quantity}{' '}
            {statusModal.job?.rawMaterial?.unitOfMeasurement}
          </div>
        </div>
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-1">
            Unfinished/Rejected Quantity
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              type="number"
              min={0}
              max={statusModal.job?.quantity}
              value={statusModal.leftoverQuantity}
              onChange={(e) =>
                setStatusModal((prev) => ({
                  ...prev,
                  leftoverQuantity: Number(e.target.value),
                }))
              }
              placeholder="Enter unfinished/rejected quantity"
              className="rounded"
              style={{ flex: 2 }}
            />
            <UnitSelect
              value={statusModal.job?.rawMaterial?.unitOfMeasurement}
              baseUnit={statusModal.job?.rawMaterial?.unitOfMeasurement}
              onChange={() => {}}
            />
          </div>
          <div className="mb-3">
            <div className="text-xs text-muted-foreground mb-1">
              Is this wastage reusable?
            </div>
            <Switch
              checked={statusModal.isReusable}
              onChange={(checked) =>
                setStatusModal((prev) => ({ ...prev, isReusable: checked }))
              }
              checkedChildren="Yes"
              unCheckedChildren="No"
            />
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">
            Reason for unfinished/rejected material
          </div>
          <Input.TextArea
            rows={2}
            value={statusModal.reason}
            onChange={(e) =>
              setStatusModal((prev) => ({
                ...prev,
                reason: e.target.value,
              }))
            }
            placeholder="Enter reason"
            className="rounded"
          />
        </div>
      </Modal>
    </motion.div>
  );
};

export default AllItems;
