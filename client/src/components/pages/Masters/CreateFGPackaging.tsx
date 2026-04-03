import React, { useEffect, useState } from 'react';
import { Button, InputNumber, Select, Table, message, Modal, Space, Tag } from 'antd';
import { motion } from 'framer-motion';
import { Package, Grid, CheckCircle, Trash2, Edit } from 'lucide-react';
import api, { API_ROUTES } from '../../../utils/api';

const { Option } = Select;

export default function CreateFGPackaging() {
  const [products, setProducts] = useState<any[]>([]);
  const [packagingSettings, setPackagingSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [packetSize, setPacketSize] = useState<number | null>(null);
  const [packetUnit, setPacketUnit] = useState<string>('Gram');
  const [cartonCapacity, setCartonCapacity] = useState<number | null>(null);
  
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Raw Materials (and filter for FINISHED_GOOD)
      const prodRes = await api.get(API_ROUTES.RAW.GET_PRODUCTS);
      const productsData = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.data || []);
      const fgs = productsData.filter((p: any) => p.category === 'FINISHED_GOOD');
      setProducts(fgs);

      // Fetch existing packaging mappings
      const packRes = await api.get(API_ROUTES.RAW.FG_PACKAGING);
      if (packRes.data?.success) {
        setPackagingSettings(packRes.data.data || []);
      }
    } catch (err: any) {
      console.error(err);
      message.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!selectedProduct || !packetSize || !packetUnit || !cartonCapacity) {
      message.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(API_ROUTES.RAW.FG_PACKAGING, {
        rawMaterialId: selectedProduct,
        packetSize,
        packetUnit,
        cartonCapacity,
      });
      message.success('FG Packaging setting saved successfully');
      
      // Reset form
      setSelectedProduct(null);
      setPacketSize(null);
      setPacketUnit('Gram');
      setCartonCapacity(null);

      fetchData();
    } catch (err: any) {
      console.error(err);
      message.error('Failed to save FG Packaging setting');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Delete Packaging Setting?',
      content: 'Are you sure you want to delete this setting?',
      onOk: async () => {
        try {
          await api.delete(`${API_ROUTES.RAW.FG_PACKAGING}/${id}`);
          message.success('Deleted successfully');
          fetchData();
        } catch {
          message.error('Failed to delete setting');
        }
      }
    });
  };

  const handleEdit = (record: any) => {
    setSelectedProduct(record.rawMaterialId);
    setPacketSize(record.packetSize);
    setPacketUnit(record.packetUnit);
    setCartonCapacity(record.cartonCapacity);
  };

  const columns = [
    {
      title: 'Finished Good',
      key: 'product',
      render: (record: any) => (
        <div>
          <div className="font-bold text-foreground text-sm">{record.rawMaterial?.name || 'Unknown'}</div>
          <div className="text-xs text-muted-foreground">{record.rawMaterial?.skuCode || '-'}</div>
        </div>
      ),
    },
    {
      title: 'Packet Size',
      key: 'packetSize',
      render: (record: any) => (
        <span className="font-semibold text-emerald-600">
          {record.packetSize} {record.packetUnit}
        </span>
      ),
    },
    {
      title: 'Carton Capacity',
      key: 'cartonCapacity',
      render: (record: any) => (
        <span className="font-semibold text-blue-600">
          {record.cartonCapacity} Packets / Carton
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (record: any) => (
        <Space>
          <Button type="text" icon={<Edit size={16} className="text-blue-500" />} onClick={() => handleEdit(record)} />
          <Button type="text" danger icon={<Trash2 size={16} />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
      align: 'center' as const,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-foreground mb-1">FG UOM Master</h1>
        <p className="text-muted-foreground text-sm">Configure standard packet sizing and carton capacities for finished goods.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-2xl shadow-xl shadow-black/5 border border-border overflow-hidden">
            <div className="p-5 border-b border-border bg-muted/20 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
                <Package size={20} />
              </div>
              <h2 className="text-lg font-bold text-foreground">Packaging Config</h2>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wide">
                  Finished Good <span className="text-red-500">*</span>
                </label>
                <Select
                  showSearch
                  placeholder="Select a FG product"
                  value={selectedProduct}
                  onChange={setSelectedProduct}
                  className="w-full"
                  size="large"
                  optionFilterProp="children"
                >
                  {products.map(p => (
                    <Option key={p.id} value={p.id}>
                      {p.name} <span className="text-muted-foreground text-xs">({p.skuCode})</span>
                    </Option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wide">
                  Packet Size <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <InputNumber
                    min={0.01}
                    value={packetSize}
                    onChange={setPacketSize}
                    placeholder="e.g., 5"
                    size="large"
                    className="flex-1"
                  />
                  <Select value={packetUnit} onChange={setPacketUnit} size="large" className="w-28">
                    <Option value="Gram">Gram</Option>
                    <Option value="KG">KG</Option>
                    <Option value="Ton">Ton</Option>
                    
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center justify-between">
                  <span>Carton Capacity <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-muted-foreground">Packets per Carton</span>
                </label>
                <InputNumber
                  min={1}
                  precision={0}
                  value={cartonCapacity}
                  onChange={setCartonCapacity}
                  placeholder="e.g., 100"
                  size="large"
                  className="w-full"
                />
              </div>

              <Button
                type="primary"
                size="large"
                className="w-full font-bold h-12 mt-4"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}
                onClick={handleSubmit}
                loading={submitting}
              >
                {!submitting && <CheckCircle size={18} className="mr-2" />}
                Save Configuration
              </Button>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-2xl shadow-xl shadow-black/5 border border-border overflow-hidden">
            <div className="p-5 border-b border-border bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600">
                  <Grid size={20} />
                </div>
                <h2 className="text-lg font-bold text-foreground">Configured Settings</h2>
              </div>
              <Tag color="blue" className="px-3 py-1 rounded-full font-bold">{packagingSettings.length} entries</Tag>
            </div>
            
            <Table
              dataSource={packagingSettings}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 8 }}
              className="mt-0"
              size="middle"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
