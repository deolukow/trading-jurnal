import React, { useState, useEffect, useRef } from "react";
import {
  Grid,
  Columns,
  Rows,
  Maximize2,
  Minimize2,
  Sparkles,
  ArrowRightLeft,
  Search,
  RefreshCw,
  TrendingUp,
  Settings,
  X,
  Plus,
  Trash2,
  Edit,
  Save,
  RotateCcw,
} from "lucide-react";

// Helper to clean pair names from Jurnal (e.g. "EUR/USD" -> "FX:EURUSD")
const cleanSymbolForTV = (symbol) => {
  if (!symbol) return "FX:EURUSD";
  const clean = symbol.replace(/[\/\s-_]/g, "").toUpperCase();

  // Forex majors
  if (["EURUSD", "GBPUSD", "AUDUSD", "NZDUSD", "USDCAD", "USDCHF", "USDJPY", "EURGBP", "GBPJPY"].includes(clean)) {
    return `FX:${clean}`;
  }
  // Crypto
  if (["BTCUSD", "ETHUSD", "SOLUSD", "ADAUSD"].includes(clean)) {
    return `BINANCE:${clean}T`;
  }
  if (clean === "XAUUSD" || clean === "GOLD") {
    return "OANDA:XAUUSD";
  }
  if (clean === "DXY" || clean === "USDOLLAR") {
    return "CAPITALCOM:DXY";
  }
  return clean;
};

// Loading script logic (Singleton pattern to prevent injecting script multiple times)
let tvScriptLoadingPromise;
const loadTradingViewScript = () => {
  if (!tvScriptLoadingPromise) {
    tvScriptLoadingPromise = new Promise((resolve) => {
      if (window.TradingView) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.id = "tradingview-widget-loading-script";
      script.src = "https://s3.tradingview.com/tv.js";
      script.type = "text/javascript";
      script.async = true;
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }
  return tvScriptLoadingPromise;
};

// --- SUBCOMPONENT: Individual TradingView Widget Slot ---
const TradingViewWidget = ({ containerId, symbol, isActive }) => {
  const widgetRef = useRef(null);

  useEffect(() => {
    let active = true;

    loadTradingViewScript().then(() => {
      if (!active) return;

      // Ensure target element exists and widget has not been instantiated on same container or is redrawn
      const element = document.getElementById(containerId);
      if (element && window.TradingView) {
        element.innerHTML = ""; // Clear content to prevent multiples

        try {
          widgetRef.current = new window.TradingView.widget({
            autosize: true,
            symbol: symbol,
            interval: "15",
            timezone: "Etc/UTC",
            theme: "dark",
            style: "1",
            locale: "en",
            enable_publishing: false,
            allow_symbol_change: true,
            container_id: containerId,
            // Premium features
            studies: [],
            show_popup_button: false,
            withdateranges: true,
            hide_side_toolbar: false,
            save_image: true,
            calendar: true,
            support_host: "https://www.tradingview.com"
          });
        } catch (err) {
          console.error("TradingView init error: ", err);
        }
      }
    });

    return () => {
      active = false;
      if (widgetRef.current) {
        widgetRef.current = null;
      }
    };
  }, [symbol, containerId]);

  return (
    <div className="w-full h-full relative bg-gray-900 flex items-center justify-center">
      <div id={containerId} className="w-full h-full" />
    </div>
  );
};

// --- MAIN TRADINGVIEW PAGE COMPONENT ---
export const TradingViewPage = ({ activeProfile, trades = [], pairs = [] }) => {
  // Grid layout mode: "1" (Single), "2-vertical" (Split Kiri-Kanan), "2-horizontal" (Split Atas-Bawah), "4" (Grid 2x2)
  const [layout, setLayout] = useState(() => {
    return localStorage.getItem("tv_layout_mode") || "2-vertical";
  });

  // Symbols for each slot (up to 4 slots)
  const [symbols, setSymbols] = useState(() => {
    const saved = localStorage.getItem("tv_active_symbols");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return ["FX:EURUSD", "FX:GBPUSD", "OANDA:XAUUSD", "CAPITALCOM:DXY"];
  });

  // Configurable presets state
  const [presets, setPresets] = useState(() => {
    const saved = localStorage.getItem("tv_presets_v2");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [
      { id: "1", name: "Forex SMT (EUR/GBP)", symbols: ["FX:EURUSD", "FX:GBPUSD", "OANDA:XAUUSD", "CAPITALCOM:DXY"] },
      { id: "2", name: "USD SMT (EUR/DXY)", symbols: ["FX:EURUSD", "CAPITALCOM:DXY", "OANDA:XAUUSD", "CAPITALCOM:DXY"] },
      { id: "3", name: "Crypto SMT (BTC/ETH)", symbols: ["BINANCE:BTCUSDT", "BINANCE:ETHUSDT", "OANDA:XAUUSD", "CAPITALCOM:DXY"] }
    ];
  });

  // Inputs for direct symbol search per slot
  const [slotInputs, setSlotInputs] = useState(["", "", "", ""]);

  // Fullscreen target slot (null if none, index 0 to 3 if focused)
  const [fullscreenSlot, setFullscreenSlot] = useState(null);

  // Preset manager modal controls
  const [showManager, setShowManager] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [newPresetName, setNewPresetName] = useState("");

  // Auto-save settings to local storage
  useEffect(() => {
    localStorage.setItem("tv_layout_mode", layout);
  }, [layout]);

  useEffect(() => {
    localStorage.setItem("tv_active_symbols", JSON.stringify(symbols));
  }, [symbols]);

  // Find latest trade logged in active profile
  const latestTradeSymbol = React.useMemo(() => {
    const profileTrades = activeProfile?.id === "all"
      ? trades
      : trades.filter(t => t.profileId === activeProfile?.id);

    if (profileTrades && profileTrades.length > 0) {
      // Sort desc by date
      const sorted = [...profileTrades].sort((a, b) => new Date(b.tradeDate) - new Date(a.tradeDate));
      return sorted[0].pair || sorted[0].symbol;
    }
    return null;
  }, [trades, activeProfile]);

  // Apply symbol change for a specific slot index
  const handleApplySymbol = (index, inputSymbol) => {
    if (!inputSymbol.trim()) return;
    const clean = cleanSymbolForTV(inputSymbol);
    const newSymbols = [...symbols];
    newSymbols[index] = clean;
    setSymbols(newSymbols);
  };

  // Preset Loaders
  const loadPreset = (presetSymbols) => {
    setSymbols(presetSymbols);
    setFullscreenSlot(null); // Reset focus
  };

  // --- PRESET MANAGEMENT LOGIC ---

  // Save current active symbols in grid as a new preset
  const handleCreatePresetFromGrid = () => {
    if (!newPresetName.trim()) {
      alert("Silakan masukkan nama preset terlebih dahulu.");
      return;
    }
    const newPreset = {
      id: crypto.randomUUID(),
      name: newPresetName.trim(),
      symbols: [...symbols]
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem("tv_presets_v2", JSON.stringify(updated));
    setNewPresetName("");
  };

  // Save edited preset symbol configuration
  const handleSaveEditedPreset = () => {
    if (!editingPreset.name.trim()) return;
    const updated = presets.map(p => p.id === editingPreset.id ? editingPreset : p);
    setPresets(updated);
    localStorage.setItem("tv_presets_v2", JSON.stringify(updated));
    setEditingPreset(null);
  };

  // Delete an existing preset
  const handleDeletePreset = (id) => {
    const confirmDel = window.confirm("Apakah Anda yakin ingin menghapus preset ini?");
    if (!confirmDel) return;
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    localStorage.setItem("tv_presets_v2", JSON.stringify(updated));
  };

  // Reset presets to default hardcoded configurations
  const handleResetPresets = () => {
    const confirmReset = window.confirm("Apakah Anda yakin ingin mengembalikan semua preset ke pengaturan default?");
    if (!confirmReset) return;
    const defaults = [
      { id: "1", name: "Forex SMT (EUR/GBP)", symbols: ["FX:EURUSD", "FX:GBPUSD", "OANDA:XAUUSD", "CAPITALCOM:DXY"] },
      { id: "2", name: "USD SMT (EUR/DXY)", symbols: ["FX:EURUSD", "CAPITALCOM:DXY", "OANDA:XAUUSD", "CAPITALCOM:DXY"] },
      { id: "3", name: "Crypto SMT (BTC/ETH)", symbols: ["BINANCE:BTCUSDT", "BINANCE:ETHUSDT", "OANDA:XAUUSD", "CAPITALCOM:DXY"] }
    ];
    setPresets(defaults);
    localStorage.setItem("tv_presets_v2", JSON.stringify(defaults));
    setEditingPreset(null);
  };

  // Dynamic slot details based on layout configuration
  // Grid returns how many active slot panels to render
  const getActiveSlotsCount = () => {
    if (layout === "1") return 1;
    if (layout === "2-vertical" || layout === "2-horizontal") return 2;
    return 4;
  };

  const slotsCount = getActiveSlotsCount();

  // Grid wrapper CSS styling classes
  const getGridClass = () => {
    if (fullscreenSlot !== null) return "grid-cols-1 grid-rows-1";
    if (layout === "1") return "grid-cols-1 grid-rows-1";
    if (layout === "2-vertical") return "grid-cols-1 lg:grid-cols-2 grid-rows-1";
    if (layout === "2-horizontal") return "grid-cols-1 grid-rows-2";
    return "grid-cols-1 lg:grid-cols-2 lg:grid-rows-2";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] space-y-4 select-none animate-fadeIn">
      {/* 1. Dashboard Control Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Presets & Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-violet-500" />
            Template Pair:
          </span>

          {/* Dynamic Loaded Presets */}
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => loadPreset(preset.symbols)}
              className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-600/70 flex items-center gap-1 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <ArrowRightLeft size={12} className="text-blue-500" />
              {preset.name}
            </button>
          ))}

          {/* Settings Customizer trigger */}
          <button
            onClick={() => setShowManager(true)}
            className="p-1.5 text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all cursor-pointer border border-dashed border-gray-300 dark:border-gray-650 flex items-center gap-1 active:scale-95"
            title="Kelola & Atur Template Pair Kustom"
          >
            <Settings size={14} className="animate-spin-hover" />
            <span className="text-[11px] font-bold pr-0.5">Kelola</span>
          </button>

          <div className="h-4 w-[1px] bg-gray-250 dark:bg-gray-700 mx-1"></div>

          {latestTradeSymbol && (
            <button
              onClick={() => {
                const cleaned = cleanSymbolForTV(latestTradeSymbol);
                const newSymbols = [...symbols];
                newSymbols[0] = cleaned;
                setSymbols(newSymbols);
                setFullscreenSlot(0); // auto focus slot 1
              }}
              className="px-3 py-1.5 text-xs font-bold bg-violet-600/10 hover:bg-violet-600 text-violet-600 dark:text-violet-400 dark:hover:text-white border border-violet-500/20 hover:border-transparent rounded-lg flex items-center gap-1 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(124,58,237,0.35)]"
              title={`Load pair ter-update: ${latestTradeSymbol}`}
            >
              <TrendingUp size={12} />
              Jurnal Terakhir ({latestTradeSymbol})
            </button>
          )}
        </div>

        {/* Layout Selectors */}
        <div className="flex items-center gap-1 bg-gray-150 dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 p-1 rounded-xl w-fit">
          <button
            onClick={() => { setLayout("1"); setFullscreenSlot(null); }}
            className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${layout === "1" && fullscreenSlot === null
                ? "bg-white dark:bg-gray-800 text-violet-600 dark:text-violet-400 shadow-sm"
                : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            title="Single Chart (1x1)"
          >
            <Columns size={16} className="rotate-90" />
            <span className="hidden sm:inline">1x1</span>
          </button>
          <button
            onClick={() => { setLayout("2-vertical"); setFullscreenSlot(null); }}
            className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${layout === "2-vertical" && fullscreenSlot === null
                ? "bg-white dark:bg-gray-800 text-violet-600 dark:text-violet-400 shadow-sm"
                : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            title="Split Vertical (Kiri-Kanan)"
          >
            <Columns size={16} />
            <span className="hidden sm:inline">Split V</span>
          </button>
          <button
            onClick={() => { setLayout("2-horizontal"); setFullscreenSlot(null); }}
            className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${layout === "2-horizontal" && fullscreenSlot === null
                ? "bg-white dark:bg-gray-800 text-violet-600 dark:text-violet-400 shadow-sm"
                : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            title="Split Horizontal (Atas-Bawah)"
          >
            <Rows size={16} />
            <span className="hidden sm:inline">Split H</span>
          </button>
          <button
            onClick={() => { setLayout("4"); setFullscreenSlot(null); }}
            className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${layout === "4" && fullscreenSlot === null
                ? "bg-white dark:bg-gray-800 text-violet-600 dark:text-violet-400 shadow-sm"
                : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            title="Quad Grid (2x2)"
          >
            <Grid size={16} />
            <span className="hidden sm:inline">2x2 Grid</span>
          </button>
        </div>
      </div>

      {/* 2. Main Chart Space */}
      <div className={`grid gap-4 flex-grow w-full h-full min-h-[400px] overflow-hidden ${getGridClass()}`}>
        {Array.from({ length: slotsCount }).map((_, idx) => {
          // If we are in fullscreen mode on a specific slot, only render that slot
          if (fullscreenSlot !== null && fullscreenSlot !== idx) return null;

          const containerId = `tv_chart_container_${idx}`;
          const currentSymbol = symbols[idx];

          return (
            <div
              key={idx}
              className="relative flex flex-col bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700/60 rounded-2xl shadow-lg overflow-hidden flex-grow group"
            >
              {/* Individual Slot Overlay Header Controls */}
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-700/50 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet-600/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 tracking-wide uppercase px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600/80">
                    {currentSymbol.includes(":") ? currentSymbol.split(":")[1] : currentSymbol}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-400 truncate hidden sm:inline max-w-[120px]">
                    {currentSymbol.includes(":") ? currentSymbol.split(":")[0] : "TradingView"}
                  </span>
                </div>

                {/* Symbol Search input inside slot */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleApplySymbol(idx, slotInputs[idx]);
                  }}
                  className="flex items-center bg-gray-150 dark:bg-gray-900 border border-gray-250 dark:border-gray-700 px-2.5 py-1 rounded-lg text-xs w-32 sm:w-44 focus-within:w-40 sm:focus-within:w-56 focus-within:border-violet-500 transition-all duration-300"
                >
                  <Search size={12} className="text-gray-400 flex-shrink-0 mr-1" />
                  <input
                    type="text"
                    placeholder="Search pair..."
                    value={slotInputs[idx]}
                    onChange={(e) => {
                      const newInputs = [...slotInputs];
                      newInputs[idx] = e.target.value;
                      setSlotInputs(newInputs);
                    }}
                    className="bg-transparent text-gray-800 dark:text-gray-200 font-semibold focus:outline-none w-full placeholder-gray-400 dark:placeholder-gray-500 uppercase"
                  />
                  {slotInputs[idx].trim() && (
                    <button type="submit" className="text-violet-500 dark:text-violet-400 font-bold ml-1 hover:scale-110 active:scale-95 cursor-pointer">
                      GO
                    </button>
                  )}
                </form>

                {/* Focus Fullscreen Control */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (fullscreenSlot === idx) {
                        setFullscreenSlot(null);
                      } else {
                        setFullscreenSlot(idx);
                      }
                    }}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg transition-all cursor-pointer"
                    title={fullscreenSlot === idx ? "Keluar Fullscreen" : "Fokus Chart ini"}
                  >
                    {fullscreenSlot === idx ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  </button>
                  <button
                    onClick={() => {
                      // Trigger re-render by resetting symbol state briefly or loading again
                      const newSymbols = [...symbols];
                      newSymbols[idx] = "";
                      setSymbols(newSymbols);
                      setTimeout(() => {
                        const restored = [...symbols];
                        restored[idx] = currentSymbol;
                        setSymbols(restored);
                      }, 50);
                    }}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg transition-all cursor-pointer"
                    title="Reload Chart"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
              </div>

              {/* Chart Embedded Canvas */}
              <div className="flex-grow w-full relative">
                {currentSymbol ? (
                  <TradingViewWidget
                    containerId={containerId}
                    symbol={currentSymbol}
                    isActive={fullscreenSlot === idx || fullscreenSlot === null}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-950 flex items-center justify-center text-gray-500 text-xs gap-2">
                    <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    Memuat...
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Customizable Preset Manager Overlay Modal */}
      {showManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-950">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings size={20} className="text-violet-500 animate-spin-hover" />
                Kelola Template Pair
              </h3>
              <button
                onClick={() => { setShowManager(false); setEditingPreset(null); }}
                className="p-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Scroll */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow bg-white dark:bg-gray-900">

              {/* Add current Layout as new Preset card */}
              <div className="p-4 bg-violet-600/10 border border-violet-500/20 rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                  <Sparkles size={14} /> Simpan Grid Aktif Sebagai Template Baru
                </h4>
                <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed font-semibold">
                  Merekam 4 simbol yang aktif di grid Anda saat ini:{" "}
                  <span className="inline-flex gap-1.5 flex-wrap mt-1">
                    {symbols.map((s, idx) => (
                      <strong key={idx} className="text-violet-800 dark:text-violet-300 font-extrabold bg-violet-100/60 dark:bg-violet-950/60 px-1.5 py-0.5 rounded border border-violet-200 dark:border-violet-800/40 text-[10px]">
                        Slot {idx + 1}: {s.includes(":") ? s.split(":")[1] : s}
                      </strong>
                    ))}
                  </span>
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Masukkan nama template baru... (misal: SMT Dolar & Gold)"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    className="flex-grow bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 px-3 py-2 rounded-lg text-xs font-semibold focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={handleCreatePresetFromGrid}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm shadow-violet-500/20"
                  >
                    Simpan Template
                  </button>
                </div>
              </div>

              {/* Preset List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Daftar Template Pair Aktif ({presets.length})
                </h4>

                <div className="space-y-3">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-all"
                    >
                      {editingPreset?.id === preset.id ? (
                        /* EDITING ACTIVE STATE */
                        <div className="space-y-3 bg-gray-50 dark:bg-gray-800">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Nama Template</label>
                            <input
                              type="text"
                              value={editingPreset.name}
                              onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })}
                              className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-none text-gray-900 dark:text-white"
                            />
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {editingPreset.symbols.map((sym, sIdx) => (
                              <div key={sIdx} className="space-y-1">
                                <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest block">Slot {sIdx + 1}</span>
                                <input
                                  type="text"
                                  value={sym}
                                  onChange={(e) => {
                                    const newSyms = [...editingPreset.symbols];
                                    newSyms[sIdx] = e.target.value.toUpperCase();
                                    setEditingPreset({ ...editingPreset, symbols: newSyms });
                                  }}
                                  className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 px-2 py-1 rounded text-xs font-semibold uppercase focus:outline-none text-gray-900 dark:text-white"
                                />
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                            <button
                              onClick={handleSaveEditedPreset}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Save size={12} /> Simpan Perubahan
                            </button>
                            <button
                              onClick={() => setEditingPreset(null)}
                              className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* READ-ONLY DISPLAY MODE */
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="text-xs font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                              {preset.name}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {preset.symbols.map((s, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="px-2.5 py-1 text-[9px] font-bold tracking-wide uppercase bg-violet-50 dark:bg-violet-950/40 text-violet-800 dark:text-violet-300 rounded border border-violet-200 dark:border-violet-800/40"
                                >
                                  Slot {sIdx + 1}: {s.includes(":") ? s.split(":")[1] : s}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Item Action Buttons */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => setEditingPreset({ ...preset })}
                              className="p-1.5 text-blue-500 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-lg transition-colors cursor-pointer"
                              title="Edit Template"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeletePreset(preset.id)}
                              className="p-1.5 text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Template"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-950 flex items-center justify-between flex-shrink-0">
              <button
                onClick={handleResetPresets}
                className="px-3.5 py-2 border border-dashed border-red-500/40 text-red-500 hover:bg-red-500/10 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <RotateCcw size={14} /> Reset ke Default
              </button>
              <button
                onClick={() => { setShowManager(false); setEditingPreset(null); }}
                className="px-5 py-2 bg-gray-900 dark:bg-gray-800 hover:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default TradingViewPage;
