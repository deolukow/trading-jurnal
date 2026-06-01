import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Camera,
  Image as ImageIcon,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  Share2,
  CheckCircle,
} from "lucide-react";
import { useLocalImage } from "../../hooks/useLocalImage";
import { FullscreenImageModal } from "./FullscreenImageModal";
import { ShareCardModal } from "./ShareCardModal";
import { formatDateTime, formatCurrency, formatLotSize, formatDuration } from "../../utils/formatters";

export const TradeDetailModal = ({ trade, onClose, customFields, currency, activeProfileName, strategies = [] }) => {
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(-1);
  const [showShareModal, setShowShareModal] = useState(false);

  // Lift image hooks to the top level
  const beforeImageUrl = useLocalImage(trade?.screenshotBeforeId);
  const afterImageUrl = useLocalImage(trade?.screenshotAfterId);

  // Touch Drag to Dismiss Logic
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    const currentY = e.touches[0].clientY;
    const diffY = currentY - touchStartY.current;
    if (diffY > 0) {
      setTranslateY(diffY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (translateY > 120) {
      onClose();
    } else {
      setTranslateY(0);
    }
  };

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Backdrop click handler
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Construct dynamic list of images that actually exist
  const availableImages = useMemo(() => {
    const list = [];
    if (beforeImageUrl) {
      list.push({
        url: beforeImageUrl,
        title: "Screenshot Sebelum Trade",
        type: "before",
      });
    }
    if (afterImageUrl) {
      list.push({
        url: afterImageUrl,
        title: "Screenshot Sesudah Trade",
        type: "after",
      });
    }
    return list;
  }, [beforeImageUrl, afterImageUrl]);

  const activeStrategy = useMemo(() => {
    if (!strategies || !trade || !trade.setup) return null;
    return strategies.find((s) => s.title === trade.setup);
  }, [strategies, trade]);

  if (!trade) return null;

  const ImageCard = ({ title, imageUrl, icon, onClick }) => {
    return (
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center">
          {icon} <span className="ml-1">{title}</span>
        </h3>
        {imageUrl ? (
          <div
            className="relative aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 cursor-pointer group"
            onClick={onClick}
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
        images={availableImages}
        initialIndex={fullscreenImageIndex}
        onClose={() => setFullscreenImageIndex(-1)}
      />
      {showShareModal && (
        <ShareCardModal
          trade={trade}
          onClose={() => setShowShareModal(false)}
          currency={currency}
          activeProfileName={activeProfileName}
        />
      )}
      <div 
        onClick={handleBackdropClick}
        className="fixed inset-0 bg-slate-950/45 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn"
      >
        <style>{`
          @keyframes modalSpringIn {
            0% {
              opacity: 0;
              transform: scale(0.93) translateY(30px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          .animate-modalSpringIn {
            animation: modalSpringIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
        `}</style>
        <div 
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-modalSpringIn relative border border-gray-100 dark:border-gray-700/50"
          style={{
            transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
            transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
          }}
        >
          {/* Swipe drag handle indicator for mobile */}
          <div 
            className="md:hidden flex justify-center pb-3 cursor-grab active:cursor-grabbing select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          </div>

          <div 
            className="flex justify-between items-start mb-6 border-b border-gray-200 dark:border-gray-700 pb-4 flex-shrink-0 cursor-grab active:cursor-grabbing select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <span className="flex items-center">{typeIcon} <span className="ml-2">{trade.pair}</span></span>
              {trade.rating && (
                <span className={`px-3 py-1 text-sm font-black rounded-lg border shadow-md tracking-wider ${
                  trade.rating === 5 ? "bg-amber-500/15 text-amber-500 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)] animate-pulse" :
                  trade.rating === 4 ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/40" :
                  trade.rating === 3 ? "bg-blue-500/15 text-blue-500 border-blue-500/40" :
                  trade.rating === 2 ? "bg-violet-500/15 text-violet-500 border-violet-500/40" :
                  "bg-gray-500/15 text-gray-400 border-gray-500/40"
                }`}>
                  {trade.rating === 5 ? "A+" :
                   trade.rating === 4 ? "A" :
                   trade.rating === 3 ? "B+" :
                   trade.rating === 2 ? "B" : "C"}
                </span>
              )}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-3xl font-light leading-none p-1"
            >
              &times;
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto flex-grow pr-1">
            <div className="space-y-4 lg:col-span-1">
              <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/30 space-y-3.5 shadow-sm">
                <div className="flex items-center space-x-3">
                  <Clock size={16} className="text-blue-500 dark:text-blue-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">
                      Tanggal & Jam Entry
                    </span>
                    <span className="text-sm text-gray-800 dark:text-white font-semibold">
                      {formatDateTime(trade.tradeDate)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 border-t border-gray-200 dark:border-gray-600/50 pt-2.5">
                  <Clock size={16} className="text-red-500 dark:text-red-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">
                      Tanggal & Jam Exit
                    </span>
                    <span className="text-sm text-gray-800 dark:text-white font-semibold">
                      {trade.exitDate ? formatDateTime(trade.exitDate) : "Belum Keluar / Masih Terbuka"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-xs">
                    P&L
                  </p>
                  <p className={`text-2xl font-extrabold ${pnlColor}`}>
                    {formatCurrency(trade.pnl, currency)}
                  </p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-xs">
                    Lot Size
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatLotSize(trade.lotSize)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-xs">
                    Risk/Reward Ratio
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {trade.riskRewardRatio > 0
                      ? `1 : ${parseFloat(trade.riskRewardRatio).toFixed(2)}`
                      : "N/A"}
                  </p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-xs">
                    Durasi Trade
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatDuration(trade.tradeDate, trade.exitDate)}
                  </p>
                </div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 text-xs">
                  Setup / Strategi
                </p>
                <p className="text-gray-800 dark:text-white font-medium">
                  {trade.setup || "Tidak Ada Setup Dicatat"}
                </p>
              </div>

              {/* Eye-catching Setup Rating Widget */}
              <div className={`p-4 rounded-xl border shadow-sm flex items-center justify-between transition-all duration-300 ${
                (trade.rating || 5) === 5 ? "bg-gradient-to-r from-amber-500/10 to-transparent dark:from-amber-500/5 dark:to-transparent border-amber-500/35 shadow-[0_0_15px_rgba(245,158,11,0.08)]" :
                (trade.rating || 5) === 4 ? "bg-gradient-to-r from-emerald-500/10 to-transparent dark:from-emerald-500/5 dark:to-transparent border-emerald-500/35" :
                (trade.rating || 5) === 3 ? "bg-gradient-to-r from-blue-500/10 to-transparent dark:from-blue-500/5 dark:to-transparent border-blue-500/35" :
                (trade.rating || 5) === 2 ? "bg-gradient-to-r from-violet-500/10 to-transparent dark:from-violet-500/5 dark:to-transparent border-violet-500/35" :
                "bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-650"
              }`}>
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Setup Rating Quality
                  </span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1 truncate">
                    {(trade.rating || 5) === 5 && "Sangat Kuat - SOP Terpenuhi Sempurna"}
                    {trade.rating === 4 && "Kuat - Setup Standar Konfirmasi Jelas"}
                    {trade.rating === 3 && "Cukup - Setup Moderat Cukup Konfirmasi"}
                    {trade.rating === 2 && "Lemah - Setup Agresif / Minim Konfirmasi"}
                    {trade.rating === 1 && "Kurang - High Risk Setup / Spekulatif"}
                  </span>
                </div>
                <div className={`px-4 py-2.5 rounded-lg border font-black text-2xl tracking-wide flex items-center justify-center flex-shrink-0 ${
                  (trade.rating || 5) === 5 ? "bg-amber-500/15 text-amber-500 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]" :
                  (trade.rating || 5) === 4 ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/40" :
                  (trade.rating || 5) === 3 ? "bg-blue-500/15 text-blue-500 border-blue-500/40" :
                  (trade.rating || 5) === 2 ? "bg-violet-500/15 text-violet-500 border-violet-500/40" :
                  "bg-gray-500/15 text-gray-400 border-gray-500/40"
                }`}>
                  {(trade.rating || 5) === 5 ? "A+" :
                   (trade.rating || 5) === 4 ? "A" :
                   (trade.rating || 5) === 3 ? "B+" :
                   (trade.rating || 5) === 2 ? "B" : "C"}
                </div>
              </div>
              {(trade.entryPrice > 0 ||
                trade.takeProfit > 0 ||
                trade.stopLoss > 0) && (
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg space-y-2">
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-semibold text-xs">
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
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-semibold border-b border-gray-300 dark:border-gray-600 pb-2 text-xs">
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
                  imageUrl={beforeImageUrl}
                  icon={
                    <Camera
                      size={18}
                      className="text-blue-500 dark:text-blue-400"
                    />
                  }
                  onClick={() => {
                    const idx = availableImages.findIndex((img) => img.type === "before");
                    if (idx !== -1) setFullscreenImageIndex(idx);
                  }}
                />
                <ImageCard
                  title="Screenshot Sesudah Trade"
                  imageUrl={afterImageUrl}
                  icon={
                    <ImageIcon
                      size={18}
                      className="text-green-500 dark:text-green-400"
                    />
                  }
                  onClick={() => {
                    const idx = availableImages.findIndex((img) => img.type === "after");
                    if (idx !== -1) setFullscreenImageIndex(idx);
                  }}
                />
              </div>

              {/* Checklist Kriteria Strategy / Setup SOP Review */}
              {activeStrategy && activeStrategy.checklists && activeStrategy.checklists.length > 0 && (
                <div className="bg-gray-50/50 dark:bg-gray-900/35 border border-gray-200 dark:border-gray-700/60 p-4 rounded-xl space-y-3 shadow-inner">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700/60">
                    <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-gray-500 dark:text-gray-400">
                      SOP Entry Criteria Verification
                    </h4>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full border border-green-500/20">
                      {trade.criteriaChecked ? trade.criteriaChecked.length : 0} dari {activeStrategy.checklists.length} Syarat Terpenuhi
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeStrategy.checklists.map((criterion, idx) => {
                      const isChecked = trade.criteriaChecked && trade.criteriaChecked.includes(criterion);
                      return (
                        <div
                          key={idx}
                          className={`flex items-center gap-3 p-3 rounded-lg border select-none transition-all duration-300 ${
                            isChecked
                              ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300 shadow-[0_0_8px_rgba(34,197,94,0.05)]"
                              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/70 text-gray-400 dark:text-gray-500 line-through decoration-gray-300 dark:decoration-gray-600"
                          }`}
                        >
                          {isChecked ? (
                            <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-650 flex items-center justify-center flex-shrink-0 text-red-500 dark:text-red-400 font-bold text-[10px] select-none bg-gray-50 dark:bg-gray-850">&times;</div>
                          )}
                          <span className="text-xs font-semibold leading-tight">
                            {criterion}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 text-xs">
                  Catatan Trade
                </p>
                <p className="text-gray-800 dark:text-white text-sm whitespace-pre-wrap">
                  {trade.notes || "Tidak ada catatan."}
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 flex-shrink-0">
            <button
              onClick={() => setShowShareModal(true)}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg hover:shadow-[0_0_12px_rgba(139,92,246,0.4)] active:scale-95 transition-all flex items-center gap-2 font-medium text-sm"
            >
              <Share2 size={18} />
              Bagikan Trade
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium text-sm"
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
