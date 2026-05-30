import React, { useState } from "react";
import { Zap, Edit3, Trash2, Save } from "lucide-react";
import { addItem, updateItem } from "../../config/db";

export const TemplateManagementModal = ({
  activeProfileId,
  showToast,
  onClose,
  templates,
  openDeleteModal,
}) => {
  const defaultTemplate = {
    name: "",
    pair: "",
    type: "long",
    lotSize: "0.01",
    setup: "",
    pnl: "0",
    riskRewardRatio: "0",
  };
  const [templateData, setTemplateData] = useState(defaultTemplate);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const handleTemplateChange = (e) => {
    const { name, value } = e.target;
    setTemplateData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (template) => {
    setEditingTemplate(template);
    setTemplateData({
      ...template,
      lotSize: String(template.lotSize),
      pnl: String(template.pnl),
      riskRewardRatio: String(template.riskRewardRatio || "0"),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalData = {
      ...templateData,
      lotSize: parseFloat(templateData.lotSize) || 0,
      pnl: parseFloat(templateData.pnl) || 0,
      riskRewardRatio: parseFloat(templateData.riskRewardRatio) || 0,
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
      setTemplateData(defaultTemplate);
      setEditingTemplate(null);
    } catch (error) {
      showToast("Gagal menyimpan Template.", "error");
      console.error("Error saving template:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
    setTemplateData(defaultTemplate);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Zap size={24} className="mr-2 text-yellow-400" /> Kelola Template
            Trade
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-3xl font-light"
          >
            &times;
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex-shrink-0 mb-6 p-4 bg-gray-100/50 dark:bg-gray-700/50 rounded-lg"
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
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-4"
              required
            />
            <input
              type="text"
              name="pair"
              placeholder="Pair Default (e.g., XAU/USD)"
              value={templateData.pair}
              onChange={handleTemplateChange}
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-1"
            />
            <select
              name="type"
              value={templateData.type}
              onChange={handleTemplateChange}
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-1"
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
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-1"
            />
            <input
              type="number"
              step="any"
              name="pnl"
              placeholder="P&L Default (0 jika kosong)"
              value={templateData.pnl}
              onChange={handleTemplateChange}
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-1"
            />
            <input
              type="number"
              step="any"
              name="riskRewardRatio"
              placeholder="R:R Ratio (e.g., 2)"
              value={templateData.riskRewardRatio}
              onChange={handleTemplateChange}
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-2"
            />
            <input
              type="text"
              name="setup"
              placeholder="Setup/Strategi Default"
              value={templateData.setup}
              onChange={handleTemplateChange}
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-4"
            />
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                <div className="flex flex-col text-sm">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {t.name}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    {t.pair || "-"} | {t.type} | Lot: {parseFloat(t.lotSize || 0).toFixed(2)} |
                    R:R:{" "}
                    {parseFloat(t.riskRewardRatio || 0) > 0
                      ? `${t.riskRewardRatio}R`
                      : "N/A"}
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
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateManagementModal;
