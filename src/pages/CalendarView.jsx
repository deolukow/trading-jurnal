import React, { useState, useMemo, useRef } from "react";
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

  // Swipe month navigation states & refs
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const pointerId = useRef(null);
  const isSwipeGesture = useRef(false);
  const preventClickRef = useRef(false);

  const handlePointerDown = (e) => {
    // Only capture primary touch or left mouse click
    if (e.button !== 0 && e.pointerType === "mouse") return;

    // Ignore interactive targets (select dropdowns, buttons)
    const target = e.target;
    if (
      target.tagName === "SELECT" ||
      target.tagName === "BUTTON" ||
      target.closest("button") ||
      target.closest("select")
    ) {
      return;
    }

    // Do NOT capture the pointer here. We will do it once a drag is confirmed.
    pointerId.current = e.pointerId;
    startX.current = e.clientX;
    startY.current = e.clientY;
    setIsDragging(true);
    setDragOffset(0);
    isSwipeGesture.current = false;
    preventClickRef.current = false;
  };

  const handlePointerMove = (e) => {
    if (!isDragging || pointerId.current !== e.pointerId) return;

    const diffX = e.clientX - startX.current;
    const diffY = e.clientY - startY.current;

    // Detect horizontal swiping intent
    if (!isSwipeGesture.current) {
      if (Math.abs(diffX) > 15 || Math.abs(diffY) > 15) {
        if (Math.abs(diffX) > Math.abs(diffY)) {
          isSwipeGesture.current = true;
          preventClickRef.current = true;
          // Capture the pointer NOW that we are certain it's a drag swipe!
          try {
            e.currentTarget.setPointerCapture(pointerId.current);
          } catch (err) {}
        } else {
          // If vertical swipe dominates (e.g. page scrolling), cancel swipe
          setIsDragging(false);
          pointerId.current = null;
        }
      }
    }

    if (isSwipeGesture.current) {
      setDragOffset(diffX);
    }
  };

  const handlePointerUp = (e) => {
    if (!isDragging || pointerId.current !== e.pointerId) return;

    try {
      e.currentTarget.releasePointerCapture(pointerId.current);
    } catch (err) {}

    setIsDragging(false);
    pointerId.current = null;

    if (isSwipeGesture.current) {
      const threshold = 100; // px to trigger month change
      if (dragOffset > threshold) {
        // Swipe Right -> Prev Month
        setCurrentDate((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1));
      } else if (dragOffset < -threshold) {
        // Swipe Left -> Next Month
        setCurrentDate((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1));
      }
    }

    // Delayed reset to ensure tap events do not register click actions instantly
    setTimeout(() => {
      preventClickRef.current = false;
    }, 50);

    setDragOffset(0);
    isSwipeGesture.current = false;
  };

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
    if (preventClickRef.current) return;
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
      <div className="flex justify-between items-center p-4 md:p-6 bg-gradient-to-r from-gray-50/20 via-white/40 to-gray-50/20 dark:from-gray-900/40 dark:via-gray-800/10 dark:to-gray-900/40 backdrop-blur-md border-b border-gray-200/20 dark:border-gray-700/30">
        <button
          type="button"
          onClick={() =>
            setCurrentDate(
              (p) => new Date(p.getFullYear(), p.getMonth() - 1, 1),
            )
          }
          className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 bg-gray-100/50 dark:bg-gray-800/40 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:text-blue-500 dark:hover:text-blue-400 hover:shadow-[0_0_10px_rgba(124,58,237,0.15)] transition-all duration-300 transform active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-1 bg-gray-100/50 dark:bg-gray-800/40 border border-gray-200/30 dark:border-gray-700/30 p-1 rounded-xl shadow-inner backdrop-blur-sm">
            <select
              value={currentMonth}
              onChange={(e) =>
                setCurrentDate(
                  (p) => new Date(p.getFullYear(), parseInt(e.target.value), 1),
                )
              }
              className="bg-transparent text-gray-900 dark:text-white font-bold py-1.5 px-3 rounded-lg cursor-pointer outline-none hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-colors text-xs md:text-sm select-none"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium">
                  {m.label}
                </option>
              ))}
            </select>
            <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-700"></div>
            <select
              value={currentYear}
              onChange={(e) =>
                setCurrentDate(
                  (p) => new Date(parseInt(e.target.value), p.getMonth(), 1),
                )
              }
              className="bg-transparent text-gray-900 dark:text-white font-bold py-1.5 px-3 rounded-lg cursor-pointer outline-none hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-colors text-xs md:text-sm select-none"
            >
              {years.map((y) => (
                <option key={y} value={y} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium">
                  {y}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mt-2.5">
            <span
              className={classNames(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] md:text-xs font-semibold backdrop-blur-md border shadow-sm transition-all duration-300",
                monthlyPnl >= 0
                  ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400 shadow-[0_0_10px_rgba(0,230,118,0.06)]"
                  : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 shadow-[0_0_10px_rgba(255,23,68,0.06)]",
              )}
            >
              <span className="text-gray-500 dark:text-gray-400/80 font-medium">
                P&L Bulan Ini:
              </span>
              <span className="font-extrabold tracking-tight">
                {formatCurrency(monthlyPnl, currency)}
              </span>
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
          className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 bg-gray-100/50 dark:bg-gray-800/40 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:text-blue-500 dark:hover:text-blue-400 hover:shadow-[0_0_10px_rgba(124,58,237,0.15)] transition-all duration-300 transform active:scale-95 cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
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
              "relative p-2 h-28 md:h-32 rounded-xl flex flex-col justify-between transition-all duration-300 select-none border backdrop-blur-sm",
              day.getMonth() !== currentDate.getMonth()
                ? "opacity-30 text-gray-400 dark:text-gray-650 bg-gray-50/10 dark:bg-gray-900/5 border-gray-200/5 dark:border-gray-800/5 pointer-events-none"
                : "text-gray-700 dark:text-gray-300 border-gray-200/40 dark:border-gray-800/30 bg-white/40 dark:bg-gray-800/15",
              dayData
                ? "cursor-pointer hover:-translate-y-0.5 shadow-sm"
                : "hover:bg-gray-100/30 dark:hover:bg-gray-800/10",
              dayData && dayData.pnl > 0
                ? "bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border-green-500/25 hover:border-green-500/60 dark:from-green-950/45 dark:via-green-950/20 dark:to-transparent dark:border-green-500/20 dark:hover:border-green-500/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_2px_8px_-2px_rgba(0,230,118,0.03)] hover:shadow-[0_4px_16px_rgba(0,230,118,0.12)] text-green-850 dark:text-green-300"
                : "",
              dayData && dayData.pnl < 0
                ? "bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border-red-500/25 hover:border-red-500/60 dark:from-red-950/35 dark:via-red-950/15 dark:to-transparent dark:border-red-500/20 dark:hover:border-red-500/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_2px_8px_-2px_rgba(255,23,68,0.03)] hover:shadow-[0_4px_16px_rgba(255,23,68,0.12)] text-red-850 dark:text-red-300"
                : "",
              dayData && dayData.pnl === 0
                ? "bg-gradient-to-br from-gray-500/10 to-transparent border-gray-500/20 hover:border-gray-500/40 dark:border-gray-700/30 dark:hover:border-gray-700/60 text-gray-700 dark:text-gray-300"
                : "",
              formatDate(selectedDate) === dayStr
                ? "ring-2 ring-blue-500 border-transparent dark:ring-blue-500 shadow-[0_0_15px_rgba(124,58,237,0.3)] z-10"
                : "",
            )}
            onClick={() => handleDayClick(cloneDay)}
          >
            <div className="flex justify-between items-start w-full">
              <span
                className={classNames(
                  "text-[11px] md:text-xs font-semibold px-1.5 py-0.5 rounded-md",
                  formatDate(new Date()) === dayStr
                    ? "text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10 dark:bg-blue-500/25 border border-blue-500/20 dark:border-blue-500/30 shadow-[0_0_8px_rgba(124,58,237,0.15)]"
                    : "text-gray-500 dark:text-gray-400",
                )}
              >
                {cloneDay.getDate()}
              </span>
              
              {formatDate(new Date()) === dayStr && (
                <span className="relative flex h-1.5 w-1.5 mt-1 mr-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                </span>
              )}
            </div>
            
            {dayData && (
              <div className="mt-1 flex-grow flex flex-col justify-end gap-0.5">
                <p
                  className={classNames(
                    "font-bold text-xs md:text-sm tracking-tight",
                    dayData.pnl > 0
                      ? "text-green-600 dark:text-green-400 drop-shadow-[0_0_6px_rgba(0,230,118,0.1)]"
                      : "text-red-600 dark:text-red-400 drop-shadow-[0_0_6px_rgba(255,23,68,0.1)]",
                  )}
                >
                  {formatCurrency(dayData.pnl, currency)}
                </p>
                
                <div className="flex justify-between items-center text-[9px] md:text-[10px] text-gray-500/80 dark:text-gray-400/70 font-medium">
                  <span>
                    {dayData.trades.length} {dayData.trades.length > 1 ? "Trades" : "Trade"}
                  </span>
                  
                  {!isNaN(winRate) && (
                    <span
                      className={classNames(
                        "px-1 py-0.5 rounded text-[8px] font-bold uppercase",
                        winRate >= 50
                          ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/10"
                          : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/10",
                      )}
                    >
                      {winRate.toFixed(0)}% W
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>,
        );
        day.setDate(day.getDate() + 1);
      }
      
      rows.push(
        <div className="grid grid-cols-8 gap-1.5 md:gap-2" key={`week-${i}`}>
          {daysInWeek}
          
          <div
            className={classNames(
              "p-2 h-28 md:h-32 rounded-xl flex flex-col justify-between items-center text-center transition-all duration-300 border border-dashed select-none animate-fadeIn",
              weeklyTradeDays > 0
                ? "bg-gradient-to-b from-blue-950/20 via-blue-900/5 to-transparent border-blue-500/20 dark:border-blue-500/10 text-gray-700 dark:text-gray-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]"
                : "bg-gray-50/20 dark:bg-gray-900/5 border-gray-200/20 dark:border-gray-800/10 text-gray-400 dark:text-gray-650",
            )}
          >
            <span className="text-[9px] md:text-[10px] uppercase tracking-wider font-extrabold text-blue-500 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(124,58,237,0.1)]">
              MGG {i + 1}
            </span>
            
            {weeklyTradeDays > 0 ? (
              <div className="flex-grow flex flex-col justify-end w-full">
                <p
                  className={classNames(
                    "font-extrabold text-xs md:text-sm tracking-tight",
                    weeklyPnl > 0
                      ? "text-green-500 dark:text-green-400 drop-shadow-[0_0_6px_rgba(0,230,118,0.15)]"
                      : "text-red-500 dark:text-red-400 drop-shadow-[0_0_6px_rgba(255,23,68,0.15)]",
                  )}
                >
                  {formatCurrency(weeklyPnl, currency)}
                </p>
                <span className="text-[9px] text-gray-400/80 dark:text-gray-500 mt-1 font-medium">
                  {weeklyTradeDays} Hari
                </span>
              </div>
            ) : (
              <div className="flex-grow flex flex-col justify-end">
                <span className="text-[8px] text-gray-400/40 dark:text-gray-650/40 font-medium">
                  Kosong
                </span>
              </div>
            )}
          </div>
        </div>,
      );
    }
    return <div className="flex flex-col gap-1.5 md:gap-2 p-3 bg-gray-50/30 dark:bg-gray-950/20 rounded-b-2xl">{rows}</div>;
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
    <div className="animate-fadeIn select-none">
      <div
        className="bg-white/40 dark:bg-gray-800/25 rounded-2xl shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)] border border-gray-200/50 dark:border-gray-700/30 overflow-hidden touch-pan-y backdrop-blur-lg"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          style={{
            transform: `translateX(${dragOffset}px)`,
            transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.2, 0.8, 0.25, 1)",
          }}
        >
          {renderHeader()}
          <div className="grid grid-cols-8 text-center font-bold text-gray-400 dark:text-gray-500 text-[10px] tracking-widest uppercase py-3 border-b border-gray-200/10 dark:border-gray-700/30 px-3 bg-gray-50/40 dark:bg-gray-900/20">
            {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
              <div key={day} className="select-none">{day}</div>
            ))}
            <div className="text-blue-500 dark:text-blue-400 font-extrabold uppercase select-none">Mingguan</div>
          </div>
          {renderCells()}
        </div>
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
