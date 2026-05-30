import React, { useState, useEffect, useRef } from "react";
import { ArrowUpRight, ArrowDownRight, Trash2 } from "lucide-react";
import { getItemsByProfileId, addItem } from "../../config/db";
import { toDateTimeLocalInput, formatCurrency, formatDateTime } from "../../utils/formatters";

export const BalanceTransactionModal = ({
  activeProfileId,
  showToast,
  onClose,
  openDeleteModal,
  currency,
  onRefresh,
}) => {
  const [transactions, setTransactions] = useState([]);
  const [type, setType] = useState("deposit");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toDateTimeLocalInput(new Date()));

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
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Backdrop click handler
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    if (!activeProfileId) return;
    getItemsByProfileId("balance_transactions", activeProfileId).then(
      (data) => {
        setTransactions(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
      },
    );
  }, [activeProfileId]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      showToast("Jumlah harus lebih dari nol", "error");
      return;
    }
    try {
      const newTransaction = {
        id: crypto.randomUUID(),
        profileId: activeProfileId,
        type,
        amount: parseFloat(amount),
        date: new Date(date),
      };
      await addItem("balance_transactions", newTransaction);
      showToast("Transaksi berhasil ditambahkan!", "success");
      setAmount("");
      setDate(toDateTimeLocalInput(new Date()));
      
      const updatedData = await getItemsByProfileId("balance_transactions", activeProfileId);
      setTransactions(updatedData.sort((a, b) => new Date(b.date) - new Date(a.date)));
      
      if (onRefresh) await onRefresh();
    } catch (error) {
      showToast("Error menambah transaksi", "error");
      console.error(error);
    }
  };

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-950/45 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn"
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
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-modalSpringIn relative border border-gray-100 dark:border-gray-700/50"
        style={{
          transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
          transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
        }}
      >
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
          className="flex justify-between items-center mb-4 flex-shrink-0 cursor-grab active:cursor-grabbing select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Kelola Saldo
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-3xl font-light leading-none p-1"
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleAddTransaction} className="flex-shrink-0 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:border-blue-500 outline-none text-sm"
            >
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
            </select>
            <input
              type="number"
              placeholder="Jumlah"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:border-blue-500 outline-none text-sm"
              required
            />
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:border-blue-500 outline-none text-sm"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center transition-colors font-medium text-sm"
          >
            Tambah Transaksi
          </button>
        </form>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex-shrink-0">
          Riwayat
        </h3>
        <div className="overflow-y-auto flex-grow pr-1">
          <ul className="space-y-2">
            {transactions.map((t) => (
              <li
                key={t.id}
                className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg flex justify-between items-center animate-fadeIn"
              >
                <div className="flex items-center">
                  {t.type === "deposit" ? (
                    <ArrowUpRight className="text-green-500 dark:text-green-400 mr-3" />
                  ) : (
                    <ArrowDownRight className="text-red-500 dark:text-red-400 mr-3" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white capitalize text-sm">
                      {t.type === "deposit" ? "Deposit" : "Withdrawal"}: {formatCurrency(t.amount, currency)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(t.date)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openDeleteModal("transaction", t)}
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end mt-6 flex-shrink-0">
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

export default BalanceTransactionModal;
