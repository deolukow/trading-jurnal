import React, { useState } from "react";
import {
  Camera,
  Image as ImageIcon,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
} from "lucide-react";
import { useLocalImage } from "../../hooks/useLocalImage";
import { FullscreenImageModal } from "./FullscreenImageModal";
import { formatDateTime, formatCurrency, formatLotSize } from "../../utils/formatters";

export const TradeDetailModal = ({ trade, onClose, customFields, currency }) => {
  const [fullscreenImage, setFullscreenImage] = useState(null);
  if (!trade) return null;

  const ImageCard = ({ title, imageId, icon }) => {
    const imageUrl = useLocalImage(imageId);
    return (
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center">
          {icon} <span className="ml-1">{title}</span>
        </h3>
        {imageUrl ? (
          <div
            className="relative aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 cursor-pointer group"
            onClick={() => setFullscreenImage(imageUrl)}
          >
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-80"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 size={32} className="text-white" />
            </div>
          </div>
        ) : (
          <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 text-center text-sm p-4">
            Tidak Ada Gambar
          </div>
        )}
      </div>
    );
  };

  const isWin = trade.pnl > 0;
  const pnlColor = isWin
    ? "text-green-500 dark:text-green-400"
    : "text-red-500 dark:text-red-400";
  const typeIcon =
    trade.type === "long" ? (
      <ArrowUpRight size={20} className="text-green-500" />
    ) : (
      <ArrowDownRight size={20} className="text-red-500" />
    );

  const filledCustomFields = customFields.filter(
    (field) => trade.customData && trade.customData[field.name],
  );

  return (
    <>
      <FullscreenImageModal
        imageUrl={fullscreenImage}
        onClose={() => setFullscreenImage(null)}
      />
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              {typeIcon} <span className="ml-2">{trade.pair}</span>
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-3xl font-light"
            >
              &times;
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4 lg:col-span-1">
              <div className="flex items-center space-x-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                <Clock size={20} className="text-gray-400 dark:text-gray-500" />
                <span className="text-lg text-gray-700 dark:text-gray-300 font-medium">
                  {formatDateTime(trade.tradeDate)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    P&L
                  </p>
                  <p className={`text-2xl font-extrabold ${pnlColor}`}>
                    {formatCurrency(trade.pnl, currency)}
                  </p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Lot Size
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatLotSize(trade.lotSize)}
                  </p>
                </div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Risk/Reward Ratio
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {trade.riskRewardRatio > 0
                    ? `1 : ${parseFloat(trade.riskRewardRatio).toFixed(2)}`
                    : "N/A"}
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Setup / Strategi
                </p>
                <p className="text-gray-800 dark:text-white font-medium">
                  {trade.setup || "Tidak Ada Setup Dicatat"}
                </p>
              </div>
              {(trade.entryPrice > 0 ||
                trade.takeProfit > 0 ||
                trade.stopLoss > 0) && (
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg space-y-2">
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-semibold">
                    Detail Harga
                  </h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Entry Price:
                    </span>
                    <span className="text-gray-800 dark:text-white font-medium">
                      {trade.entryPrice > 0
                        ? trade.entryPrice.toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Take Profit:
                    </span>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {trade.takeProfit > 0
                        ? trade.takeProfit.toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Stop Loss:
                    </span>
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      {trade.stopLoss > 0
                        ? trade.stopLoss.toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
              )}
              {filledCustomFields.length > 0 && (
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg space-y-2">
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-semibold border-b border-gray-300 dark:border-gray-600 pb-2">
                    Field Tambahan
                  </h4>
                  {filledCustomFields.map((field) => (
                    <div
                      key={field.id}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-gray-500 dark:text-gray-400 capitalize">
                        {field.name}:
                      </span>
                      <span className="text-gray-800 dark:text-white font-medium text-right">
                        {trade.customData[field.name]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <ImageCard
                  title="Screenshot Sebelum Trade"
                  imageId={trade.screenshotBeforeId}
                  icon={
                    <Camera
                      size={18}
                      className="text-blue-500 dark:text-blue-400"
                    />
                  }
                />
                <ImageCard
                  title="Screenshot Sesudah Trade"
                  imageId={trade.screenshotAfterId}
                  icon={
                    <ImageIcon
                      size={18}
                      className="text-green-500 dark:text-green-400"
                    />
                  }
                />
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Catatan Trade
                </p>
                <p className="text-gray-800 dark:text-white text-sm whitespace-pre-wrap">
                  {trade.notes || "Tidak ada catatan."}
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TradeDetailModal;
