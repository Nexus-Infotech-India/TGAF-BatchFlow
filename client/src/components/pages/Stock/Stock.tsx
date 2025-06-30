import React, { useEffect, useState } from "react";
import api, { API_ROUTES } from "../../../utils/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Spin, Alert } from "antd";

type StockItem = {
  rawMaterial: {
    id: string;
    name: string;
  };
  warehouse: {
    id: string;
    name: string;
  };
  currentQuantity: number;
};

type ChartData = {
  product: string;
  [warehouse: string]: string | number;
};

const COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1", "#a4de6c", "#d0ed57",
];

const Stock: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [warehouses, setWarehouses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get(API_ROUTES.RAW.GET_CURRENT_STOCK_DISTRIBUTION)
      .then(res => {
        const raw: StockItem[] = res.data;
        // Get all unique products and warehouses
        const products = Array.from(new Set(raw.map(item => item.rawMaterial.name)));
        const warehouseNames = Array.from(new Set(raw.map(item => item.warehouse.name)));
        setWarehouses(warehouseNames);

        // Build chart data: [{ product: "Wheat", "Warehouse A": 100, ... }, ...]
        const chartData: ChartData[] = products.map(product => {
          const entry: ChartData = { product };
          warehouseNames.forEach(wh => {
            const found = raw.find(
              item => item.rawMaterial.name === product && item.warehouse.name === wh
            );
            entry[wh] = found ? found.currentQuantity : 0;
          });
          return entry;
        });
        setData(chartData);
        setLoading(false);
      })
      .catch(_err => {
        setError("Failed to load stock distribution");
        setLoading(false);
      });
  }, []);

  if (loading) return <Spin />;
  if (error) return <Alert type="error" message={error} />;

  return (
    <div style={{ width: "100%", height: 500 }}>
      <h2>Current Stock Distribution</h2>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="product" />
          <YAxis />
          <Tooltip />
          <Legend />
          {warehouses.map((wh, idx) => (
            <Bar
              key={wh}
              dataKey={wh}
              stackId="a"
              fill={COLORS[idx % COLORS.length]}
              name={wh}
              maxBarSize={60}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Stock;