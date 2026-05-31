import React from "react";
import { Info, Edit3, Trash2, Plus } from "lucide-react";
import { formatDateTime, formatCurrency, formatDuration } from "../../utils/formatters";

export const TradeList = ({
  trades,
  onEdit,
  onDelete,
  onView,
  onAddTrade,
  onCloseTrade,
  title = "Riwayat Trade",
  requestSort,
  sortConfig,
  customFields,
  currency,
}) => {
  const getSortIndicator = (key) => {
    if (sortConfig && sortConfig.key === key) {
      return sortConfig.direction === "ascending" ? "▲" : "▼";
    }
    return null;
  };

  const handleHeaderClick = (key) => {
    if (requestSort) {
      requestSort(key);
    }
  };

  const headerProps = (key, isRightAligned = false) => {
    let className = "p-3";
    if (isRightAligned) className += " text-right";
    if (requestSort)
      className +=
        " cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors";

    return {
      scope: "col",
      className: className,
      onClick: () => handleHeaderClick(key),
    };
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg animate-fadeIn overflow-hidden mt-6">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          {title}
        </h3>
        {onAddTrade && (
          <button
            onClick={onAddTrade}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md hover:shadow-[0_0_12px_rgba(124,58,237,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all cursor-pointer"
          >
            <Plus size={16} /> Tambah Trade
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700">
            <tr>
              <th {...headerProps("tradeDate")}>
                Entry{" "}
                <span className="text-blue-500 dark:text-blue-400">
                  {getSortIndicator("tradeDate")}
                </span>
              </th>
              <th {...headerProps("exitDate")}>
                Exit{" "}
                <span className="text-blue-500 dark:text-blue-400">
                  {getSortIndicator("exitDate")}
                </span>
              </th>
              <th scope="col" className="p-3 text-center">
                Status
              </th>
              <th scope="col" className="p-3">
                Durasi
              </th>
              <th {...headerProps("pair")}>
                Pair{" "}
                <span className="text-blue-500 dark:text-blue-400">
                  {getSortIndicator("pair")}
                </span>
              </th>
              <th {...headerProps("type")}>
                Tipe{" "}
                <span className="text-blue-500 dark:text-blue-400">
                  {getSortIndicator("type")}
                </span>
              </th>
              <th {...headerProps("lotSize", true)}>
                Lot{" "}
                <span className="text-blue-500 dark:text-blue-400">
                  {getSortIndicator("lotSize")}
                </span>
              </th>
              <th {...headerProps("pnl", true)}>
                P&L{" "}
                <span className="text-blue-500 dark:text-blue-400">
                  {getSortIndicator("pnl")}
                </span>
              </th>
              <th {...headerProps("riskRewardRatio", true)}>
                R:R{" "}
                <span className="text-blue-500 dark:text-blue-400">
                  {getSortIndicator("riskRewardRatio")}
                </span>
              </th>
              <th {...headerProps("setup")}>
                Setup{" "}
                <span className="text-blue-500 dark:text-blue-400">
                  {getSortIndicator("setup")}
                </span>
              </th>
              {customFields.map((field) => (
                <th key={field.id} {...headerProps(field.name)}>
                  {field.name}{" "}
                  <span className="text-blue-500 dark:text-blue-400">
                    {getSortIndicator(field.name)}
                  </span>
                </th>
              ))}
              <th scope="col" className="p-3 text-center">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td
                  colSpan={11 + customFields.length}
                  className="text-center p-6 text-gray-500"
                >
                  Tidak ada trade untuk ditampilkan.
                </td>
              </tr>
            ) : (
              trades.map((trade) => (
                <tr
                  key={trade.id}
                  className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="p-3">{formatDateTime(trade.tradeDate)}</td>
                  <td className="p-3">
                    {trade.exitDate ? formatDateTime(trade.exitDate) : "-"}
                  </td>
                  <td className="p-3 text-center">
                    {trade.exitDate ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-extrabold rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400 border border-gray-250/30 dark:border-gray-600/40 shadow-sm transition-all duration-300 select-none">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500"></span>
                        CLOSED
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onCloseTrade) onCloseTrade(trade);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-extrabold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/10 shadow-[0_0_12px_rgba(124,58,237,0.15)] hover:bg-blue-500/20 hover:border-blue-500/30 active:scale-95 transform transition-all cursor-pointer select-none"
                        title="Klik untuk Menutup Posisi Trade Ini Sekarang"
                      >
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                        </span>
                        OPEN
                      </button>
                    )}
                  </td>
                  <td className="p-3 font-medium text-gray-500 dark:text-gray-400">
                    {formatDuration(trade.tradeDate, trade.exitDate)}
                  </td>
                  <td className="p-3 font-semibold text-gray-900 dark:text-white">
                    {trade.pair}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        trade.type === "long"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {trade.type}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {typeof trade.lotSize === "number"
                      ? trade.lotSize.toFixed(2)
                      : parseFloat(trade.lotSize || 0).toFixed(2)}
                  </td>
                  <td
                    className={`p-3 text-right font-bold ${
                      trade.pnl >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatCurrency(trade.pnl, currency)}
                  </td>
                  <td className="p-3 text-right">
                    {trade.riskRewardRatio > 0
                      ? `${parseFloat(trade.riskRewardRatio).toFixed(2)}R`
                      : "-"}
                  </td>
                  <td className="p-3">{trade.setup || "-"}</td>
                  {customFields.map((field) => (
                    <td key={field.id} className="p-3">
                      {trade.customData?.[field.name] || "-"}
                    </td>
                  ))}
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => onView(trade)}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                        title="Lihat Rincian"
                      >
                        <Info size={16} />
                      </button>
                      <button
                        onClick={() => onEdit(trade)}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400"
                        title="Edit Trade"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => onDelete("trade", trade)}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500"
                        title="Delete Trade"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradeList;
