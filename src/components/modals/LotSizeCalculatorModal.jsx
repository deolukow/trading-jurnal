import React, { useState, useEffect, useMemo, useRef } from "react";
import { Calculator, Info, Copy } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

export const LotSizeCalculatorModal = ({
  isOpen,
  onClose,
  currentBalance,
  currency,
}) => {
  const [balance, setBalance] = useState("");
  const [riskPercent, setRiskPercent] = useState("1");
  const [stopLossPips, setStopLossPips] = useState("20");
  const [pipValue, setPipValue] = useState("1");
  const [toastMessage, setToastMessage] = useState("");

  // Touch Drag to Dismiss Logic
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    const currentY = e.touches[0].clientY;
    const diffY = currentY - touchStartY.current;
    if (diffY > 0) {
      setTranslateY(diffY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (translateY > 120) {
      onClose();
    } else {
      setTranslateY(0);
    }
  };

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Backdrop click handler
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen && currentBalance) {
      setBalance(currentBalance.toFixed(2));
    }
  }, [isOpen, currentBalance]);

  const calculation = useMemo(() => {
    const numBalance = parseFloat(balance);
    const numRiskPercent = parseFloat(riskPercent);
    const numStopLossPips = parseFloat(stopLossPips);
    const numPipValue = parseFloat(pipValue);
    if (
      isNaN(numBalance) ||
      isNaN(numRiskPercent) ||
      isNaN(numStopLossPips) ||
      isNaN(numPipValue) ||
      numBalance <= 0 ||
      numStopLossPips <= 0 ||
      numPipValue <= 0
    ) {
      return { riskAmount: 0, lotSize: 0, isValid: false };
    }
    const riskAmount = numBalance * (numRiskPercent / 100);
    const totalStopLossValue = numStopLossPips * numPipValue;
    const lotSize =
      totalStopLossValue > 0 ? riskAmount / totalStopLossValue : 0;
    return { riskAmount, lotSize, isValid: true };
  }, [balance, riskPercent, stopLossPips, pipValue]);

  const handleCopyToClipboard = () => {
    if (calculation.isValid && calculation.lotSize > 0) {
      const lotSizeToCopy = calculation.lotSize.toFixed(2);
      navigator.clipboard
        .writeText(lotSizeToCopy)
        .then(() => {
          setToastMessage("Lot Size disalin!");
          setTimeout(() => setToastMessage(""), 2000);
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
          try {
            const textArea = document.createElement("textarea");
            textArea.value = lotSizeToCopy;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            setToastMessage("Lot Size disalin!");
            setTimeout(() => setToastMessage(""), 2000);
          } catch (e) {
            setToastMessage("Gagal menyalin.");
            setTimeout(() => setToastMessage(""), 2000);
          }
        });
    }
  };

  if (!isOpen) return null;
  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-950/45 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-fadeIn"
    >
      <style>{`
        @keyframes modalSpringIn {
          0% {
            opacity: 0;
            transform: scale(0.93) translateY(30px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modalSpringIn {
          animation: modalSpringIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
      <div 
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md animate-modalSpringIn relative border border-gray-100 dark:border-gray-700/50"
        style={{
          transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
          transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
        }}
      >
        {toastMessage && (
          <div className="absolute top-4 right-4 bg-green-600 text-white text-xs px-3 py-1 rounded-full animate-fadeIn z-10 font-semibold">
            {toastMessage}
          </div>
        )}

        {/* Swipe drag handle indicator for mobile */}
        <div 
          className="md:hidden flex justify-center pb-3 cursor-grab active:cursor-grabbing select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>

        <div 
          className="flex justify-between items-center mb-6 flex-shrink-0 cursor-grab active:cursor-grabbing select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Calculator
              size={24}
              className="mr-2 text-blue-500 dark:text-blue-400"
            />{" "}
            Kalkulator Lot Size
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-3xl font-light leading-none p-1"
          >
            &times;
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Saldo Akun ({currency})
            </label>
            <input
              type="number"
              step="any"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:border-blue-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Risiko per Trade (%)
            </label>
            <input
              type="number"
              step="any"
              value={riskPercent}
              onChange={(e) => setRiskPercent(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:border-blue-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Jarak Stop Loss (Poin/Pips)
            </label>
            <input
              type="number"
              step="any"
              value={stopLossPips}
              onChange={(e) => setStopLossPips(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:border-blue-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Nilai per Poin/Pip per Lot ({currency})
              <Info
                size={14}
                className="ml-1 text-gray-400 dark:text-gray-500 cursor-help"
                title="Nilai profit/loss dalam Dolar jika harga bergerak 1 poin/pip dengan ukuran 1.00 Lot. Contoh: XAU/USD = $1, EUR/USD = $10."
              />
            </label>
            <input
              type="number"
              step="any"
              value={pipValue}
              onChange={(e) => setPipValue(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:border-blue-500 outline-none text-sm"
            />
          </div>
        </div>
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
          <div className="flex justify-between items-center text-lg">
            <span className="text-gray-600 dark:text-gray-400">
              Risiko Maksimal:
            </span>
            <span className="font-bold text-red-500 dark:text-red-400">
              {formatCurrency(calculation.riskAmount, currency)}
            </span>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Rekomendasi Lot Size
            </p>
            <div className="flex items-center justify-center mt-1">
              <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                {calculation.isValid ? calculation.lotSize.toFixed(2) : "0.00"}
              </p>
              <button
                onClick={handleCopyToClipboard}
                className="ml-3 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                title="Salin Lot Size"
              >
                <Copy size={20} />
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium text-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default LotSizeCalculatorModal;
