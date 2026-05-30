import React, { useState, useEffect, useRef } from "react";
import { Zap, Edit3, Trash2, Save } from "lucide-react";
import { addItem, updateItem } from "../../config/db";

export const TemplateManagementModal = ({
  activeProfileId,
  showToast,
  onClose,
  templates,
  customFields = [],
  strategies = [],
  openDeleteModal,
  onRefresh,
}) => {
  const getDefaultTemplate = () => {
    const base = {
      name: "",
      pair: "",
      type: "long",
      lotSize: "0.01",
      setup: "",
      pnl: "0",
      riskRewardRatio: "0",
      entryPrice: "",
      takeProfit: "",
      stopLoss: "",
      notes: "",
      customData: {},
    };
    if (customFields && customFields.length > 0) {
      customFields.forEach((field) => {
        base.customData[field.name] = "";
      });
    }
    return base;
  };

  const [templateData, setTemplateData] = useState(() => getDefaultTemplate());
  const [editingTemplate, setEditingTemplate] = useState(null);

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

  // Auto-calculate R:R Ratio in the template modal
  useEffect(() => {
    const entry = parseFloat(templateData.entryPrice);
    const tp = parseFloat(templateData.takeProfit);
    const sl = parseFloat(templateData.stopLoss);
    const type = templateData.type;

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
        setTemplateData((prev) => ({ ...prev, riskRewardRatio: ratio.toFixed(2) }));
      } else {
        setTemplateData((prev) => ({ ...prev, riskRewardRatio: "0" }));
      }
    }
  }, [
    templateData.entryPrice,
    templateData.takeProfit,
    templateData.stopLoss,
    templateData.type,
  ]);

  const handleTemplateChange = (e) => {
    const { name, value } = e.target;
    setTemplateData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomFieldChange = (e) => {
    const { name, value } = e.target;
    setTemplateData((prev) => ({
      ...prev,
      customData: {
        ...prev.customData,
        [name]: value,
      },
    }));
  };

  const handleEditClick = (template) => {
    setEditingTemplate(template);
    const preparedCustomData = { ...(template.customData || {}) };
    if (customFields && customFields.length > 0) {
      customFields.forEach((field) => {
        if (!preparedCustomData.hasOwnProperty(field.name)) {
          preparedCustomData[field.name] = "";
        }
      });
    }
    setTemplateData({
      ...template,
      lotSize: String(template.lotSize ?? "0.01"),
      pnl: String(template.pnl ?? "0"),
      riskRewardRatio: String(template.riskRewardRatio ?? "0"),
      entryPrice: String(template.entryPrice ?? ""),
      takeProfit: String(template.takeProfit ?? ""),
      stopLoss: String(template.stopLoss ?? ""),
      notes: template.notes ?? "",
      customData: preparedCustomData,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalData = {
      ...templateData,
      lotSize: parseFloat(templateData.lotSize) || 0,
      pnl: parseFloat(templateData.pnl) || 0,
      riskRewardRatio: parseFloat(templateData.riskRewardRatio) || 0,
      entryPrice: parseFloat(templateData.entryPrice) || 0,
      takeProfit: parseFloat(templateData.takeProfit) || 0,
      stopLoss: parseFloat(templateData.stopLoss) || 0,
    };
    if (!finalData.name.trim()) {
      showToast("Nama Template wajib diisi.", "error");
      return;
    }
    try {
      if (editingTemplate) {
        await updateItem("templates", {
          ...finalData,
          id: editingTemplate.id,
          profileId: activeProfileId,
          updatedAt: new Date(),
        });
        showToast(`Template '${finalData.name}' berhasil diupdate.`, "success");
      } else {
        const newId = crypto.randomUUID();
        await addItem("templates", {
          ...finalData,
          id: newId,
          profileId: activeProfileId,
          createdAt: new Date(),
        });
        showToast(
          `Template '${finalData.name}' berhasil ditambahkan.`,
          "success",
        );
      }
      setTemplateData(getDefaultTemplate());
      setEditingTemplate(null);
      if (onRefresh) await onRefresh();
    } catch (error) {
      showToast("Gagal menyimpan Template.", "error");
      console.error("Error saving template:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
    setTemplateData(getDefaultTemplate());
  };

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
      <div 
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-modalSpringIn relative border border-gray-100 dark:border-gray-700/50"
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
          className="flex justify-between items-center mb-4 flex-shrink-0 cursor-grab active:cursor-grabbing select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Zap size={24} className="mr-2 text-yellow-400" /> Kelola Template
            Trade
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-3xl font-light leading-none p-1"
          >
            &times;
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex-shrink-0 mb-6 p-4 bg-gray-100/50 dark:bg-gray-700/50 rounded-lg max-h-[50vh] overflow-y-auto"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            {editingTemplate
              ? `Edit Template: ${editingTemplate.name}`
              : "Buat Template Baru"}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              type="text"
              name="name"
              placeholder="Nama Template (Wajib)"
              value={templateData.name}
              onChange={handleTemplateChange}
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-4 focus:border-blue-500 outline-none"
              required
            />
            <input
              type="text"
              name="pair"
              placeholder="Pair Default (e.g., XAU/USD)"
              value={templateData.pair}
              onChange={handleTemplateChange}
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-1 focus:border-blue-500 outline-none"
            />
            <select
              name="type"
              value={templateData.type}
              onChange={handleTemplateChange}
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-1 focus:border-blue-500 outline-none"
            >
              <option value="long">Long (Buy)</option>
              <option value="short">Short (Sell)</option>
            </select>
            <input
              type="number"
              step="any"
              name="lotSize"
              placeholder="Lot Size Default"
              value={templateData.lotSize}
              onChange={handleTemplateChange}
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-1 focus:border-blue-500 outline-none"
            />
            <input
              type="number"
              step="any"
              name="pnl"
              placeholder="P&L Default (0 jika kosong)"
              value={templateData.pnl}
              onChange={handleTemplateChange}
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-1 focus:border-blue-500 outline-none"
            />
            <select
              name="setup"
              value={templateData.setup || ""}
              onChange={handleTemplateChange}
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-2 border border-transparent focus:border-blue-500 outline-none"
            >
              <option value="">-- Pilih Setup Strategi --</option>
              {strategies.map((strat) => (
                <option key={strat.id} value={strat.title}>
                  {strat.title} {strat.probability ? `(${strat.probability}%)` : ""}
                </option>
              ))}
              {templateData.setup &&
                !strategies.some((s) => s.title === templateData.setup) && (
                  <option value={templateData.setup}>
                    {templateData.setup} (Lama)
                  </option>
                )}
            </select>
            <input
              type="number"
              step="any"
              name="entryPrice"
              placeholder="Entry Price Default"
              value={templateData.entryPrice}
              onChange={handleTemplateChange}
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-1 focus:border-blue-500 outline-none"
            />
            <input
              type="number"
              step="any"
              name="takeProfit"
              placeholder="TP Default"
              value={templateData.takeProfit}
              onChange={handleTemplateChange}
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-1 focus:border-blue-500 outline-none"
            />
            <input
              type="number"
              step="any"
              name="stopLoss"
              placeholder="SL Default"
              value={templateData.stopLoss}
              onChange={handleTemplateChange}
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-1 focus:border-blue-500 outline-none"
            />
            <input
              type="number"
              step="any"
              name="riskRewardRatio"
              placeholder="R:R Ratio (Otomatis)"
              value={templateData.riskRewardRatio}
              onChange={handleTemplateChange}
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-1 focus:border-blue-500 outline-none"
            />
            <textarea
              name="notes"
              placeholder="Catatan Default..."
              value={templateData.notes}
              onChange={handleTemplateChange}
              rows="2"
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-4 focus:border-blue-500 outline-none"
            />

            {/* Render Custom Fields in Template Editor */}
            {customFields && customFields.length > 0 && (
              <div className="col-span-2 md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                <span className="col-span-1 md:col-span-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                  Field Tambahan Kustom Default
                </span>
                {customFields.map((field) => (
                  <div key={field.id} className="flex flex-col">
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {field.name}
                    </label>
                    {field.type === "dropdown" ? (
                      <select
                        name={field.name}
                        value={templateData.customData?.[field.name] || ""}
                        onChange={handleCustomFieldChange}
                        className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-transparent focus:border-blue-500 outline-none text-sm"
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
                        value={templateData.customData?.[field.name] || ""}
                        onChange={handleCustomFieldChange}
                        placeholder={`Input default ${field.name}`}
                        className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-transparent focus:border-blue-500 outline-none text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            {editingTemplate && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Batal Edit
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              <Save size={18} className="inline mr-1" />{" "}
              {editingTemplate ? "Update Template" : "Simpan Template"}
            </button>
          </div>
        </form>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex-shrink-0">
          Daftar Template ({templates.length})
        </h3>
        <div className="overflow-y-auto flex-grow space-y-2 pr-2">
          {templates.length === 0 ? (
            <p className="text-gray-500 text-sm p-4 text-center bg-gray-100 dark:bg-gray-700 rounded-lg">
              Buat template pertama Anda di atas.
            </p>
          ) : (
            templates.map((t) => (
              <div
                key={t.id}
                className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg flex justify-between items-center transition-shadow hover:shadow-md hover:shadow-gray-700/50"
              >
                <div className="flex flex-col text-sm max-w-[80%]">
                  <span className="font-semibold text-gray-900 dark:text-white truncate">
                    {t.name}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs flex flex-wrap gap-x-1.5 gap-y-0.5 animate-fadeIn">
                    <span>{t.pair || "-"}</span>
                    <span>•</span>
                    <span className="capitalize">{t.type}</span>
                    <span>•</span>
                    <span>Lot: {parseFloat(t.lotSize || 0).toFixed(2)}</span>
                    <span>•</span>
                    <span>
                      R:R:{" "}
                      {parseFloat(t.riskRewardRatio || 0) > 0
                        ? `${t.riskRewardRatio}R`
                        : "N/A"}
                    </span>
                    {t.setup && (
                      <>
                        <span>•</span>
                        <span className="truncate">Setup: {t.setup}</span>
                      </>
                    )}
                    {t.entryPrice > 0 && (
                      <>
                        <span>•</span>
                        <span>EP: {t.entryPrice}</span>
                      </>
                    )}
                    {t.takeProfit > 0 && (
                      <>
                        <span>•</span>
                        <span>TP: {t.takeProfit}</span>
                      </>
                    )}
                    {t.stopLoss > 0 && (
                      <>
                        <span>•</span>
                        <span>SL: {t.stopLoss}</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleEditClick(t)}
                    className="p-1 text-gray-500 dark:text-gray-400 hover:text-yellow-400 transition-colors"
                    title={`Edit Template ${t.name}`}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => openDeleteModal("template", t)}
                    className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                    title={`Hapus Template ${t.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-end mt-6 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium text-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateManagementModal;
