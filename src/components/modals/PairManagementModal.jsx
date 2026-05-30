import React, { useState, useEffect, useRef } from "react";
import { Target, Trash2 } from "lucide-react";
import { addItem } from "../../config/db";

export const PairManagementModal = ({
  activeProfileId,
  showToast,
  onClose,
  pairs,
  openDeleteModal,
  onRefresh,
}) => {
  const [newPair, setNewPair] = useState("");

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
      if (onRefresh) await onRefresh();
    } catch (error) {
      showToast("Gagal menambah Pair.", "error");
      console.error("Error adding pair:", error);
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
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-modalSpringIn relative border border-gray-100 dark:border-gray-700/50"
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
            <Target size={24} className="mr-2 text-yellow-400" /> Kelola Pair
            Trading
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-3xl font-light leading-none p-1"
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
            className="flex-grow bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:border-blue-500 outline-none"
            required
            maxLength={10}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
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
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium text-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default PairManagementModal;
