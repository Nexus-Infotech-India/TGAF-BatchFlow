import React, { useEffect, useState } from 'react';
import api, { API_ROUTES } from '../../../utils/api';

interface RawMaterial {
  id: string;
  skuCode: string;
  name: string;
  category: string;
  unitOfMeasurement: string;
  minReorderLevel: number;
  vendorId?: string;
}

interface PurchaseOrderItem {
  currentStock: number;
  id: string;
  rawMaterialId: string;
  status: string;
  quantityOrdered: number;
  quantityReceived: number;
  rawMaterial: RawMaterial;
  warehouseId?: string;
  warehouseName?: string;
}

interface Warehouse {
  id: string;
  name: string;
}

const REASON_CODES = [
  { value: 'moisture', label: 'Moisture' },
  { value: 'damage', label: 'Damage' },
  { value: 'breakage', label: 'Breakage' },
  { value: 'other', label: 'Other' },
];

const CleaningRawMaterialList: React.FC = () => {
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [cleaningJobs, setCleaningJobs] = useState<any[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusItem, setStatusItem] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [leftoverQuantity, setLeftoverQuantity] = useState<number>(0);
  const [reasonCode, setReasonCode] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // Fetch items, warehouses, and cleaning jobs
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const authToken = localStorage.getItem('authToken');
        const [itemsRes, warehousesRes, cleaningJobsRes] = await Promise.all([
          api.get(API_ROUTES.RAW.GET_ALL_PURCHASE_ORDER_ITEMS, {
            params: { status: 'Received' },
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          api.get(API_ROUTES.RAW.GET_WAREHOUSES, {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          api.get(API_ROUTES.RAW.GET_CLEANING_JOBS, {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
        ]);
        setItems(itemsRes.data);
        setWarehouses(warehousesRes.data);
        setCleaningJobs(cleaningJobsRes.data);
      } catch {
        setItems([]);
        setWarehouses([]);
        setCleaningJobs([]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Aggregate by rawMaterialId + warehouseId, but do NOT sum currentStock
  const aggregated = Object.values(
    items.reduce((acc, item) => {
      const key = `${item.rawMaterialId}_${item.warehouseId}`;
      if (!acc[key]) {
        acc[key] = {
          rawMaterialId: item.rawMaterialId,
          skuCode: item.rawMaterial?.skuCode,
          name: item.rawMaterial?.name,
          category: item.rawMaterial?.category,
          unitOfMeasurement: item.rawMaterial?.unitOfMeasurement,
          warehouseId: item.warehouseId,
          warehouseName: item.warehouseName,
          currentStock: typeof item.currentStock === 'number' ? item.currentStock : 0,
        };
      }
      // Do NOT sum currentStock!
      return acc;
    }, {} as Record<string, any>)
  );

  // Find latest cleaning job for a rawMaterialId + warehouseId
  const getLatestCleaningJob = (rawMaterialId: string, fromWarehouseId: string) => {
    const jobs = cleaningJobs
      .filter(
        (job) =>
          job.rawMaterialId === rawMaterialId &&
          job.fromWarehouseId === fromWarehouseId
      )
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    return jobs[0];
  };

  const handleCleaningClick = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
    setToWarehouseId('');
    setQuantity(item.currentStock || 0);
  };

  const handleModalSubmit = async () => {
    if (!selectedItem || !selectedItem.warehouseId || !toWarehouseId || !quantity) return;
    setSubmitting(true);
    try {
      const authToken = localStorage.getItem('authToken');
      await api.post(
        API_ROUTES.RAW.CREATE_CLEANING_JOB,
        {
          rawMaterialId: selectedItem.rawMaterialId,
          fromWarehouseId: selectedItem.warehouseId,
          toWarehouseId,
          quantity,
          status: 'Sent',
          startedAt: new Date().toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      setShowModal(false);
      setSelectedItem(null);
      setLoading(true);
      const [itemsRes, cleaningJobsRes] = await Promise.all([
        api.get(API_ROUTES.RAW.GET_ALL_PURCHASE_ORDER_ITEMS, {
          params: { status: 'Received' },
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        api.get(API_ROUTES.RAW.GET_CLEANING_JOBS, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);
      setItems(itemsRes.data);
      setCleaningJobs(cleaningJobsRes.data);
      setLoading(false);
    } catch {
      // handle error as needed
    }
    setSubmitting(false);
  };

  // Status update modal logic
  const handleStatusClick = (item: any) => {
    setStatusItem(item);
    setShowStatusModal(true);
    setNewStatus('');
    setLeftoverQuantity(0);
    setReasonCode('');
  };

  const handleStatusSubmit = async () => {
    if (!statusItem || !newStatus) return;
    setStatusSubmitting(true);
    try {
      const authToken = localStorage.getItem('authToken');
      // Find the latest cleaning job for this item
      const job = getLatestCleaningJob(statusItem.rawMaterialId, statusItem.warehouseId);
      if (!job) {
        setStatusSubmitting(false);
        return;
      }
      const payload: any = {
        status: newStatus,
      };
      if (newStatus === 'Cleaned' || newStatus === 'Finished') {
        payload.leftoverQuantity = leftoverQuantity;
        payload.reasonCode = reasonCode;
        payload.finishedAt = new Date().toISOString();
      }
     await api.put(API_ROUTES.RAW.UPDATE_CLEANING_JOB(job.id), payload, {
  headers: { Authorization: `Bearer ${authToken}` },
});
      setShowStatusModal(false);
      setStatusItem(null);
      setLoading(true);
      const cleaningJobsRes = await api.get(API_ROUTES.RAW.GET_CLEANING_JOBS, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setCleaningJobs(cleaningJobsRes.data);
      setLoading(false);
    } catch {
      // handle error as needed
    }
    setStatusSubmitting(false);
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Raw Materials (Received)</h1>
      </div>
      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : aggregated.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No received raw materials found.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">SKU Code</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Unit</th>
                <th className="px-4 py-2 text-left">Warehouse</th>
                <th className="px-4 py-2 text-left">Current Stock</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Cleaning Action</th>
                <th className="px-4 py-2 text-left">Update Status</th>
              </tr>
            </thead>
            <tbody>
              {aggregated.map((item: any) => {
                const job = getLatestCleaningJob(item.rawMaterialId, item.warehouseId);
                return (
                  <tr key={`${item.rawMaterialId}_${item.warehouseId}`} className="border-b">
                    <td className="px-4 py-2">{item.skuCode}</td>
                    <td className="px-4 py-2">{item.name}</td>
                    <td className="px-4 py-2">{item.category}</td>
                    <td className="px-4 py-2">{item.unitOfMeasurement}</td>
                    <td className="px-4 py-2">{item.warehouseName}</td>
                    <td className="px-4 py-2 font-semibold">{item.currentStock}</td>
                    <td className="px-4 py-2">
                      {job ? (
                        <span className="font-medium">{job.status}</span>
                      ) : (
                        <span className="text-gray-400">Not Started</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {item.currentStock > 0 ? (
                        <button
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          onClick={() => handleCleaningClick(item)}
                        >
                          Transfer to Cleaning
                        </button>
                      ) : (
                        <span className="text-gray-400">Transferred</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {job ? (
                        <button
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          onClick={() => handleStatusClick(item)}
                        >
                          Change Status
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for cleaning action */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">
              Transfer to Cleaning Unit
            </h2>
            <div className="mb-4">
              <label className="block mb-1 font-medium">To Warehouse</label>
              <select
                className="w-full border px-2 py-1 rounded"
                value={toWarehouseId}
                onChange={(e) => setToWarehouseId(e.target.value)}
              >
                <option value="">Select cleaning unit</option>
                {warehouses
                  .filter((w) => w.id !== selectedItem.warehouseId)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Quantity</label>
              <input
                type="number"
                className="w-full border px-2 py-1 rounded"
                min={1}
                max={selectedItem.currentStock || 0}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
              <div className="text-xs text-gray-500 mt-1">
                Available: {selectedItem.currentStock || 0}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setShowModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={handleModalSubmit}
                disabled={
                  submitting ||
                  !selectedItem.warehouseId ||
                  !toWarehouseId ||
                  !quantity ||
                  quantity < 1 ||
                  quantity > selectedItem.currentStock
                }
              >
                {submitting ? 'Transferring...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for status update */}
      {showStatusModal && statusItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Update Cleaning Status</h2>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Status</label>
              <select
                className="w-full border px-2 py-1 rounded"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="">Select status</option>
                <option value="Sent">Sent</option>
                <option value="In Progress">In Progress</option>
                <option value="Cleaned">Cleaned</option>
                <option value="Finished">Finished</option>
              </select>
            </div>
            {(newStatus === 'Cleaned' || newStatus === 'Finished') && (
              <>
                <div className="mb-4">
                  <label className="block mb-1 font-medium">
                    Leftover/Unusable Quantity
                  </label>
                  <input
                    type="number"
                    className="w-full border px-2 py-1 rounded"
                    min={0}
                    value={leftoverQuantity}
                    onChange={(e) => setLeftoverQuantity(Number(e.target.value))}
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-medium">Reason Code</label>
                  <select
                    className="w-full border px-2 py-1 rounded"
                    value={reasonCode}
                    onChange={(e) => setReasonCode(e.target.value)}
                  >
                    <option value="">Select reason</option>
                    {REASON_CODES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setShowStatusModal(false)}
                disabled={statusSubmitting}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded"
                onClick={handleStatusSubmit}
                disabled={
                  statusSubmitting ||
                  !newStatus ||
                  ((newStatus === 'Cleaned' || newStatus === 'Finished') &&
                    (leftoverQuantity < 0 || !reasonCode))
                }
              >
                {statusSubmitting ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CleaningRawMaterialList;