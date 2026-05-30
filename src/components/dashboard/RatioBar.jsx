import React from "react";

export const RatioBar = ({ winValue, lossValue }) => {
  const total = winValue + lossValue;
  if (total === 0)
    return (
      <div className="h-2 w-full bg-gray-300 dark:bg-gray-600 rounded-full"></div>
    );
  const winPercentage = (winValue / total) * 100;
  return (
    <div className="w-full bg-red-500/50 rounded-full h-2.5 flex overflow-hidden">
      <div
        className="bg-green-500 h-2.5"
        style={{ width: `${winPercentage}%` }}
      ></div>
    </div>
  );
};

export default RatioBar;
