import React, { useState } from "react";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import ProductDetail from "./pages/ProductDetail";
import ProductForm from "./components/ProductForm";
import { api } from "./api/client";
import "./App.css";

export default function App() {
  const [view, setView] = useState("dashboard"); // "dashboard" | "detail"
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modal, setModal] = useState(null); // null | "add" | { mode: "edit", product }
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  function openAdd() {
    setModal("add");
    setFormError(null);
  }

  function openEdit(product) {
    setModal({ mode: "edit", product });
    setFormError(null);
  }

  async function handleFormSubmit(payload) {
    setFormLoading(true);
    setFormError(null);
    try {
      if (modal === "add") {
        await api.createProduct(payload);
      } else {
        await api.updateProduct(modal.product.id, payload);
      }
      setModal(null);
      refresh();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(product) {
    if (!confirm(`Remove "${product.name}" from watchlist?`)) return;
    try {
      await api.deleteProduct(product.id);
      if (view === "detail" && selectedProduct?.id === product.id) {
        setView("dashboard");
        setSelectedProduct(null);
      }
      refresh();
    } catch (e) {
      alert("Failed to delete: " + e.message);
    }
  }

  function handleSelectProduct(product) {
    setSelectedProduct(product);
    setView("detail");
  }

  return (
    <div className="app">
      <Header onAddProduct={openAdd} />

      <main className="app-main">
        {view === "dashboard" && (
          <Dashboard
            onSelectProduct={handleSelectProduct}
            onAddProduct={openAdd}
            onEditProduct={openEdit}
            onDeleteProduct={handleDelete}
            refreshKey={refreshKey}
          />
        )}
        {view === "detail" && selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            onBack={() => setView("dashboard")}
          />
        )}
      </main>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {modal === "add" ? "Add product" : "Edit product"}
              </h2>
              <button className="modal-close" onClick={() => setModal(null)}>
                ✕
              </button>
            </div>
            {formError && (
              <div className="modal-error">{formError}</div>
            )}
            <ProductForm
              initial={modal !== "add" ? modal.product : undefined}
              onSubmit={handleFormSubmit}
              onCancel={() => setModal(null)}
              loading={formLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
}
