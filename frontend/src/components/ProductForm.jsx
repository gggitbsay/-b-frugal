import React, { useState, useEffect } from "react";
import "./ProductForm.css";

const CATEGORIES = [
  "Electronics",
  "Computers",
  "Phones",
  "Audio",
  "Appliances",
  "Furniture",
  "Clothing",
  "Sports",
  "Other",
];

export default function ProductForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    name: "",
    url: "",
    category: "",
    target_price: "",
    ...initial,
    target_price: initial?.target_price ?? "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      url: form.url.trim(),
      category: form.category || null,
      target_price: form.target_price !== "" ? parseFloat(form.target_price) : null,
    };
    onSubmit(payload);
  }

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label className="form-label">Product name *</label>
        <input
          className="form-input"
          value={form.name}
          onChange={set("name")}
          placeholder="e.g. Sony WH-1000XM5"
          required
        />
      </div>

      <div className="form-field">
        <label className="form-label">URL *</label>
        <input
          className="form-input"
          type="url"
          value={form.url}
          onChange={set("url")}
          placeholder="https://www.coolblue.nl/product/..."
          required
        />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label className="form-label">Category</label>
          <select className="form-input" value={form.category} onChange={set("category")}>
            <option value="">— none —</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="form-label">Target price (€)</label>
          <input
            className="form-input"
            type="number"
            min="0"
            step="0.01"
            value={form.target_price}
            onChange={set("target_price")}
            placeholder="e.g. 249.99"
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Saving…" : initial ? "Save changes" : "Add product"}
        </button>
      </div>
    </form>
  );
}
