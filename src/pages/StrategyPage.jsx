import React, { useState } from "react";
import { Edit3, Trash2, Plus, CheckCircle } from "lucide-react";
import { addItem, updateItem } from "../config/db";

export const StrategyPage = ({
  activeProfileId,
  showToast,
  openDeleteModal,
  strategies,
  onRefresh,
}) => {
  const [title, setTitle] = useState("");
  const [probability, setProbability] = useState("");
  const [description, setDescription] = useState("");
  const [checklists, setChecklists] = useState([]);
  const [newCheckItem, setNewCheckItem] = useState("");
  const [editingStrategy, setEditingStrategy] = useState(null);

  const handleAddChecklist = () => {
    if (newCheckItem.trim() && !checklists.includes(newCheckItem.trim())) {
      setChecklists([...checklists, newCheckItem.trim()]);
      setNewCheckItem("");
    }
  };

  const handleRemoveChecklist = (index) => {
    setChecklists(checklists.filter((_, i) => i !== index));
  };

  const handleEditClick = (strat) => {
    setEditingStrategy(strat);
    setTitle(strat.title);
    setProbability(strat.probability || "");
    setDescription(strat.description || "");
    setChecklists(strat.checklists || []);
  };

  const handleCancelEdit = () => {
    setEditingStrategy(null);
    setTitle("");
    setProbability("");
    setDescription("");
    setChecklists([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return showToast("Judul strategi wajib diisi", "error");

    const strategyData = {
      id: editingStrategy ? editingStrategy.id : crypto.randomUUID(),
      profileId: activeProfileId,
      title: title.trim(),
      probability: probability ? parseFloat(probability) : null,
      description: description.trim(),
      checklists: checklists,
      createdAt: editingStrategy ? editingStrategy.createdAt : new Date(),
      updatedAt: new Date(),
    };

    try {
      if (editingStrategy) {
        await updateItem("strategies", strategyData);
        showToast("Strategi berhasil diupdate", "success");
      } else {
        await addItem("strategies", strategyData);
        showToast("Strategi berhasil ditambahkan", "success");
      }
      handleCancelEdit();
      onRefresh();
    } catch (err) {
      showToast("Gagal menyimpan strategi", "error");
    }
  };

  return (
    <div className="animate-fadeIn space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
        Manajemen Strategi & Setup
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Input */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-fit space-y-4"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b pb-2">
            {editingStrategy ? "Edit Strategi" : "Tambah Strategi Baru"}
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Judul / Setup Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded outline-none border border-transparent focus:border-blue-500"
              placeholder="Contoh: Breaker Block + FVG"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Probabilitas Win-Rate (%)
            </label>
            <input
              type="number"
              max="100"
              min="0"
              value={probability}
              onChange={(e) => setProbability(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded outline-none border border-transparent focus:border-blue-500"
              placeholder="Contoh: 75"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Rules Checklist Entry
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCheckItem}
                onChange={(e) => setNewCheckItem(e.target.value)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm outline-none border border-transparent focus:border-blue-500"
                placeholder="Syarat / Konfirmasi Rule..."
              />
              <button
                type="button"
                onClick={handleAddChecklist}
                className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Plus size={20} />
              </button>
            </div>
            <ul className="mt-2 space-y-1">
              {checklists.map((item, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center text-xs bg-gray-100 dark:bg-gray-700/50 p-2 rounded border border-gray-200 dark:border-gray-600"
                >
                  <span className="text-gray-700 dark:text-gray-300">
                    • {item}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklist(i)}
                    className="text-red-500 font-bold hover:text-red-700"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Keterangan / Detail Rules
            </label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm outline-none border border-transparent focus:border-blue-500 resize-none"
              placeholder="Tulis detail SOP eksekusi setup di sini..."
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold"
            >
              {editingStrategy ? "Update Strategi" : "Simpan Strategi"}
            </button>
            {editingStrategy && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
              >
                Batal
              </button>
            )}
          </div>
        </form>

        {/* Grid List Strategi */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Daftar Strategi Aktif ({strategies.length})
          </h3>
          {strategies.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-8 text-center rounded-xl border text-gray-400">
              Belum ada strategi yang dicatat. Strategi yang Anda buat di sini
              otomatis akan menjadi opsi pada menu input trade.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strategies.map((strat) => (
                <div
                  key={strat.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700 flex flex-col justify-between group relative"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg pr-8">
                        {strat.title}
                      </h4>
                      {strat.probability && (
                        <span className="bg-blue-500/10 text-blue-500 text-xs font-bold px-2 py-1 rounded border border-blue-500/20">
                          WR: {strat.probability}%
                        </span>
                      )}
                    </div>
                    {strat.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap line-clamp-3 border-b border-gray-100 dark:border-gray-700 pb-2 mb-2">
                        {strat.description}
                      </p>
                    )}
                    {strat.checklists && strat.checklists.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">
                          Entry Criteria:
                        </p>
                        {strat.checklists.map((chk, idx) => (
                          <div
                            key={idx}
                            className="flex items-center text-xs text-gray-600 dark:text-gray-400 gap-1.5"
                          >
                            <CheckCircle
                              size={12}
                              className="text-green-500 flex-shrink-0"
                            />
                            <span className="truncate">{chk}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-1 border-t dark:border-gray-700 pt-3 mt-4">
                    <button
                      type="button"
                      onClick={() => handleEditClick(strat)}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteModal("strategy", strat)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StrategyPage;
