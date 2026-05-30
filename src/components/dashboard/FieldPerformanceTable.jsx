import React, { useState, useMemo } from "react";

export const FieldPerformanceTable = ({ trades, customFields }) => {
  const [selectedField, setSelectedField] = useState("pair");

  const standardFields = useMemo(
    () => [
      { key: "pair", label: "Pair" },
      { key: "type", label: "Tipe (Long/Short)" },
      { key: "setup", label: "Setup / Strategi" },
      { key: "dayOfWeek", label: "Hari" },
    ],
    [],
  );

  const allFields = useMemo(() => {
    return [
      ...standardFields,
      ...customFields.map((f) => ({
        key: `custom_${f.name}`,
        label: f.name,
      })),
    ];
  }, [standardFields, customFields]);

  const performanceData = useMemo(() => {
    const groups = {};
    const INDONESIAN_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

    trades.forEach((trade) => {
      let value = "";
      let dayIndex = -1;

      if (selectedField === "dayOfWeek") {
        const date = trade.tradeDate instanceof Date ? trade.tradeDate : new Date(trade.tradeDate);
        dayIndex = isNaN(date.getTime()) ? -1 : date.getDay();
        value = dayIndex !== -1 ? INDONESIAN_DAYS[dayIndex] : "N/A";
      } else if (selectedField.startsWith("custom_")) {
        const fieldName = selectedField.replace("custom_", "");
        value = trade.customData?.[fieldName] || "N/A";
      } else {
        value = trade[selectedField] || "N/A";
      }

      if (!groups[value]) {
        groups[value] = {
          name: value,
          count: 0,
          wins: 0,
          losses: 0,
          totalRR: 0,
          dayIndex: dayIndex,
        };
      }

      groups[value].count++;
      if (trade.pnl > 0) groups[value].wins++;
      else if (trade.pnl < 0) groups[value].losses++;

      groups[value].totalRR += parseFloat(trade.riskRewardRatio) || 0;
    });

    return Object.values(groups)
      .map((g) => ({
        ...g,
        winrate: g.count > 0 ? (g.wins / g.count) * 100 : 0,
        avgRR: g.count > 0 ? g.totalRR / g.count : 0,
      }))
      .sort((a, b) => {
        if (selectedField === "dayOfWeek") {
          // Sort Monday (1) to Sunday (7)
          const getSortIndex = (idx) => (idx === 0 ? 7 : idx);
          return getSortIndex(a.dayIndex) - getSortIndex(b.dayIndex);
        }
        return b.count - a.count;
      });
  }, [trades, selectedField]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg animate-fadeIn overflow-hidden mt-6 mb-6">
      <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-0">
          Performa Berdasarkan Kategori
        </h3>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Kelompokkan:
          </label>
          <select
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
            className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 outline-none text-sm font-medium"
          >
            {allFields.map((field) => (
              <option key={field.key} value={field.key}>
                {field.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="p-3 w-12 text-center">
                No.
              </th>
              <th scope="col" className="p-3">
                Nama
              </th>
              <th scope="col" className="p-3 text-center">
                Jml Trade
              </th>
              <th scope="col" className="p-3 text-center">
                Win Rate
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
            {performanceData.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center p-6 text-gray-500">
                  Tidak ada data untuk ditampilkan pada periode ini.
                </td>
              </tr>
            ) : (
              performanceData.map((data, index) => (
                <tr
                  key={index}
                  className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="p-3 text-center font-medium">{index + 1}</td>
                  <td className="p-3 font-medium text-gray-900 dark:text-white capitalize">
                    {data.name}
                  </td>
                  <td className="p-3 text-center font-bold text-gray-700 dark:text-gray-300">
                    {data.count}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-1 rounded font-bold text-xs ${
                        data.winrate >= 50
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {data.winrate.toFixed(1)}%
                    </span>
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
                    {`${data.avgRR.toFixed(2)}R`}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FieldPerformanceTable;
