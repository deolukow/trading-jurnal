import React, { useState, useMemo } from "react";
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
  activeProfileId,
  tradingProfiles,
}) => {
  const [rowLimit, setRowLimit] = useState(25); // Default to 25 rows

  const displayedTrades = useMemo(() => {
    if (rowLimit === "all") return trades;
    return trades.slice(0, rowLimit);
  }, [trades, rowLimit]);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-gray-200 dark:border-gray-700 gap-3">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          {title}
        </h3>
        
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 w-full sm:w-auto justify-end">
          {/* Custom Premium Limit Rows Segmented Control */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-100/80 dark:bg-gray-950/40 p-1 rounded-xl border border-gray-250/20 dark:border-gray-700/40 backdrop-blur-sm shadow-inner">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-500 dark:text-gray-400 px-2 select-none">
              Tampilkan:
            </span>
            <div className="flex items-center gap-1">
              {[10, 25, 50, 100, "all"].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRowLimit(val)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all duration-300 cursor-pointer ${
                    rowLimit === val
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white shadow-[0_2px_8px_rgba(124,58,237,0.3)] scale-[1.03]"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-800/60 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  {val === "all" ? "Semua" : val}
                </button>
              ))}
            </div>
          </div>

          {onAddTrade && (
            <button
              onClick={onAddTrade}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-[0_0_12px_rgba(124,58,237,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all cursor-pointer"
            >
              <Plus size={16} /> Tambah Trade
            </button>
          )}
        </div>
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
              {activeProfileId === "all" && (
                <th scope="col" className="p-3">
                  Profile
                </th>
              )}
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
              <th {...headerProps("rating")}>
                Rating{" "}
                <span className="text-blue-500 dark:text-blue-400">
                  {getSortIndicator("rating")}
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
            {displayedTrades.length === 0 ? (
              <tr>
                <td
                  colSpan={12 + customFields.length}
                  className="text-center p-6 text-gray-500"
                >
                  Tidak ada trade untuk ditampilkan.
                </td>
              </tr>
            ) : (
              displayedTrades.map((trade) => (
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
                  {activeProfileId === "all" && (
                    <td className="p-3">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {tradingProfiles?.find(p => p.id === trade.profileId)?.name || "Unknown"}
                      </span>
                    </td>
                  )}
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
                    {formatCurrency(trade.pnl, tradingProfiles?.find(p => p.id === trade.profileId)?.currency || currency)}
                  </td>
                  <td className="p-3 text-right">
                    {trade.riskRewardRatio > 0
                      ? `${parseFloat(trade.riskRewardRatio).toFixed(2)}R`
                      : "-"}
                  </td>
                   <td className="p-3">{trade.setup || "-"}</td>
                  <td className="p-3 font-extrabold text-xs">
                    <span className={`px-2 py-0.5 rounded border font-black tracking-wide ${
                      trade.rating === 5 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" :
                      trade.rating === 4 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                      trade.rating === 3 ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" :
                      trade.rating === 2 ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20" :
                      trade.rating === 1 ? "bg-gray-500/10 text-gray-500 border-gray-500/20" :
                      "text-gray-400 dark:text-gray-500 border-transparent"
                    }`}>
                      {trade.rating === 5 ? "A+" :
                       trade.rating === 4 ? "A" :
                       trade.rating === 3 ? "B+" :
                       trade.rating === 2 ? "B" :
                       trade.rating === 1 ? "C" : "-"}
                    </span>
                  </td>
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
      {trades.length > 0 && (
        <div className="p-3 bg-gray-50/50 dark:bg-gray-900/20 text-xs text-gray-500 dark:text-gray-400 text-right border-t border-gray-150 dark:border-gray-700/30 select-none">
          Menampilkan <span className="font-bold text-gray-700 dark:text-gray-200">{displayedTrades.length}</span> dari <span className="font-bold text-gray-700 dark:text-gray-200">{trades.length}</span> trade
        </div>
      )}
    </div>
  );
};

export default TradeList;
