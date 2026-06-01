import React, { useState, useEffect, useRef } from "react";
import { Settings, X, Activity, Search } from "lucide-react";

// Popular standard pair options
const POPULAR_PAIRS = [
  { value: "CAPITALCOM:US100", label: "NAS100 (Nasdaq 100)" },
  { value: "OANDA:XAUUSD", label: "GOLD / XAUUSD (Emas)" },
  { value: "CAPITALCOM:DXY", label: "DXY (US Dollar Index)" },
  { value: "FX:EURUSD", label: "EUR/USD (Euro / US Dollar)" },
  { value: "FX:GBPUSD", label: "GBP/USD (Pound / US Dollar)" },
  { value: "FX:USDJPY", label: "USD/JPY (US Dollar / Yen)" },
  { value: "FX:USDCAD", label: "USD/CAD (US Dollar / Canadian Dollar)" },
  { value: "FX:AUDUSD", label: "AUD/USD (Australian Dollar / US Dollar)" },
  { value: "FX:EURGBP", label: "EUR/GBP (Euro / Pound)" },
  { value: "BINANCE:BTCUSDT", label: "BTC/USDT (Bitcoin)" },
  { value: "BINANCE:ETHUSDT", label: "ETH/USDT (Ethereum)" },
  { value: "BINANCE:SOLUSDT", label: "SOL/USDT (Solana)" },
  { value: "custom", label: "🔎 Simbol Kustom..." }
];

// Sub-component to load a single quote embed
const TradingViewSingleQuote = ({ containerId, symbol }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    let active = true;
    if (!containerRef.current) return;
    containerRef.current.innerHTML = ""; // Clear existing

    // Re-create the widget anchor div
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    containerRef.current.appendChild(widgetDiv);

    // Injects TradingView single quote script
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: symbol || "FX:EURUSD",
      width: "100%",
      isSparkline: true,
      colorTheme: "dark",
      locale: "id"
    });

    if (active) {
      containerRef.current.appendChild(script);
    }

    return () => {
      active = false;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [symbol]);

  return (
    <div 
      id={containerId} 
      className="tradingview-widget-container w-full h-[125px] overflow-hidden rounded-xl bg-gray-950 border border-gray-700/40"
      ref={containerRef}
    />
  );
};

export const RealtimePricesWidget = () => {
  // Load saved pairs from LocalStorage
  const [pair1, setPair1] = useState(() => {
    const saved = localStorage.getItem("ticker_pair_1");
    if (saved === "FX:EURUSD" || saved === "NASDAQ:NDX" || !saved) {
      localStorage.setItem("ticker_pair_1", "CAPITALCOM:US100");
      return "CAPITALCOM:US100";
    }
    return saved;
  });

  const [pair2, setPair2] = useState(() => {
    const saved = localStorage.getItem("ticker_pair_2");
    if (!saved) {
      localStorage.setItem("ticker_pair_2", "OANDA:XAUUSD");
      return "OANDA:XAUUSD";
    }
    return saved;
  });
  
  // Custom manual inputs state
  const [customInput1, setCustomInput1] = useState("");
  const [customInput2, setCustomInput2] = useState("");
  
  // Selection modes (dropdown value or "custom")
  const [selectMode1, setSelectMode1] = useState(() => {
    const saved = localStorage.getItem("ticker_pair_1");
    const activeVal = (saved === "FX:EURUSD" || saved === "NASDAQ:NDX" || !saved) ? "CAPITALCOM:US100" : saved;
    return POPULAR_PAIRS.some(p => p.value === activeVal) ? activeVal : "custom";
  });
  
  const [selectMode2, setSelectMode2] = useState(() => {
    const saved = localStorage.getItem("ticker_pair_2") || "OANDA:XAUUSD";
    return POPULAR_PAIRS.some(p => p.value === saved) ? saved : "custom";
  });

  const [showSettings, setShowSettings] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem("ticker_pair_1", pair1);
  }, [pair1]);

  useEffect(() => {
    localStorage.setItem("ticker_pair_2", pair2);
  }, [pair2]);

  // Handle saving pair 1 selections
  const handleSavePair1 = (val) => {
    setSelectMode1(val);
    if (val !== "custom") {
      setPair1(val);
    } else {
      setCustomInput1(pair1);
    }
  };

  const handleApplyCustom1 = (e) => {
    e.preventDefault();
    if (customInput1.trim()) {
      setPair1(customInput1.trim().toUpperCase());
    }
  };

  // Handle saving pair 2 selections
  const handleSavePair2 = (val) => {
    setSelectMode2(val);
    if (val !== "custom") {
      setPair2(val);
    } else {
      setCustomInput2(pair2);
    }
  };

  const handleApplyCustom2 = (e) => {
    e.preventDefault();
    if (customInput2.trim()) {
      setPair2(customInput2.trim().toUpperCase());
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col justify-between h-full border border-gray-250 dark:border-gray-700/60 select-none animate-fadeIn relative overflow-hidden group">
      
      {/* 1. Widget Header */}
      <div className="flex justify-between items-center mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </div>
          <h3 className="text-sm font-extrabold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={14} className="text-violet-500" />
            Pantauan Harga Live
          </h3>
        </div>

        {/* Toggle Settings Button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1.5 text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer active:scale-95"
          title="Atur Pasangan Mata Uang"
        >
          {showSettings ? <X size={16} /> : <Settings size={16} className="animate-spin-hover" />}
        </button>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-grow flex flex-col md:flex-row gap-3 w-full overflow-hidden items-center justify-center">
        
        {/* Slot 1 Widget Display */}
        <div className="w-full flex-1">
          <TradingViewSingleQuote containerId="ticker_widget_1" symbol={pair1} />
        </div>

        {/* Slot 2 Widget Display */}
        <div className="w-full flex-1">
          <TradingViewSingleQuote containerId="ticker_widget_2" symbol={pair2} />
        </div>
      </div>

      {/* 3. Settings Form Slide-down Overlay */}
      {showSettings && (
        <div className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-750 p-4 rounded-xl z-20 flex flex-col justify-between animate-fadeIn">
          
          <div className="space-y-4 overflow-y-auto max-h-[85%] pr-1">
            <div className="flex items-center justify-between border-b pb-2 dark:border-gray-750">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Pengaturan Pair Pantauan</span>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-800 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Pair 1 Settings Row */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Pantauan Pair 1</label>
              <select
                value={selectMode1}
                onChange={(e) => handleSavePair1(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-2 rounded-lg outline-none border border-transparent focus:border-violet-500 text-xs font-semibold"
              >
                {POPULAR_PAIRS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>

              {selectMode1 === "custom" && (
                <form onSubmit={handleApplyCustom1} className="flex gap-1.5 mt-1 animate-fadeIn">
                  <input
                    type="text"
                    placeholder="Contoh: FX:EURUSD atau NASDAQ:AAPL"
                    value={customInput1}
                    onChange={(e) => setCustomInput1(e.target.value)}
                    className="flex-grow bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 px-2 py-1.5 rounded-lg text-xs font-semibold focus:outline-none uppercase text-gray-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold flex items-center gap-0.5 cursor-pointer shadow-sm shadow-violet-500/20 active:scale-95"
                  >
                    <Search size={12} /> Apply
                  </button>
                </form>
              )}
            </div>

            {/* Pair 2 Settings Row */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Pantauan Pair 2</label>
              <select
                value={selectMode2}
                onChange={(e) => handleSavePair2(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-2 rounded-lg outline-none border border-transparent focus:border-violet-500 text-xs font-semibold"
              >
                {POPULAR_PAIRS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>

              {selectMode2 === "custom" && (
                <form onSubmit={handleApplyCustom2} className="flex gap-1.5 mt-1 animate-fadeIn">
                  <input
                    type="text"
                    placeholder="Contoh: OANDA:XAUUSD atau BINANCE:BTCUSDT"
                    value={customInput2}
                    onChange={(e) => setCustomInput2(e.target.value)}
                    className="flex-grow bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 px-2 py-1.5 rounded-lg text-xs font-semibold focus:outline-none uppercase text-gray-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold flex items-center gap-0.5 cursor-pointer shadow-sm shadow-violet-500/20 active:scale-95"
                  >
                    <Search size={12} /> Apply
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Settings Footer */}
          <button
            onClick={() => setShowSettings(false)}
            className="w-full py-2 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white rounded-xl text-xs font-bold cursor-pointer text-center"
          >
            Selesai & Simpan
          </button>
        </div>
      )}
    </div>
  );
};

export default RealtimePricesWidget;
