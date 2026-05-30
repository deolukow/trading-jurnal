import React from "react";

export const StatCard = ({ title, value, children, footer, icon }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col justify-between min-h-[160px]">
    <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-2">
      {icon}
      <span className="ml-2">{title}</span>
    </div>
    <div className="flex-grow flex items-center justify-center">
      {value !== undefined && value !== null && (
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white my-2">
          {value}
        </h3>
      )}
      {children}
    </div>
    <div className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2 h-8 flex items-center justify-center">
      {footer}
    </div>
  </div>
);

export default StatCard;
