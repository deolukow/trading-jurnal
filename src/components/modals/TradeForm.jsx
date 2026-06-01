import React, { useState, useEffect, useMemo, useRef } from "react";
import { Save, UploadCloud, Camera, Edit3, Star } from "lucide-react";
import { useLocalImage } from "../../hooks/useLocalImage";
import { toDateTimeLocalInput } from "../../utils/formatters";

export const TradeForm = ({
  onSaveTrade,
  editingTrade,
  onCancelEdit,
  pairs,
  templates,
  customFields,
  activeProfileId,
  strategies,
}) => {
  const initialTradeData = useMemo(() => {
    const baseData = {
      tradeDate: toDateTimeLocalInput(new Date()),
      exitDate: "",
      pair: "",
      type: "long",
      lotSize: "0.01",
      pnl: "0",
      setup: "",
      rating: 5, // Default to 5 stars (A+)
      notes: "",
      screenshotBeforeId: null,
      screenshotAfterId: null,
      entryPrice: "",
      takeProfit: "",
      stopLoss: "",
      riskRewardRatio: "0",
      customData: {},
      criteriaChecked: [],
    };
    customFields.forEach((field) => {
      baseData.customData[field.name] = "";
    });
    return baseData;
  }, [customFields]);

  const [formData, setFormData] = useState(initialTradeData);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [screenshotBeforeFile, setScreenshotBeforeFile] = useState(null);
  const [screenshotAfterFile, setScreenshotAfterFile] = useState(null);

  const existingBeforeImageUrl = useLocalImage(formData.screenshotBeforeId);
  const existingAfterImageUrl = useLocalImage(formData.screenshotAfterId);

  // Touch Drag / Swipe-down to Dismiss Logic (Native Bottom Sheet Feel)
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
      onCancelEdit();
    } else {
      setTranslateY(0);
    }
  };

  // Keyboard Escape listener for pro UX accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onCancelEdit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancelEdit]);

  // Click Outside Backdrop Handler
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancelEdit();
    }
  };

  useEffect(() => {
    let dataToEdit = editingTrade
      ? {
          ...initialTradeData,
          ...editingTrade,
          tradeDate: toDateTimeLocalInput(editingTrade.tradeDate),
          exitDate: editingTrade.exitDate ? toDateTimeLocalInput(editingTrade.exitDate) : "",
          pnl: String(editingTrade.pnl || "0"),
          lotSize: String(editingTrade.lotSize || "0.01"),
          riskRewardRatio: String(editingTrade.riskRewardRatio || "0"),
          entryPrice: String(editingTrade.entryPrice || ""),
          takeProfit: String(editingTrade.takeProfit || ""),
          stopLoss: String(editingTrade.stopLoss || ""),
          criteriaChecked: editingTrade.criteriaChecked || [],
        }
      : initialTradeData;

    dataToEdit.customData = dataToEdit.customData || {};
    customFields.forEach((field) => {
      if (!dataToEdit.customData.hasOwnProperty(field.name)) {
        dataToEdit.customData[field.name] = "";
      }
    });

    if (
      editingTrade &&
      editingTrade.pair &&
      !pairs.some((p) => p.name === editingTrade.pair)
    ) {
      setFormData({ ...dataToEdit, pair: editingTrade.pair });
    } else if (pairs.length > 0 && !dataToEdit.pair) {
      setFormData({ ...dataToEdit, pair: pairs[0].name });
    } else {
      setFormData(dataToEdit);
    }
    setSelectedTemplate("");
    setScreenshotBeforeFile(null);
    setScreenshotAfterFile(null);
  }, [editingTrade, pairs, initialTradeData, customFields]);

  // Auto-calculate R:R Ratio
  useEffect(() => {
    const entry = parseFloat(formData.entryPrice);
    const tp = parseFloat(formData.takeProfit);
    const sl = parseFloat(formData.stopLoss);
    const type = formData.type;

    if (entry > 0 && tp > 0 && sl > 0) {
      let risk, reward;
      if (type === "long") {
        reward = tp - entry;
        risk = entry - sl;
      } else {
        reward = entry - tp;
        risk = sl - entry;
      }

      if (risk > 0 && reward > 0) {
        const ratio = reward / risk;
        setFormData((prev) => ({ ...prev, riskRewardRatio: ratio.toFixed(2) }));
      } else {
        setFormData((prev) => ({ ...prev, riskRewardRatio: "0" }));
      }
    }
  }, [
    formData.entryPrice,
    formData.takeProfit,
    formData.stopLoss,
    formData.type,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "setup") {
        if (editingTrade && editingTrade.setup === value) {
          updated.criteriaChecked = editingTrade.criteriaChecked || [];
        } else {
          updated.criteriaChecked = [];
        }
      }
      return updated;
    });
    setSelectedTemplate("");
  };

  const handleCustomFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      customData: {
        ...prev.customData,
        [name]: value,
      },
    }));
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      if (fileType === "before") {
        setScreenshotBeforeFile(file);
        setFormData((prev) => ({ ...prev, screenshotBeforeId: null }));
      } else {
        setScreenshotAfterFile(file);
        setFormData((prev) => ({ ...prev, screenshotAfterId: null }));
      }
    }
  };

  const handleTemplateSelect = (e) => {
    const templateId = e.target.value;
    setSelectedTemplate(templateId);
    if (templateId) {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        // Salin customData secara defensif hanya untuk customFields yang aktif di sistem saat ini
        const newCustomData = {};
        customFields.forEach((field) => {
          newCustomData[field.name] = (template.customData && template.customData[field.name]) || "";
        });

        setFormData((prev) => ({
          ...prev,
          pair: template.pair || "",
          type: template.type || "long",
          lotSize: String(template.lotSize ?? "0.01"),
          pnl: String(template.pnl ?? "0"),
          setup: template.setup || "",
          rating: template.rating ?? 5,
          riskRewardRatio: String(template.riskRewardRatio ?? "0"),
          entryPrice: String(template.entryPrice ?? ""),
          takeProfit: String(template.takeProfit ?? ""),
          stopLoss: String(template.stopLoss ?? ""),
          notes: template.notes ?? "",
          customData: newCustomData,
          screenshotBeforeId: null,
          screenshotAfterId: null,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...initialTradeData,
        tradeDate: prev.tradeDate,
        pair: pairs.length > 0 ? pairs[0].name : "",
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      id: editingTrade ? editingTrade.id : crypto.randomUUID(),
      profileId: activeProfileId,
      pnl: parseFloat(formData.pnl) || 0,
      lotSize: parseFloat(formData.lotSize) || 0,
      riskRewardRatio: parseFloat(formData.riskRewardRatio) || 0,
      entryPrice: parseFloat(formData.entryPrice) || 0,
      takeProfit: parseFloat(formData.takeProfit) || 0,
      stopLoss: parseFloat(formData.stopLoss) || 0,
      tradeDate: new Date(formData.tradeDate),
      exitDate: formData.exitDate ? new Date(formData.exitDate) : null,
    };
    onSaveTrade(finalData, screenshotBeforeFile, screenshotAfterFile);
  };

  const FileInput = ({ id, label, file, onChange, existingImageUrl }) => {
    const [preview, setPreview] = useState(null);

    useEffect(() => {
      if (!file) {
        setPreview(null);
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    const currentImage = preview || existingImageUrl;

    return (
      <div className="md:col-span-3">
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          {label}
        </label>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 flex-shrink-0">
            {currentImage ? (
              <div className="relative group w-full h-full">
                <img
                  src={currentImage}
                  alt="Preview"
                  className="h-full w-full object-cover rounded-lg"
                />
                <label
                  htmlFor={id}
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg cursor-pointer"
                >
                  <Edit3 size={24} className="text-white" />
                </label>
              </div>
            ) : (
              <div className="h-full w-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Camera
                  size={32}
                  className="text-gray-400 dark:text-gray-500"
                />
              </div>
            )}
          </div>
          <label
            htmlFor={id}
            className="cursor-pointer bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white py-2 px-4 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 text-sm w-full"
          >
            <UploadCloud size={16} className="mr-2" />
            <span className="truncate">
              {file ? file.name : "Upload Gambar"}
            </span>
          </label>
          <input
            id={id}
            type="file"
            onChange={onChange}
            className="hidden"
            accept="image/*"
          />
        </div>
      </div>
    );
  };

  const activeStrategy = useMemo(() => {
    if (!strategies || !formData.setup) return null;
    return strategies.find((s) => s.title === formData.setup);
  }, [strategies, formData.setup]);

  return (
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
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-modalSpringIn relative border border-gray-100 dark:border-gray-700/50"
        style={{
          transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
          transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
        }}
      >
        {/* Swipe indicator drag handle for mobile screens */}
        <div 
          className="md:hidden flex justify-center pb-3 cursor-grab active:cursor-grabbing select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>

        <div 
          className="flex justify-between items-center mb-6 flex-shrink-0 cursor-grab active:cursor-grabbing select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editingTrade ? "Edit Trade" : "Tambah Trade Baru"}
          </h2>
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-3xl font-light leading-none p-1"
          >
            &times;
          </button>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Pilih Template (Opsional)
          </label>
          <select
            value={selectedTemplate}
            onChange={handleTemplateSelect}
            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
          >
            <option value="">-- Tanpa Template --</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pair */}
          <div className="flex flex-col">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Pair / Aset *
            </label>
            {pairs.length > 0 ? (
              <select
                name="pair"
                value={formData.pair || ""}
                onChange={handleChange}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded outline-none border border-transparent focus:border-blue-500"
                required
              >
                <option value="" disabled>
                  Pilih Pair
                </option>
                {pairs.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
                {editingTrade &&
                  editingTrade.pair &&
                  !pairs.some((p) => p.name === editingTrade.pair) && (
                    <option
                      value={editingTrade.pair}
                      className="text-gray-400 bg-gray-800"
                    >
                      {editingTrade.pair} (Lama)
                    </option>
                  )}
              </select>
            ) : (
              <input
                name="pair"
                value={formData.pair || ""}
                onChange={handleChange}
                placeholder="Pair (e.g., BTC/USD)"
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded outline-none border border-transparent focus:border-blue-500"
                required
              />
            )}
          </div>

          {/* Tanggal & Jam Entry */}
          <div className="flex flex-col">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Tanggal & Jam Entry *
            </label>
            <input
              type="datetime-local"
              name="tradeDate"
              value={formData.tradeDate || ""}
              onChange={handleChange}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded outline-none border border-transparent focus:border-blue-500"
              required
            />
          </div>

          {/* Tanggal & Jam Exit */}
          <div className="flex flex-col">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Tanggal & Jam Exit (Opsional)
            </label>
            <input
              type="datetime-local"
              name="exitDate"
              value={formData.exitDate || ""}
              onChange={handleChange}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded outline-none border border-transparent focus:border-blue-500"
            />
          </div>

          {/* Tipe */}
          <div className="flex flex-col">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Tipe Posisi *
            </label>
            <select
              name="type"
              value={formData.type || "long"}
              onChange={handleChange}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded outline-none border border-transparent focus:border-blue-500"
            >
              <option value="long">Long</option>
              <option value="short">Short</option>
            </select>
          </div>

          {/* P&L */}
          <div className="flex flex-col">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              P&L / Hasil Trade *
            </label>
            <input
              type="number"
              step="any"
              name="pnl"
              value={formData.pnl || ""}
              onChange={handleChange}
              placeholder="Hasil P&L"
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded font-bold outline-none border border-transparent focus:border-blue-500"
              required
            />
          </div>

          {/* Lot Size */}
          <div className="flex flex-col">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Lot Size *
            </label>
            <input
              type="number"
              step="any"
              name="lotSize"
              value={formData.lotSize || ""}
              onChange={handleChange}
              placeholder="0.01"
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded outline-none border border-transparent focus:border-blue-500"
              required
            />
          </div>

          {/* Mengubah Setup dari Input Teks ke Dropdown Dinamis */}
          <div className="md:col-span-3 flex flex-col">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Setup / Strategi
            </label>
            <select
              name="setup"
              value={formData.setup || ""}
              onChange={handleChange}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-transparent focus:border-blue-500 outline-none"
              required
            >
              <option value="">-- Pilih Setup Strategi --</option>
              {strategies.map((strat) => (
                <option key={strat.id} value={strat.title}>
                  {strat.title}{" "}
                  {strat.probability ? `(${strat.probability}%)` : ""}
                </option>
              ))}
              {formData.setup &&
                !strategies.some((s) => s.title === formData.setup) && (
                  <option value={formData.setup}>
                    {formData.setup} (Lama)
                  </option>
                )}
            </select>
          </div>

          {/* Rating Setup (Interactive Star Rating Input) */}
          <div className="md:col-span-3 flex flex-col bg-gray-50/50 dark:bg-gray-900/35 border border-gray-200/60 dark:border-gray-700/60 p-4 rounded-xl space-y-2.5">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Setup Rating / Quality Assessment *
            </label>
            <div className="flex items-center gap-4 flex-wrap">
              {/* 5-Star Row */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isFilled = starValue <= (formData.rating || 5);
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, rating: starValue }))}
                      className="p-1 hover:scale-125 transition-transform cursor-pointer group active:scale-95"
                      title={`Bintang ${starValue} dari 5`}
                    >
                      <Star
                        size={22}
                        className={`transition-all duration-200 ${
                          isFilled
                            ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)] scale-110"
                            : "text-gray-300 dark:text-gray-600 hover:text-amber-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              
              {/* Rating Value Text Display */}
              <div className="flex items-center gap-2.5">
                <span className={`px-2.5 py-0.5 font-black text-xs rounded-lg border shadow-sm tracking-wide ${
                  (formData.rating || 5) === 5 ? "bg-amber-500/15 text-amber-500 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.15)]" :
                  (formData.rating || 5) === 4 ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/40" :
                  (formData.rating || 5) === 3 ? "bg-blue-500/15 text-blue-500 border-blue-500/40" :
                  (formData.rating || 5) === 2 ? "bg-violet-500/15 text-violet-500 border-violet-500/40" :
                  "bg-gray-500/15 text-gray-400 border-gray-500/40"
                }`}>
                  {(formData.rating || 5) === 5 ? "A+" :
                   (formData.rating || 5) === 4 ? "A" :
                   (formData.rating || 5) === 3 ? "B+" :
                   (formData.rating || 5) === 2 ? "B" : "C"}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                  {(formData.rating || 5) === 5 && "Sangat Kuat - SOP Terpenuhi Sempurna"}
                  {(formData.rating || 5) === 4 && "Kuat - Setup Standar Konfirmasi Jelas"}
                  {(formData.rating || 5) === 3 && "Cukup - Setup Moderat dengan Konfirmasi Cukup"}
                  {(formData.rating || 5) === 2 && "Lemah - Setup Agresif / Konservatif Minim"}
                  {(formData.rating || 5) === 1 && "Kurang - High Risk Setup / Spekulatif"}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Strategy Entry Criteria Checklist */}
          {activeStrategy && activeStrategy.checklists && activeStrategy.checklists.length > 0 && (
            <div className="md:col-span-3 bg-gray-50/50 dark:bg-gray-900/35 border border-gray-200/60 dark:border-gray-700/60 p-4 rounded-xl space-y-3 shadow-inner">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-500 dark:text-gray-400">
                  Konfirmasi Setup / Entry Criteria Checklist
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full border border-blue-500/20">
                  {formData.criteriaChecked ? formData.criteriaChecked.length : 0} dari {activeStrategy.checklists.length} terpenuhi
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeStrategy.checklists.map((criterion, idx) => {
                  const isChecked = formData.criteriaChecked && formData.criteriaChecked.includes(criterion);
                  return (
                    <label
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer select-none transition-all duration-300 ${
                        isChecked
                          ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300 shadow-[0_0_8px_rgba(34,197,94,0.08)]"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-650 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData((prev) => {
                            const list = prev.criteriaChecked || [];
                            const newList = checked
                              ? [...list, criterion]
                              : list.filter((item) => item !== criterion);
                            return { ...prev, criteriaChecked: newList };
                          });
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                      />
                      <span className="text-xs font-semibold leading-tight">
                        {criterion}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <input
            type="number"
            step="any"
            name="entryPrice"
            value={formData.entryPrice || ""}
            onChange={handleChange}
            placeholder="Harga Entry"
            className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
          />
          <input
            type="number"
            step="any"
            name="takeProfit"
            value={formData.takeProfit || ""}
            onChange={handleChange}
            placeholder="Harga Take Profit"
            className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
          />
          <input
            type="number"
            step="any"
            name="stopLoss"
            value={formData.stopLoss || ""}
            onChange={handleChange}
            placeholder="Harga Stop Loss"
            className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
          />
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              R:R Ratio
            </label>
            <input
              type="number"
              step="any"
              name="riskRewardRatio"
              value={formData.riskRewardRatio || ""}
              onChange={handleChange}
              placeholder="R:R Ratio (Otomatis)"
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
            />
          </div>
          {customFields.map((field) => (
            <div key={field.id} className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {field.name}
              </label>
              {field.type === "dropdown" ? (
                <select
                  name={field.name}
                  value={formData.customData?.[field.name] || ""}
                  onChange={handleCustomFieldChange}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-transparent focus:border-blue-500 outline-none"
                >
                  <option value="">-- Pilih {field.name} --</option>
                  {field.options.map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name={field.name}
                  value={formData.customData?.[field.name] || ""}
                  onChange={handleCustomFieldChange}
                  placeholder={`Input untuk {field.name}`}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-transparent focus:border-blue-500 outline-none"
                />
              )}
            </div>
          ))}

          <FileInput
            id="ss-before"
            label="Screenshot (Sebelum)"
            file={screenshotBeforeFile}
            onChange={(e) => handleFileChange(e, "before")}
            existingImageUrl={existingBeforeImageUrl}
          />
          <FileInput
            id="ss-after"
            label="Screenshot (Sesudah)"
            file={screenshotAfterFile}
            onChange={(e) => handleFileChange(e, "after")}
            existingImageUrl={existingAfterImageUrl}
          />

          <textarea
            name="notes"
            value={formData.notes || ""}
            onChange={handleChange}
            placeholder="Catatan..."
            rows="3"
            className="md:col-span-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
          ></textarea>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Save size={18} className="mr-2" />
            {editingTrade ? "Update" : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TradeForm;
