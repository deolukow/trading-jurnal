import React from "react";

export const MonthYearSelector = ({
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
}) => {
  const currentFullYear = new Date().getFullYear();
  const months = [
    { value: "0", label: "Januari" },
    { value: "1", label: "Februari" },
    { value: "2", label: "Maret" },
    { value: "3", label: "April" },
    { value: "4", label: "Mei" },
    { value: "5", label: "Juni" },
    { value: "6", label: "Juli" },
    { value: "7", label: "Agustus" },
    { value: "8", label: "September" },
    { value: "9", label: "Oktober" },
    { value: "10", label: "November" },
    { value: "11", label: "Desember" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg mb-6 animate-fadeIn flex flex-col sm:flex-row items-center justify-center gap-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Pilih Bulan & Tahun Ringkasan:
        </span>
      </div>
      <div className="flex items-center gap-3">
        {/* Month Selector dropdown */}
        <select
          id="monthSelector"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 w-40 text-center rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 font-medium outline-none cursor-pointer"
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        {/* Year Input */}
        <input
          id="monthYearSelectorYear"
          type="number"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          onBlur={(e) => {
            const year = parseInt(e.target.value, 10);
            if (isNaN(year) || year < 2020 || year > currentFullYear + 5) {
              setSelectedYear(String(currentFullYear));
            }
          }}
          placeholder="YYYY"
          className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 w-24 text-center rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none outline-none font-semibold"
        />
      </div>
    </div>
  );
};

export default MonthYearSelector;
