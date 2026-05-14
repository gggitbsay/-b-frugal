import React from "react";
import "./ProductCard.css";

function formatPrice(price) {
  if (price == null) return "—";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

function timeAgo(iso) {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function hostname(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export default function ProductCard({ product, onDelete, onEdit, onClick }) {
  const isDeal =
    product.price_drop &&
    product.current_price != null &&
    product.target_price != null;

  return (
    <div
      className={`product-card ${isDeal ? "product-card--deal" : ""}`}
      onClick={() => onClick(product)}
    >
      <div className="product-card__header">
        <span className="product-card__retailer">{hostname(product.url)}</span>
        {product.category && (
          <span className="product-card__category">{product.category}</span>
        )}
        {isDeal && <span className="product-card__deal-badge">DEAL</span>}
      </div>

      <div className="product-card__name">{product.name}</div>

      <div className="product-card__prices">
        <span className={`product-card__price ${isDeal ? "product-card__price--deal" : ""}`}>
          {formatPrice(product.current_price)}
        </span>
        {product.target_price != null && (
          <span className="product-card__target">
            target: {formatPrice(product.target_price)}
          </span>
        )}
      </div>

      <div className="product-card__footer">
        <span className="product-card__updated">
          checked {timeAgo(product.last_checked)}
        </span>
        <div className="product-card__actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="product-card__btn"
            onClick={() => onEdit(product)}
            title="Edit"
          >
            ✎
          </button>
          <button
            className="product-card__btn product-card__btn--danger"
            onClick={() => onDelete(product)}
            title="Delete"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
