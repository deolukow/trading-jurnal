import React, { useState, useEffect } from "react";
import { Edit3, Trash2, Plus, CheckCircle, Camera, Image as ImageIcon, Eye } from "lucide-react";
import { addItem, updateItem, getItem, deleteItem } from "../config/db";
import { useLocalImage } from "../hooks/useLocalImage";
import { FullscreenImageModal } from "../components/modals/FullscreenImageModal";
import { StrategyDetailModal } from "../components/modals/StrategyDetailModal";

// --- SUBCOMPONENT: Helper to load and display saved strategy thumbnail ---
const StrategyImageLoader = ({ imageId, onClick }) => {
  const url = useLocalImage(imageId);
  if (!url) return <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded border border-gray-300 dark:border-gray-600"></div>;
  return (
    <div className="relative group w-12 h-12 border border-gray-300 dark:border-gray-600 rounded overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow active:scale-95 duration-200">
      <img
        src={url}
        alt="Setup Preview"
        onClick={onClick}
        className="w-full h-full object-cover transition-transform group-hover:scale-105"
      />
    </div>
  );
};

// --- SUBCOMPONENT: Helper to load and show saved image preview in the edit form ---
const StrategyExistingImagePreview = ({ imageId, onRemove }) => {
  const url = useLocalImage(imageId);
  return (
    <div className="relative w-16 h-16 group border border-gray-300 dark:border-gray-600 rounded overflow-hidden shadow-sm">
      {url ? (
        <img src={url} alt="Saved Setup" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute inset-0 bg-red-600/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-semibold text-xs transition-all duration-200"
      >
        Hapus
      </button>
    </div>
  );
};

// --- MAIN STRATEGY PAGE COMPONENT ---
export const StrategyPage = ({
  activeProfileId,
  showToast,
  openDeleteModal,
  strategies,
  onRefresh,
  tradingProfiles,
}) => {
  const [title, setTitle] = useState("");
  const [probability, setProbability] = useState("");
  const [description, setDescription] = useState("");
  const [checklists, setChecklists] = useState([]);
  const [newCheckItem, setNewCheckItem] = useState("");

  // Image attachments states
  const [imageFiles, setImageFiles] = useState([]); // Selected new files in form
  const [existingImageIds, setExistingImageIds] = useState([]); // Previously saved image IDs in form
  const [editingStrategy, setEditingStrategy] = useState(null);
  const [targetProfileId, setTargetProfileId] = useState(
    activeProfileId === "all" && tradingProfiles?.length > 0 ? tradingProfiles[0].id : activeProfileId
  );

  // Fullscreen Lightbox states
  const [previewImages, setPreviewImages] = useState([]);
  const [previewInitialIndex, setPreviewInitialIndex] = useState(-1);

  // Strategy Details Modal & Expand/Collapse states
  const [selectedStrategyForDetail, setSelectedStrategyForDetail] = useState(null);
  const [expandedDescIds, setExpandedDescIds] = useState({});

  const handleAddChecklist = () => {
    if (newCheckItem.trim() && !checklists.includes(newCheckItem.trim())) {
      setChecklists([...checklists, newCheckItem.trim()]);
      setNewCheckItem("");
    }
  };

  const handleRemoveChecklist = (index) => {
    setChecklists(checklists.filter((_, i) => i !== index));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImageFiles((prev) => [...prev, ...files]);
    }
    // Reset file input value so same files can be selected again if removed
    e.target.value = "";
  };

  const removeNewImageFile = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImageId = (id) => {
    setExistingImageIds((prev) => prev.filter((item) => item !== id));
  };

  const handleEditClick = (strat) => {
    setEditingStrategy(strat);
    setTitle(strat.title);
    setProbability(strat.probability || "");
    setDescription(strat.description || "");
    setChecklists(strat.checklists || []);
    setExistingImageIds(strat.imageIds || []);
    setImageFiles([]); // Reset new files
    setTargetProfileId(strat.profileId || (tradingProfiles?.length > 0 ? tradingProfiles[0].id : activeProfileId));
  };

  const handleCancelEdit = () => {
    setEditingStrategy(null);
    setTitle("");
    setProbability("");
    setDescription("");
    setChecklists([]);
    setExistingImageIds([]);
    setImageFiles([]);
    if (activeProfileId === "all" && tradingProfiles?.length > 0) {
      setTargetProfileId(tradingProfiles[0].id);
    } else {
      setTargetProfileId(activeProfileId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return showToast("Judul strategi wajib diisi", "error");

    try {
      // 1. Save new uploaded image files into IndexedDB
      const newImageIds = [];
      for (const file of imageFiles) {
        const id = crypto.randomUUID();
        await addItem("trade_images", { id, file });
        newImageIds.push(id);
      }

      // 2. Combine kept old image IDs and newly saved image IDs
      const finalImageIds = [...existingImageIds, ...newImageIds];

      const strategyData = {
        id: editingStrategy ? editingStrategy.id : crypto.randomUUID(),
        profileId: activeProfileId === "all" ? targetProfileId : activeProfileId,
        title: title.trim(),
        probability: probability ? parseFloat(probability) : null,
        description: description.trim(),
        checklists: checklists,
        imageIds: finalImageIds, // Save images array
        createdAt: editingStrategy ? editingStrategy.createdAt : new Date(),
        updatedAt: new Date(),
      };

      // 3. Clear orphaned images in DB that were deleted during editing
      if (editingStrategy && editingStrategy.imageIds) {
        const deletedIds = editingStrategy.imageIds.filter(id => !finalImageIds.includes(id));
        for (const id of deletedIds) {
          await deleteItem("trade_images", id);
        }
      }

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
      console.error(err);
      showToast("Gagal menyimpan strategi", "error");
    }
  };

  // Open Fullscreen Lightbox preview for selected strategy images
  const handleImagePreview = async (imageIds, initialIndex, strategyTitle) => {
    try {
      const resolved = [];
      for (const id of imageIds) {
        const record = await getItem("trade_images", id);
        if (record && record.file) {
          resolved.push({
            url: URL.createObjectURL(record.file),
            title: `${strategyTitle} Setup Example`,
          });
        }
      }
      setPreviewImages(resolved);
      setPreviewInitialIndex(initialIndex);
    } catch (err) {
      console.error("Failed to load previews:", err);
      showToast("Gagal memuat preview gambar", "error");
    }
  };

  // Close Lightbox and safely clean local object URLs from memory
  const handleClosePreview = () => {
    previewImages.forEach((img) => {
      if (img.url && img.url.startsWith("blob:")) {
        URL.revokeObjectURL(img.url);
      }
    });
    setPreviewImages([]);
    setPreviewInitialIndex(-1);
  };

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Dynamic Lightbox Modal */}
      {previewInitialIndex !== -1 && (
        <FullscreenImageModal
          images={previewImages}
          initialIndex={previewInitialIndex}
          onClose={handleClosePreview}
        />
      )}

      {/* Strategy Detail Modal */}
      {selectedStrategyForDetail && (
        <StrategyDetailModal
          isOpen={!!selectedStrategyForDetail}
          onClose={() => setSelectedStrategyForDetail(null)}
          strategy={selectedStrategyForDetail}
          tradingProfiles={tradingProfiles}
          onEdit={handleEditClick}
          onDelete={openDeleteModal}
          handleImagePreview={handleImagePreview}
        />
      )}

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

          {activeProfileId === "all" && tradingProfiles && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Akun Tujuan
              </label>
              <select
                value={targetProfileId}
                onChange={(e) => setTargetProfileId(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded outline-none border border-transparent focus:border-blue-500"
                required
              >
                {tradingProfiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.currency})</option>
                ))}
              </select>
            </div>
          )}

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
            <ul className="mt-2 space-y-1 max-h-[140px] overflow-y-auto">
              {checklists.map((item, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center text-xs bg-gray-100 dark:bg-gray-700/50 p-2 rounded border border-gray-200 dark:border-gray-600 animate-fadeIn"
                >
                  <span className="text-gray-700 dark:text-gray-300">
                    • {item}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklist(i)}
                    className="text-red-500 font-bold hover:text-red-700 text-sm leading-none"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Multiple Image Attachments Uploader */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Contoh Gambar Setup (Bisa Multiple)
            </label>
            <div className="flex flex-col gap-3">
              <label className="flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 p-4 rounded-lg cursor-pointer bg-gray-100/50 dark:bg-gray-700/35 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                <div className="text-center">
                  <Camera size={24} className="mx-auto text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors mb-1" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 block font-medium">Unggah Gambar Contoh Setup</span>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {/* Preview newly attached images */}
              {imageFiles.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">
                    Gambar Baru Ditambahkan ({imageFiles.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {imageFiles.map((file, idx) => {
                      const fileUrl = URL.createObjectURL(file);
                      return (
                        <div key={idx} className="relative w-14 h-14 group border border-gray-300 dark:border-gray-600 rounded overflow-hidden shadow-sm animate-fadeIn">
                          <img
                            src={fileUrl}
                            alt="Preview New Attachment"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImageFile(idx)}
                            className="absolute inset-0 bg-red-600/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs"
                          >
                            Hapus
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Preview existing saved images */}
              {editingStrategy && existingImageIds.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-700 animate-fadeIn">
                  <p className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">
                    Gambar Tersimpan ({existingImageIds.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {existingImageIds.map((id) => (
                      <StrategyExistingImagePreview
                        key={id}
                        imageId={id}
                        onRemove={() => removeExistingImageId(id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
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
              className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold transition-colors"
            >
              {editingStrategy ? "Update Strategi" : "Simpan Strategi"}
            </button>
            {editingStrategy && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm transition-colors"
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
            <div className="bg-white dark:bg-gray-800 p-8 text-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400">
              Belum ada strategi yang dicatat. Strategi yang Anda buat di sini
              otomatis akan menjadi opsi pada menu input trade.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strategies.map((strat) => (
                <div
                  key={strat.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700 flex flex-col justify-between group relative transition-all hover:shadow-md"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 
                        onClick={() => setSelectedStrategyForDetail(strat)}
                        className="font-bold text-gray-900 dark:text-white text-lg pr-8 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors truncate flex-1"
                        title="Klik untuk detail strategi"
                      >
                        {strat.title}
                      </h4>
                      {strat.probability && (
                        <span className="bg-blue-500/10 text-blue-500 text-xs font-bold px-2 py-1 rounded border border-blue-500/20 flex-shrink-0">
                          WR: {strat.probability}%
                        </span>
                      )}
                    </div>
                    {activeProfileId === "all" && tradingProfiles && strat.profileId && (
                      <div className="mb-2">
                        <span className="inline-block px-2.5 py-1 text-[10px] font-semibold rounded-md bg-indigo-100/60 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                          Profil: {tradingProfiles.find(p => p.id === strat.profileId)?.name || "Unknown"}
                        </span>
                      </div>
                    )}
                    {strat.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 pb-2 mb-2">
                        <p className={`whitespace-pre-wrap leading-relaxed ${expandedDescIds[strat.id] ? "" : "line-clamp-3"}`}>
                          {strat.description}
                        </p>
                        {strat.description.length > 120 && (
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedDescIds(prev => ({ ...prev, [strat.id]: !prev[strat.id] }));
                            }}
                            className="text-[11px] font-bold text-blue-500 dark:text-blue-400 hover:underline mt-1 focus:outline-none"
                          >
                            {expandedDescIds[strat.id] ? "Sembunyikan" : "Selengkapnya..."}
                          </button>
                        )}
                      </div>
                    )}
                    {strat.checklists && strat.checklists.length > 0 && (
                      <div className="space-y-1 mb-2">
                        <p className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">
                          Entry Criteria:
                        </p>
                        {strat.checklists.map((chk, idx) => (
                          <div
                            key={idx}
                            className="flex items-start text-xs text-gray-600 dark:text-gray-400 gap-1.5"
                          >
                            <CheckCircle
                              size={12}
                              className="text-green-500 flex-shrink-0 mt-0.5"
                            />
                            <span className="break-words flex-1">{chk}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Render attachment image thumbnails */}
                    {strat.imageIds && strat.imageIds.length > 0 && (
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-700/50">
                        <p className="text-[11px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                          Gambar Contoh Setup ({strat.imageIds.length}):
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {strat.imageIds.map((id, index) => (
                            <StrategyImageLoader
                              key={id}
                              imageId={id}
                              onClick={() => handleImagePreview(strat.imageIds, index, strat.title)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-1 border-t dark:border-gray-700 pt-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedStrategyForDetail(strat)}
                      className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded transition-colors"
                      title="Lihat Detail Strategi"
                    >
                      <Eye size={16} />
                    </button>
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
