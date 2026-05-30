import React, { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, Trash2 } from "lucide-react";
import { getItemsByProfileId, addItem } from "../../config/db";
import { toDateTimeLocalInput, formatCurrency, formatDateTime } from "../../utils/formatters";

export const BalanceTransactionModal = ({
  activeProfileId,
  showToast,
  onClose,
  openDeleteModal,
  currency,
}) => {
  const [transactions, setTransactions] = useState([]);
  const [type, setType] = useState("deposit");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toDateTimeLocalInput(new Date()));

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
      getItemsByProfileId("balance_transactions", activeProfileId).then(
        (data) => {
          setTransactions(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        },
      );
    } catch (error) {
      showToast("Error menambah transaksi", "error");
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex-shrink-0">
          Kelola Saldo
        </h2>
        <form onSubmit={handleAddTransaction} className="flex-shrink-0 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
            >
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
            </select>
            <input
              type="number"
              placeholder="Jumlah"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
              required
            />
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
          >
            Tambah Transaksi
          </button>
        </form>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex-shrink-0">
          Riwayat
        </h3>
        <div className="overflow-y-auto flex-grow">
          <ul className="space-y-2">
            {transactions.map((t) => (
              <li
                key={t.id}
                className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg flex justify-between items-center"
              >
                <div className="flex items-center">
                  {t.type === "deposit" ? (
                    <ArrowUpRight className="text-green-500 dark:text-green-400 mr-3" />
                  ) : (
                    <ArrowDownRight className="text-red-500 dark:text-red-400 mr-3" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white capitalize">
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
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-500"
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
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default BalanceTransactionModal;
