import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import "./PriceChart.css";

function formatPrice(v) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(v);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("nl-NL", {
    month: "short",
    day: "numeric",
  });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__date">{label}</div>
      <div className="chart-tooltip__price">
        {formatPrice(payload[0].value)}
      </div>
      {payload[0].payload.price_raw && (
        <div className="chart-tooltip__raw">{payload[0].payload.price_raw}</div>
      )}
    </div>
  );
};

export default function PriceChart({ prices, targetPrice }) {
  if (!prices || prices.length === 0) {
    return (
      <div className="chart-empty">No price history yet</div>
    );
  }

  const data = prices
    .filter((r) => r.price != null)
    .map((r) => ({
      date: formatDate(r.checked_at),
      price: r.price,
      price_raw: r.price_raw,
    }));

  if (data.length === 0) {
    return <div className="chart-empty">No parsed prices yet</div>;
  }

  const prices_vals = data.map((d) => d.price);
  const minPrice = Math.min(...prices_vals);
  const maxPrice = Math.max(...prices_vals);
  const padding = (maxPrice - minPrice) * 0.2 || 5;
  const domain = [
    Math.max(0, minPrice - padding),
    maxPrice + padding,
  ];

  return (
    <div className="chart-wrapper">
      <div className="chart-stats">
        <span className="chart-stat">
          <span className="chart-stat__label">Min</span>
          <span className="chart-stat__value">{formatPrice(minPrice)}</span>
        </span>
        <span className="chart-stat">
          <span className="chart-stat__label">Max</span>
          <span className="chart-stat__value">{formatPrice(maxPrice)}</span>
        </span>
        <span className="chart-stat">
          <span className="chart-stat__label">Current</span>
          <span className="chart-stat__value chart-stat__value--current">
            {formatPrice(data[data.length - 1].price)}
          </span>
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            domain={domain}
            tickFormatter={formatPrice}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          {targetPrice != null && (
            <ReferenceLine
              y={targetPrice}
              stroke="var(--deal)"
              strokeDasharray="4 3"
              label={{
                value: `Target ${formatPrice(targetPrice)}`,
                fill: "var(--deal)",
                fontSize: 11,
                position: "insideTopRight",
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="price"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={{ fill: "var(--accent)", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
