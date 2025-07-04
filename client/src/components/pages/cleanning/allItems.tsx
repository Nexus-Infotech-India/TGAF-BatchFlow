import React, { useEffect, useState } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { Table, Button, Modal, Input, Select, Spin, message } from 'antd';
import { EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  TrendingUp,
  CheckCircle,
  FileText,
  XCircle,
} from 'lucide-react';

const { Option } = Select;

interface StockItem {
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
}

interface Warehouse {
  id: string;
  name: string;
}

const statusColors: Record<string, string> = {
  Cleaned: 'bg-green-50 text-green-700 border-green-200',
  Sent: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Rejected: 'bg-red-50 text-red-700 border-red-200',
};

const statusIcons: Record<string, React.ReactNode> = {
  Cleaned: <CheckCircle className="w-4 h-4 mr-1" />,
  Sent: <FileText className="w-4 h-4 mr-1" />,
  Pending: <TrendingUp className="w-4 h-4 mr-1" />,
  Rejected: <XCircle className="w-4 h-4 mr-1" />,
};

const AllItems: React.FC = () => {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [cleaningJobs, setCleaningJobs] = useState<
    Record<string, CleaningJob[]>
  >({});
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [transferModal, setTransferModal] = useState<{
    visible: boolean;
    item?: StockItem;
  }>({ visible: false });
  const [transfer, setTransfer] = useState<{
    quantity: number;
    toWarehouseId: string;
  }>({ quantity: 0, toWarehouseId: '' });
  const [transferLoading, setTransferLoading] = useState(false);

  // Status update modal state
  const [statusModal, setStatusModal] = useState<{
    visible: boolean;
    job?: CleaningJob;
    leftoverQuantity: number;
    reason: string;
    loading: boolean;
  }>({
    visible: false,
    job: undefined,
    leftoverQuantity: 0,
    reason: '',
    loading: false,
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

  // Fetch cleaning jobs for a stock row
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
      setCleaningJobs((prev) => ({
        ...prev,
        [`${rawMaterialId}_${warehouseId}`]: res.data,
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
    if (
      transfer.quantity <= 0 ||
      transfer.quantity > transferModal.item.currentQuantity
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
      // Optionally refresh cleaning jobs for the expanded row
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

  // Stats for header
  const totalStock = stock.length;
  const totalQuantity = stock.reduce(
    (sum, s) => sum + (s.currentQuantity || 0),
    0
  );
  const totalJobs = Object.values(cleaningJobs).flat().length;
  const cleanedJobs = Object.values(cleaningJobs)
    .flat()
    .filter((j) => j.status === 'Cleaned').length;

  // Table columns for current stock
  const columns = [
    {
      title: '',
      key: 'expand',
      width: 40,
      render: (_: any, record: StockItem) => (
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
        />
      ),
    },
    {
      title: 'Material Name',
      dataIndex: 'materialName',
      key: 'materialName',
      className: 'font-semibold text-gray-900',
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      className: 'text-gray-600',
    },
    {
      title: 'Current Quantity',
      dataIndex: 'currentQuantity',
      key: 'currentQuantity',
      render: (qty: number) => <b>{qty}</b>,
      className: 'text-gray-900',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: StockItem) => (
        <Button
          type="primary"
          onClick={() => openTransferModal(record)}
          disabled={record.currentQuantity <= 0}
        >
          Transfer
        </Button>
      ),
    },
  ];

  // Expanded row render: Cleaning jobs table
  const expandedRowRender = (record: StockItem) => {
    const key = `${record.rawMaterialId}_${record.warehouseId}`;
    const jobs = cleaningJobs[key] || [];
    return (
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow bg-white mt-2 p-2">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <th className="px-2 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wider text-left w-32">
                Cleaning Job ID
              </th>
              <th className="px-4 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wider text-left">
                To Warehouse
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
                <td colSpan={6} className="px-4 py-2 text-center text-gray-400 italic">
                  No cleaning jobs found.
                </td>
              </tr>
            )}
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-blue-50 transition">
                <td className="px-2 py-2 text-xs font-mono text-gray-900 break-all w-32">
                  {job.id}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900">
                  {job.toWarehouse?.name || "-"}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 text-right">
                  {job.quantity}
                </td>
                <td className="px-4 py-2 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[job.status] || "bg-gray-50 text-gray-700 border-gray-200"}`}
                  >
                    {statusIcons[job.status] || null}
                    {job.status}
                    {job.status !== "Cleaned" && (
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
                <td className="px-4 py-2 text-center text-xs text-gray-900">
                  {job.startedAt && !isNaN(Date.parse(job.startedAt))
                    ? new Date(job.startedAt).toLocaleString(undefined, {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                    : "-"}
                </td>
                <td className="px-4 py-2 text-center text-xs text-gray-900">
                  {job.finishedAt && !isNaN(Date.parse(job.finishedAt))
                    ? new Date(job.finishedAt).toLocaleString(undefined, {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                    : "-"}
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
                  Current Stock
                </h1>
                <p className="text-gray-600 text-sm mt-0.5">
                  View and manage all raw material stock and cleaning jobs
                </p>
              </div>
              <div className="ml-auto flex gap-2">
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={fetchStock}
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
                  <th colSpan={6} className="p-0 border-b-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs font-medium text-gray-600 mb-1">
                          Total Stock Items
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {totalStock}
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
                          {totalQuantity}
                        </p>
                        <div className="flex items-center mt-1">
                          <CheckCircle
                            size={10}
                            className="text-green-500 mr-1"
                          />
                          <span className="text-xs text-green-600 font-medium">
                            In stock
                          </span>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs font-medium text-gray-600 mb-1">
                          Cleaning Jobs
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {totalJobs}
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
                      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs font-medium text-gray-600 mb-1">
                          Cleaned
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {cleanedJobs}
                        </p>
                        <div className="flex items-center mt-1">
                          <CheckCircle
                            size={10}
                            className="text-green-500 mr-1"
                          />
                          <span className="text-xs text-green-600 font-medium">
                            Completed
                          </span>
                        </div>
                      </div>
                    </div>
                  </th>
                </tr>
                <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <th className="px-6 py-4"></th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Material Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Current Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stock.map((record, index) => (
                  <React.Fragment
                    key={`${record.rawMaterialId}_${record.warehouseId}`}
                  >
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
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.materialName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {record.warehouseName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <b>{record.currentQuantity}</b>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left">
                        <Button
                          type="primary"
                          onClick={() => openTransferModal(record)}
                          disabled={record.currentQuantity <= 0}
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
                          className="bg-gray-50"
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
            <span className="text-lg font-semibold text-blue-700">Transfer to Cleaning</span>
            <div className="text-xs text-gray-500 mt-1">
              {transferModal.item?.materialName && (
                <>Material: <b>{transferModal.item.materialName}</b></>
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
          <div className="text-xs text-gray-500 mb-1">From Warehouse</div>
          <div className="font-medium text-gray-800">{transferModal.item?.warehouseName}</div>
        </div>
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-1">Available Quantity</div>
          <div className="font-medium text-gray-800">{transferModal.item?.currentQuantity}</div>
        </div>
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-1">Quantity to transfer</div>
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
          />
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Destination warehouse</div>
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
            <span className="text-lg font-semibold text-blue-700">Mark as Cleaned</span>
            <div className="text-xs text-gray-500 mt-1">
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
          <div className="text-xs text-gray-500 mb-1">Total Quantity</div>
          <div className="font-medium text-gray-800">{statusModal.job?.quantity}</div>
        </div>
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-1">Unfinished/Rejected Quantity</div>
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
          />
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Reason for unfinished/rejected material</div>
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
