import React, { useState, useEffect, useMemo } from "react";
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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md relative">
        {toastMessage && (
          <div className="absolute top-4 right-4 bg-green-600 text-white text-xs px-3 py-1 rounded-full animate-fadeIn z-10">
            {toastMessage}
          </div>
        )}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <Calculator
            size={24}
            className="mr-2 text-blue-500 dark:text-blue-400"
          />{" "}
          Kalkulator Lot Size
        </h2>
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
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
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
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
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
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
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
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
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
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default LotSizeCalculatorModal;
