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
    }));

    trades.forEach((trade) => {
      const tradeMonth = new Date(trade.tradeDate).getMonth();
      months[tradeMonth].pnl += trade.pnl;
      months[tradeMonth].trades++;
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
      <h3 className="text-xl font-bold text-gray-900 dark:text-white p-4">
        Ringkasan Bulanan untuk Tahun {year}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="p-3">
                Bulan
              </th>
              <th scope="col" className="p-3 text-right">
                Total P&L
              </th>
              <th scope="col" className="p-3 text-right">
                Total Trade
              </th>
              <th scope="col" className="p-3 text-right">
                Win Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center p-6 text-gray-500">
                  Tidak ada trade untuk ditampilkan pada tahun ini.
                </td>
              </tr>
            ) : (
              monthlyData.map((data) => {
                const winRate =
                  data.trades > 0 ? (data.wins / data.trades) * 100 : 0;
                return (
                  <tr
                    key={data.month}
                    className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="p-3 font-medium text-gray-900 dark:text-white">
                      {getMonthName(data.month)}
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
                    <td className="p-3 text-right">{data.trades}</td>
                    <td className="p-3 text-right">{winRate.toFixed(1)}%</td>
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
