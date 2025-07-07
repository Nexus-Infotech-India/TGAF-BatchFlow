import React, { useEffect, useState } from "react";
import api, { API_ROUTES } from "../../../utils/api";

type Warehouse = {
  id: string;
  name: string;
  location?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (warehouseId: string, quantity: number) => void;
  defaultQuantity?: number;
};

const ReceiveModal: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  defaultQuantity = 0,
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [quantity, setQuantity] = useState<number>(defaultQuantity);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchWarehouses();
      setShowForm(false);
      setSelectedWarehouseId("");
      setQuantity(defaultQuantity);
    }
    // eslint-disable-next-line
  }, [open, defaultQuantity]);

 const fetchWarehouses = async () => {
  try {
    const authToken = localStorage.getItem('authToken');
    const res = await api.get(API_ROUTES.RAW.GET_WAREHOUSES, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    setWarehouses(res.data);
  } catch {
    setWarehouses([]);
  }
};

  const handleAddClick = () => setShowForm(true);

 const handleConfirm = async () => {
  if (!selectedWarehouseId) {
    window.alert("Please select a warehouse.");
    return;
  }
  if (!quantity || quantity <= 0) {
    window.alert("Please enter a valid quantity.");
    return;
  }
  setLoading(true);
  try {
    await onConfirm(selectedWarehouseId, quantity);
  } finally {
    setLoading(false);
  }
};

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blur bg-opacity-30">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-auto p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          disabled={loading}
        >
          ×
        </button>
        <h2 className="text-lg font-semibold mb-4">Receive Item</h2>
        {!showForm ? (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Warehouse
              </label>
              <div className="flex gap-2">
                <select
                  className="w-full border rounded px-2 py-1"
                  value={selectedWarehouseId}
                  onChange={e => setSelectedWarehouseId(e.target.value)}
                >
                  <option value="">Choose warehouse</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                <button
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                  onClick={handleAddClick}
                  type="button"
                >
                  Add
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity Received
              </label>
              <input
                type="number"
                min={1}
                className="w-full border rounded px-2 py-1"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-1 rounded bg-gray-100 text-gray-700"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-1 rounded bg-blue-600 text-white"
               
                onClick={handleConfirm}
              >
              {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Loading...
                  </span>
                ) : (
                  "OK"
                )}
              </button>
            </div>
          </div>
        ) : (
          <WarehouseForm
            onCreated={w => {
              setWarehouses(ws => [...ws, w]);
              setSelectedWarehouseId(w.id);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}
      </div>
    </div>
  );
};

type WarehouseFormProps = {
  onCreated: (w: Warehouse) => void;
  onCancel: () => void;
};

const WarehouseForm: React.FC<WarehouseFormProps> = ({ onCreated, onCancel }) => {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const authToken = localStorage.getItem('authToken');
      const res = await api.post(
        API_ROUTES.RAW.CREATE_WAREHOUSE,
        { name, location },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      onCreated(res.data);
    } catch {
      // handle error
    }
    setLoading(false);
  };

  return (
    <div>
      <h3 className="text-base font-semibold mb-2">Add Warehouse</h3>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          className="w-full border rounded px-2 py-1"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Warehouse name"
        />
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location
        </label>
        <input
          className="w-full border rounded px-2 py-1"
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="Location"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          className="px-4 py-1 rounded bg-gray-100 text-gray-700"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          className="px-4 py-1 rounded bg-blue-600 text-white"
          onClick={handleCreate}
          disabled={!name || loading}
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default ReceiveModal;

// ...existing code...

// Edit Purchase Order Modal
type EditOrderModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: { expectedDate: string }) => void;
  defaultExpectedDate: string;
};

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  open,
  onClose,
  onSave,
  defaultExpectedDate,
}) => {
  const [expectedDate, setExpectedDate] = useState(defaultExpectedDate);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setExpectedDate(defaultExpectedDate);
  }, [defaultExpectedDate, open]);

  const handleSave = async () => {
    setLoading(true);
    await onSave({ expectedDate });
    setLoading(false);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blur bg-opacity-30">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-auto p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          disabled={loading}
        >
          ×
        </button>
        <h2 className="text-lg font-semibold mb-4">Edit Purchase Order</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expected Date
          </label>
          <input
            type="date"
            className="w-full border rounded px-2 py-1"
            value={expectedDate}
            onChange={e => setExpectedDate(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-1 rounded bg-gray-100 text-gray-700"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-1 rounded bg-blue-600 text-white"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Purchase Order Modal
type DeleteOrderModalProps = {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  poNumber: string;
};

export const DeleteOrderModal: React.FC<DeleteOrderModalProps> = ({
  open,
  onClose,
  onDelete,
  poNumber,
}) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await onDelete();
    setLoading(false);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blur bg-opacity-30">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-auto p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          disabled={loading}
        >
          ×
        </button>
        <h2 className="text-lg font-semibold mb-4">Delete Purchase Order</h2>
        <p className="mb-4 text-gray-700">
          Are you sure you want to delete <b>{poNumber}</b>?
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-1 rounded bg-gray-100 text-gray-700"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-1 rounded bg-red-600 text-white"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};