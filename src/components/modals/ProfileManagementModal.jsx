import React, { useState, useEffect, useRef } from "react";
import { Users, PlusCircle, Trash2, Edit3, Camera, X } from "lucide-react";
import { addItem, updateItem, getItemsByProfileId, getItem } from "../../config/db";

export const ProfileManagementModal = ({
  showToast,
  onClose,
  profiles,
  openDeleteModal,
}) => {
  const [profileName, setProfileName] = useState("");
  const [profileDesc, setProfileDesc] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [editingProfile, setEditingProfile] = useState(null);

  // Import options states
  const [importSourceId, setImportSourceId] = useState("");
  const [importStrategies, setImportStrategies] = useState(true);
  const [importPairs, setImportPairs] = useState(true);
  const [importCustomFields, setImportCustomFields] = useState(true);
  const [importTemplates, setImportTemplates] = useState(true);

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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      showToast("Ukuran foto maksimal 1MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfileAvatar("");
    const fileInput = document.getElementById("profile-avatar-input");
    if (fileInput) fileInput.value = "";
  };

  const resetForm = () => {
    setProfileName("");
    setProfileDesc("");
    setCurrency("USD");
    setProfileAvatar("");
    setEditingProfile(null);
    setImportSourceId("");
  };

  const handleEdit = (profile) => {
    setEditingProfile(profile);
    setProfileName(profile.name);
    setProfileDesc(profile.description || "");
    setCurrency(profile.currency || "USD");
    setProfileAvatar(profile.avatar || "");
    
    const formElement = document.getElementById("profile-form-container");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAddProfile = async (e) => {
    e.preventDefault();
    const name = profileName.trim();
    const description = profileDesc.trim();

    if (!name) {
      showToast("Nama profil tidak boleh kosong.", "error");
      return;
    }

    try {
      if (editingProfile) {
        const updatedProfile = {
          ...editingProfile,
          name,
          description,
          currency,
          avatar: profileAvatar,
          updatedAt: new Date(),
        };
        await updateItem("profiles", updatedProfile);
        showToast(`Profil '${name}' berhasil diperbarui.`, "success");
        resetForm();
        onClose();
        return;
      }

      const newProfile = {
        id: crypto.randomUUID(),
        name,
        description,
        currency,
        avatar: profileAvatar,
        createdAt: new Date(),
      };
      await addItem("profiles", newProfile);

      // Perform deep copy importing if a source profile is chosen
      if (importSourceId) {
        showToast("Sedang mengimpor data profil...", "info");

        // 1. Copy Custom Fields
        if (importCustomFields) {
          try {
            const sourceFields = await getItemsByProfileId("custom_fields", importSourceId);
            for (const f of sourceFields) {
              await addItem("custom_fields", {
                ...f,
                id: crypto.randomUUID(),
                profileId: newProfile.id,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
          } catch (err) {
            console.error("Gagal mengimpor field tambahan:", err);
          }
        }

        // 2. Copy Pairs
        if (importPairs) {
          try {
            const sourcePairs = await getItemsByProfileId("pairs", importSourceId);
            for (const p of sourcePairs) {
              await addItem("pairs", {
                ...p,
                id: crypto.randomUUID(),
                profileId: newProfile.id,
                createdAt: new Date(),
              });
            }
          } catch (err) {
            console.error("Gagal mengimpor pair:", err);
          }
        }

        // 3. Copy Strategies & deep copy their examples images
        if (importStrategies) {
          try {
            const sourceStrats = await getItemsByProfileId("strategies", importSourceId);
            for (const s of sourceStrats) {
              const copiedImageIds = [];
              if (s.imageIds && s.imageIds.length > 0) {
                for (const oldImgId of s.imageIds) {
                  try {
                    const oldImgRecord = await getItem("trade_images", oldImgId);
                    if (oldImgRecord && oldImgRecord.file) {
                      const newImgId = crypto.randomUUID();
                      await addItem("trade_images", { id: newImgId, file: oldImgRecord.file });
                      copiedImageIds.push(newImgId);
                    }
                  } catch (err) {
                    console.error("Gagal menyalin gambar strategi saat import:", err);
                  }
                }
              }
              await addItem("strategies", {
                ...s,
                id: crypto.randomUUID(),
                profileId: newProfile.id,
                imageIds: copiedImageIds,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
          } catch (err) {
            console.error("Gagal mengimpor strategi:", err);
          }
        }

        // 4. Copy Trade Templates
        if (importTemplates) {
          try {
            const sourceTemplates = await getItemsByProfileId("templates", importSourceId);
            for (const t of sourceTemplates) {
              await addItem("templates", {
                ...t,
                id: crypto.randomUUID(),
                profileId: newProfile.id,
                createdAt: new Date(),
              });
            }
          } catch (err) {
            console.error("Gagal mengimpor template trade:", err);
          }
        }
      }

      showToast(
        importSourceId
          ? `Profil '${name}' berhasil ditambahkan dengan data impor.`
          : `Profil '${name}' berhasil ditambahkan.`,
        "success"
      );

      resetForm();
      onClose();
    } catch (error) {
      console.error("Error adding/updating profile:", error);
      showToast("Gagal memproses profil.", "error");
    }
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
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-modalSpringIn relative border border-gray-100 dark:border-gray-700/50"
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
            <Users
              size={24}
              className="mr-2 text-blue-500 dark:text-blue-400"
            />{" "}
            Kelola Profil Trading
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-3xl font-light leading-none p-1"
          >
            &times;
          </button>
        </div>

        <form
          id="profile-form-container"
          onSubmit={handleAddProfile}
          className="flex-shrink-0 mb-6 p-4 bg-gray-100/50 dark:bg-gray-700/50 rounded-lg max-h-[50vh] overflow-y-auto space-y-3"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {editingProfile ? `Edit Profil: ${editingProfile.name}` : "Tambah Profil Baru"}
          </h3>

          {/* Circular Photo Upload Zone */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative group">
              {profileAvatar ? (
                <img
                  src={profileAvatar}
                  alt="Preview Avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white border-2 border-white/10 shadow-md">
                  <Users size={32} />
                </div>
              )}
              <label
                htmlFor="profile-avatar-input"
                className="absolute inset-0 bg-black/40 hover:bg-black/50 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-200"
              >
                <Camera size={18} />
                <span className="text-[9px] font-semibold mt-1">Ganti Foto</span>
              </label>
              {profileAvatar && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow hover:scale-105 transition-transform"
                  title="Hapus Foto"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <input
              id="profile-avatar-input"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-medium">
              Upload Foto Profil (Maks. 1MB)
            </span>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nama Profil (e.g., Akun Pro)"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:border-blue-500 outline-none text-sm"
              required
            />
            <textarea
              placeholder="Deskripsi (e.g., Akun di broker XM, leverage 1:500)"
              value={profileDesc}
              onChange={(e) => setProfileDesc(e.target.value)}
              rows="2"
              className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:border-blue-500 outline-none text-sm resize-none"
            />
            <div className="flex gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">Mata Uang:</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="flex-grow bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:border-blue-500 outline-none text-sm"
              >
                <option value="USD">USD ($)</option>
                <option value="IDR">IDR (Rp)</option>
              </select>
            </div>

            {/* Render Import Data Section if there is at least 1 other profile AND we are not in edit mode */}
            {!editingProfile && profiles && profiles.length > 0 && (
              <div className="pt-3 border-t border-gray-300 dark:border-gray-600 space-y-2.5">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Import Data dari Profil Lain (Opsional)
                </label>
                <select
                  value={importSourceId}
                  onChange={(e) => setImportSourceId(e.target.value)}
                  className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm focus:border-blue-500 outline-none"
                >
                  <option value="">-- Jangan Import Data --</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.currency})
                    </option>
                  ))}
                </select>

                {importSourceId && (
                  <div className="grid grid-cols-2 gap-2 p-3 bg-gray-200/75 dark:bg-gray-900/35 rounded border border-gray-300 dark:border-gray-700 text-xs animate-fadeIn">
                    <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={importStrategies}
                        onChange={(e) => setImportStrategies(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Strategi & Setup</span>
                    </label>
                    <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={importPairs}
                        onChange={(e) => setImportPairs(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Daftar Pair</span>
                    </label>
                    <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={importCustomFields}
                        onChange={(e) => setImportCustomFields(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Field Tambahan</span>
                    </label>
                    <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={importTemplates}
                        onChange={(e) => setImportTemplates(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Template Trade</span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end mt-4 space-x-2">
            {editingProfile && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center shadow"
            >
              {editingProfile ? (
                <>
                  <Edit3 size={18} className="mr-1.5" /> Simpan Perubahan
                </>
              ) : (
                <>
                  <PlusCircle size={18} className="mr-1.5" /> Tambah Profil
                </>
              )}
            </button>
          </div>
        </form>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex-shrink-0 font-bold">
          Daftar Profil ({profiles.length})
        </h3>
        <div className="overflow-y-auto flex-grow space-y-2 pr-2">
          {profiles.map((p) => {
            const parts = p.name.trim().split(/\s+/);
            const initials = parts.length >= 2
              ? (parts[0][0] + parts[1][0]).toUpperCase()
              : parts[0].slice(0, 2).toUpperCase();

            return (
              <div
                key={p.id}
                className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg flex justify-between items-center group transition-shadow hover:shadow-sm"
              >
                <div className="flex items-center space-x-3 max-w-[75%] min-w-0">
                  {p.avatar ? (
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-200 dark:border-gray-600 shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-xs flex-shrink-0 shadow-sm">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {p.name}{" "}
                      <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                        ({p.currency})
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {p.description || "Tidak ada deskripsi"}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleEdit(p)}
                    className="p-1.5 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded transition-colors"
                    title={`Edit Profil ${p.name}`}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => openDeleteModal("profile", p)}
                    className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded transition-colors"
                    title={`Hapus Profil ${p.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end mt-6 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium text-sm shadow-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileManagementModal;
