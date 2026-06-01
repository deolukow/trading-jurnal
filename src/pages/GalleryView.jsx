import React from "react";
import { Image, Info } from "lucide-react";
import { DateRangePicker } from "../components/dashboard/DateRangePicker";
import { useLocalImage } from "../hooks/useLocalImage";
import { formatDateTime, formatCurrency } from "../utils/formatters";
import { classNames } from "../utils/helpers";

export const GalleryView = ({
  trades,
  activePeriod,
  setActivePeriod,
  periods,
  onShowTradeDetail,
  currency,
  customStartDate,
  customEndDate,
  setCustomStartDate,
  setCustomEndDate,
}) => {
  const GalleryImage = ({ trade }) => {
    const imageUrl = useLocalImage(trade.screenshotAfterId);
    const isWin = trade.pnl > 0;
    const pnlColor = isWin
      ? "text-green-500 dark:text-green-400"
      : "text-red-500 dark:text-red-400";

    if (!imageUrl) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 relative aspect-video flex flex-col justify-between p-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex justify-between items-center">
              {trade.pair}
              {trade.rating && (
                <span className={`px-2 py-0.5 text-[10px] font-black rounded-lg border tracking-wide ${
                  trade.rating === 5 ? "bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-[0_0_6px_rgba(245,158,11,0.1)]" :
                  trade.rating === 4 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" :
                  trade.rating === 3 ? "bg-blue-500/10 text-blue-500 border-blue-500/30" :
                  trade.rating === 2 ? "bg-violet-500/10 text-violet-500 border-violet-500/30" :
                  "bg-gray-500/10 text-gray-400 border-gray-500/30"
                }`}>
                  {trade.rating === 5 ? "A+" :
                   trade.rating === 4 ? "A" :
                   trade.rating === 3 ? "B+" :
                   trade.rating === 2 ? "B" : "C"}
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Memuat gambar...
            </p>
          </div>
          <div className="flex justify-between items-end mt-2">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">P&L</p>
              <p className={`text-lg font-bold ${pnlColor}`}>
                {formatCurrency(trade.pnl, currency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">R:R</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {trade.riskRewardRatio > 0
                  ? `${parseFloat(trade.riskRewardRatio).toFixed(2)}R`
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] border border-gray-200 dark:border-gray-700 relative group"
        onClick={() => onShowTradeDetail(trade)}
      >
        <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-700 relative">
          <img
            src={imageUrl}
            alt={`Trade ${trade.pair}`}
            className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-80"
          />
          
          {/* Elegant Setup Rating Overlay Badge on Thumbnail */}
          {trade.rating && (
            <span className={`absolute top-2.5 left-2.5 z-10 px-2.5 py-0.5 text-[10px] font-black rounded-lg border tracking-wider shadow-md select-none ${
              trade.rating === 5 ? "bg-amber-500/90 border-amber-400 text-white shadow-[0_2px_8px_rgba(245,158,11,0.4)]" :
              trade.rating === 4 ? "bg-emerald-500/90 border-emerald-400 text-white" :
              trade.rating === 3 ? "bg-blue-500/90 border-blue-400 text-white" :
              trade.rating === 2 ? "bg-violet-500/90 border-violet-400 text-white" :
              "bg-gray-650/90 border-gray-500 text-white"
            }`}>
              SETUP {trade.rating === 5 ? "A+" :
                     trade.rating === 4 ? "A" :
                     trade.rating === 3 ? "B+" :
                     trade.rating === 2 ? "B" : "C"}
            </span>
          )}

          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              className="text-white bg-blue-600 p-3 rounded-full hover:bg-blue-700"
            >
              <Info size={24} />
            </button>
          </div>
        </div>
        <div className="p-3">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex justify-between items-center">
            {trade.pair}
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                trade.type === "long"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
              }`}
            >
              {trade.type.toUpperCase()}
            </span>
          </h3>
          <div className="flex justify-between items-end mt-2">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">P&L</p>
              <p className={`text-lg font-bold ${pnlColor}`}>
                {formatCurrency(trade.pnl, currency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">R:R</p>
              <p
                className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[120px]"
                title={
                  trade.riskRewardRatio > 0
                    ? `${parseFloat(trade.riskRewardRatio).toFixed(2)}R`
                    : "N/A"
                }
              >
                {trade.riskRewardRatio > 0
                  ? `${parseFloat(trade.riskRewardRatio).toFixed(2)}R`
                  : "N/A"}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">
            {formatDateTime(trade.tradeDate)}
          </p>
        </div>
      </div>
    );
  };

  const galleryTrades = trades
    .filter((trade) => trade.screenshotAfterId)
    .sort((a, b) => new Date(b.tradeDate) - new Date(a.tradeDate));

  return (
    <div className="animate-fadeIn">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Galeri Visual Trade
      </h2>
      <div className="flex space-x-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => setActivePeriod(p.key)}
            className={classNames(
              "px-4 py-2 text-sm font-medium rounded-lg transition-colors flex-grow",
              activePeriod === p.key
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      {activePeriod === "custom" && (
        <DateRangePicker
          startDate={customStartDate}
          endDate={customEndDate}
          onStartDateChange={setCustomStartDate}
          onEndDateChange={setCustomEndDate}
        />
      )}
      {galleryTrades.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-10 rounded-xl text-center text-gray-500 mt-10">
          <Image
            size={48}
            className="mx-auto mb-3 text-gray-400 dark:text-gray-600"
          />
          <p className="text-lg">
            Tidak ada trade dengan gambar pada periode ini.
          </p>
          <p className="text-sm mt-1">
            Pastikan Anda mengupload gambar saat menambahkan trade.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {galleryTrades.map((trade) => (
            <GalleryImage key={trade.id} trade={trade} />
          ))}
        </div>
      )}
    </div>
  );
};

export default GalleryView;
