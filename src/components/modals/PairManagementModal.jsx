import React, { useState } from "react";
import { Target, Trash2 } from "lucide-react";
import { addItem } from "../../config/db";

export const PairManagementModal = ({
  activeProfileId,
  showToast,
  onClose,
  pairs,
  openDeleteModal,
}) => {
  const [newPair, setNewPair] = useState("");

  const handleAddPair = async (e) => {
    e.preventDefault();
    const pairName = newPair.trim().toUpperCase();
    if (!pairName) {
      showToast("Nama Pair tidak boleh kosong.", "error");
      return;
    }
    if (pairs.some((p) => p.name?.toUpperCase() === pairName)) {
      showToast(`Pair '${pairName}' sudah ada.`, "error");
      setNewPair("");
      return;
    }
    try {
      const newPairData = {
        id: crypto.randomUUID(),
        profileId: activeProfileId,
        name: pairName,
        createdAt: new Date(),
      };
      await addItem("pairs", newPairData);
      showToast(`Pair ${pairName} berhasil ditambahkan.`, "success");
      setNewPair("");
    } catch (error) {
      showToast("Gagal menambah Pair.", "error");
      console.error("Error adding pair:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Target size={24} className="mr-2 text-yellow-400" /> Kelola Pair
            Trading
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-3xl font-light"
          >
            &times;
          </button>
        </div>
        <form
          onSubmit={handleAddPair}
          className="flex-shrink-0 mb-6 flex space-x-2"
        >
          <input
            type="text"
            placeholder="Nama Pair (e.g., EUR/USD)"
            value={newPair}
            onChange={(e) => setNewPair(e.target.value.toUpperCase())}
            className="flex-grow bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
            required
            maxLength={10}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Tambah
          </button>
        </form>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex-shrink-0">
          Daftar Pair ({pairs.length})
        </h3>
        <div className="overflow-y-auto flex-grow space-y-2 pr-2">
          {pairs.length === 0 ? (
            <p className="text-gray-500 text-sm p-4 text-center bg-gray-100 dark:bg-gray-700 rounded-lg">
              Tambahkan pair trading yang sering Anda gunakan di atas.
            </p>
          ) : (
            pairs.map((p) => (
              <div
                key={p.id}
                className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg flex justify-between items-center transition-shadow hover:shadow-md hover:shadow-gray-700/50"
              >
                <span className="font-semibold text-gray-900 dark:text-white">
                  {p.name}
                </span>
                <button
                  type="button"
                  onClick={() => openDeleteModal("pair", p)}
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                  title={`Hapus Pair ${p.name}`}
                >
                  <Trash2 size={16} />
                </button>
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

export default PairManagementModal;
