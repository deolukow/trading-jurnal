import React, { useState, useEffect, useRef } from "react";
import { TrendingUp, Save, Trash2 } from "lucide-react";
import { updateItem, deleteItem } from "../../config/db";
import { formatCurrency } from "../../utils/formatters";

export const GoalSettingModal = ({
  activeProfileId,
  showToast,
  onClose,
  currentGoal,
  currency,
  onRefresh,
}) => {
  const [goalType, setGoalType] = useState("weekly");
  const [goalAmount, setGoalAmount] = useState("");
  const [dailyProfitTarget, setDailyProfitTarget] = useState("");
  const [dailyLossTarget, setDailyLossTarget] = useState("");

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

  useEffect(() => {
    if (currentGoal) {
      setGoalType(currentGoal.type || "weekly");
      setGoalAmount(currentGoal.amount || "");
      setDailyProfitTarget(currentGoal.dailyProfitTarget || "");
      setDailyLossTarget(currentGoal.dailyLossTarget || "");
    } else {
      setGoalType("weekly");
      setGoalAmount("");
      setDailyProfitTarget("");
      setDailyLossTarget("");
    }
  }, [currentGoal]);

  const handleSave = async () => {
    const amount = parseFloat(goalAmount) || 0;
    const dailyProfit = parseFloat(dailyProfitTarget) || 0;
    const dailyLoss = parseFloat(dailyLossTarget) || 0;

    if (amount < 0 || dailyProfit < 0 || dailyLoss < 0) {
      showToast("Target tidak boleh angka negatif.", "error");
      return;
    }
    if (amount === 0 && dailyProfit === 0 && dailyLoss === 0) {
      showToast("Mohon isi setidaknya satu target.", "info");
      return;
    }

    const goalData = {
      id: activeProfileId,
      profileId: activeProfileId,
      type: goalType,
      amount: amount,
      dailyProfitTarget: dailyProfit,
      dailyLossTarget: dailyLoss,
      updatedAt: new Date(),
    };
    try {
      await updateItem("goals", goalData);
      showToast("Target berhasil disimpan!", "success");
      if (onRefresh) await onRefresh();
      onClose();
    } catch (error) {
      console.error("Error saving goal:", error);
      showToast("Gagal menyimpan target.", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteItem("goals", activeProfileId);
      showToast("Target berhasil dihapus.", "success");
      setGoalAmount("");
      setDailyProfitTarget("");
      setDailyLossTarget("");
      if (onRefresh) await onRefresh();
      onClose();
    } catch (error) {
      console.error("Error deleting goal:", error);
      showToast("Gagal menghapus target.", "error");
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
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md animate-modalSpringIn relative border border-gray-100 dark:border-gray-700/50"
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
          className="flex justify-between items-center mb-2 flex-shrink-0 cursor-grab active:cursor-grabbing select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <TrendingUp size={24} className="mr-2 text-yellow-400" /> Tetapkan
            Target
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-3xl font-light leading-none p-1"
          >
            &times;
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Target harian hanya tampil di periode 'Harian'. Target
          mingguan/bulanan tampil di periode masing-masing.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Target Mingguan/Bulanan
            </label>
            <div className="flex space-x-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
              <button
                type="button"
                onClick={() => setGoalType("weekly")}
                className={`flex-1 py-2 text-sm rounded-md transition-colors font-medium ${
                  goalType === "weekly"
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                Mingguan
              </button>
              <button
                type="button"
                onClick={() => setGoalType("monthly")}
                className={`flex-1 py-2 text-sm rounded-md transition-colors font-medium ${
                  goalType === "monthly"
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                Bulanan
              </button>
            </div>
            <input
              id="goalAmount"
              type="number"
              step="any"
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
              placeholder={`Jumlah Target ${
                goalType === "weekly" ? "Mingguan" : "Bulanan"
              }`}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded mt-2 focus:border-blue-500 outline-none text-sm"
            />
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Target Harian
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                id="dailyProfitTarget"
                type="number"
                step="any"
                value={dailyProfitTarget}
                onChange={(e) => setDailyProfitTarget(e.target.value)}
                placeholder={`Profit Harian (${currency})`}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:border-blue-500 outline-none text-sm"
              />
              <input
                id="dailyLossTarget"
                type="number"
                step="any"
                value={dailyLossTarget}
                onChange={(e) => setDailyLossTarget(e.target.value)}
                placeholder={`Batas Loss Harian (${currency})`}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:border-blue-500 outline-none text-sm"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              <Save size={18} className="inline mr-1" /> Simpan
            </button>
            {currentGoal &&
              (currentGoal.amount > 0 ||
                currentGoal.dailyProfitTarget > 0 ||
                currentGoal.dailyLossTarget > 0) && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                >
                  <Trash2 size={18} className="inline mr-1" /> Hapus
                </button>
              )}
          </div>
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

export default GoalSettingModal;
