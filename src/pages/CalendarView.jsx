import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { TradeList } from "../components/common/TradeList";
import { formatDate, formatCurrency } from "../utils/formatters";
import { classNames } from "../utils/helpers";

export const CalendarView = ({
  trades,
  onEdit,
  onDelete,
  onView,
  customFields,
  currency,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const tradesByDate = useMemo(() => {
    const map = new Map();
    trades.forEach((trade) => {
      const dateStr = formatDate(trade.tradeDate);
      if (!map.has(dateStr)) {
        map.set(dateStr, { pnl: 0, trades: [], wins: 0, losses: 0 });
      }
      const dayData = map.get(dateStr);
      dayData.pnl += trade.pnl;
      dayData.trades.push(trade);
      if (trade.pnl > 0) dayData.wins++;
      else if (trade.pnl < 0) dayData.losses++;
    });
    return map;
  }, [trades]);

  const monthlyPnl = useMemo(() => {
    let total = 0;
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    tradesByDate.forEach((dayData, dateStr) => {
      const date = new Date(dateStr);
      if (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      ) {
        total += dayData.pnl;
      }
    });
    return total;
  }, [tradesByDate, currentDate]);

  const handleDayClick = (day) => {
    const dayStr = formatDate(day);
    if (tradesByDate.has(dayStr)) {
      setSelectedDate(day);
    } else {
      setSelectedDate(null);
    }
  };

  const renderHeader = () => {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentFullYear = new Date().getFullYear();
    const startYear = currentFullYear - 5;
    const endYear = currentFullYear + 5;
    const years = Array.from(
      { length: endYear - startYear + 1 },
      (_, i) => startYear + i,
    );
    const months = [
      { value: 0, label: "Januari" },
      { value: 1, label: "Februari" },
      { value: 2, label: "Maret" },
      { value: 3, label: "April" },
      { value: 4, label: "Mei" },
      { value: 5, label: "Juni" },
      { value: 6, label: "Juli" },
      { value: 7, label: "Agustus" },
      { value: 8, label: "September" },
      { value: 9, label: "Oktober" },
      { value: 10, label: "November" },
      { value: 11, label: "Desember" },
    ];
    return (
      <div className="flex justify-between items-center p-4">
        <button
          type="button"
          onClick={() =>
            setCurrentDate(
              (p) => new Date(p.getFullYear(), p.getMonth() - 1, 1),
            )
          }
          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          <ChevronLeft />
        </button>
        <div className="flex flex-col items-center">
          <div className="flex space-x-3">
            <select
              value={currentMonth}
              onChange={(e) =>
                setCurrentDate(
                  (p) => new Date(p.getFullYear(), parseInt(e.target.value), 1),
                )
              }
              className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold py-2 px-3 rounded-lg appearance-none cursor-pointer"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              value={currentYear}
              onChange={(e) =>
                setCurrentDate(
                  (p) => new Date(parseInt(e.target.value), p.getMonth(), 1),
                )
              }
              className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold py-2 px-3 rounded-lg appearance-none cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400 font-medium">
              Total P&L Bulan Ini:{" "}
            </span>
            <span
              className={`font-bold ${
                monthlyPnl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatCurrency(monthlyPnl, currency)}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            setCurrentDate(
              (p) => new Date(p.getFullYear(), p.getMonth() + 1, 1),
            )
          }
          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          <ChevronRight />
        </button>
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay());
    const rows = [];
    let day = new Date(startDate);
    for (let i = 0; i < 6; i++) {
      const daysInWeek = [];
      let weeklyPnl = 0;
      let weeklyTradeDays = 0;
      for (let j = 0; j < 7; j++) {
        const cloneDay = new Date(day);
        const dayStr = formatDate(cloneDay);
        const dayData = tradesByDate.get(dayStr);
        if (dayData) {
          weeklyPnl += dayData.pnl;
          weeklyTradeDays++;
        }
        const winRate = dayData
          ? (dayData.wins / (dayData.wins + dayData.losses)) * 100
          : 0;
        daysInWeek.push(
          <div
            key={day.toString()}
            className={classNames(
              "relative p-2 h-28 md:h-32 border-t border-l border-gray-200 dark:border-gray-700 flex flex-col",
              day.getMonth() !== currentDate.getMonth()
                ? "text-gray-500 dark:text-gray-600 bg-gray-50 dark:bg-gray-900/50"
                : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800",
              dayData
                ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                : "",
              formatDate(selectedDate) === dayStr
                ? "bg-blue-600/20 dark:bg-blue-600/50 ring-2 ring-blue-400"
                : "",
            )}
            onClick={() => handleDayClick(cloneDay)}
          >
            <span
              className={classNames(
                "font-medium",
                formatDate(new Date()) === dayStr
                  ? "text-blue-500 dark:text-blue-400 font-bold"
                  : "",
              )}
            >
              {cloneDay.getDate()}
            </span>
            {dayData && (
              <div className="mt-1 text-xs flex-grow flex flex-col justify-end">
                <p
                  className={classNames(
                    "font-bold",
                    dayData.pnl > 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                >
                  {formatCurrency(dayData.pnl, currency)}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  {dayData.trades.length} trade
                  {dayData.trades.length > 1 ? "s" : ""}
                </p>
                <p
                  className={classNames(
                    dayData.wins > dayData.losses
                      ? "text-green-500"
                      : "text-red-500",
                  )}
                >
                  {isNaN(winRate) ? "N/A" : `${winRate.toFixed(0)}% win`}
                </p>
              </div>
            )}
          </div>,
        );
        day.setDate(day.getDate() + 1);
      }
      rows.push(
        <div className="grid grid-cols-8" key={`week-${i}`}>
          {daysInWeek}
          <div className="p-2 h-28 md:h-32 border-t border-l border-r border-gray-200 dark:border-gray-700 flex flex-col justify-center items-center text-center bg-white dark:bg-gray-800">
            {weeklyTradeDays > 0 ? (
              <>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Week {i + 1}
                </p>
                <p
                  className={classNames(
                    "font-bold text-sm",
                    weeklyPnl > 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                >
                  {formatCurrency(weeklyPnl, currency)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {weeklyTradeDays} hari
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-600">
                Week {i + 1}
              </p>
            )}
          </div>
        </div>,
      );
    }
    return <div>{rows}</div>;
  };

  const selectedTrades = useMemo(() => {
    if (!selectedDate) return [];
    const dayStr = formatDate(selectedDate);
    const dayData = tradesByDate.get(dayStr);
    if (!dayData) return [];
    return [...dayData.trades].sort(
      (a, b) => new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime(),
    );
  }, [selectedDate, tradesByDate]);

  return (
    <div className="animate-fadeIn">
      <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        {renderHeader()}
        <div className="grid grid-cols-8 text-center font-semibold text-gray-500 dark:text-gray-400 text-xs px-2 pb-2">
          {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
            <div key={day}>{day}</div>
          ))}
          <div className="text-blue-500 dark:text-blue-400">Mingguan</div>
        </div>
        {renderCells()}
      </div>
      {selectedDate && selectedTrades.length > 0 && (
        <TradeList
          trades={selectedTrades}
          onEdit={onEdit}
          onView={onView}
          onDelete={onDelete}
          title={`Trade untuk ${selectedDate.toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}`}
          customFields={customFields}
          currency={currency}
        />
      )}
    </div>
  );
};

export default CalendarView;
