const BASE = "/api";

async function request(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request("GET", `/products/${qs ? `?${qs}` : ""}`);
  },
  getProduct: (id) => request("GET", `/products/${id}`),
  createProduct: (data) => request("POST", "/products/", data),
  updateProduct: (id, data) => request("PUT", `/products/${id}`, data),
  deleteProduct: (id) => request("DELETE", `/products/${id}`),
  getProductPrices: (id) => request("GET", `/products/${id}/prices`),
};
