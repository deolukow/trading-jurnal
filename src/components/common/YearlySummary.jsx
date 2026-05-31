import React, { useMemo } from "react";
import { formatCurrency } from "../../utils/formatters";

export const YearlySummary = ({ trades, currency, year }) => {
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      pnl: 0,
      trades: 0,
      wins: 0,
      losses: 0,
      totalRR: 0,
    }));

    trades.forEach((trade) => {
      const tradeMonth = new Date(trade.tradeDate).getMonth();
      months[tradeMonth].pnl += trade.pnl;
      months[tradeMonth].trades++;
      months[tradeMonth].totalRR += parseFloat(trade.riskRewardRatio) || 0;
      if (trade.pnl > 0) {
        months[tradeMonth].wins++;
      } else if (trade.pnl < 0) {
        months[tradeMonth].losses++;
      }
    });

    return months.filter((m) => m.trades > 0);
  }, [trades]);

  const getMonthName = (monthIndex) => {
    return new Date(0, monthIndex).toLocaleString("id-ID", { month: "long" });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg animate-fadeIn overflow-hidden mt-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white p-4 border-b border-gray-200 dark:border-gray-700">
        Ringkasan Bulanan untuk Tahun {year}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="p-3 w-12 text-center">
                No.
              </th>
              <th scope="col" className="p-3">
                Bulan
              </th>
              <th scope="col" className="p-3 text-center">
                Jml Trade
              </th>
              <th scope="col" className="p-3 text-center">
                Win Rate
              </th>
              <th scope="col" className="p-3 text-right">
                Total P&L
              </th>
              <th scope="col" className="p-3 text-center">
                Total Win
              </th>
              <th scope="col" className="p-3 text-center">
                Total Loss
              </th>
              <th scope="col" className="p-3 text-center">
                Total R:R
              </th>
              <th scope="col" className="p-3 text-center">
                Rata-rata R:R
              </th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center p-6 text-gray-500">
                  Tidak ada trade untuk ditampilkan pada tahun ini.
                </td>
              </tr>
            ) : (
              monthlyData.map((data, index) => {
                const winRate =
                  data.trades > 0 ? (data.wins / data.trades) * 100 : 0;
                const avgRR =
                  data.trades > 0 ? data.totalRR / data.trades : 0;
                return (
                  <tr
                    key={data.month}
                    className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="p-3 text-center font-medium">{index + 1}</td>
                    <td className="p-3 font-medium text-gray-900 dark:text-white capitalize">
                      {getMonthName(data.month)}
                    </td>
                    <td className="p-3 text-center font-bold text-gray-700 dark:text-gray-300">
                      {data.trades}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-1 rounded font-bold text-xs ${
                          winRate >= 50
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {winRate.toFixed(1)}%
                      </span>
                    </td>
                    <td
                      className={`p-3 text-right font-bold ${
                        data.pnl >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatCurrency(data.pnl, currency)}
                    </td>
                    <td className="p-3 text-center text-green-600 dark:text-green-400 font-medium">
                      {data.wins}
                    </td>
                    <td className="p-3 text-center text-red-600 dark:text-red-400 font-medium">
                      {data.losses}
                    </td>
                    <td className="p-3 text-center font-medium">
                      {`${data.totalRR.toFixed(2)}R`}
                    </td>
                    <td className="p-3 text-center font-medium text-blue-600 dark:text-blue-400">
                      {`${avgRR.toFixed(2)}R`}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default YearlySummary;
