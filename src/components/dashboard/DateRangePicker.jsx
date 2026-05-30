import React from "react";

export const DateRangePicker = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg mb-6 animate-fadeIn flex flex-col sm:flex-row items-center justify-center gap-4 border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">
        Pilih Rentang Tanggal:
      </h3>
      <div className="flex items-center gap-2">
        <label
          htmlFor="startDate"
          className="text-sm text-gray-500 dark:text-gray-400"
        >
          Dari:
        </label>
        <input
          type="date"
          id="startDate"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="flex items-center gap-2">
        <label
          htmlFor="endDate"
          className="text-sm text-gray-500 dark:text-gray-400"
        >
          Hingga:
        </label>
        <input
          type="date"
          id="endDate"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
};

export default DateRangePicker;
