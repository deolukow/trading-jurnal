import React from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

export const DailyGoalProgress = ({ goal, currentPnl, currency }) => {
  if (!goal || (goal.dailyProfitTarget <= 0 && goal.dailyLossTarget <= 0)) {
    return null;
  }

  const { dailyProfitTarget, dailyLossTarget } = goal;
  const profitProgress =
    dailyProfitTarget > 0 && currentPnl > 0
      ? (currentPnl / dailyProfitTarget) * 100
      : 0;
  const clampedProfitProgress = Math.min(profitProgress, 100);
  const isProfitAchieved =
    dailyProfitTarget > 0 && currentPnl >= dailyProfitTarget;

  const lossProgress =
    dailyLossTarget > 0 && currentPnl < 0
      ? (Math.abs(currentPnl) / dailyLossTarget) * 100
      : 0;
  const clampedLossProgress = Math.min(lossProgress, 100);
  const isLossLimitHit =
    dailyLossTarget > 0 && Math.abs(currentPnl) >= dailyLossTarget;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg mb-6 animate-fadeIn">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <CheckCircle size={20} className="mr-2 text-cyan-400" />
          Target Harian
        </h3>
        {isProfitAchieved && (
          <span className="flex items-center text-sm font-bold bg-green-500/20 text-green-300 px-3 py-1 rounded-full">
            <CheckCircle size={16} className="mr-1.5" />
            Profit Tercapai!
          </span>
        )}
        {isLossLimitHit && (
          <span className="flex items-center text-sm font-bold bg-red-500/20 text-red-300 px-3 py-1 rounded-full">
            <AlertTriangle size={16} className="mr-1.5" />
            Batas Loss Tercapai!
          </span>
        )}
      </div>
      {dailyProfitTarget > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500 dark:text-gray-400">
              Target Profit
            </span>
            <div>
              <span
                className={`font-bold ${
                  isProfitAchieved ? "text-green-400" : "text-gray-900 dark:text-white"
                }`}
              >
                {formatCurrency(currentPnl > 0 ? currentPnl : 0, currency)}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {" "}
                / {formatCurrency(dailyProfitTarget, currency)}
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ease-out ${
                isProfitAchieved ? "bg-green-500" : "bg-cyan-500"
              }`}
              style={{ width: `${clampedProfitProgress}%` }}
            ></div>
          </div>
        </div>
      )}
      {dailyLossTarget > 0 && (
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500 dark:text-gray-400">Batas Loss</span>
            <div>
              <span
                className={`font-bold ${
                  isLossLimitHit ? "text-red-400" : "text-gray-900 dark:text-white"
                }`}
              >
                {formatCurrency(currentPnl < 0 ? currentPnl : 0, currency)}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {" "}
                / {formatCurrency(-dailyLossTarget, currency)}
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all duration-500 ease-out bg-red-500"
              style={{ width: `${clampedLossProgress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyGoalProgress;
