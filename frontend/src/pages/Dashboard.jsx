import React, { useState, useEffect, useCallback } from "react";
import ProductCard from "../components/ProductCard";
import "./Dashboard.css";

export default function Dashboard({ onSelectProduct, onAddProduct, onEditProduct, onDeleteProduct, refreshKey }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ category: "", sort: "added", search: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { active_only: true };
      if (filter.category) params.category = filter.category;
      const qs = new URLSearchParams(params).toString();
      const res = await fetch(`/api/products/?${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProducts(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter.category, refreshKey]);

  useEffect(() => {
    load();
  }, [load]);

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  const sorted = [...products]
    .filter((p) =>
      filter.search === "" ||
      p.name.toLowerCase().includes(filter.search.toLowerCase())
    )
    .sort((a, b) => {
      if (filter.sort === "price_asc") return (a.current_price ?? Infinity) - (b.current_price ?? Infinity);
      if (filter.sort === "price_desc") return (b.current_price ?? 0) - (a.current_price ?? 0);
      if (filter.sort === "deals") return (b.price_drop ? 1 : 0) - (a.price_drop ? 1 : 0);
      return new Date(b.added_date) - new Date(a.added_date);
    });

  const dealCount = products.filter((p) => p.price_drop).length;

  return (
    <div className="dashboard">
      <div className="dashboard-toolbar">
        <div className="dashboard-stats">
          <span className="stat-chip">{products.length} products</span>
          {dealCount > 0 && (
            <span className="stat-chip stat-chip--deal">{dealCount} deal{dealCount > 1 ? "s" : ""}!</span>
          )}
        </div>

        <div className="dashboard-filters">
          <input
            className="filter-input"
            placeholder="Search…"
            value={filter.search}
            onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
          />
          <select
            className="filter-select"
            value={filter.category}
            onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value }))}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="filter-select"
            value={filter.sort}
            onChange={(e) => setFilter((f) => ({ ...f, sort: e.target.value }))}
          >
            <option value="added">Newest first</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
            <option value="deals">Deals first</option>
          </select>
        </div>
      </div>

      {loading && <div className="dashboard-loading">Loading…</div>}
      {error && (
        <div className="dashboard-error">
          Failed to load products: {error}
          <button onClick={load} className="btn-retry">Retry</button>
        </div>
      )}

      {!loading && !error && sorted.length === 0 && (
        <div className="dashboard-empty">
          <p>No products in your watchlist yet.</p>
          <button className="btn-primary" onClick={onAddProduct}>
            + Add your first product
          </button>
        </div>
      )}

      <div className="product-grid">
        {sorted.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onClick={onSelectProduct}
            onEdit={onEditProduct}
            onDelete={onDeleteProduct}
          />
        ))}
      </div>
    </div>
  );
}
