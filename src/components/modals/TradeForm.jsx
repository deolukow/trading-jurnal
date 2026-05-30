import React, { useState, useEffect, useMemo } from "react";
import { Save, UploadCloud, Camera, Edit3 } from "lucide-react";
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
      pair: "",
      type: "long",
      lotSize: "0.01",
      pnl: "0",
      setup: "",
      notes: "",
      screenshotBeforeId: null,
      screenshotAfterId: null,
      entryPrice: "",
      takeProfit: "",
      stopLoss: "",
      riskRewardRatio: "0",
      customData: {},
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

  useEffect(() => {
    let dataToEdit = editingTrade
      ? {
          ...initialTradeData,
          ...editingTrade,
          tradeDate: toDateTimeLocalInput(editingTrade.tradeDate),
          pnl: String(editingTrade.pnl || "0"),
          lotSize: String(editingTrade.lotSize || "0.01"),
          riskRewardRatio: String(editingTrade.riskRewardRatio || "0"),
          entryPrice: String(editingTrade.entryPrice || ""),
          takeProfit: String(editingTrade.takeProfit || ""),
          stopLoss: String(editingTrade.stopLoss || ""),
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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        setFormData((prev) => ({
          ...prev,
          pair: template.pair || "",
          type: template.type || "long",
          lotSize: String(template.lotSize || "0.01"),
          pnl: String(template.pnl || "0"),
          setup: template.setup || "",
          riskRewardRatio: String(template.riskRewardRatio || "0"),
          notes: "",
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {editingTrade ? "Edit Trade" : "Tambah Trade Baru"}
        </h2>
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
          {pairs.length > 0 ? (
            <select
              name="pair"
              value={formData.pair || ""}
              onChange={handleChange}
              className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
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
              className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
              required
            />
          )}
          <input
            type="datetime-local"
            name="tradeDate"
            value={formData.tradeDate || ""}
            onChange={handleChange}
            className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
            required
          />
          <select
            name="type"
            value={formData.type || "long"}
            onChange={handleChange}
            className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
          >
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
          <input
            type="number"
            step="any"
            name="pnl"
            value={formData.pnl || ""}
            onChange={handleChange}
            placeholder="P&L (Hasil Trade)"
            className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded font-bold"
            required
          />
          <input
            type="number"
            step="any"
            name="lotSize"
            value={formData.lotSize || ""}
            onChange={handleChange}
            placeholder="Lot Size"
            className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
            required
          />

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
