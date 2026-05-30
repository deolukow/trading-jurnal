import React from "react";
import { TrendingUp, CheckCircle } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

export const GoalProgress = ({ goal, currentPnl, period, currency }) => {
  if (
    !goal ||
    !goal.type ||
    !goal.amount ||
    (goal.type !== "weekly" && goal.type !== "monthly") ||
    goal.type !== period
  ) {
    return null;
  }
  const { amount: goalAmount, type: goalType } = goal;
  const progress = currentPnl > 0 ? (currentPnl / goalAmount) * 100 : 0;
  const clampedProgress = Math.min(progress, 100);
  const isAchieved = currentPnl >= goalAmount;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg mb-6 animate-fadeIn">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <TrendingUp size={20} className="mr-2 text-yellow-400" />
          Target Profit {goalType === "weekly" ? "Mingguan" : "Bulanan"}
        </h3>
        {isAchieved && (
          <span className="flex items-center text-sm font-bold bg-green-500/20 text-green-300 px-3 py-1 rounded-full">
            <CheckCircle size={16} className="mr-1.5" />
            Target Tercapai!
          </span>
        )}
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex-grow">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative overflow-hidden">
            <div
              className={`h-4 rounded-full transition-all duration-500 ease-out ${
                isAchieved ? "bg-green-500" : "bg-blue-500"
              }`}
              style={{ width: `${clampedProgress}%` }}
            ></div>
          </div>
        </div>
        <div className="flex-shrink-0 w-40 text-right">
          <span
            className={`font-bold text-lg ${
              isAchieved ? "text-green-400 dark:text-green-300" : "text-gray-900 dark:text-white"
            }`}
          >
            {formatCurrency(currentPnl, currency)}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {" "}
            / {formatCurrency(goalAmount, currency)}
          </span>
        </div>
      </div>
      <p className="text-right text-sm text-gray-500 dark:text-gray-400 mt-1">
        {progress.toFixed(1)}%
      </p>
    </div>
  );
};

export default GoalProgress;
