import React from "react";

export const YearSelector = ({ selectedYear, setSelectedYear }) => {
  const currentFullYear = new Date().getFullYear();

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg mb-6 animate-fadeIn flex items-center justify-center gap-4 border border-gray-200 dark:border-gray-700">
      <label
        htmlFor="yearSelector"
        className="text-sm font-semibold text-gray-700 dark:text-gray-300"
      >
        Masukkan Tahun Ringkasan:
      </label>
      <input
        id="yearSelector"
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
        className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 w-28 text-center rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  );
};

export default YearSelector;
