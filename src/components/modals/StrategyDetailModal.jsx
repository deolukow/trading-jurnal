import React, { useState } from "react";
import { X, CheckCircle, Edit3, Trash2, Calendar, Award, BookOpen, Layers } from "lucide-react";
import { useLocalImage } from "../../hooks/useLocalImage";

const StrategyDetailImageLoader = ({ imageId, onClick }) => {
  const url = useLocalImage(imageId);
  if (!url) return <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg border border-gray-300 dark:border-gray-600"></div>;
  return (
    <div 
      className="relative group w-20 h-20 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-95 duration-200"
      onClick={onClick}
    >
      <img
        src={url}
        alt="Setup Preview"
        className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300"
      />
      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span className="text-[10px] text-white font-medium bg-black/50 px-1.5 py-0.5 rounded">Buka</span>
      </div>
    </div>
  );
};

export const StrategyDetailModal = ({
  isOpen,
  onClose,
  strategy,
  tradingProfiles = [],
  onEdit,
  onDelete,
  handleImagePreview,
}) => {
  if (!isOpen || !strategy) return null;

  // Local state for interactive checkboxes
  const [checkedItems, setCheckedItems] = useState({});

  const toggleCheck = (idx) => {
    setCheckedItems(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const associatedProfile = tradingProfiles?.find(p => p.id === strategy.profileId);

  // Format dates
  const formatDate = (dateInput) => {
    if (!dateInput) return "-";
    const date = new Date(dateInput);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) + " " + date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Close modal on Escape press
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-950/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn"
    >
      <style>{`
        @keyframes modalSpringIn {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modalSpringIn {
          animation: modalSpringIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col animate-modalSpringIn border border-gray-150 dark:border-gray-700/60 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2.5">
            <BookOpen className="text-blue-500 flex-shrink-0" size={22} />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate max-w-[450px]">
              {strategy.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Grid: Description & Checklist on left, Meta & Images on right */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            
            {/* Left Section (3 cols on desktop): Description and SOP criteria */}
            <div className="md:col-span-3 space-y-6">
              
              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Keterangan & SOP Detail
                </h4>
                {strategy.description ? (
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {strategy.description}
                  </div>
                ) : (
                  <p className="text-sm italic text-gray-400 dark:text-gray-500">
                    Tidak ada keterangan tertulis.
                  </p>
                )}
              </div>

              {/* Entry Criteria Checklist */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500" />
                  Entry SOP Rules Checklist
                </h4>
                
                {strategy.checklists && strategy.checklists.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 italic">
                      Tip: Klik syarat di bawah ini untuk konfirmasi setup saat ini.
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {strategy.checklists.map((chk, idx) => {
                        const isChecked = !!checkedItems[idx];
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleCheck(idx)}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer select-none transition-all duration-200 ${
                              isChecked 
                                ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900/60" 
                                : "bg-white dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500/50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-gray-600 cursor-pointer"
                            />
                            <span className={`text-xs font-medium leading-normal break-words flex-1 transition-colors ${
                              isChecked 
                                ? "text-emerald-800 dark:text-emerald-300 line-through opacity-85" 
                                : "text-gray-700 dark:text-gray-300"
                            }`}>
                              {chk}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm italic text-gray-400 dark:text-gray-500">
                    Belum ada kriteria checklist yang dicatat.
                  </p>
                )}
              </div>
            </div>

            {/* Right Section (2 cols on desktop): Stats & Setup Images */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Strategy Details Box */}
              <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-150 dark:border-gray-700/60 space-y-4">
                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Info Ringkasan
                </h4>
                
                {/* Winrate Probability */}
                {strategy.probability !== undefined && strategy.probability !== null && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Target Winrate:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{strategy.probability}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${strategy.probability}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Profile Link */}
                {associatedProfile && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-250/30 dark:border-gray-700/35">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Layers size={13} className="text-indigo-500" />
                      Trading Account:
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/30">
                      {associatedProfile.name}
                    </span>
                  </div>
                )}

                {/* Dates */}
                <div className="space-y-2.5 pt-2.5 border-t border-gray-250/30 dark:border-gray-700/35 text-[11px] text-gray-400 dark:text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span>Dibuat: {formatDate(strategy.createdAt)}</span>
                  </div>
                  {strategy.updatedAt && strategy.createdAt !== strategy.updatedAt && (
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} />
                      <span>Diupdate: {formatDate(strategy.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Images Preview Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Award size={14} className="text-blue-500" />
                  Contoh Setup Gambar
                </h4>

                {strategy.imageIds && strategy.imageIds.length > 0 ? (
                  <div>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 italic mb-2">
                      Klik thumbnail untuk melihat resolusi penuh:
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {strategy.imageIds.map((id, index) => (
                        <StrategyDetailImageLoader
                          key={id}
                          imageId={id}
                          onClick={() => handleImagePreview(strategy.imageIds, index, strategy.title)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 dark:border-gray-700/80 p-5 rounded-xl text-center text-xs text-gray-400 dark:text-gray-500">
                    Tidak ada screenshot setup contoh yang dilampirkan.
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => {
                onEdit(strategy);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors border border-blue-200 dark:border-blue-900/50"
            >
              <Edit3 size={14} />
              Edit Setup
            </button>
            <button
              onClick={() => {
                onDelete("strategy", strategy);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors border border-red-200 dark:border-red-900/50"
            >
              <Trash2 size={14} />
              Hapus
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default StrategyDetailModal;
