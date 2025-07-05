import React, { useEffect, useState } from "react";
import api, { API_ROUTES } from "../../../utils/api";

interface LowStockAlert {
  skuCode: string;
  name: string;
  available: number;
  minReorderLevel: number;
}

interface WasteStock {
  unfinished: number;
  byProduct: number;
  total: number;
}

const RawDashboard: React.FC = () => {
  const [totalStock, setTotalStock] = useState<number>(0);
  const [pendingPOs, setPendingPOs] = useState<number>(0);
  const [stockUnderCleaning, setStockUnderCleaning] = useState<number>(0);
  const [stockInProcessing, setStockInProcessing] = useState<number>(0);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [wasteStock, setWasteStock] = useState<WasteStock>({ unfinished: 0, byProduct: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const authToken = localStorage.getItem("authToken");

  useEffect(() => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${authToken}` };

    Promise.all([
      api.get(API_ROUTES.RAW.GET_TOTAL_RAW_MATERIAL_STOCK, { headers }),
      api.get(API_ROUTES.RAW.GET_PENDING_PO_COUNT, { headers }),
      api.get(API_ROUTES.RAW.GET_STOCK_UNDER_CLEANING, { headers }),
      api.get(API_ROUTES.RAW.GET_STOCK_IN_PROCESSING, { headers }),
      api.get(API_ROUTES.RAW.GET_LOW_STOCK_ALERTS, { headers }),
      api.get(API_ROUTES.RAW.GET_WASTE_STOCK, { headers }),
    ])
      .then(
        ([
          totalStockRes,
          pendingPOsRes,
          cleaningRes,
          processingRes,
          lowStockRes,
          wasteRes,
        ]) => {
          setTotalStock(totalStockRes.data.totalRawMaterialStock || 0);
          setPendingPOs(pendingPOsRes.data.pendingPOs || 0);
          setStockUnderCleaning(cleaningRes.data.stockUnderCleaning || 0);
          setStockInProcessing(processingRes.data.stockInProcessing || 0);
          setLowStockAlerts(lowStockRes.data.lowStockAlerts || []);
          setWasteStock(wasteRes.data.wasteStock || { unfinished: 0, byProduct: 0, total: 0 });
        }
      )
      .finally(() => setLoading(false));
  }, [authToken]);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h2>Raw Material Dashboard</h2>
      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        <StatCard
          icon="📦"
          label="Total Raw Material Stock (kg/litre)"
          value={totalStock}
        />
        <StatCard
          icon="🚚"
          label="POs Pending Delivery"
          value={pendingPOs}
        />
        <StatCard
          icon="🔍"
          label="Stock Under Cleaning"
          value={stockUnderCleaning}
        />
        <StatCard
          icon="🛠️"
          label="In Processing"
          value={stockInProcessing}
        />
        <StatCard
          icon="♻️"
          label="Unusable/Waste Stock"
          value={wasteStock.total}
          tooltip={`Unfinished: ${wasteStock.unfinished}, ByProduct: ${wasteStock.byProduct}`}
        />
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>⚠️ Low Stock Alerts</h3>
        {lowStockAlerts.length === 0 ? (
          <div>No SKUs below minimum reorder levels.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>SKU Code</th>
                <th>Name</th>
                <th>Available</th>
                <th>Min Reorder Level</th>
              </tr>
            </thead>
            <tbody>
              {lowStockAlerts.map((alert) => (
                <tr key={alert.skuCode}>
                  <td>{alert.skuCode}</td>
                  <td>{alert.name}</td>
                  <td>{alert.available}</td>
                  <td>{alert.minReorderLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  icon: string;
  label: string;
  value: number;
  tooltip?: string;
}> = ({ icon, label, value, tooltip }) => (
  <div
    style={{
      border: "1px solid #ddd",
      borderRadius: "8px",
      padding: "1rem",
      minWidth: "220px",
      background: "#fafbfc",
      boxShadow: "0 2px 8px #0001",
      position: "relative",
    }}
    title={tooltip}
  >
    <div style={{ fontSize: "2rem" }}>{icon}</div>
    <div style={{ fontWeight: "bold", margin: "0.5rem 0" }}>{label}</div>
    <div style={{ fontSize: "1.5rem", color: "#1976d2" }}>{value}</div>
  </div>
);

export default RawDashboard;