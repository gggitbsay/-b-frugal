import React, { useState, useEffect } from "react";
import PriceChart from "../components/PriceChart";
import "./ProductDetail.css";

function formatPrice(v) {
  if (v == null) return "—";
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(v);
}

export default function ProductDetail({ product, onBack }) {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${product.id}/prices`)
      .then((r) => r.json())
      .then((data) => {
        setPrices(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [product.id]);

  const currentPrice = prices.length > 0 ? prices[prices.length - 1].price : null;
  const isDeal = product.target_price && currentPrice && currentPrice <= product.target_price;

  return (
    <div className="detail">
      <button className="detail-back" onClick={onBack}>
        ← Back to watchlist
      </button>

      <div className="detail-header">
        <div className="detail-meta">
          {product.category && (
            <span className="detail-category">{product.category}</span>
          )}
          {isDeal && <span className="detail-deal-badge">DEAL</span>}
        </div>
        <h1 className="detail-name">{product.name}</h1>
        <a
          className="detail-url"
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {product.url}
        </a>
      </div>

      <div className="detail-prices-row">
        <div className="detail-price-block">
          <span className="detail-price-label">Current price</span>
          <span className={`detail-price-value ${isDeal ? "detail-price-value--deal" : ""}`}>
            {formatPrice(currentPrice)}
          </span>
        </div>
        {product.target_price != null && (
          <div className="detail-price-block">
            <span className="detail-price-label">Target price</span>
            <span className="detail-price-value">{formatPrice(product.target_price)}</span>
          </div>
        )}
        {prices.length > 0 && (
          <>
            <div className="detail-price-block">
              <span className="detail-price-label">All-time low</span>
              <span className="detail-price-value detail-price-value--low">
                {formatPrice(Math.min(...prices.filter((p) => p.price != null).map((p) => p.price)))}
              </span>
            </div>
            <div className="detail-price-block">
              <span className="detail-price-label">All-time high</span>
              <span className="detail-price-value">
                {formatPrice(Math.max(...prices.filter((p) => p.price != null).map((p) => p.price)))}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="detail-chart-section">
        <h2 className="detail-section-title">Price history</h2>
        {loading ? (
          <div className="detail-loading">Loading price history…</div>
        ) : (
          <PriceChart prices={prices} targetPrice={product.target_price} />
        )}
      </div>

      <div className="detail-history-section">
        <h2 className="detail-section-title">Recent checks</h2>
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Price</th>
              <th>Raw</th>
              <th>In stock</th>
            </tr>
          </thead>
          <tbody>
            {[...prices].reverse().slice(0, 20).map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.checked_at).toLocaleString("nl-NL")}</td>
                <td className="history-price">{formatPrice(r.price)}</td>
                <td className="history-raw">{r.price_raw ?? "—"}</td>
                <td>{r.in_stock ? "✓" : "✗"}</td>
              </tr>
            ))}
            {prices.length === 0 && (
              <tr>
                <td colSpan={4} className="history-empty">
                  No price checks yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
