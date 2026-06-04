import React, { useState, useEffect } from "react";
import { X, Check, Download, ShieldAlert, Sparkles, CheckCircle } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";
import { useLocalImage } from "../../hooks/useLocalImage";

export const ShareCardModal = ({ trade, onClose, currency, activeProfileName, strategies = [], initialBalance = 0 }) => {
  const isDashboard = trade?.isDashboard || false;

  const [username, setUsername] = useState(() => {
    return localStorage.getItem("share_card_username") || activeProfileName || "deolukow";
  });
  
  useEffect(() => {
    if (username) {
      localStorage.setItem("share_card_username", username);
    }
  }, [username]);

  const [isVerified, setIsVerified] = useState(true);
  
  // Custom values for editing before sharing
  const [pair, setPair] = useState(trade?.pair || (isDashboard ? "ALL SYMBOLS" : "XAUUSD"));
  const [positionType, setPositionType] = useState(
    isDashboard ? (trade?.type || "0.0%") : (trade?.type || "long")
  );
  
  // Pre-calculate smart P&L values
  const rawPnl = trade?.pnl || 0;
  const isWin = rawPnl > 0;
  
  const balanceToUse = initialBalance > 0 ? initialBalance : 10000;

  const [pnlValue, setPnlValue] = useState(rawPnl);
  const [percentage, setPercentage] = useState(
    isDashboard 
      ? (trade?.type || "0.0%") 
      : (isWin ? `+${((rawPnl / balanceToUse) * 100).toFixed(2)}%` : `${((rawPnl / balanceToUse) * 100).toFixed(2)}%`)
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

  // Detailed card states
  const [cardType, setCardType] = useState("standard"); // standard, detailed
  const [headerBadge, setHeaderBadge] = useState(() => {
    return activeProfileName || "WZ PREMIUM";
  });
  const [session, setSession] = useState(() => {
    return trade?.customData?.Sesi || trade?.customData?.Session || "New York";
  });
  const [riskReward, setRiskReward] = useState(trade?.riskRewardRatio || 0);
  const [rating, setRating] = useState(trade?.rating || 5);
  const [notes, setNotes] = useState(trade?.notes || "");

  // Load post-trade screenshot
  const afterImageUrl = useLocalImage(trade?.screenshotAfterId);

  // Strategy and checklists
  const activeStrategy = React.useMemo(() => {
    if (!strategies || !trade || !trade.setup) return null;
    return strategies.find((s) => s.title === trade.setup);
  }, [strategies, trade]);

  const [selectedCriteria, setSelectedCriteria] = useState(() => {
    return trade?.criteriaChecked || [];
  });

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
        const pct = ((trade.pnl / balanceToUse) * 100).toFixed(2);
        setPercentage(trade.pnl > 0 ? `+${pct}%` : `${pct}%`);
        
        const tk = (trade.pnl / 10).toFixed(1);
        setTicks(trade.pnl > 0 ? `+${tk}` : `${tk}`);
        
        // Detailed fields sync
        setSession(trade.customData?.Sesi || trade.customData?.Session || "New York");
        setRiskReward(trade.riskRewardRatio || 0);
        setRating(trade.rating || 5);
        setNotes(trade.notes || "");
        setSelectedCriteria(trade.criteriaChecked || []);
      }
    }
  }, [trade, isDashboard]);

  // Sync default footer text, header badge, and username when activeProfileName loads
  useEffect(() => {
    if (activeProfileName) {
      setFooterText(activeProfileName);
      setHeaderBadge(activeProfileName);
      
      const savedUsername = localStorage.getItem("share_card_username");
      if (!savedUsername) {
        setUsername(activeProfileName);
      }
    }
  }, [activeProfileName]);

  // Label overrides based on sharing target
  const symbolLabel = isDashboard ? "Portfolio" : "Symbol";
  const positionLabel = isDashboard ? "Growth" : "Position";
  const pnlLabel = isDashboard ? "Net Performance" : (pnlFormat === "ticks_percent" ? "Total Ticks/Points" : "Profit/Loss");
  const entryLabel = isDashboard ? "Tanggal Mulai" : "Entry Price";
  const exitLabel = isDashboard ? "Tanggal Selesai" : "Exit Price (Last)";

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

    const drawEverything = (screenshotImg) => {
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

      // Draw top-right header badge if detailed card type is active
      if (cardType === "detailed") {
        ctx.save();
        ctx.font = "bold 15px Inter, system-ui, sans-serif";
        const badgeText = headerBadge;
        const badgeTextW = ctx.measureText(badgeText).width;
        
        const badgeW = badgeTextW + 28;
        const badgeH = 36;
        const badgeX = 720 - badgeW;
        const badgeY = 78;
        const badgeR = 8;
        
        // Background Pill
        ctx.fillStyle = "rgba(139, 92, 246, 0.1)";
        ctx.strokeStyle = "rgba(139, 92, 246, 0.35)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeR);
        } else {
          ctx.rect(badgeX, badgeY, badgeW, badgeH);
        }
        ctx.fill();
        ctx.stroke();
        
        // Text inside Badge
        ctx.fillStyle = "#a78bfa";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2);
        ctx.restore();
      }

      if (cardType === "standard") {
        // --- DRAW STANDARD CARD CONTENT ---
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
          ctx.font = isDashboard ? "bold 23px Inter, system-ui, sans-serif" : "bold 36px Inter, system-ui, sans-serif";
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(isDashboard ? startDate : entryPrice.toLocaleString("id-ID"), startX, 652);

          ctx.fillStyle = "#7f848e";
          ctx.font = "500 22px Inter, system-ui, sans-serif";
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(exitLabel, 380, 615);
          
          ctx.fillStyle = "#ffffff";
          ctx.font = isDashboard ? "bold 23px Inter, system-ui, sans-serif" : "bold 36px Inter, system-ui, sans-serif";
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
      } else {
        // --- DRAW DETAILED PREMIUM CARD CONTENT ---
        // 3x2 Grid Trade Stats (Matches HTML bg-white/[0.02] border p-2.5 rounded-xl)
        const gridX = 80, gridY = 160, gridW = 640, gridH = 175, gridR = 24;
        
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(gridX, gridY, gridW, gridH, gridR);
        } else {
          ctx.rect(gridX, gridY, gridW, gridH);
        }
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Exact coordinates mapped from HTML grid
        const col1X = 105, col2X = 310, col3X = 515;
        const row1Y_Label = 195, row1Y_Value = 222;
        const row2LineY = 250;
        const row2Y_Label = 275, row2Y_Value = 302;

        // -- Row 1: Pair / Symbol --
        ctx.save();
        ctx.fillStyle = "#7f848e";
        ctx.font = "bold 16px Inter, system-ui, sans-serif";
        ctx.fillText("PAIR", col1X, row1Y_Label);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 24px Inter, system-ui, sans-serif";
        ctx.fillText(pair.toUpperCase(), col1X, row1Y_Value);
        ctx.restore();

        // -- Row 1: Position Tipe --
        ctx.save();
        ctx.fillStyle = "#7f848e";
        ctx.font = "bold 16px Inter, system-ui, sans-serif";
        ctx.fillText("TIPE", col2X, row1Y_Label);
        
        const isLong = positionType.toLowerCase() === "long";
        ctx.fillStyle = isLong ? "#4ade80" : "#f87171"; // text-green-400 : text-red-400
        ctx.font = "900 24px Inter, system-ui, sans-serif";
        ctx.fillText(positionType.toUpperCase(), col2X, row1Y_Value);
        ctx.restore();

        // -- Row 1: PNL --
        ctx.save();
        ctx.fillStyle = "#7f848e";
        ctx.font = "bold 16px Inter, system-ui, sans-serif";
        ctx.fillText("PNL", col3X, row1Y_Label);
        
        ctx.fillStyle = pnlValue > 0 ? "#4ade80" : pnlValue < 0 ? "#f87171" : "#ffffff";
        ctx.font = "900 24px Inter, system-ui, sans-serif";
        ctx.fillText(getPnlPreviewText(), col3X, row1Y_Value);
        ctx.restore();

        // -- Row 2: Dividers --
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(col1X, row2LineY); ctx.lineTo(col1X + 175, row2LineY);
        ctx.moveTo(col2X, row2LineY); ctx.lineTo(col2X + 175, row2LineY);
        ctx.moveTo(col3X, row2LineY); ctx.lineTo(col3X + 175, row2LineY);
        ctx.stroke();
        ctx.restore();

        // -- Row 2: Risk Reward --
        ctx.save();
        ctx.fillStyle = "#7f848e";
        ctx.font = "bold 16px Inter, system-ui, sans-serif";
        ctx.fillText("TOTAL R:R", col1X, row2Y_Label);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 24px Inter, system-ui, sans-serif";
        ctx.fillText(riskReward > 0 ? `1:${parseFloat(riskReward).toFixed(2)}` : "N/A", col1X, row2Y_Value);
        ctx.restore();

        // -- Row 2: Session --
        ctx.save();
        ctx.fillStyle = "#7f848e";
        ctx.font = "bold 16px Inter, system-ui, sans-serif";
        ctx.fillText("SESI", col2X, row2Y_Label);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 24px Inter, system-ui, sans-serif";
        ctx.fillText(session.toUpperCase(), col2X, row2Y_Value);
        ctx.restore();

        // -- Row 2: Setup Rating Badge --
        ctx.save();
        ctx.fillStyle = "#7f848e";
        ctx.font = "bold 16px Inter, system-ui, sans-serif";
        ctx.fillText("RATING", col3X, row2Y_Label);

        // Grade mapping and coloring
        const gradeText = rating === 5 ? "A+" : rating === 4 ? "A" : rating === 3 ? "B+" : rating === 2 ? "B" : "C";
        const gradeColor = rating === 5 ? "#fbbf24" : rating === 4 ? "#34d399" : rating === 3 ? "#60a5fa" : rating === 2 ? "#a78bfa" : "#9ca3af";
        const gradeBg = rating === 5 ? "rgba(245,158,11,0.15)" : rating === 4 ? "rgba(16,185,129,0.15)" : rating === 3 ? "rgba(59,130,246,0.15)" : rating === 2 ? "rgba(139,92,246,0.15)" : "rgba(107,114,128,0.15)";
        const gradeBorder = rating === 5 ? "rgba(245,158,11,0.4)" : rating === 4 ? "rgba(16,185,129,0.4)" : rating === 3 ? "rgba(59,130,246,0.4)" : rating === 2 ? "rgba(139,92,246,0.4)" : "rgba(107,114,128,0.4)";

        // Draw Badge Pill Background
        ctx.font = "900 20px Inter, system-ui, sans-serif";
        const textW = ctx.measureText(gradeText).width;
        const badgeW = textW + 24, badgeH = 32, badgeR = 8;
        
        ctx.fillStyle = gradeBg;
        ctx.strokeStyle = gradeBorder;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(col3X, row2Y_Value - 16, badgeW, badgeH, badgeR);
        } else {
          ctx.rect(col3X, row2Y_Value - 16, badgeW, badgeH);
        }
        ctx.fill();
        ctx.stroke();

        // Draw Badge Text
        ctx.fillStyle = gradeColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(gradeText, col3X + badgeW / 2, row2Y_Value);
        ctx.restore();

        // 2. Center Post-Trade Screenshot Image
        const ssX = 80, ssY = 380, ssW = 640, ssH = 340, ssR = 16;
        
        ctx.save();
        if (screenshotImg) {
          // Draw with glowing shadow
          ctx.shadowColor = "rgba(139, 92, 246, 0.4)";
          ctx.shadowBlur = 25;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(ssX, ssY, ssW, ssH, ssR);
          } else {
            ctx.rect(ssX, ssY, ssW, ssH);
          }
          ctx.closePath();
          ctx.clip();
          
          ctx.drawImage(screenshotImg, ssX, ssY, ssW, ssH);
        } else {
          // Draw glassy placeholder
          ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
          ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(ssX, ssY, ssW, ssH, ssR);
          } else {
            ctx.rect(ssX, ssY, ssW, ssH);
          }
          ctx.fill();
          ctx.stroke();

          // Camera Icon placeholder in canvas
          ctx.font = "bold 26px Inter, system-ui, sans-serif";
          ctx.fillStyle = "#4b5563";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("TIDAK ADA FOTO SESUDAH TRADE", ssX + ssW / 2, ssY + ssH / 2);
        }
        ctx.restore();

        // Draw thin glowing neon border over screenshot
        ctx.save();
        ctx.strokeStyle = "rgba(139, 92, 246, 0.35)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(ssX, ssY, ssW, ssH, ssR);
        } else {
          ctx.rect(ssX, ssY, ssW, ssH);
        }
        ctx.stroke();
        ctx.restore();

        // 3. Draw Setup Checklist (Glowing Pills)
        let pillX = 80;
        let pillY = 745;
        const maxPillWidth = 720;
        const pillH = 34;
        const pillRadius = 17;

        ctx.save();
        selectedCriteria.forEach((criterion) => {
          ctx.font = "bold 15px Inter, system-ui, sans-serif";
          const textW = ctx.measureText(criterion).width;
          const pillW = textW + 50; // text + check icon + padding

          // Wrap to next line if it exceeds max bounds
          if (pillX + pillW > maxPillWidth) {
            pillX = 80;
            pillY += 42;
          }

          // Draw pill background
          ctx.fillStyle = "rgba(139, 92, 246, 0.12)";
          ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(pillX, pillY, pillW, pillH, pillRadius);
          } else {
            ctx.rect(pillX, pillY, pillW, pillH);
          }
          ctx.fill();
          ctx.stroke();

          // Draw tiny glowing check icon
          ctx.strokeStyle = "#a78bfa";
          ctx.lineWidth = 2.5;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(pillX + 16, pillY + 17);
          ctx.lineTo(pillX + 20, pillY + 21);
          ctx.lineTo(pillX + 27, pillY + 13);
          ctx.stroke();

          // Draw text
          ctx.fillStyle = "#d8b4fe";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(criterion, pillX + 36, pillY + 17);

          pillX += pillW + 10; // next pill offset with spacing
        });
        ctx.restore();

        // 4. Draw Trade Notes (Centered & wrapped)
        if (notes.trim()) {
          const notesY = selectedCriteria.length > 0 ? pillY + 54 : 755;
          ctx.save();
          ctx.fillStyle = "#9ca3af";
          ctx.font = "italic 500 20px Inter, system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          
          // Wrapping notes logic
          const words = notes.split(" ");
          let currentLine = "";
          let lineY = notesY;
          const maxNotesW = 640;

          for (let n = 0; n < words.length; n++) {
            const testLine = currentLine + words[n] + " ";
            const testWidth = ctx.measureText(testLine).width;
            if (testWidth > maxNotesW && n > 0) {
              ctx.fillText(currentLine.trim(), 400, lineY);
              currentLine = words[n] + " ";
              lineY += 28;
            } else {
              currentLine = testLine;
            }
          }
          ctx.fillText(currentLine.trim(), 400, lineY);
          ctx.restore();
        }

        // 5. Centered bottom Watermark Redesign
        ctx.save();
        
        const centerY = 948;
        
        // A. Draw Faded Horizontal Divider Line (fading to edges)
        const lineGrad = ctx.createLinearGradient(150, centerY, 650, centerY);
        lineGrad.addColorStop(0, "rgba(139, 92, 246, 0)");
        lineGrad.addColorStop(0.5, "rgba(139, 92, 246, 0.25)");
        lineGrad.addColorStop(1, "rgba(139, 92, 246, 0)");
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(150, centerY);
        ctx.lineTo(650, centerY);
        ctx.stroke();
        
        // B. Calculate centered content bounds for high fidelity centering
        ctx.font = "bold 13px Inter, system-ui, sans-serif";
        const part1 = "WZGOLD";
        const part2 = " TRADING JURNAL";
        const part1W = ctx.measureText(part1).width;
        
        ctx.font = "500 13px Inter, system-ui, sans-serif";
        const part2W = ctx.measureText(part2).width;
        const totalTextW = part1W + part2W;
        
        const dotRadius = 4.5;
        const dotGap = 12;
        const contentWidth = (dotRadius * 2) + dotGap + totalTextW;
        
        // C. Draw Glassmorphic Pill Badge (wider than content)
        const watermarkPillW = contentWidth + 48; // generous padding
        const watermarkPillH = 38;
        const watermarkPillX = 400 - watermarkPillW / 2;
        const watermarkPillY = centerY - watermarkPillH / 2;
        const watermarkPillR = 19;
        
        // Pill Glow
        ctx.shadowColor = "rgba(139, 92, 246, 0.25)";
        ctx.shadowBlur = 12;
        
        // Pill Fill
        ctx.fillStyle = "rgba(8, 7, 13, 0.85)";
        ctx.strokeStyle = "rgba(139, 92, 246, 0.35)";
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(watermarkPillX, watermarkPillY, watermarkPillW, watermarkPillH, watermarkPillR);
        } else {
          ctx.rect(watermarkPillX, watermarkPillY, watermarkPillW, watermarkPillH);
        }
        ctx.fill();
        ctx.stroke();
        ctx.restore(); // reset shadow
        
        // D. Draw Amber Gold bead/dot with glow
        ctx.save();
        const contentStartX = 400 - contentWidth / 2;
        const dotCenterX = contentStartX + dotRadius;
        
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(dotCenterX, centerY, dotRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // E. Draw Text inside Pill
        ctx.save();
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        
        const textStartX = contentStartX + (dotRadius * 2) + dotGap;
        
        // Part 1: "WZGOLD"
        ctx.fillStyle = "#c084fc"; // violet-300 / light purple
        ctx.font = "bold 13px Inter, system-ui, sans-serif";
        ctx.fillText(part1, textStartX, centerY);
        
        // Part 2: " TRADING JURNAL"
        ctx.fillStyle = "#9ca3af"; // gray-400
        ctx.font = "500 13px Inter, system-ui, sans-serif";
        ctx.fillText(part2, textStartX + part1W, centerY);
        ctx.restore();
      }

      // Generate Download Link
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

    // Trigger drawing (Asynchronous if detailed card has image)
    if (cardType === "detailed" && afterImageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = afterImageUrl;
      img.onload = () => {
        drawEverything(img);
      };
      img.onerror = () => {
        drawEverything(null);
      };
    } else {
      drawEverything(null);
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
            
            {cardType === "standard" || isDashboard ? (
              /* --- STANDARD CARD --- */
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
                    <div className={`grid grid-cols-2 gap-4 border-t border-white/5 pt-2 ${isDashboard ? "max-w-full" : "max-w-[65%]"}`}>
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
            ) : (
              /* --- DETAILED PREMIUM CARD --- */
              <div 
                id="share-card-preview"
                className="w-full max-w-[390px] aspect-[4/5] rounded-2xl bg-gradient-to-b from-[#08070d] to-[#150d24] border-2 border-violet-500/40 p-5 flex flex-col justify-between shadow-[0_0_20px_rgba(139,92,246,0.25)] relative overflow-hidden"
              >
                {/* Profile Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5 flex-shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-400/50 flex items-center justify-center text-white font-bold text-xs">
                      {username ? username.charAt(0).toUpperCase() : "D"}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="text-white font-bold text-xs truncate max-w-[100px]">{username}</span>
                        {isVerified && (
                          <span className="w-3.5 h-3.5 rounded-full bg-violet-500 flex items-center justify-center text-gray-950 flex-shrink-0">
                            <Check size={8} strokeWidth={4} />
                          </span>
                        )}
                      </div>
                      <span className="text-gray-500 text-[9px]">{formattedDate}</span>
                    </div>
                  </div>
                  <span className="text-violet-400 font-extrabold text-[10px] tracking-widest bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">{headerBadge}</span>
                </div>

                {/* 3x2 Grid Trade Stats */}
                <div className="grid grid-cols-3 gap-x-2 gap-y-1.5 mt-2 bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-xl flex-shrink-0">
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-[8px] font-bold uppercase tracking-wider">PAIR</span>
                    <span className="text-white text-xs font-black leading-tight mt-0.5 truncate">{pair.toUpperCase()}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-[8px] font-bold uppercase tracking-wider">TIPE</span>
                    <span className={`text-xs font-black leading-tight mt-0.5 ${positionType.toLowerCase() === "long" ? "text-green-400" : "text-red-400"}`}>
                      {positionType.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-[8px] font-bold uppercase tracking-wider">PNL</span>
                    <span className={`text-xs font-black leading-tight mt-0.5 truncate ${pnlValue > 0 ? "text-green-400" : pnlValue < 0 ? "text-red-400" : "text-white"}`}>
                      {getPnlPreviewText()}
                    </span>
                  </div>
                  <div className="flex flex-col border-t border-white/[0.04] pt-1">
                    <span className="text-gray-500 text-[8px] font-bold uppercase tracking-wider">TOTAL R:R</span>
                    <span className="text-white text-xs font-black leading-tight mt-0.5">{riskReward > 0 ? `1:${parseFloat(riskReward).toFixed(2)}` : "N/A"}</span>
                  </div>
                  <div className="flex flex-col border-t border-white/[0.04] pt-1">
                    <span className="text-gray-500 text-[8px] font-bold uppercase tracking-wider">SESI</span>
                    <span className="text-white text-xs font-black leading-tight mt-0.5 truncate">{session.toUpperCase()}</span>
                  </div>
                  <div className="flex flex-col border-t border-white/[0.04] pt-1">
                    <span className="text-gray-500 text-[8px] font-bold uppercase tracking-wider">RATING</span>
                    <span className={`text-[10px] font-extrabold leading-none mt-1 py-0.5 px-1.5 rounded-md border flex items-center justify-center tracking-wide w-fit ${
                      rating === 5 ? "bg-amber-500/15 text-amber-400 border-amber-500/40" :
                      rating === 4 ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40" :
                      rating === 3 ? "bg-blue-500/15 text-blue-400 border-blue-500/40" :
                      rating === 2 ? "bg-violet-500/15 text-violet-400 border-violet-500/40" :
                      "bg-gray-500/15 text-gray-400 border-gray-500/40"
                    }`}>
                      {rating === 5 ? "A+" : rating === 4 ? "A" : rating === 3 ? "B+" : rating === 2 ? "B" : "C"}
                    </span>
                  </div>
                </div>

                {/* Center Aspect-Video Screenshot */}
                <div className="w-full aspect-video rounded-xl bg-gray-950/60 border border-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.15)] mt-2.5 overflow-hidden flex items-center justify-center flex-grow">
                  {afterImageUrl ? (
                    <img src={afterImageUrl} alt="SS Sesudah Trade" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5 p-3 text-center">
                      <ShieldAlert size={20} className="text-gray-600" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide leading-tight">TIDAK ADA FOTO SESUDAH TRADE</span>
                    </div>
                  )}
                </div>

                {/* Checklist (Pills) & Notes block */}
                <div className="flex flex-col gap-1.5 mt-2.5 flex-shrink-0">
                  {selectedCriteria.length > 0 && (
                    <div className="flex flex-wrap gap-1 max-h-[46px] overflow-hidden">
                      {selectedCriteria.map((criterion, idx) => (
                        <div key={idx} className="flex items-center gap-0.5 bg-violet-500/10 border border-violet-500/25 py-0.5 px-1.5 rounded-full text-[8px] font-bold text-violet-300">
                          <CheckCircle size={8} className="text-violet-400" />
                          <span>{criterion}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {notes.trim() && (
                    <p className="text-[9px] text-gray-400 italic text-center font-medium line-clamp-1 border-t border-white/5 pt-1.5 mt-0.5">
                      "{notes}"
                    </p>
                  )}
                </div>

                {/* Watermark Bottom Center */}
                <div className="relative flex items-center justify-center mt-4 w-full flex-shrink-0">
                  {/* Faded Divider Line */}
                  <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/25 to-transparent"></div>
                  
                  {/* Glassmorphic Pill */}
                  <div className="relative z-10 px-4 py-1.5 rounded-full bg-gray-950/80 border border-violet-500/25 backdrop-blur-md flex items-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.7)]"></span>
                    <span className="text-[9px] font-extrabold text-violet-300 tracking-[0.2em] uppercase">
                      WzGold <span className="text-gray-400 font-medium">Trading Jurnal</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Customization Controls (Right Side) */}
          <div className="lg:col-span-6 space-y-5 bg-gray-900 border border-gray-800 p-5 rounded-xl">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider border-b border-gray-800 pb-2 flex items-center gap-1.5">
              <span>Pengaturan Kartu</span>
            </h3>

            {/* Pilih Tipe Kartu (Only show for individual trades) */}
            {!isDashboard && (
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-medium">Tipe Desain Kartu</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-950 p-1.5 rounded-lg border border-gray-800">
                  <button
                    onClick={() => setCardType("standard")}
                    className={`py-1.5 px-3 rounded text-xs font-bold transition-all cursor-pointer ${
                      cardType === "standard"
                        ? "bg-violet-600 text-white shadow-sm"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Standar (Minimal)
                  </button>
                  <button
                    onClick={() => setCardType("detailed")}
                    className={`py-1.5 px-3 rounded text-xs font-bold transition-all cursor-pointer ${
                      cardType === "detailed"
                        ? "bg-violet-600 text-white shadow-sm"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Premium (Detail SOP)
                  </button>
                </div>
              </div>
            )}

             {cardType === "detailed" && !isDashboard && (
              <div className="space-y-4 pt-1 animate-fadeIn">
                {/* Teks Badge Kanan Atas */}
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 font-medium">Teks Badge Kanan Atas</label>
                  <input
                    type="text"
                    value={headerBadge}
                    onChange={(e) => setHeaderBadge(e.target.value)}
                    maxLength={20}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-violet-500 font-semibold"
                    placeholder="Contoh: WZ PREMIUM"
                  />
                </div>

                {/* Sesi Trading */}
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 font-medium">Sesi Trading</label>
                  <select
                    value={session}
                    onChange={(e) => setSession(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="London">London Session</option>
                    <option value="New York">New York Session</option>
                    <option value="Asia">Asia (Tokyo) Session</option>
                    <option value="Sydney">Sydney Session</option>
                    <option value="Overlap">Overlap Sesi</option>
                  </select>
                </div>

                {/* Risk/Reward Input */}
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 font-medium">Risk-to-Reward Ratio (R:R)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={riskReward}
                    onChange={(e) => setRiskReward(parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>

                {/* Rating Setup */}
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 font-medium">Rating Setup Quality</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(parseInt(e.target.value) || 5)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="5">Setup A+ (Sempurna / SOP Lengkap)</option>
                    <option value="4">Setup A (Kuat / Konfirmasi Jelas)</option>
                    <option value="3">Setup B+ (Moderat / Cukup SOP)</option>
                    <option value="2">Setup B (Agresif / Minim Konfirmasi)</option>
                    <option value="1">Setup C (High Risk / Spekulatif)</option>
                  </select>
                </div>

                {/* Checklist SOP criteria selection */}
                {activeStrategy && activeStrategy.checklists && activeStrategy.checklists.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-medium block">Pilih SOP Terpenuhi (Checklist)</label>
                    <div className="grid grid-cols-1 gap-2 max-h-[140px] overflow-y-auto bg-gray-950 border border-gray-800 p-2.5 rounded-lg pr-1.5">
                      {activeStrategy.checklists.map((criterion, idx) => {
                        const isChecked = selectedCriteria.includes(criterion);
                        return (
                          <label key={idx} className="flex items-center gap-2 text-xs text-gray-300 font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedCriteria(selectedCriteria.filter(c => c !== criterion));
                                } else {
                                  setSelectedCriteria([...selectedCriteria, criterion]);
                                }
                              }}
                              className="rounded border-gray-700 bg-gray-900 text-violet-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            />
                            <span className={isChecked ? "text-violet-300 font-bold" : "text-gray-500 font-normal line-through"}>
                              {criterion}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Notes Input */}
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 font-medium">Catatan Setup</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    maxLength={100}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-violet-500 resize-none font-semibold"
                    placeholder="Tulis catatan singkat untuk kartu share..."
                  />
                </div>
              </div>
            )}

            {/* Input Username */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">Nama Profile / Username</label>
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
