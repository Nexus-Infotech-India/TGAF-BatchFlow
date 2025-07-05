import React, { useEffect, useState } from 'react';
import { List, Spin, Timeline, Card, Empty, Typography } from 'antd';
import api, { API_ROUTES } from '../../../utils/api';

type PurchaseOrder = {
  id: string;
  orderNumber: string;
  orderDate: string;
  vendor: { id: string; name: string };
  totalQuantity: number;
  receivedQuantity: number;
  status: string;
};

type TimelineEvent = {
  type: string;
  date: string;
  details: string;
};

type PurchaseOrderTimeline = {
  purchaseOrder: PurchaseOrder & { items: any[] };
  events: TimelineEvent[];
};

interface Props {
  onClose: () => void;
  rawMaterialId: string | null;
  rawMaterialName: string | null;
}

const ProductPurchaseOrdersView: React.FC<Props> = ({
  onClose,
  rawMaterialId,
  rawMaterialName,
}) => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [timeline, setTimeline] = useState<PurchaseOrderTimeline | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);

  useEffect(() => {
    if (rawMaterialId) {
      setLoading(true);
      setSelectedOrder(null);
      setTimeline(null);
      api
        .get(
          API_ROUTES.RAW.GET_PURCHASE_ORDERS_BY_PRODUCT(rawMaterialId),
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`
            }
          }
        )
        .then((res) => setOrders(res.data))
        .catch(() => setOrders([]))
        .finally(() => setLoading(false));
    }
  }, [rawMaterialId]);

  const handleOrderClick = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setTimelineLoading(true);
    api
      .get(API_ROUTES.RAW.GET_PURCHASE_ORDER_TIMELINE(order.id),{
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      })
      .then((res) => setTimeline(res.data))
      .catch(() => setTimeline(null))
      .finally(() => setTimelineLoading(false));
  };

  const handleBack = () => {
    setSelectedOrder(null);
    setTimeline(null);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-4 flex items-center">
        <button className="btn mr-2" onClick={onClose}>
          ← Back to Stock Heatmap
        </button>
        <h2 className="text-2xl font-bold">
          {selectedOrder
            ? `Timeline: ${selectedOrder.orderNumber}`
            : `Purchase Orders for ${rawMaterialName}`}
        </h2>
      </div>
      {loading ? (
        <Spin />
      ) : !selectedOrder ? (
        orders.length === 0 ? (
          <Empty description="No purchase orders found" />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={orders}
            renderItem={(order) => (
              <List.Item
                className="cursor-pointer hover:bg-blue-50 rounded"
                onClick={() => handleOrderClick(order)}
              >
                <List.Item.Meta
                  title={
                    <span>
                      <b>{order.orderNumber}</b> &nbsp;|&nbsp; {order.vendor.name}
                    </span>
                  }
                  description={
                    <>
                      <span>
                        Ordered: {order.totalQuantity} | Received: {order.receivedQuantity}
                      </span>
                      <br />
                      <span>Status: {order.status}</span>
                      <br />
                      <span>
                        Date: {new Date(order.orderDate).toLocaleString()}
                      </span>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        )
      ) : timelineLoading ? (
        <Spin />
      ) : timeline ? (
        <div>
          <Card className="mb-4">
            <Typography.Text strong>
              Vendor: {timeline.purchaseOrder.vendor.name}
            </Typography.Text>
            <br />
            <Typography.Text>
              Ordered: {timeline.purchaseOrder.totalQuantity} | Received: {timeline.purchaseOrder.receivedQuantity}
            </Typography.Text>
            <br />
            <Typography.Text>
              Date: {new Date(timeline.purchaseOrder.orderDate).toLocaleString()}
            </Typography.Text>
            <br />
            <Typography.Text>Status: {timeline.purchaseOrder.status}</Typography.Text>
          </Card>
          <Timeline
            items={timeline.events.map((ev) => ({
              children: (
                <div>
                  <span>
                    <b>{ev.type.replace(/_/g, ' ')}</b>: {ev.details}
                  </span>
                  <div style={{ color: '#888', fontSize: 12 }}>
                    {new Date(ev.date).toLocaleString()}
                  </div>
                </div>
              ),
              color:
                ev.type === 'ORDER_PLACED'
                  ? 'blue'
                  : ev.type === 'RECEIVED'
                  ? 'green'
                  : ev.type === 'CLEANING'
                  ? 'orange'
                  : ev.type === 'PROCESSING'
                  ? 'purple'
                  : ev.type === 'FINISHED_GOOD'
                  ? 'gold'
                  : 'gray',
            }))}
          />
          <div className="mt-4 flex justify-end">
            <button className="btn" onClick={handleBack}>
              Back to Orders
            </button>
          </div>
        </div>
      ) : (
        <Empty description="No timeline data" />
      )}
    </div>
  );
};

export default ProductPurchaseOrdersView;