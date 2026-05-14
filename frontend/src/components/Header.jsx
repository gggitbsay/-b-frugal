import React from "react";
import "./Header.css";

export default function Header({ onAddProduct }) {
  return (
    <header className="header">
      <div className="header-logo">
        <span className="header-logo-icon">📉</span>
        <span className="header-logo-text">PriceWatch</span>
      </div>
      <button className="btn-primary" onClick={onAddProduct}>
        + Add product
      </button>
    </header>
  );
}
