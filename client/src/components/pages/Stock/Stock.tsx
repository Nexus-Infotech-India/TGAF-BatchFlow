import React, { useEffect, useState } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { Spin, Alert, Card, Empty, Button, Slider } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Boxes,
  Warehouse,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  TrendingUp,
  Package,
  MapPin,
  BarChart3,
  Maximize2,
  Grid3X3,
} from 'lucide-react';

// Helper to interpolate color between multiple colors based on value (0-1)
function interpolateColor(factor: number) {
  const LOW_COLOR = '#f8faff'; // very light blue-white
  const MID_COLOR = '#bfdbfe'; // light blue
  const HIGH_COLOR = '#1e40af'; // deep blue

  if (factor <= 0.5) {
    // Interpolate between low and mid
    const normalizedFactor = factor * 2;
    return interpolateColorBetween(LOW_COLOR, MID_COLOR, normalizedFactor);
  } else {
    // Interpolate between mid and high
    const normalizedFactor = (factor - 0.5) * 2;
    return interpolateColorBetween(MID_COLOR, HIGH_COLOR, normalizedFactor);
  }
}

function interpolateColorBetween(
  color1: string,
  color2: string,
  factor: number
) {
  let c1 = color1.substring(1);
  let c2 = color2.substring(1);
  let rgb1 = [
    parseInt(c1.substring(0, 2), 16),
    parseInt(c1.substring(2, 4), 16),
    parseInt(c1.substring(4, 6), 16),
  ];
  let rgb2 = [
    parseInt(c2.substring(0, 2), 16),
    parseInt(c2.substring(2, 4), 16),
    parseInt(c2.substring(4, 6), 16),
  ];
  let rgb = rgb1.map((v, i) => Math.round(v + (rgb2[i] - v) * factor));
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

type StockItem = {
  rawMaterial: {
    id: string;
    name: string;
    unitOfMeasurement?: string;
  };
  warehouse: {
    id: string;
    name: string;
    location?: string;
  };
  currentQuantity: number;
};

const Stock: React.FC = () => {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('detailed');

 useEffect(() => {
  const authToken = localStorage.getItem('authToken');
  api
    .get(API_ROUTES.RAW.GET_CURRENT_STOCK_DISTRIBUTION, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    .then((res) => {
      // Aggregate by rawMaterialId + warehouseId
      const aggregate: Record<string, any> = {};
      res.data.forEach((item: any) => {
        const key = `${item.rawMaterial.id}_${item.warehouse.id}`;
        if (!aggregate[key]) {
          aggregate[key] = { ...item, currentQuantity: 0 };
        }
        aggregate[key].currentQuantity += item.currentQuantity ?? item.quantity ?? 0;
      });
      setStock(Object.values(aggregate));
      setLoading(false);
    })
    .catch((_err) => {
      setError('Failed to load stock distribution');
      setLoading(false);
    });
}, []);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 20, 60));
  const handleResetZoom = () => setZoomLevel(100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-blue-600 font-medium">
            Loading stock distribution...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-6">
        <Alert
          type="error"
          message="Stock Distribution Error"
          description={error}
          className="max-w-md"
          showIcon
        />
      </div>
    );
  }

  if (stock.length === 0) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-6">
        <Card className="max-w-md">
          <Empty
            description="No stock data available"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      </div>
    );
  }

  // Get all unique warehouses and products
  const warehouses = Array.from(
    new Set(stock.map((item) => item.warehouse.name))
  );
  const products = Array.from(
    new Set(stock.map((item) => item.rawMaterial.name))
  );

  // Build a matrix: rows = products, columns = warehouses
  const matrix: Record<string, Record<string, StockItem | undefined>> = {};
  products.forEach((prod) => {
    matrix[prod] = {};
    warehouses.forEach((wh) => {
      matrix[prod][wh] = stock.find(
        (item) => item.rawMaterial.name === prod && item.warehouse.name === wh
      );
    });
  });

  // Find min and max quantity for color scaling
  const allQuantities = stock
    .map((item) => item.currentQuantity)
    .filter((q) => q > 0);
  const minQ = Math.min(...allQuantities, 0);
  const maxQ = Math.max(...allQuantities, 1);

  // Calculate dynamic cell dimensions based on content
  const headerHeight = viewMode === 'detailed' ? '80px' : '60px';
  const cellHeight = viewMode === 'detailed' ? '70px' : '50px';
  const productColumnWidth = '200px';

  // Calculate warehouse column width dynamically
  const availableWidth = `calc(100vw - 280px - ${productColumnWidth})`; // 280px for sidebar + padding
  const warehouseColumnWidth =
    warehouses.length > 0
      ? `calc(${availableWidth} / ${warehouses.length})`
      : '150px';

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.05,
      },
    },
  };

  const cellVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 },
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 },
    },
  };

  const scaleStyle = {
    transform: `scale(${zoomLevel / 100})`,
    transformOrigin: 'top left',
    transition: 'transform 0.3s ease-in-out',
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-white overflow-hidden">
      {/* Header Section */}
      <motion.div
        className="p-6 pb-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Stock Distribution Heatmap
              </h1>
              <p className="text-gray-600 mt-1">
                {products.length} products across {warehouses.length} warehouses
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            <Button
              type={viewMode === 'compact' ? 'primary' : 'default'}
              icon={<Grid3X3 className="w-4 h-4" />}
              onClick={() => setViewMode('compact')}
              size="small"
            >
              Compact
            </Button>
            <Button
              type={viewMode === 'detailed' ? 'primary' : 'default'}
              icon={<Maximize2 className="w-4 h-4" />}
              onClick={() => setViewMode('detailed')}
              size="small"
            >
              Detailed
            </Button>
            <div className="border-l border-gray-300 ml-2 pl-2">
              <Button
                icon={<ZoomOut className="w-4 h-4" />}
                onClick={handleZoomOut}
                size="small"
              />
              <Button
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={handleResetZoom}
                size="small"
                className="mx-1"
              />
              <Button
                icon={<ZoomIn className="w-4 h-4" />}
                onClick={handleZoomIn}
                size="small"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Heatmap Section */}
      <div className="px-6 pb-6 h-full">
        <div className="h-full bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="h-full overflow-auto" style={scaleStyle}>
            <motion.div
              className="grid h-full"
              style={{
                gridTemplateColumns: `${productColumnWidth} repeat(${warehouses.length}, 1fr)`,
                gridTemplateRows: `${headerHeight} repeat(${products.length}, ${cellHeight})`,
                minHeight: '100%',
              }}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Header Row */}
              <motion.div
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center px-6 border-r border-blue-500"
                variants={cellVariants}
              >
                <div className="flex items-center space-x-2">
                  <Boxes className="w-5 h-5" />
                  <span className="font-bold text-lg">Product</span>
                </div>
              </motion.div>

              {warehouses.map((wh, index) => (
                <motion.div
                  key={wh}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white flex flex-col items-center justify-center px-4 py-2 border-r border-blue-500 last:border-r-0"
                  variants={cellVariants}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <Warehouse className="w-5 h-5" />
                    <span className="font-bold text-lg text-center">{wh}</span>
                  </div>
                  {viewMode === 'detailed' && (
                    <div className="text-xs opacity-75 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {stock.find((item) => item.warehouse.name === wh)
                        ?.warehouse?.location || 'N/A'}
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Data Rows */}
              {products.map((prod, prodIndex) => (
                <React.Fragment key={prod}>
                  {/* Product Name Cell */}
                  <motion.div
                    className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex items-center px-6 border-r border-gray-300"
                    variants={cellVariants}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <span className="font-semibold text-gray-800 truncate">
                        {prod}
                      </span>
                    </div>
                  </motion.div>

                  {/* Data Cells */}
                  {warehouses.map((wh, whIndex) => {
                    const item = matrix[prod][wh];
                    const q = item?.currentQuantity ?? 0;
                    // Normalize quantity for color
                    const norm = maxQ === minQ ? 0 : (q - minQ) / (maxQ - minQ);
                    const bg = q === 0 ? '#f3f4f6' : interpolateColor(norm);
                    const textColor = norm > 0.6 ? '#ffffff' : '#1f2937';

                    return (
                      <motion.div
                        key={`${prod}-${wh}`}
                        className="border-b border-r border-gray-200 last:border-r-0 flex items-center justify-center group cursor-pointer relative overflow-hidden"
                        style={{
                          backgroundColor: bg,
                          color: textColor,
                        }}
                        variants={cellVariants}
                        whileHover="hover"
                        title={`${prod} in ${wh}: ${q} units`}
                      >
                        <div className="flex flex-col items-center justify-center h-full w-full p-2">
                          {q > 0 ? (
                            <>
                              <span
                                className={`font-bold ${viewMode === 'detailed' ? 'text-xl' : 'text-lg'}`}
                              >
                                {q.toLocaleString()}
                              </span>
                              {viewMode === 'detailed' && item && (
                                <span className="text-xs opacity-75">
                                  {item.rawMaterial.unitOfMeasurement || 'unit'}
                                </span>
                              )}
                            </>
                          ) : (
                            <div className="flex flex-col items-center opacity-50">
                              <span className="text-lg">—</span>
                              {viewMode === 'detailed' && (
                                <span className="text-xs">No Stock</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Hover overlay */}
                      </motion.div>
                    );
                  })}
                </React.Fragment>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stock;
