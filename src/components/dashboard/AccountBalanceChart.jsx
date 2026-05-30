import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { formatCurrency } from "../../utils/formatters";

export const AccountBalanceChart = ({ data, period, currency, chartType }) => {
  const axisColor = "#A0AEC0";
  const gridColor = "#4A5568";
  const tooltipLabel = chartType === "balance" ? "Saldo" : "P&L";

  const getXAxisFormat = (dateStr) => {
    if (dateStr === "Start") return "Awal";
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    if (period === "monthly" || period === "custom")
      return date.toLocaleString("id-ID", { month: "short", day: "numeric" });
    if (period === "weekly")
      return date.toLocaleString("id-ID", { month: "short", day: "numeric" });
    if (period === "daily")
      return date.toLocaleString("id-ID", { month: "short", day: "numeric" });
    if (period === "yearly") return date.getFullYear();
    return date.toLocaleDateString("id-ID");
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const displayLabel =
        label === "Start" ? "Awal Periode" : `Tanggal: ${label}`;
      return (
        <div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm p-3 rounded-lg border border-gray-300 dark:border-gray-600">
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            {displayLabel}
          </p>
          <p className="text-gray-900 dark:text-white font-bold">{`${tooltipLabel}: ${formatCurrency(payload[0].value, currency)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 5, right: 20, left: -10, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis
          dataKey="name"
          stroke={axisColor}
          tickFormatter={getXAxisFormat}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          stroke={axisColor}
          tickFormatter={(value) =>
            currency === "IDR" ? `${value / 1000000}jt` : `$${value / 100}k`
          }
          tick={{ fontSize: 12 }}
          domain={["dataMin", "dataMax"]}
        />
        <Tooltip content={<CustomTooltip />} />
        {chartType === "pnl" && (
          <ReferenceLine y={0} stroke={axisColor} strokeDasharray="4 4" />
        )}
        <defs>
          <linearGradient id="colorChart" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="linear"
          dataKey="value"
          stroke="#8b5cf6"
          fillOpacity={1}
          fill="url(#colorChart)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default AccountBalanceChart;
