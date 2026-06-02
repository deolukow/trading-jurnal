import React, { useState, useMemo, useEffect } from "react";
import { Image, Info, Filter, X, RotateCcw, CheckSquare, Square } from "lucide-react";
import { DateRangePicker } from "../components/dashboard/DateRangePicker";
import { useLocalImage } from "../hooks/useLocalImage";
import { formatDateTime, formatCurrency } from "../utils/formatters";
import { classNames } from "../utils/helpers";

/**
 * Premium Gallery View for WzGold Trading Jurnal
 * Supports:
 * - Interactive collapsible multi-select filter panel
 * - Filtering by Pair, Tipe Posisi, Setup, Rating Setup, and all Custom Fields
 * - Check/uncheck options with live count indicators for each attribute
 * - Show-all shortcuts (both category-specific and overall resets)
 * - State synchronization to App.jsx so sequential slider navigates strictly within filtered matches
 */
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
  customFields = [],
  onFilteredTradesChange,
  tradingProfiles,
}) => {
  // Filter Expansion and active category tab
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [activeFilterField, setActiveFilterField] = useState("pair");

  // Selected Filters State: { [fieldKey]: [values] }
  // If a field is not present or has empty list, it means "Show All" for that field
  const [selectedFilters, setSelectedFilters] = useState({});

  // 1. Resolve Base Gallery Trades (Trades with screenshots in active period)
  const galleryTradesBase = useMemo(() => {
    return trades
      .filter((trade) => trade.screenshotAfterId)
      .sort((a, b) => new Date(b.tradeDate) - new Date(a.tradeDate));
  }, [trades]);

  // 2. Extract All Active Categories (Standard + Custom Fields)
  const allFilterFields = useMemo(() => {
    const fields = [
      { key: "pair", label: "Pair / Aset" },
      { key: "type", label: "Tipe Posisi" },
      { key: "setup", label: "Setup / Strategi" },
      { key: "rating", label: "Rating Setup" },
    ];
    customFields.forEach((field) => {
      fields.push({
        key: `custom_${field.name}`,
        label: field.name,
      });
    });
    return fields;
  }, [customFields]);

  // 3. Extract unique values in the base dataset for a given category
  const getUniqueValues = (fieldKey) => {
    const vals = new Set();
    galleryTradesBase.forEach((t) => {
      if (fieldKey === "rating") {
        vals.add(t.rating || 5);
      } else if (fieldKey.startsWith("custom_")) {
        const fName = fieldKey.replace("custom_", "");
        const customValue = t.customData?.[fName];
        if (Array.isArray(customValue)) {
          customValue.forEach(v => vals.add(v));
        } else if (customValue) {
          vals.add(customValue);
        }
      } else {
        if (t[fieldKey]) {
          vals.add(t[fieldKey]);
        }
      }
    });
    return Array.from(vals).sort((a, b) => {
      if (typeof a === "number" && typeof b === "number") return b - a; // rating descending (A+ to C)
      return String(a).localeCompare(String(b));
    });
  };

  // 4. Calculate trade counts for a unique value
  const getValueCount = (fieldKey, value) => {
    return galleryTradesBase.filter((t) => {
      if (fieldKey === "rating") {
        return (t.rating || 5) === value;
      } else if (fieldKey.startsWith("custom_")) {
        const fName = fieldKey.replace("custom_", "");
        const customValue = t.customData?.[fName];
        if (Array.isArray(customValue)) {
          return customValue.includes(value);
        }
        return customValue === value;
      } else {
        return t[fieldKey] === value;
      }
    }).length;
  };

  // 5. Handle Toggle checkbox selection
  const handleToggleAttribute = (fieldKey, value) => {
    setSelectedFilters((prev) => {
      const currentList = prev[fieldKey] || [];
      const updatedList = currentList.includes(value)
        ? currentList.filter((v) => v !== value)
        : [...currentList, value];

      const newFilters = { ...prev, [fieldKey]: updatedList };
      if (updatedList.length === 0) {
        delete newFilters[fieldKey];
      }
      return newFilters;
    });
  };

  // 6. Quick Action: Show All khusus atribut (Hapus Filter Kategori)
  const handleClearCategoryFilter = (fieldKey) => {
    setSelectedFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[fieldKey];
      return newFilters;
    });
  };

  // 7. Quick Action: Centang semua atribut
  const handleCheckAllCategoryAttributes = (fieldKey) => {
    const allVals = getUniqueValues(fieldKey);
    setSelectedFilters((prev) => ({
      ...prev,
      [fieldKey]: allVals,
    }));
  };

  // 8. Overall Reset: Show All secara keseluruhan
  const handleResetAllFilters = () => {
    setSelectedFilters({});
  };

  // 9. Resolve final list of filtered gallery trades
  const filteredGalleryTrades = useMemo(() => {
    return galleryTradesBase.filter((trade) => {
      for (const [fieldKey, activeVals] of Object.entries(selectedFilters)) {
        if (!activeVals || activeVals.length === 0) continue; // No filter active on this field

        let tradeVal = "";
        if (fieldKey === "rating") {
          tradeVal = trade.rating || 5;
        } else if (fieldKey.startsWith("custom_")) {
          const fName = fieldKey.replace("custom_", "");
          tradeVal = trade.customData?.[fName];
        } else {
          tradeVal = trade[fieldKey] || "";
        }

        if (Array.isArray(tradeVal)) {
          // Pass if the trade has at least one matching selected option
          const hasMatch = tradeVal.some(v => activeVals.includes(v));
          if (!hasMatch) return false;
        } else {
          if (!activeVals.includes(tradeVal || "")) {
            return false;
          }
        }
      }
      return true; // Passes all filters
    });
  }, [galleryTradesBase, selectedFilters]);

  // 10. Sync active filtered list back to App.jsx for sequentially sliding TradeDetailModal
  useEffect(() => {
    if (onFilteredTradesChange) {
      onFilteredTradesChange(filteredGalleryTrades);
    }
  }, [filteredGalleryTrades, onFilteredTradesChange]);

  // Extract counts of active filters
  const activeFiltersCount = Object.keys(selectedFilters).length;

  const GalleryImage = ({ trade }) => {
    const imageUrl = useLocalImage(trade.screenshotAfterId);
    const isWin = trade.pnl > 0;
    const pnlColor = isWin
      ? "text-green-500 dark:text-green-400"
      : "text-red-500 dark:text-red-400";
      
    const tradeCurrency = tradingProfiles?.find(p => p.id === trade.profileId)?.currency || currency;

    if (!imageUrl) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 relative aspect-video flex flex-col justify-between p-3 select-none">
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
                {formatCurrency(trade.pnl, tradeCurrency)}
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
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] border border-gray-200 dark:border-gray-700 relative group"
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
              className={`text-xs font-semibold px-2 py-1 rounded-full ${
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
                {formatCurrency(trade.pnl, tradeCurrency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">R:R</p>
              <p
                className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[120px] font-medium"
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
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 border-t border-gray-200 dark:border-gray-700 pt-2 font-medium">
            {formatDateTime(trade.tradeDate)}
          </p>
        </div>
      </div>
    );
  };

  const activeCategoryValues = getUniqueValues(activeFilterField);

  return (
    <div className="animate-fadeIn max-w-[1400px] w-full mx-auto px-1">
      {/* Top action row with elegant layout */}
      <div className="flex justify-end items-center mb-5">
        {/* Filter Toggle Button with Glowing Active Indicator */}
        <button
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-xl font-bold text-xs cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all select-none ${
            isFilterExpanded || activeFiltersCount > 0
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-[0_2px_12px_rgba(124,58,237,0.25)] hover:from-blue-500 hover:to-indigo-500"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
          }`}
        >
          <Filter size={15} />
          <span>Filter Galeri</span>
          {activeFiltersCount > 0 && (
            <span className="flex items-center justify-center bg-white text-blue-600 dark:text-indigo-600 rounded-full w-4.5 h-4.5 text-[9px] font-black leading-none shadow-sm animate-pulse">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Expandable Multi-Select Category-Based Filter Drawer */}
      {isFilterExpanded && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 p-5 rounded-2xl shadow-xl mb-6 space-y-5 animate-fadeSlide max-w-5xl mx-auto w-full">
          <div className="flex justify-between items-center border-b border-gray-150 dark:border-gray-700/60 pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Pengaturan Filter Multi-Kategori
            </span>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetAllFilters}
                className="text-[10px] font-black uppercase tracking-wider text-red-500 dark:text-red-400 flex items-center gap-1 hover:underline cursor-pointer active:scale-95 transition-transform"
                title="Hapus semua filter di semua kategori (Show All secara keseluruhan)"
              >
                <RotateCcw size={12} /> Show All Keseluruhan
              </button>
            )}
          </div>

          {/* Category Tab Selectors (Centered) */}
          <div className="space-y-1 bg-gray-100/50 dark:bg-gray-900/30 p-1.5 rounded-xl flex flex-wrap justify-center gap-1.5 w-full">
            {allFilterFields.map((field) => {
              const isSelected = activeFilterField === field.key;
              const hasActiveFilters = (selectedFilters[field.key] || []).length > 0;
              const activeCount = (selectedFilters[field.key] || []).length;
              return (
                <button
                  key={field.key}
                  onClick={() => setActiveFilterField(field.key)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200/40 dark:border-gray-700/40"
                      : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  <span>{field.label}</span>
                  {hasActiveFilters && (
                    <span className="px-1.5 py-0.5 bg-blue-500 text-white rounded-full text-[9px] font-black">
                      {activeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right/Bottom Multi-Select Checkbox Grid for Selected Category */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 px-1">
              <span>
                Pilih atribut dari <strong className="text-gray-700 dark:text-gray-200">
                  {allFilterFields.find((f) => f.key === activeFilterField)?.label}
                </strong>:
              </span>
              
              {/* Category-Specific Quick Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleCheckAllCategoryAttributes(activeFilterField)}
                  className="hover:text-blue-500 cursor-pointer text-[10px] font-bold"
                >
                  Centang Semua
                </button>
                <span className="text-gray-300 dark:text-gray-700 font-light">|</span>
                <button
                  onClick={() => handleClearCategoryFilter(activeFilterField)}
                  className="hover:text-red-500 cursor-pointer text-[10px] font-bold"
                  title="Show All khusus atribut kategori ini"
                >
                  Show All (Hapus Filter)
                </button>
              </div>
            </div>

            {/* Checkbox Attributes Grid */}
            {activeCategoryValues.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/20 dark:bg-gray-900/10">
                Tidak ada atribut untuk kategori ini pada periode data aktif.
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-2 border border-gray-150 dark:border-gray-700/60 p-3.5 rounded-xl max-h-[180px] overflow-y-auto bg-gray-50/10 dark:bg-gray-900/15 w-full">
                {activeCategoryValues.map((val) => {
                  const currentCategorySelected = selectedFilters[activeFilterField] || [];
                  const isChecked = currentCategorySelected.includes(val);
                  let displayVal = val;
                  if (activeFilterField === "rating") {
                    displayVal = val === 5 ? "A+" :
                                 val === 4 ? "A" :
                                 val === 3 ? "B+" :
                                 val === 2 ? "B" : "C";
                  }

                  return (
                    <label
                      key={val}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition-all duration-200 text-xs font-semibold whitespace-nowrap ${
                        isChecked
                          ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.06)]"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-650 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleAttribute(activeFilterField, val)}
                        className="hidden"
                      />
                      <span className="flex-shrink-0 text-blue-500 dark:text-blue-400">
                        {isChecked ? <CheckSquare size={15} /> : <Square size={15} className="text-gray-300 dark:text-gray-600" />}
                      </span>
                      <span className="truncate">{displayVal}</span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 bg-gray-100 dark:bg-gray-950 text-gray-500 dark:text-gray-400 rounded-full ml-auto">
                        {getValueCount(activeFilterField, val)}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Period Selection Controls */}
      <div className="flex space-x-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 select-none">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => setActivePeriod(p.key)}
            className={classNames(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all flex-grow cursor-pointer",
              activePeriod === p.key
                ? "bg-blue-600 text-white shadow-lg font-bold"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-750",
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

      {/* Final Layout Cards Grid */}
      {filteredGalleryTrades.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-10 rounded-xl text-center text-gray-500 mt-10 border border-gray-200 dark:border-gray-700 shadow">
          {galleryTradesBase.length === 0 ? (
            <>
              <Image
                size={48}
                className="mx-auto mb-3 text-gray-400 dark:text-gray-600"
              />
              <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                Tidak ada trade dengan gambar pada periode ini.
              </p>
              <p className="text-sm mt-1 text-gray-500">
                Pastikan Anda mengupload gambar saat menambahkan trade.
              </p>
            </>
          ) : (
            <>
              <Filter
                size={48}
                className="mx-auto mb-3 text-gray-400 dark:text-gray-600 animate-pulse"
              />
              <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                Tidak ada trade yang cocok dengan kriteria filter Anda.
              </p>
              <p className="text-sm mt-1 text-gray-500">
                Coba sesuaikan checkboxes filter Anda atau klik{" "}
                <button
                  onClick={handleResetAllFilters}
                  className="text-blue-500 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                >
                  Reset Semua Filter
                </button>{" "}
                untuk menampilkan kembali.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active status indicator */}
          {activeFiltersCount > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between bg-blue-500/5 border border-blue-500/15 p-2 px-3 rounded-lg select-none">
              <span>
                Menampilkan <strong className="text-blue-600 dark:text-blue-400">{filteredGalleryTrades.length}</strong> dari <strong className="text-gray-700 dark:text-gray-300">{galleryTradesBase.length}</strong> trade visual aktif dengan kriteria filter
              </span>
              <button
                onClick={handleResetAllFilters}
                className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Hapus Semua Filter
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGalleryTrades.map((trade) => (
              <GalleryImage key={trade.id} trade={trade} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryView;
