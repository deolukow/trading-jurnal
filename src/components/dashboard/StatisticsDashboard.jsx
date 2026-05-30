import React from "react";
import {
  DollarSign,
  TrendingUp,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Ratio,
  Zap,
  Divide,
  CalendarDays,
  BarChartHorizontal,
  Hash,
} from "lucide-react";
import { StatCard } from "./StatCard";
import { GaugeChart } from "./GaugeChart";
import { RatioBar } from "./RatioBar";
import { formatCurrency, formatLotSize } from "../../utils/formatters";

export const StatisticsDashboard = ({ stats, currency }) => {
  if (!stats) return null;

  const displayProfitFactor = isFinite(stats.profitFactor)
    ? stats.profitFactor.toFixed(2)
    : "∞";
  const displayAvgWinLossRatio = isFinite(stats.avgWinLossRatio)
    ? stats.avgWinLossRatio.toFixed(2)
    : "∞";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-6 animate-fadeIn">
      <StatCard
        title="Net P&L"
        value={formatCurrency(stats.netPnl, currency)}
        icon={<DollarSign size={16} />}
        footer={
          <span
            className={
              stats.netPnl >= 0
                ? "text-green-500 dark:text-green-400"
                : "text-red-500 dark:text-red-400"
            }
          >
            {" "}
            {stats.netPnl >= 0 ? "Profit" : "Loss"}{" "}
          </span>
        }
      />
      <StatCard
        title="Account Growth"
        value={`${stats.growthPercentage >= 0 ? "+" : ""}${stats.growthPercentage.toFixed(2)}%`}
        icon={
          <TrendingUp
            size={16}
            className={
              stats.growthPercentage >= 0 ? "text-green-400" : "text-red-400"
            }
          />
        }
        footer={
          <span
            className={
              stats.growthPercentage >= 0
                ? "text-green-500 dark:text-green-400"
                : "text-red-500 dark:text-red-400"
            }
          >
            {stats.growthPercentage >= 0
              ? "Pertumbuhan Positif"
              : "Pertumbuhan Negatif"}
          </span>
        }
      />
      <StatCard
        title="Trade Win %"
        icon={<Target size={16} />}
        footer={
          <span>
            <span className="text-green-500 dark:text-green-400">
              {stats.wins} menang
            </span>{" "}
            /{" "}
            <span className="text-red-500 dark:text-red-400">
              {stats.losses} kalah
            </span>
          </span>
        }
      >
        {" "}
        <GaugeChart value={stats.tradeWinRate} />{" "}
      </StatCard>

      {/* CARD: Best Trade */}
      <StatCard
        title="Best Trade"
        value={formatCurrency(stats.bestTrade, currency)}
        icon={<ArrowUpRight size={16} className="text-green-500" />}
        footer={
          <span className="text-gray-500">Profit Terbesar Periode Ini</span>
        }
      />

      {/* CARD: Worst Trade */}
      <StatCard
        title="Worst Trade"
        value={formatCurrency(stats.worstTrade, currency)}
        icon={<ArrowDownRight size={16} className="text-red-500" />}
        footer={
          <span className="text-gray-500">Loss Terbesar Periode Ini</span>
        }
      />

      {/* CARD: Best RR */}
      <StatCard
        title="Avg R:R Ratio"
        value={`${stats.avgRiskReward.toFixed(2)}R`}
        icon={<Ratio size={16} />}
        footer={<span>Rata-rata Risk to Reward</span>}
      />

      <StatCard
        title="Streak W/L"
        icon={<Zap size={16} />}
        footer={<span>Kemenangan / Kekalahan beruntun</span>}
      >
        <div className="flex items-center justify-center space-x-6 text-center">
          <div>
            <p className="text-3xl font-bold text-green-500 dark:text-green-400">
              {stats.consecutiveWins}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Menang</p>
          </div>
          <div className="h-10 w-px bg-gray-200 dark:bg-gray-700"></div>
          <div>
            <p className="text-3xl font-bold text-red-500 dark:text-red-400">
              {stats.consecutiveLosses}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Kalah</p>
          </div>
        </div>
      </StatCard>
      <StatCard
        title="Profit Factor"
        value={displayProfitFactor}
        icon={<Divide size={16} />}
        footer={
          <div className="w-full flex flex-col items-center">
            <span className="text-green-500">
              {formatCurrency(stats.grossProfit, currency)}
            </span>
            <span className="text-gray-500 mx-1">/</span>
            <span className="text-red-500">
              {formatCurrency(stats.grossLoss, currency)}
            </span>
          </div>
        }
      />
      <StatCard
        title="Day Win %"
        icon={<CalendarDays size={16} />}
        footer={
          <span>
            <span className="text-green-500 dark:text-green-400">
              {stats.profitableDays} hari
            </span>{" "}
            /{" "}
            <span className="text-red-500 dark:text-red-400">
              {stats.losingDays} hari
            </span>
          </span>
        }
      >
        {" "}
        <GaugeChart value={stats.dayWinRate} />{" "}
      </StatCard>
      <StatCard
        title="Avg Win/Loss"
        icon={<BarChartHorizontal size={16} />}
        footer={
          <div className="w-full flex flex-col items-center">
            <RatioBar
              winValue={stats.avgWin}
              lossValue={Math.abs(stats.avgLoss)}
            />
            <div className="w-full flex justify-between mt-1">
              <span className="text-green-500 dark:text-green-400">
                {formatCurrency(stats.avgWin, currency)}
              </span>
              <span className="text-red-500 dark:text-red-400">
                {formatCurrency(stats.avgLoss, currency)}
              </span>
            </div>
          </div>
        }
        value={displayAvgWinLossRatio}
      />
      <StatCard
        title="Avg R:R Ratio"
        value={`${stats.avgRiskReward.toFixed(2)}R`}
        icon={<Ratio size={16} />}
        footer={<span>Rata-rata Risk to Reward</span>}
      />
      <StatCard
        title="Total Lot Digunakan"
        value={formatLotSize(stats.totalLotUsed)}
        icon={<Hash size={16} />}
        footer={<span>Volum Trading Akumulatif</span>}
      />
    </div>
  );
};

export default StatisticsDashboard;
