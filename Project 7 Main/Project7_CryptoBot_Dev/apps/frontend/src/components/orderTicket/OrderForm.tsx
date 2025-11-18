import React, { useState } from "react";
import clsx from "clsx";
import { Button } from "../ui/Button";
import { placeOrder, cancelOrder } from "../../services/api/tradingApi";

type OrderFormProps = {
  className?: string;
};

export default function OrderForm({ className }: OrderFormProps) {
  const [symbol, setSymbol] = useState('BTC-USDT');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [type, setType] = useState<'limit' | 'market'>('limit');
  const [quantity, setQuantity] = useState('0.01');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const response = await placeOrder({
        symbol,
        side,
        type,
        quantity: Number(quantity),
        price: price ? Number(price) : undefined,
      });
      setLastOrderId(response.orderId);
      setStatus(`Order ${response.orderId} acknowledged (${response.status}).`);
    } catch (err: any) {
      setStatus(err.message ?? 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!lastOrderId) return;
    setLoading(true);
    try {
      const response = await cancelOrder(lastOrderId, symbol);
      setStatus(`Cancel ${response.orderId} ${response.status}`);
    } catch (err: any) {
      setStatus(err.message ?? 'Cancel failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel" style={{ marginTop: 20 }}>
      <h3>Order Ticket</h3>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8 }}>
        <label>
          Symbol
          <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} />
        </label>
        <label>
          Side
          <select value={side} onChange={(e) => setSide(e.target.value as any)}>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </label>
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="limit">Limit</option>
            <option value="market">Market</option>
          </select>
        </label>
        <label>
          Quantity
          <input type="number" step="0.0001" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </label>
        {type === 'limit' && (
          <label>
            Price
            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
          </label>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Placing...' : 'Place order'}
        </Button>
        {lastOrderId && (
          <Button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="bg-transparent text-blue-600 hover:bg-blue-50 border border-blue-200"
          >
            Cancel {lastOrderId}
          </Button>
        )}
      </form>
      {status && <p className="muted" style={{ marginTop: 8 }}>{status}</p>}
    </div>
  );
}
