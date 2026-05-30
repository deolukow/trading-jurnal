import React, { useState, useEffect } from "react";
import { X, Check, Download, ShieldAlert, Sparkles } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

export const ShareCardModal = ({ trade, onClose, currency, activeProfileName }) => {
  const isDashboard = trade?.isDashboard || false;

  const [username, setUsername] = useState("deolukow");
  const [isVerified, setIsVerified] = useState(true);
  
  // Custom values for editing before sharing
  const [pair, setPair] = useState(trade?.pair || (isDashboard ? "ALL SYMBOLS" : "XAUUSD"));
  const [positionType, setPositionType] = useState(
    isDashboard ? (trade?.type || "0.0%") : (trade?.type || "long")
  );
  
  // Pre-calculate smart P&L values
  const rawPnl = trade?.pnl || 0;
  const isWin = rawPnl > 0;
  
  const [pnlValue, setPnlValue] = useState(rawPnl);
  const [percentage, setPercentage] = useState(
    isDashboard 
      ? (trade?.type || "0.0%") 
      : (isWin ? `+${((rawPnl / 1000) * 100).toFixed(0)}%` : `${((rawPnl / 1000) * 100).toFixed(0)}%`)
  );
  const [ticks, setTicks] = useState(
    isDashboard 
      ? `${(trade?.entryPrice || 0) + (trade?.exitPrice || 0)} Trades`
      : (isWin ? `+${(rawPnl / 10).toFixed(1)}` : `${(rawPnl / 10).toFixed(1)}`)
  );
  
  // Prices (Wins & Losses if Trade)
  const [entryPrice, setEntryPrice] = useState(trade?.entryPrice || 0);
  const [exitPrice, setExitPrice] = useState(trade?.exitPrice || trade?.takeProfit || 0);
  
  // Period Dates (Start Date & End Date if Dashboard)
  const [startDate, setStartDate] = useState(trade?.startDate || "");
  const [endDate, setEndDate] = useState(trade?.endDate || "");

  // Display Options
  const [showPrices, setShowPrices] = useState(true);
  const [pnlFormat, setPnlFormat] = useState(isDashboard ? "nominal" : "nominal_percent"); // nominal, percent, nominal_percent, ticks_percent

  // Footer text - defaults to active profile name, customizable
  const [footerText, setFooterText] = useState(activeProfileName || "WzGold Trading Jurnal");

  const formattedDate = trade?.tradeDate
    ? new Date(trade.tradeDate).toLocaleString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).replace(/\//g, "-").replace(",", "")
    : new Date().toLocaleString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).replace(/\//g, "-").replace(",", "");

  // Update percentages and values based on trade change
  useEffect(() => {
    if (trade) {
      setPair(trade.pair);
      setPositionType(trade.type);
      setPnlValue(trade.pnl);
      setEntryPrice(trade.entryPrice);
      setExitPrice(isDashboard ? trade.exitPrice : (trade.takeProfit || trade.entryPrice || 0));
      
      if (isDashboard) {
        setPercentage(trade.type);
        setTicks(`${(trade.entryPrice || 0) + (trade.exitPrice || 0)} Trades`);
        setStartDate(trade.startDate || "");
        setEndDate(trade.endDate || "");
      } else {
        const pct = ((trade.pnl / 1000) * 100).toFixed(0);
        setPercentage(trade.pnl > 0 ? `+${pct}%` : `${pct}%`);
        
        const tk = (trade.pnl / 10).toFixed(1);
        setTicks(trade.pnl > 0 ? `+${tk}` : `${tk}`);
      }
    }
  }, [trade, isDashboard]);

  // Sync default footer text when activeProfileName loads
  useEffect(() => {
    if (activeProfileName) {
      setFooterText(activeProfileName);
    }
  }, [activeProfileName]);

  // Label overrides based on sharing target
  const symbolLabel = isDashboard ? "Portfolio" : "Symbol";
  const positionLabel = isDashboard ? "Growth" : "Position";
  const pnlLabel = isDashboard ? "Net Performance" : (pnlFormat === "ticks_percent" ? "Total Ticks/Points" : "Profit/Loss");
  const entryLabel = isDashboard ? "Start Date" : "Entry Price";
  const exitLabel = isDashboard ? "End Date" : "Exit Price (Last)";

  // Format P&L for preview text
  const getPnlPreviewText = () => {
    const formattedNominal = pnlValue > 0 
      ? `+${formatCurrency(pnlValue, currency)}` 
      : formatCurrency(pnlValue, currency);

    if (isDashboard) {
      // For dashboard, we often want to combine Net Profit and the Win Rate label
      return `${formattedNominal} (${percentage})`;
    }

    switch (pnlFormat) {
      case "nominal":
        return formattedNominal;
      case "percent":
        return percentage;
      case "ticks_percent":
        return `${ticks > 0 ? "+" : ""}${ticks} (${percentage})`;
      case "nominal_percent":
      default:
        return `${formattedNominal} (${percentage})`;
    }
  };

  // Helper to extract initials for the bottom right logo box
  const getInitials = (text) => {
    if (!text) return "JW";
    const words = text.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0].slice(0, 1) + words[1].slice(0, 1)).toUpperCase();
    }
    return text.slice(0, 2).toUpperCase();
  };

  // High-Resolution HTML5 Canvas drawing & download pipeline
  const handleExport = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Enable image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // 1. Draw Background Gradient (Midnight Violet)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1000);
    bgGrad.addColorStop(0, "#08070d"); // Deep dark charcoal
    bgGrad.addColorStop(1, "#150d24"); // Midnight violet glow
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 1000);

    // 2. Draw Card Border (Neon Purple Glowing Border)
    ctx.save();
    ctx.strokeStyle = "rgba(139, 92, 246, 0.45)";
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(139, 92, 246, 0.6)";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(30, 30, 740, 940, 24);
    } else {
      ctx.rect(30, 30, 740, 940);
    }
    ctx.stroke();
    ctx.restore();

    // 3. Draw Avatar Circle & Initial Letter
    const avX = 90, avY = 110, avR = 40;
    ctx.save();
    ctx.beginPath();
    ctx.arc(avX, avY, avR, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(124, 58, 237, 0.18)"; // Glassy violet fill
    ctx.fill();
    ctx.strokeStyle = "rgba(167, 139, 250, 0.65)"; // Glowing border
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Letter
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(username.charAt(0).toUpperCase(), avX, avY);
    ctx.restore();

    // 4. Draw Username & Verified Badge
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px Inter, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(username, 155, 78);

    const nameWidth = ctx.measureText(username).width;

    if (isVerified) {
      const badgeX = 155 + nameWidth + 15;
      const badgeY = 82;
      const badgeR = 16;
      ctx.beginPath();
      ctx.arc(badgeX + badgeR, badgeY + badgeR, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = "#a78bfa"; // Premium violet badge
      ctx.fill();

      // Checkmark icon
      ctx.strokeStyle = "#08070d";
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(badgeX + 10, badgeY + 16);
      ctx.lineTo(badgeX + 14, badgeY + 20);
      ctx.lineTo(badgeX + 22, badgeY + 12);
      ctx.stroke();
    }
    ctx.restore();

    // 5. Draw Date (Set textAlign and textBaseline explicitly to avoid overlapping!)
    ctx.save();
    ctx.fillStyle = "#7f848e";
    ctx.font = "24px Inter, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(formattedDate, 155, 134);
    ctx.restore();

    // 6. Draw Content Grid (Symbol, Position, P&L)
    const startX = 80;
    
    // -- SYMBOL / PORTFOLIO --
    ctx.save();
    ctx.fillStyle = "#7f848e";
    ctx.font = "500 22px Inter, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(symbolLabel, startX, 220);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 56px Inter, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(pair.toUpperCase(), startX, 255);
    ctx.restore();

    // -- POSITION / GROWTH --
    ctx.save();
    ctx.fillStyle = "#7f848e";
    ctx.font = "500 22px Inter, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(positionLabel, startX, 350);
    
    const isLong = positionType.toLowerCase() === "long";
    ctx.fillStyle = isDashboard || isLong ? "#00e676" : "#ff1744"; // Neon green vs neon red
    ctx.font = "bold 38px Inter, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    
    const posVal = isDashboard ? positionType : (isLong ? "Long" : "Short");
    ctx.fillText(posVal, startX, 385);
    ctx.restore();

    // -- TOTAL P&L / PERFORMANCE --
    ctx.save();
    ctx.fillStyle = "#7f848e";
    ctx.font = "500 22px Inter, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(pnlLabel, startX, 475);

    ctx.fillStyle = pnlValue > 0 ? "#00e676" : pnlValue < 0 ? "#ff1744" : "#ffffff";
    ctx.font = "bold 58px Inter, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const pnlText = getPnlPreviewText();
    ctx.fillText(pnlText, startX, 510);
    ctx.restore();

    // -- ENTRY & EXIT / PERIOD DATES --
    if (showPrices) {
      ctx.save();
      ctx.fillStyle = "#7f848e";
      ctx.font = "500 22px Inter, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(entryLabel, startX, 615);
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 36px Inter, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(isDashboard ? startDate : entryPrice.toLocaleString("id-ID"), startX, 652);

      ctx.fillStyle = "#7f848e";
      ctx.font = "500 22px Inter, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(exitLabel, 380, 615);
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 36px Inter, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(isDashboard ? endDate : exitPrice.toLocaleString("id-ID"), 380, 652);
      ctx.restore();
    }

    // 7. Draw Glowing Logo Ring (WzGold Trading Jurnal)
    const logoX = 580, logoY = 360, logoR = 105;
    
    ctx.save();
    // Glowing shadow
    ctx.shadowColor = "rgba(139, 92, 246, 0.9)";
    ctx.shadowBlur = 40;
    
    // Outer border ring
    ctx.strokeStyle = "rgba(167, 139, 250, 0.95)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(logoX, logoY, logoR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Inner thin ring
    ctx.save();
    ctx.strokeStyle = "rgba(167, 139, 250, 0.35)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(logoX, logoY, logoR - 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Text logo inside ring ("WzGold Trading Jurnal")
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("WzGold", logoX, logoY - 20);

    ctx.fillStyle = "#c084fc";
    ctx.font = "bold 15px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("TRADING", logoX, logoY + 18);
    ctx.fillText("JURNAL", logoX, logoY + 38);
    ctx.restore();

    // 8. Draw Divider
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 780);
    ctx.lineTo(720, 780);
    ctx.stroke();

    // 9. Draw Footer
    // Left Branding (Customizable)
    ctx.save();
    ctx.fillStyle = "#a78bfa";
    ctx.font = "bold 28px Inter, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(footerText.toUpperCase(), 80, 835);

    ctx.fillStyle = "#7f848e";
    ctx.font = "20px Inter, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Track, Analyze, Conquer.", 80, 872);
    ctx.restore();

    // Right Branding Box (REPLACED JW box with beautiful styled WzGold badge!)
    const boxX = 530, boxY = 820, boxWidth = 175, boxHeight = 70, boxRadius = 14;
    ctx.save();
    ctx.fillStyle = "rgba(18, 19, 22, 0.95)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(boxX, boxY, boxWidth, boxHeight, boxRadius);
    } else {
      ctx.rect(boxX, boxY, boxWidth, boxHeight);
    }
    ctx.fill();
    ctx.stroke();

    // Styled "WzGold" text
    ctx.fillStyle = "#ffffff";
    ctx.font = "italic bold 32px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("WzGold", boxX + boxWidth / 2, boxY + boxHeight / 2);
    ctx.restore();

    // 10. Generate Download Link
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = isDashboard 
        ? `dashboard-performance-${pair.toUpperCase()}.png`
        : `trade-performance-${pair.toUpperCase()}-${positionType.toUpperCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Gagal mengekspor kartu canvas ke PNG", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[110] p-4 overflow-y-auto animate-fadeIn select-none">
      <div className="bg-gray-900/90 border border-gray-800 backdrop-blur-lg p-6 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-violet-400" size={22} />
            <span>{isDashboard ? "Pembuat Kartu Performa Dashboard" : "Pembuat Kartu Performa Trading"}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-gray-800"
          >
            <X size={22} />
          </button>
        </div>

        {/* Core Layout - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column 1: Live Interactive Card Preview (Left Side) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Preview Kartu Media Sosial</p>
            
            {/* The HTML/CSS Rendered Card representation */}
            <div 
              id="share-card-preview"
              className="w-full max-w-[390px] aspect-[4/5] rounded-2xl bg-gradient-to-b from-[#08070d] to-[#150d24] border-2 border-violet-500/40 p-6 flex flex-col justify-between shadow-[0_0_20px_rgba(139,92,246,0.25)] relative overflow-hidden"
            >
              
              {/* Profile Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-600/20 border border-violet-400/50 flex items-center justify-center text-white font-bold text-sm">
                  {username ? username.charAt(0).toUpperCase() : "D"}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-white font-bold text-sm sm:text-base truncate">{username}</span>
                    {isVerified && (
                      <span className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center text-gray-950 flex-shrink-0">
                        <Check size={10} strokeWidth={4} />
                      </span>
                    )}
                  </div>
                  <span className="text-gray-500 text-xs">{formattedDate}</span>
                </div>
              </div>

              {/* Glowing Circle Logo (Right column overlay - updated to WzGold Trading Jurnal) */}
              <div className="absolute right-6 top-[28%] flex flex-col items-center justify-center">
                <div className="w-24 h-24 rounded-full border-4 border-violet-400 shadow-[0_0_20px_rgba(167,139,250,0.8)] flex flex-col items-center justify-center relative bg-transparent p-2 text-center">
                  <div className="absolute inset-2 rounded-full border border-violet-400/30"></div>
                  <span className="text-white font-black text-[11px] tracking-wide leading-tight mt-0.5">WzGold</span>
                  <span className="text-violet-400 font-extrabold text-[7px] tracking-wider mt-0.5">TRADING</span>
                  <span className="text-violet-400 font-extrabold text-[7px] tracking-wider leading-none">JURNAL</span>
                </div>
              </div>

              {/* Left Column Stats */}
              <div className="flex flex-col gap-4 mt-2">
                {/* Symbol / Portfolio */}
                <div className="flex flex-col leading-tight">
                  <span className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider">{symbolLabel}</span>
                  <span className="text-white text-3xl font-extrabold tracking-wide">{pair.toUpperCase()}</span>
                </div>

                {/* Position / Growth */}
                <div className="flex flex-col leading-tight">
                  <span className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider">{positionLabel}</span>
                  <span className={`text-xl font-bold ${isDashboard || positionType.toLowerCase() === "long" ? "text-[#00e676]" : "text-[#ff1744]"}`}>
                    {isDashboard ? positionType : (positionType.toLowerCase() === "long" ? "Long" : "Short")}
                  </span>
                </div>

                {/* Profit / Loss */}
                <div className="flex flex-col leading-tight">
                  <span className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider">{pnlLabel}</span>
                  <span className={`text-2xl font-black ${pnlValue > 0 ? "text-[#00e676]" : pnlValue < 0 ? "text-[#ff1744]" : "text-white"}`}>
                    {getPnlPreviewText()}
                  </span>
                </div>

                {/* Entry & Exit Price / Period Dates (Toggleable) */}
                {showPrices && (
                  <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-2 max-w-[65%]">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-[9px] font-medium uppercase tracking-wider">{entryLabel}</span>
                      <span className="text-white font-bold text-xs sm:text-sm mt-0.5">
                        {isDashboard ? startDate : entryPrice.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-[9px] font-medium uppercase tracking-wider">{exitLabel}</span>
                      <span className="text-white font-bold text-xs sm:text-sm mt-0.5">
                        {isDashboard ? endDate : exitPrice.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Footer Section (Updated to WzGold styled badge!) */}
              <div className="border-t border-white/5 pt-3 flex justify-between items-center mt-3">
                <div className="flex flex-col min-w-0 mr-2">
                  <span className="text-violet-400 font-bold text-xs tracking-wider truncate uppercase">{footerText}</span>
                  <span className="text-gray-500 text-[9px] leading-tight">Track, Analyze, Conquer.</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-gray-950 border border-white/10 flex items-center justify-center font-bold text-white italic text-xs tracking-wide flex-shrink-0">
                  WzGold
                </div>
              </div>

            </div>
          </div>

          {/* Column 2: Customization Controls (Right Side) */}
          <div className="lg:col-span-6 space-y-5 bg-gray-900 border border-gray-800 p-5 rounded-xl">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider border-b border-gray-800 pb-2 flex items-center gap-1.5">
              <span>Pengaturan Kartu</span>
            </h3>

            {/* Input Username */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">Username Profil</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={18}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Toggle Switch: Verified Badge */}
            <div className="flex justify-between items-center py-1">
              <div className="flex flex-col">
                <span className="text-xs text-white font-medium">Lencana Verifikasi (Verified)</span>
                <span className="text-[10px] text-gray-500">Tampilkan centang verified ungu di sebelah nama</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-950 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-400 peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
              </label>
            </div>

            <div className="border-t border-gray-800 my-4"></div>

            {/* Input Footer Text (Custom Branding) */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">Branding Teks Footer (Bisa Kustom)</label>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                maxLength={25}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-violet-500"
                placeholder="Nama akun Anda / Brand"
              />
            </div>

            {/* Dropdown: P&L Format */}
            {!isDashboard && (
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-medium">Format P&L / Capaian</label>
                <select
                  value={pnlFormat}
                  onChange={(e) => setPnlFormat(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="nominal_percent">Nominal & Persentase (+$50.00 (+500%))</option>
                  <option value="nominal">Nominal Saja (+$50.00)</option>
                  <option value="percent">Persentase Saja (+500%)</option>
                  <option value="ticks_percent">Poin & Persentase (+50.0 (+500%))</option>
                </select>
              </div>
            )}

            {/* Custom P&L Edit Fields */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-500 font-medium">Ubah Nominal P&L</label>
                <input
                  type="number"
                  value={pnlValue}
                  onChange={(e) => setPnlValue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg py-1.5 px-2.5 text-white text-xs focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-500 font-medium">
                  {isDashboard ? "Ubah Growth (Teks)" : "Ubah Persentase (Teks)"}
                </label>
                <input
                  type="text"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg py-1.5 px-2.5 text-white text-xs focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="border-t border-gray-800 my-4"></div>

            {/* Toggle Switch: Show Prices / Dates */}
            <div className="flex justify-between items-center py-1">
              <div className="flex flex-col">
                <span className="text-xs text-white font-medium">
                  {isDashboard ? "Tampilkan Hari & Tanggal Periode" : "Tampilkan Harga Entry & Exit"}
                </span>
                <span className="text-[10px] text-gray-500">
                  {isDashboard ? "Tampilkan jangka waktu awal dan akhir dari periode performa aktif" : "Nonaktifkan untuk melindungi detail rahasia harga setup Anda"}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPrices}
                  onChange={(e) => setShowPrices(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-950 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-400 peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
              </label>
            </div>

            {/* Price / WinLoss / Period Dates Edit Inputs */}
            {showPrices && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                {isDashboard ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-500 font-medium">Tanggal Mulai</label>
                      <input
                        type="text"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg py-1.5 px-2.5 text-white text-xs focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-500 font-medium">Tanggal Selesai</label>
                      <input
                        type="text"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg py-1.5 px-2.5 text-white text-xs focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-500 font-medium">Harga Entry</label>
                      <input
                        type="number"
                        value={entryPrice}
                        onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg py-1.5 px-2.5 text-white text-xs focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-500 font-medium">Harga Exit</label>
                      <input
                        type="number"
                        value={exitPrice}
                        onChange={(e) => setExitPrice(parseFloat(e.target.value) || 0)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg py-1.5 px-2.5 text-white text-xs focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Custom Values */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-medium">
                  {isDashboard ? "Nama Portofolio" : "Pair / Symbol"}
                </label>
                <input
                  type="text"
                  value={pair}
                  onChange={(e) => setPair(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-medium">
                  {isDashboard ? "Label Growth" : "Tipe Posisi"}
                </label>
                {isDashboard ? (
                  <input
                    type="text"
                    value={positionType}
                    onChange={(e) => setPositionType(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                ) : (
                  <select
                    value={positionType}
                    onChange={(e) => setPositionType(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="long">Long</option>
                    <option value="short">Short</option>
                  </select>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center border-t border-gray-800 pt-4 mt-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-950 border border-gray-800/80 px-3 py-1.5 rounded-lg max-w-[50%]">
            <ShieldAlert size={14} className="text-amber-500/80 flex-shrink-0" />
            <span className="truncate">Kartu diproses 100% lokal offline di browser Anda.</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg text-sm transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleExport}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg text-sm flex items-center gap-2 hover:shadow-[0_0_12px_rgba(139,92,246,0.3)] active:scale-95 transition-all"
            >
              <Download size={16} />
              Unduh Kartu (PNG)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ShareCardModal;
