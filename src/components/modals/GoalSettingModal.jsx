import React, { useState, useEffect } from "react";
import { TrendingUp, Save, Trash2 } from "lucide-react";
import { updateItem, deleteItem } from "../../config/db";
import { formatCurrency } from "../../utils/formatters";

export const GoalSettingModal = ({
  activeProfileId,
  showToast,
  onClose,
  currentGoal,
  currency,
}) => {
  const [goalType, setGoalType] = useState("weekly");
  const [goalAmount, setGoalAmount] = useState("");
  const [dailyProfitTarget, setDailyProfitTarget] = useState("");
  const [dailyLossTarget, setDailyLossTarget] = useState("");

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
      onClose();
    } catch (error) {
      console.error("Error deleting goal:", error);
      showToast("Gagal menghapus target.", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
          <TrendingUp size={24} className="mr-2 text-yellow-400" /> Tetapkan
          Target
        </h2>
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
                className={`flex-1 py-2 text-sm rounded-md transition-colors ${
                  goalType === "weekly"
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                Mingguan
              </button>
              <button
                type="button"
                onClick={() => setGoalType("monthly")}
                className={`flex-1 py-2 text-sm rounded-md transition-colors ${
                  goalType === "monthly"
                    ? "bg-blue-600 text-white"
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
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded mt-2"
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
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
              />
              <input
                id="dailyLossTarget"
                type="number"
                step="any"
                value={dailyLossTarget}
                onChange={(e) => setDailyLossTarget(e.target.value)}
                placeholder={`Batas Loss Harian (${currency})`}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save size={18} className="inline mr-1" /> Simpan
            </button>
            {currentGoal &&
              (currentGoal.amount > 0 ||
                currentGoal.dailyProfitTarget > 0 ||
                currentGoal.dailyLossTarget > 0) && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={18} className="inline mr-1" /> Hapus
                </button>
              )}
          </div>
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

export default GoalSettingModal;
