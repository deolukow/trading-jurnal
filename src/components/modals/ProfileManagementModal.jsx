import React, { useState } from "react";
import { Users, PlusCircle, Trash2 } from "lucide-react";
import { addItem } from "../../config/db";

export const ProfileManagementModal = ({
  showToast,
  onClose,
  profiles,
  openDeleteModal,
}) => {
  const [profileName, setProfileName] = useState("");
  const [profileDesc, setProfileDesc] = useState("");
  const [currency, setCurrency] = useState("USD");

  const handleAddProfile = async (e) => {
    e.preventDefault();
    const name = profileName.trim();
    const description = profileDesc.trim();

    if (!name) {
      showToast("Nama profil tidak boleh kosong.", "error");
      return;
    }

    try {
      const newProfile = {
        id: crypto.randomUUID(),
        name,
        description,
        currency,
        createdAt: new Date(),
      };
      await addItem("profiles", newProfile);
      showToast(`Profil '${name}' berhasil ditambahkan.`, "success");
      setProfileName("");
      setProfileDesc("");
      setCurrency("USD");
      onClose();
    } catch (error) {
      console.error("Error adding profile:", error);
      showToast("Gagal menambah profil.", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Users
              size={24}
              className="mr-2 text-blue-500 dark:text-blue-400"
            />{" "}
            Kelola Profil Trading
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-3xl font-light"
          >
            &times;
          </button>
        </div>

        <form
          onSubmit={handleAddProfile}
          className="flex-shrink-0 mb-6 p-4 bg-gray-100/50 dark:bg-gray-700/50 rounded-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Tambah Profil Baru
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nama Profil (e.g., Akun Pro)"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
              required
            />
            <textarea
              placeholder="Deskripsi (e.g., Akun di broker XM, leverage 1:500)"
              value={profileDesc}
              onChange={(e) => setProfileDesc(e.target.value)}
              rows="2"
              className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
            >
              <option value="USD">USD ($)</option>
              <option value="IDR">IDR (Rp)</option>
            </select>
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <PlusCircle size={18} className="inline mr-1" /> Tambah Profil
            </button>
          </div>
        </form>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex-shrink-0">
          Daftar Profil ({profiles.length})
        </h3>
        <div className="overflow-y-auto flex-grow space-y-2 pr-2">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {p.name}{" "}
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                    ({p.currency})
                  </span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {p.description || "Tidak ada deskripsi"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openDeleteModal("profile", p)}
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                title={`Hapus Profil ${p.name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
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

export default ProfileManagementModal;
