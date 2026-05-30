import React, { useState, useEffect, useCallback, useMemo } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./config/firebase";
import {
  initDB,
  addItem,
  updateItem,
  deleteItem,
  getItem,
  getAllItems,
  getItemsByProfileId,
} from "./config/db";
import {
  formatDate,
  formatDateTime,
  toDateTimeLocalInput,
  formatCurrency,
  formatLotSize,
} from "./utils/formatters";
import { generateDeviceFingerprint, classNames } from "./utils/helpers";
import { useLocalImage } from "./hooks/useLocalImage";

// lucide-react icons
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Image as ImageIcon,
  TrendingUp,
  Calculator,
  Target,
  Zap,
  ListPlus,
  Wallet,
  PlusCircle,
  Menu,
  LogOut,
  Share2,
} from "lucide-react";

// modular components
import { Toast } from "./components/common/Toast";
import { SidebarLink } from "./components/common/SidebarLink";
import { TradeList } from "./components/common/TradeList";
import { YearlySummary } from "./components/common/YearlySummary";

import { ConfirmationModal } from "./components/modals/ConfirmationModal";
import { FullscreenImageModal } from "./components/modals/FullscreenImageModal";
import { TradeDetailModal } from "./components/modals/TradeDetailModal";
import { LotSizeCalculatorModal } from "./components/modals/LotSizeCalculatorModal";
import { GoalSettingModal } from "./components/modals/GoalSettingModal";
import { ProfileManagementModal } from "./components/modals/ProfileManagementModal";
import { CustomFieldManagementModal } from "./components/modals/CustomFieldManagementModal";
import { TemplateManagementModal } from "./components/modals/TemplateManagementModal";
import { PairManagementModal } from "./components/modals/PairManagementModal";
import { ShareCardModal } from "./components/modals/ShareCardModal";
import { BalanceTransactionModal } from "./components/modals/BalanceTransactionModal";
import { TradeForm } from "./components/modals/TradeForm";

import { GoalProgress } from "./components/dashboard/GoalProgress";
import { DailyGoalProgress } from "./components/dashboard/DailyGoalProgress";
import { StatisticsDashboard } from "./components/dashboard/StatisticsDashboard";
import { AccountBalanceChart } from "./components/dashboard/AccountBalanceChart";
import { DateRangePicker } from "./components/dashboard/DateRangePicker";
import { YearSelector } from "./components/dashboard/YearSelector";
import { FieldPerformanceTable } from "./components/dashboard/FieldPerformanceTable";
import { ProfileSelector } from "./components/dashboard/ProfileSelector";

import { LoginPage } from "./pages/LoginPage";
import { StrategyPage } from "./pages/StrategyPage";
import { CalendarView } from "./pages/CalendarView";
import { GalleryView } from "./pages/GalleryView";

// --- MAIN APP COMPONENT ---
function App() {
  const [trades, setTrades] = useState([]);
  const [pairs, setPairs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [balanceTransactions, setBalanceTransactions] = useState([]);
  const [strategies, setStrategies] = useState([]); // State untuk Strategi
  const [initialBalance, setInitialBalance] = useState(0);
  const [goalSettings, setGoalSettings] = useState(null);

  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [tradingProfiles, setTradingProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState("");

  const [toast, setToast] = useState({ message: "", type: "" });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTradeFormVisible, setIsTradeFormVisible] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [viewingTrade, setViewingTrade] = useState(null);
  const [showDashboardShareModal, setShowDashboardShareModal] = useState(false);
  const [isTransactionModalVisible, setIsTransactionModalVisible] =
    useState(false);
  const [isPairModalVisible, setIsPairModalVisible] = useState(false);
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
  const [isCustomFieldModalVisible, setIsCustomFieldModalVisible] =
    useState(false);
  const [isCalculatorVisible, setIsCalculatorVisible] = useState(false);
  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [activePeriod, setActivePeriod] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "tradeDate",
    direction: "descending",
  });
  const [chartType, setChartType] = useState("balance");
  const [customStartDate, setCustomStartDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [customEndDate, setCustomEndDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [selectedYear, setSelectedYear] = useState(
    String(new Date().getFullYear()),
  );

  const periods = useMemo(
    () => [
      { key: "all", label: "Semua" },
      { key: "daily", label: "Harian" },
      { key: "weekly", label: "Mingguan" },
      { key: "monthly", label: "Bulanan" },
      { key: "yearly", label: "Tahunan" },
      { key: "custom", label: "Kustom" },
    ],
    [],
  );

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const refreshProfiles = useCallback(async () => {
    const profilesData = await getAllItems("profiles");
    const sortedProfiles = profilesData.sort(
      (a, b) => a.createdAt - b.createdAt,
    );
    setTradingProfiles(sortedProfiles);

    if (
      activeProfile &&
      !sortedProfiles.some((p) => p.id === activeProfile.id)
    ) {
      const newActiveProfile =
        sortedProfiles.length > 0 ? sortedProfiles[0] : null;
      setActiveProfile(newActiveProfile);
      if (newActiveProfile) {
        localStorage.setItem("activeProfileId", newActiveProfile.id);
      } else {
        localStorage.removeItem("activeProfileId");
      }
    } else if (!activeProfile && sortedProfiles.length > 0) {
      const lastProfileId = localStorage.getItem("activeProfileId");
      const lastProfile = sortedProfiles.find((p) => p.id === lastProfileId);
      setActiveProfile(lastProfile || sortedProfiles[0]);
    }
  }, [activeProfile]);

  const refreshAllData = useCallback(async (profileId) => {
    if (!profileId) {
      setTrades([]);
      setPairs([]);
      setTemplates([]);
      setCustomFields([]);
      setBalanceTransactions([]);
      setStrategies([]);
      setGoalSettings(null);
      setInitialBalance(0);
      return;
    }

    const [
      tradesData,
      pairsData,
      templatesData,
      customFieldsData,
      balanceData,
      goalData,
      strategiesData,
    ] = await Promise.all([
      getItemsByProfileId("trades", profileId),
      getItemsByProfileId("pairs", profileId),
      getItemsByProfileId("templates", profileId),
      getItemsByProfileId("custom_fields", profileId),
      getItemsByProfileId("balance_transactions", profileId),
      getItem("goals", profileId),
      getItemsByProfileId("strategies", profileId), // Load strategy data
    ]);

    setTrades(tradesData);
    setPairs(pairsData.sort((a, b) => a.createdAt - b.createdAt));
    setTemplates(templatesData.sort((a, b) => a.name.localeCompare(b.name)));
    setCustomFields(customFieldsData.sort((a, b) => a.createdAt - b.createdAt));
    setBalanceTransactions(balanceData.sort((a, b) => new Date(b.date) - new Date(a.date)));
    setStrategies(strategiesData.sort((a, b) => b.createdAt - a.createdAt));
    setGoalSettings(goalData);

    const totalDeposits = balanceData
      .filter((t) => t.type === "deposit")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = balanceData
      .filter((t) => t.type === "withdrawal")
      .reduce((sum, t) => sum + t.amount, 0);
    setInitialBalance(totalDeposits - totalWithdrawals);
  }, []);

  useEffect(() => {
    initDB().then(() => {
      console.log("Database initialized");
    });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser) {
        refreshProfiles().then(() => setIsLoading(false));
      } else {
        setActiveProfile(null);
        setTradingProfiles([]);
        refreshAllData(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [refreshProfiles, refreshAllData]);

  useEffect(() => {
    if (activeProfile) {
      refreshAllData(activeProfile.id);
    } else if (!isLoading && user) {
      refreshAllData(null);
    }
  }, [activeProfile, isLoading, user, refreshAllData]);

  const handleSelectProfile = (profile) => {
    setActiveProfile(profile);
    localStorage.setItem("activeProfileId", profile.id);
  };

  const handleLogin = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      const currentFingerprint = await generateDeviceFingerprint();
      const deviceDocRef = doc(db, "device_auths", user.uid);
      const docSnap = await getDoc(deviceDocRef);

      if (docSnap.exists()) {
        const storedFingerprint = docSnap.data().fingerprint;
        if (storedFingerprint !== currentFingerprint) {
          setLoginError(
            "Akun ini sudah terdaftar di perangkat lain. Silakan login di perangkat pertama Anda.",
          );
          await signOut(auth);
          return;
        }
      } else {
        await setDoc(deviceDocRef, {
          fingerprint: currentFingerprint,
          createdAt: new Date(),
          email: user.email,
          userAgent: navigator.userAgent,
        });
      }

      setLoginError("");
    } catch (error) {
      console.error("Login failed:", error);
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        setLoginError("Email atau kata sandi yang Anda masukkan salah.");
      } else {
        setLoginError("Terjadi kesalahan. Silakan coba lagi.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast("Anda telah berhasil keluar.", "success");
    } catch (error) {
      console.error("Logout failed:", error);
      showToast("Gagal keluar.", "error");
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const handleShowTradeDetail = (trade) => {
    setViewingTrade(trade);
  };

  const handleSaveTrade = async (tradeData, beforeFile, afterFile) => {
    if (!activeProfile) return;

    const isEditing = !!editingTrade?.id;
    const finalTradeData = { ...tradeData };

    try {
      if (isEditing) {
        if (beforeFile && editingTrade.screenshotBeforeId)
          await deleteItem("trade_images", editingTrade.screenshotBeforeId);
        if (afterFile && editingTrade.screenshotAfterId)
          await deleteItem("trade_images", editingTrade.screenshotAfterId);
      }

      if (beforeFile) {
        const newId = crypto.randomUUID();
        await addItem("trade_images", { id: newId, file: beforeFile });
        finalTradeData.screenshotBeforeId = newId;
      }
      if (afterFile) {
        const newId = crypto.randomUUID();
        await addItem("trade_images", { id: newId, file: afterFile });
        finalTradeData.screenshotAfterId = newId;
      }

      if (isEditing) {
        await updateItem("trades", {
          ...finalTradeData,
          updatedAt: new Date(),
        });
      } else {
        await addItem("trades", {
          ...finalTradeData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      showToast(
        isEditing ? "Trade berhasil diupdate!" : "Trade berhasil ditambah!",
        "success",
      );
      setEditingTrade(null);
      setIsTradeFormVisible(false);
      refreshAllData(activeProfile.id);
    } catch (e) {
      console.error(e);
      showToast("Gagal menyimpan trade.", "error");
    }
  };

  const openDeleteModal = (type, data) => {
    setItemToDelete({ type, data });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    const { type, data } = itemToDelete;

    try {
      if (type === "profile") {
        await handleDeleteProfile(data);
        return;
      }

      if (type === "trade") {
        if (data.screenshotBeforeId)
          await deleteItem("trade_images", data.screenshotBeforeId);
        if (data.screenshotAfterId)
          await deleteItem("trade_images", data.screenshotAfterId);
      }

      if (!activeProfile) return;

      if (type === "custom_field") {
        try {
          const templatesToClean = templates.filter(
            (t) => t.customData && t.customData.hasOwnProperty(data.name)
          );
          for (const t of templatesToClean) {
            const updatedCustomData = { ...t.customData };
            delete updatedCustomData[data.name];
            await updateItem("templates", {
              ...t,
              customData: updatedCustomData,
              updatedAt: new Date(),
            });
          }
        } catch (err) {
          console.error("Gagal membersihkan template dari field tambahan:", err);
        }
      }

      let storeName = "";
      let itemName = "";
      switch (type) {
        case "trade":
          storeName = "trades";
          itemName = "Trade";
          break;
        case "transaction":
          storeName = "balance_transactions";
          itemName = "Transaksi";
          break;
        case "pair":
          storeName = "pairs";
          itemName = "Pair";
          break;
        case "template":
          storeName = "templates";
          itemName = "Template";
          break;
        case "custom_field":
          storeName = "custom_fields";
          itemName = "Field";
          break;
        case "strategy":
          storeName = "strategies";
          itemName = "Strategi";
          break;
        default:
          return;
      }

      await deleteItem(storeName, data.id);
      showToast(`${itemName} berhasil dihapus.`, "success");
      refreshAllData(activeProfile.id);
    } catch (e) {
      console.error(`Error deleting ${type}:`, e);
      showToast(`Gagal menghapus item.`, "error");
    } finally {
      setItemToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteProfile = async (profileToDelete) => {
    if (!profileToDelete) return;

    showToast(`Menghapus profil '${profileToDelete.name}'...`, "info");

    try {
      const storesToClear = [
        "trades",
        "balance_transactions",
        "pairs",
        "templates",
        "custom_fields",
        "goals",
        "strategies",
      ];

      const tradesToDelete = await getItemsByProfileId(
        "trades",
        profileToDelete.id,
      );
      for (const trade of tradesToDelete) {
        if (trade.screenshotBeforeId)
          await deleteItem("trade_images", trade.screenshotBeforeId);
        if (trade.screenshotAfterId)
          await deleteItem("trade_images", trade.screenshotAfterId);
      }

      for (const storeName of storesToClear) {
        const items = await getItemsByProfileId(storeName, profileToDelete.id);
        for (const item of items) {
          await deleteItem(storeName, item.id);
        }
      }

      await deleteItem("profiles", profileToDelete.id);
      showToast(
        `Profil '${profileToDelete.name}' dan semua datanya berhasil dihapus.`,
        "success",
      );

      refreshProfiles();
    } catch (error) {
      console.error("Error deleting profile and its data:", error);
      showToast("Gagal menghapus profil secara lengkap.", "error");
    } finally {
      setItemToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const filteredTrades = useMemo(() => {
    if (!activeProfile) return [];

    if (activePeriod === "yearly") {
      const yearNumber = parseInt(selectedYear, 10);
      if (!yearNumber || String(yearNumber).length < 4) return [];
      return trades.filter(
        (t) =>
          t.tradeDate && new Date(t.tradeDate).getFullYear() === yearNumber,
      );
    }

    const getStartOfDate = (dateString) => {
      const date = new Date(dateString);
      date.setHours(0, 0, 0, 0);
      return date;
    };

    const getEndOfDate = (dateString) => {
      const date = new Date(dateString);
      date.setHours(23, 59, 59, 999);
      return date;
    };

    const filterFn = (allTrades, period) => {
      if (period === "all") return allTrades;

      if (period === "custom") {
        if (!customStartDate || !customEndDate) return [];
        const start = getStartOfDate(customStartDate);
        const end = getEndOfDate(customEndDate);
        return allTrades.filter((t) => {
          const tradeDate = t.tradeDate || new Date(0);
          return tradeDate >= start && tradeDate <= end;
        });
      }

      const now = new Date();
      const startOfPeriod = new Date(now);
      switch (period) {
        case "daily":
          startOfPeriod.setHours(0, 0, 0, 0);
          break;
        case "weekly":
          const d = now.getDay();
          startOfPeriod.setDate(now.getDate() - d + (d === 0 ? -6 : 1));
          startOfPeriod.setHours(0, 0, 0, 0);
          break;
        case "monthly":
          startOfPeriod.setDate(1);
          startOfPeriod.setHours(0, 0, 0, 0);
          break;
        case "yearly":
          startOfPeriod.setMonth(0, 1);
          startOfPeriod.setHours(0, 0, 0, 0);
          break;
        default:
          break;
      }
      return allTrades.filter(
        (t) => (t.tradeDate || new Date(0)) >= startOfPeriod,
      );
    };
    return filterFn(trades, activePeriod);
  }, [
    trades,
    activePeriod,
    activeProfile,
    customStartDate,
    customEndDate,
    selectedYear,
  ]);

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const sortedTrades = useMemo(() => {
    let sortableTrades = [...filteredTrades];
    if (sortConfig.key !== null) {
      sortableTrades.sort((a, b) => {
        const isCustom = customFields.some((f) => f.name === sortConfig.key);

        const aValue = isCustom
          ? (a.customData?.[sortConfig.key] ?? "")
          : (a[sortConfig.key] ?? "");
        const bValue = isCustom
          ? (b.customData?.[sortConfig.key] ?? "")
          : (b[sortConfig.key] ?? "");

        let comparison = 0;

        if (aValue instanceof Date && bValue instanceof Date) {
          comparison = aValue.getTime() - bValue.getTime();
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          comparison = aValue - bValue;
        } else {
          comparison = String(aValue).localeCompare(String(bValue), undefined, {
            numeric: true,
            sensitivity: "base",
          });
        }

        if (comparison === 0) {
          const aDate = a.tradeDate ? new Date(a.tradeDate).getTime() : 0;
          const bDate = b.tradeDate ? new Date(b.tradeDate).getTime() : 0;
          return bDate - aDate;
        }

        return sortConfig.direction === "ascending" ? comparison : -comparison;
      });
    }
    return sortableTrades;
  }, [filteredTrades, sortConfig, customFields]);

  const performanceStats = useMemo(() => {
    const defaultStats = {
      netPnl: 0,
      tradeWinRate: 0,
      wins: 0,
      losses: 0,
      profitFactor: 0,
      dayWinRate: 0,
      profitableDays: 0,
      losingDays: 0,
      avgWinLossRatio: 0,
      avgWin: 0,
      avgLoss: 0,
      grossProfit: 0,
      grossLoss: 0,
      avgRiskReward: 0,
      totalLotUsed: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
      growthPercentage: 0,
      bestTrade: 0,
      worstTrade: 0,
      bestRR: 0,
    };
    if (!activeProfile) return defaultStats;

    const statsTrades = [...filteredTrades].sort(
      (a, b) => new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime(),
    );
    if (statsTrades.length === 0) return defaultStats;

    const winningTrades = statsTrades.filter((t) => parseFloat(t.pnl) > 0);
    const losingTrades = statsTrades.filter((t) => parseFloat(t.pnl) < 0);
    const wins = winningTrades.length;
    const losses = losingTrades.length;
    const totalTrades = statsTrades.length;
    const grossProfit = winningTrades.reduce(
      (s, t) => s + parseFloat(t.pnl),
      0,
    );
    const grossLoss = Math.abs(
      losingTrades.reduce((s, t) => s + parseFloat(t.pnl), 0),
    );
    const netPnl = grossProfit - grossLoss;
    const tradeWinRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : Infinity;
    const avgWin = wins > 0 ? grossProfit / wins : 0;
    const avgLoss = losses > 0 ? -grossLoss / losses : 0;
    const avgWinLossRatio =
      avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : Infinity;
    const dailyPnl = new Map();
    statsTrades.forEach((t) => {
      const d = formatDate(t.tradeDate);
      if (d && d !== "N/A")
        dailyPnl.set(d, (dailyPnl.get(d) || 0) + (parseFloat(t.pnl) || 0));
    });
    let pDays = 0,
      lDays = 0;
    dailyPnl.forEach((pnl) => {
      if (pnl > 0) pDays++;
      else if (pnl < 0) lDays++;
    });
    const totalTradingDays = pDays + lDays;
    const dayWinRate =
      totalTradingDays > 0 ? (pDays / totalTradingDays) * 100 : 0;
    const tradesWithRR = statsTrades
      .map((t) => parseFloat(t.riskRewardRatio) || 0)
      .filter((rr) => rr > 0);
    const totalRR = tradesWithRR.reduce((s, rr) => s + rr, 0);
    const avgRiskReward =
      tradesWithRR.length > 0 ? totalRR / tradesWithRR.length : 0;
    const totalLotUsed = statsTrades.reduce(
      (s, t) => s + (parseFloat(t.lotSize) || 0),
      0,
    );

    let maxWins = 0;
    let currentWins = 0;
    let maxLosses = 0;
    let currentLosses = 0;
    for (const trade of statsTrades) {
      const pnl = parseFloat(trade.pnl) || 0;
      if (pnl > 0) {
        currentWins++;
        currentLosses = 0;
        if (currentWins > maxWins) {
          maxWins = currentWins;
        }
      } else if (pnl < 0) {
        currentLosses++;
        currentWins = 0;
        if (currentLosses > maxLosses) {
          maxLosses = currentLosses;
        }
      } else {
        currentWins = 0;
        currentLosses = 0;
      }
    }

    // Logic untuk Best Trade, Worst Trade, & Best RR
    const allPnls = statsTrades.map((t) => parseFloat(t.pnl) || 0);
    const bestTrade = allPnls.length > 0 ? Math.max(...allPnls) : 0;
    const worstTrade = allPnls.length > 0 ? Math.min(...allPnls) : 0;

    const allRRs = statsTrades.map((t) => parseFloat(t.riskRewardRatio) || 0);
    const bestRR = allRRs.length > 0 ? Math.max(...allRRs) : 0;

    // Calculate starting balance of the active period
    let startOfPeriod;
    if (activePeriod === "custom") {
      startOfPeriod = customStartDate ? new Date(customStartDate) : new Date(0);
      startOfPeriod.setHours(0, 0, 0, 0);
    } else {
      const now = new Date();
      startOfPeriod = new Date(now);
      switch (activePeriod) {
        case "daily":
          startOfPeriod.setHours(0, 0, 0, 0);
          break;
        case "weekly":
          const d = now.getDay();
          startOfPeriod.setDate(now.getDate() - d + (d === 0 ? -6 : 1));
          startOfPeriod.setHours(0, 0, 0, 0);
          break;
        case "monthly":
          startOfPeriod.setDate(1);
          startOfPeriod.setHours(0, 0, 0, 0);
          break;
        case "yearly":
          startOfPeriod.setMonth(0, 1);
          startOfPeriod.setHours(0, 0, 0, 0);
          break;
        default:
          startOfPeriod = new Date(0);
          break;
      }
    }

    const depositsBefore = balanceTransactions
      .filter((t) => new Date(t.date).getTime() < startOfPeriod.getTime())
      .reduce(
        (sum, t) => sum + (t.type === "deposit" ? t.amount : -t.amount),
        0,
      );

    const tradesBefore = trades
      .filter((t) => new Date(t.tradeDate).getTime() < startOfPeriod.getTime())
      .reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);

    const startingBalance = depositsBefore + tradesBefore;

    const totalDeposits = balanceTransactions
      .filter((t) => t.type === "deposit")
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    let growthPercentage = 0;
    if (activePeriod === "all" || startingBalance <= 0) {
      growthPercentage = totalDeposits > 0 ? (netPnl / totalDeposits) * 100 : 0;
    } else {
      growthPercentage = (netPnl / startingBalance) * 100;
    }

    return {
      netPnl,
      tradeWinRate,
      wins,
      losses,
      profitFactor,
      dayWinRate,
      profitableDays: pDays,
      losingDays: lDays,
      avgWinLossRatio,
      avgWin,
      avgLoss,
      grossProfit,
      grossLoss,
      avgRiskReward,
      totalLotUsed,
      consecutiveWins: maxWins,
      consecutiveLosses: maxLosses,
      growthPercentage,
      bestTrade,
      worstTrade,
      bestRR,
    };
  }, [
    filteredTrades,
    activeProfile,
    activePeriod,
    customStartDate,
    balanceTransactions,
    trades,
  ]);

  const accountStats = useMemo(() => {
    if (!activeProfile) return { chartData: [] };

    const allTradesForProfile = trades;
    const allTransactionsForProfile = balanceTransactions;

    const combinedEvents = [
      ...allTradesForProfile.map((t) => ({
        type: "trade",
        date: t.tradeDate,
        pnl: t.pnl,
      })),
      ...allTransactionsForProfile.map((t) => ({
        type: t.type,
        date: t.date,
        amount: t.amount,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let cumulativeBalance = 0;
    const balanceHistory = [];
    combinedEvents.forEach((e) => {
      if (e.type === "trade") {
        cumulativeBalance += parseFloat(e.pnl) || 0;
      } else if (e.type === "deposit") {
        cumulativeBalance += parseFloat(e.amount) || 0;
      } else if (e.type === "withdrawal") {
        cumulativeBalance -= parseFloat(e.amount) || 0;
      }
      balanceHistory.push({
        name: formatDate(e.date),
        value: cumulativeBalance,
      });
    });

    let cumulativePnl = 0;
    const pnlHistory = [];
    allTradesForProfile
      .sort(
        (a, b) => new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime(),
      )
      .forEach((t) => {
        cumulativePnl += parseFloat(t.pnl) || 0;
        pnlHistory.push({
          name: formatDate(t.tradeDate),
          value: cumulativePnl,
        });
      });

    const periodFilteredData = () => {
      const sourceData = chartType === "balance" ? balanceHistory : pnlHistory;
      if (sourceData.length === 0) return [];
      if (activePeriod === "all") return sourceData;

      let startOfPeriod;
      let endOfPeriod = new Date();

      if (activePeriod === "custom") {
        if (!customStartDate || !customEndDate) return [];
        startOfPeriod = new Date(customStartDate);
        startOfPeriod.setHours(0, 0, 0, 0);
        endOfPeriod = new Date(customEndDate);
        endOfPeriod.setHours(23, 59, 59, 999);
      } else {
        const now = new Date();
        startOfPeriod = new Date(now);
        switch (activePeriod) {
          case "daily":
            startOfPeriod.setHours(0, 0, 0, 0);
            break;
          case "weekly":
            const d = now.getDay();
            startOfPeriod.setDate(now.getDate() - d + (d === 0 ? -6 : 1));
            startOfPeriod.setHours(0, 0, 0, 0);
            break;
          case "monthly":
            startOfPeriod.setDate(1);
            startOfPeriod.setHours(0, 0, 0, 0);
            break;
          case "yearly":
            startOfPeriod.setMonth(0, 1);
            startOfPeriod.setHours(0, 0, 0, 0);
            break;
          default:
            break;
        }
      }

      const lastDataBeforePeriod = [...sourceData]
        .reverse()
        .find((d) => new Date(d.name).getTime() < startOfPeriod.getTime());
      const baselineValue = lastDataBeforePeriod
        ? lastDataBeforePeriod.value
        : 0;

      const filteredData = sourceData.filter((d) => {
        const eventDate = new Date(d.name).getTime();
        if (activePeriod === "custom") {
          return (
            eventDate >= startOfPeriod.getTime() &&
            eventDate <= endOfPeriod.getTime()
          );
        }
        return eventDate >= startOfPeriod.getTime();
      });

      if (filteredData.length > 0) {
        if (
          new Date(filteredData[0].name).getTime() > startOfPeriod.getTime()
        ) {
          return [{ name: "Start", value: baselineValue }, ...filteredData];
        }
        return filteredData;
      }

      return [{ name: "Start", value: baselineValue }];
    };

    return { chartData: periodFilteredData() };
  }, [
    trades,
    balanceTransactions,
    activeProfile,
    activePeriod,
    chartType,
    customStartDate,
    customEndDate,
  ]);

  const currentBalance = useMemo(() => {
    if (!activeProfile) return 0;
    const cumulativePnl = trades.reduce(
      (sum, t) => sum + (parseFloat(t.pnl) || 0),
      0,
    );
    const cumulativeTransactions = balanceTransactions.reduce((sum, t) => {
      const amount = parseFloat(t.amount) || 0;
      return sum + (t.type === "deposit" ? amount : -amount);
    }, 0);
    return cumulativeTransactions + cumulativePnl;
  }, [trades, balanceTransactions, activeProfile]);

  const getPeriodLabel = () => {
    if (activePeriod === "custom") {
      const formattedStart = new Date(customStartDate).toLocaleDateString(
        "id-ID",
        { day: "numeric", month: "short" },
      );
      const formattedEnd = new Date(customEndDate).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      return `${formattedStart} - ${formattedEnd}`;
    }
    return periods.find((p) => p.key === activePeriod)?.label;
  };

  if (!isAuthReady || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-gray-900 dark:text-white">
        Memuat Autentikasi...
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} error={loginError} />;
  }

  if (isAuthReady && !isLoading && tradingProfiles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center text-gray-900 dark:text-white">
        {isProfileModalVisible && (
          <ProfileManagementModal
            showToast={showToast}
            onClose={() => {
              setIsProfileModalVisible(false);
              refreshProfiles();
            }}
            profiles={tradingProfiles}
            openDeleteModal={openDeleteModal}
          />
        )}
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "" })}
        />
        <h2 className="text-2xl font-bold mb-4">
          Selamat Datang, {user.email}!
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Untuk memulai, silakan buat profil trading pertama Anda.
        </p>
        <button
          onClick={() => setIsProfileModalVisible(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <PlusCircle size={20} className="mr-2" /> Buat Profil Trading
        </button>
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      <a
        href="https://www.instagram.com/deolukow_"
        target="_blank"
        rel="noopener noreferrer"
        className="block mb-4 hover:opacity-80 transition-opacity"
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Wz<span className="text-blue-500 dark:text-blue-400">Gold</span>{" "}
          Trading Jurnal
        </h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          created by Deo Lukow (2025)
        </p>
      </a>
      <div className="mb-4">
        <ProfileSelector
          profiles={tradingProfiles}
          activeProfile={activeProfile}
          onSelectProfile={handleSelectProfile}
          onManageProfiles={() => {
            setIsProfileModalVisible(true);
            setIsSidebarOpen(false);
          }}
        />
      </div>
      <button
        onClick={() => {
          setEditingTrade(null);
          setIsTradeFormVisible(true);
          setIsSidebarOpen(false);
        }}
        className="w-full px-4 py-3 mb-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg flex items-center justify-center text-sm font-semibold"
      >
        <PlusCircle size={18} className="mr-2" /> Tambah Trade
      </button>
      <nav className="flex-grow">
        <ul>
          <SidebarLink
            icon={<LayoutDashboard size={20} />}
            text="Dashboard"
            active={activeView === "dashboard"}
            onClick={() => {
              setActiveView("dashboard");
              setIsSidebarOpen(false);
            }}
          />
          <SidebarLink
            icon={<BookOpen size={20} />}
            text="Strategi"
            active={activeView === "strategy"}
            onClick={() => {
              setActiveView("strategy");
              setIsSidebarOpen(false);
            }}
          />
          <SidebarLink
            icon={<CalendarDays size={20} />}
            text="Kalender"
            active={activeView === "calendar"}
            onClick={() => {
              setActiveView("calendar");
              setIsSidebarOpen(false);
            }}
          />
          <SidebarLink
            icon={<ImageIcon size={20} />}
            text="Galeri Trade"
            active={activeView === "gallery"}
            onClick={() => {
              setActiveView("gallery");
              setActivePeriod("all");
              setIsSidebarOpen(false);
            }}
          />
        </ul>
        <ul className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <li className="px-3 pb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Alat Bantu
          </li>
          <li className="mb-2">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setIsGoalModalVisible(true);
                setIsSidebarOpen(false);
              }}
              className="flex items-center p-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
            >
              <TrendingUp
                size={20}
                className="text-yellow-500 dark:text-yellow-400"
              />
              <span className="ml-3">Tetapkan Target</span>
            </a>
          </li>
          <li className="mb-2">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setIsCalculatorVisible(true);
                setIsSidebarOpen(false);
              }}
              className="flex items-center p-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
            >
              <Calculator
                size={20}
                className="text-green-500 dark:text-green-400"
              />
              <span className="ml-3">Kalkulator Lot Size</span>
            </a>
          </li>
          <li className="mb-2">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setIsPairModalVisible(true);
                setIsSidebarOpen(false);
              }}
              className="flex items-center p-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
            >
              <Target
                size={20}
                className="text-yellow-500 dark:text-yellow-400"
              />
              <span className="ml-3">Kelola Pair</span>
            </a>
          </li>
          <li className="mb-2">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setIsTemplateModalVisible(true);
                setIsSidebarOpen(false);
              }}
              className="flex items-center p-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
            >
              <Zap size={20} className="text-blue-500 dark:text-blue-400" />
              <span className="ml-3">Kelola Template</span>
            </a>
          </li>
          <li className="mb-2">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setIsCustomFieldModalVisible(true);
                setIsSidebarOpen(false);
              }}
              className="flex items-center p-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
            >
              <ListPlus
                size={20}
                className="text-indigo-500 dark:text-indigo-400"
              />
              <span className="ml-3">Kelola Field Tambahan</span>
            </a>
          </li>
        </ul>
      </nav>
      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
        <div
          className="text-xs text-gray-400 dark:text-gray-500 mb-2 truncate"
          title={user.email}
        >
          Masuk sebagai: {user.email}
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center p-3 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20"
        >
          <LogOut size={20} />
          <span className="ml-3">Keluar</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-300 font-sans">
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "" })}
        />
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteItem}
          title="Konfirmasi Hapus"
          message={`Yakin ingin menghapus ${itemToDelete?.type} ini? Aksi ini tidak dapat dibatalkan.`}
        />

        {activeProfile && isTradeFormVisible && (
          <TradeForm
            onSaveTrade={handleSaveTrade}
            editingTrade={editingTrade}
            onCancelEdit={() => {
              setEditingTrade(null);
              setIsTradeFormVisible(false);
            }}
            pairs={pairs}
            templates={templates}
            customFields={customFields}
            activeProfileId={activeProfile.id}
            strategies={strategies}
          />
        )}
        {viewingTrade && (
          <TradeDetailModal
            trade={viewingTrade}
            onClose={() => setViewingTrade(null)}
            customFields={customFields}
            currency={activeProfile?.currency}
            activeProfileName={activeProfile?.name}
          />
        )}
        {showDashboardShareModal && (() => {
          const getPeriodDates = () => {
            let start = new Date();
            let end = new Date();

            const formatDateStr = (date) => {
              return date.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
              });
            };

            const parseDateLocal = (dateStr) => {
              if (!dateStr) return new Date();
              const parts = dateStr.split("-");
              if (parts.length === 3) {
                // Year, Month (0-indexed), Day
                return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
              }
              return new Date(dateStr);
            };

            if (activePeriod === "daily") {
              return { start: formatDateStr(start), end: formatDateStr(end) };
            } else if (activePeriod === "weekly") {
              const day = start.getDay();
              const diff = start.getDate() - day + (day === 0 ? -6 : 1);
              const monday = new Date(start.setDate(diff));
              const sunday = new Date(monday);
              sunday.setDate(monday.getDate() + 6);
              return { start: formatDateStr(monday), end: formatDateStr(sunday) };
            } else if (activePeriod === "monthly") {
              const firstDay = new Date(start.getFullYear(), start.getMonth(), 1);
              const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
              return { start: formatDateStr(firstDay), end: formatDateStr(lastDay) };
            } else if (activePeriod === "yearly") {
              const firstDay = new Date(selectedYear, 0, 1);
              const lastDay = new Date(selectedYear, 11, 31);
              return { start: formatDateStr(firstDay), end: formatDateStr(lastDay) };
            } else if (activePeriod === "custom") {
              const startD = parseDateLocal(customStartDate);
              const endD = parseDateLocal(customEndDate);
              return { start: formatDateStr(startD), end: formatDateStr(endD) };
            } else {
              if (trades.length > 0) {
                const sortedTrades = [...trades].sort((a, b) => new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime());
                const first = new Date(sortedTrades[0].tradeDate);
                const last = new Date(sortedTrades[sortedTrades.length - 1].tradeDate);
                return { start: formatDateStr(first), end: formatDateStr(last) };
              }
              return { start: formatDateStr(start), end: formatDateStr(end) };
            }
          };

          const pDates = getPeriodDates();

          return (
            <ShareCardModal
              trade={{
                isDashboard: true,
                pair: activeProfile?.name || "ALL PAIRS",
                type: (initialBalance > 0
                  ? (performanceStats.netPnl / initialBalance) * 100
                  : 0).toFixed(1) + "%",
                pnl: performanceStats.netPnl,
                startDate: pDates.start,
                endDate: pDates.end,
                tradeDate: new Date(),
              }}
              onClose={() => setShowDashboardShareModal(false)}
              currency={activeProfile?.currency}
              activeProfileName={activeProfile?.name}
            />
          );
        })()}
        {activeProfile && isCalculatorVisible && (
          <LotSizeCalculatorModal
            isOpen={isCalculatorVisible}
            onClose={() => setIsCalculatorVisible(false)}
            currentBalance={currentBalance}
            currency={activeProfile?.currency}
          />
        )}
        {activeProfile && isGoalModalVisible && (
          <GoalSettingModal
            activeProfileId={activeProfile.id}
            showToast={showToast}
            onClose={() => {
              setIsGoalModalVisible(false);
              refreshAllData(activeProfile.id);
            }}
            onRefresh={() => refreshAllData(activeProfile.id)}
            currentGoal={goalSettings}
            currency={activeProfile?.currency}
          />
        )}
        {activeProfile && isTransactionModalVisible && (
          <BalanceTransactionModal
            activeProfileId={activeProfile.id}
            showToast={showToast}
            onClose={() => {
              setIsTransactionModalVisible(false);
              refreshAllData(activeProfile.id);
            }}
            onRefresh={() => refreshAllData(activeProfile.id)}
            openDeleteModal={openDeleteModal}
            currency={activeProfile?.currency}
          />
        )}
        {activeProfile && isPairModalVisible && (
          <PairManagementModal
            activeProfileId={activeProfile.id}
            showToast={showToast}
            onClose={() => {
              setIsPairModalVisible(false);
              refreshAllData(activeProfile.id);
            }}
            onRefresh={() => refreshAllData(activeProfile.id)}
            pairs={pairs}
            openDeleteModal={openDeleteModal}
          />
        )}
        {activeProfile && isTemplateModalVisible && (
          <TemplateManagementModal
            activeProfileId={activeProfile.id}
            showToast={showToast}
            onClose={() => {
              setIsTemplateModalVisible(false);
              refreshAllData(activeProfile.id);
            }}
            onRefresh={() => refreshAllData(activeProfile.id)}
            templates={templates}
            customFields={customFields}
            strategies={strategies}
            openDeleteModal={openDeleteModal}
          />
        )}
        {activeProfile && isCustomFieldModalVisible && (
          <CustomFieldManagementModal
            activeProfileId={activeProfile.id}
            showToast={showToast}
            onClose={() => {
              setIsCustomFieldModalVisible(false);
              refreshAllData(activeProfile.id);
            }}
            onRefresh={() => refreshAllData(activeProfile.id)}
            customFields={customFields}
            openDeleteModal={openDeleteModal}
          />
        )}
        {isProfileModalVisible && (
          <ProfileManagementModal
            showToast={showToast}
            onClose={() => {
              setIsProfileModalVisible(false);
              refreshProfiles();
            }}
            profiles={tradingProfiles}
            openDeleteModal={openDeleteModal}
          />
        )}

        {isSidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-75 z-40 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            ></div>
            <aside className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 p-4 z-50 flex flex-col md:hidden animate-slideIn overflow-y-auto">
              <SidebarContent />
            </aside>
          </>
        )}

        <aside className="w-64 bg-white dark:bg-gray-800 p-4 flex-shrink-0 flex-col hidden md:flex overflow-y-auto">
          <SidebarContent />
        </aside>

        <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
              <button
                className="md:hidden text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu size={28} />
              </button>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
                {activeView === "dashboard"
                  ? "Dashboard"
                  : activeView === "strategy"
                    ? "Strategi"
                    : activeView === "calendar"
                      ? "Kalender Trade"
                      : "Galeri Trade"}
              </h2>
            </div>
            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              {activeView === "dashboard" && (
                <button
                  onClick={() => setShowDashboardShareModal(true)}
                  className="p-3 bg-white dark:bg-gray-800 text-violet-500 hover:text-white hover:bg-violet-600 dark:hover:bg-violet-600 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(139,92,246,0.35)] active:scale-95"
                  title="Bagikan Performa Dashboard"
                >
                  <Share2 size={18} />
                </button>
              )}
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center border border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Saldo Saat Ini
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(currentBalance, activeProfile?.currency)}
                </div>
              </div>
              <button
                onClick={() => setIsTransactionModalVisible(true)}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg flex items-center text-sm font-semibold"
              >
                <Wallet size={16} className="mr-2" /> Kelola Saldo
              </button>
            </div>
          </header>

          <div className="flex-grow">
            {activeView === "dashboard" && (
              <>
                <div className="flex space-x-1 sm:space-x-2 p-1 bg-gray-200 dark:bg-gray-800 rounded-xl mb-6">
                  {periods.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setActivePeriod(p.key)}
                      className={classNames(
                        "px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors flex-grow",
                        activePeriod === p.key
                          ? "bg-blue-600 text-white shadow-lg"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {activePeriod === "custom" && (
                  <DateRangePicker
                    startDate={customStartDate}
                    endDate={customEndDate}
                    onStartDateChange={setCustomStartDate}
                    onEndDateChange={setCustomEndDate}
                  />
                )}
                {activePeriod === "yearly" && (
                  <YearSelector
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                  />
                )}

                <GoalProgress
                  goal={goalSettings}
                  currentPnl={performanceStats.netPnl}
                  period={activePeriod}
                  currency={activeProfile?.currency}
                />
                {activePeriod === "daily" && (
                  <DailyGoalProgress
                    goal={goalSettings}
                    currentPnl={performanceStats.netPnl}
                    currency={activeProfile?.currency}
                  />
                )}
                <StatisticsDashboard
                  stats={performanceStats}
                  currency={activeProfile?.currency}
                />

                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg mb-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-0">
                      {chartType === "balance"
                        ? "Grafik Saldo Akun"
                        : "Grafik P&L Kumulatif"}
                    </h3>
                    <div className="flex space-x-1 p-1 bg-gray-200 dark:bg-gray-700/50 rounded-lg">
                      <button
                        onClick={() => setChartType("balance")}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${chartType === "balance"
                          ? "bg-blue-600 text-white shadow"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                          }`}
                      >
                        Grafik Saldo
                      </button>
                      <button
                        onClick={() => setChartType("pnl")}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${chartType === "pnl"
                          ? "bg-blue-600 text-white shadow"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                          }`}
                      >
                        Grafik P&L
                      </button>
                    </div>
                  </div>
                  <div className="h-80">
                    <AccountBalanceChart
                      data={accountStats.chartData}
                      period={activePeriod}
                      currency={activeProfile?.currency}
                      chartType={chartType}
                    />
                  </div>
                </div>

                {/* --- TABEL PERFORMA FIELD BARU --- */}
                <FieldPerformanceTable
                  trades={filteredTrades}
                  customFields={customFields}
                />

                {activePeriod === "yearly" ? (
                  <YearlySummary
                    trades={filteredTrades}
                    currency={activeProfile?.currency}
                    year={selectedYear}
                  />
                ) : (
                  <TradeList
                    trades={sortedTrades}
                    onView={handleShowTradeDetail}
                    onEdit={(t) => {
                      setEditingTrade(t);
                      setIsTradeFormVisible(true);
                    }}
                    onDelete={(type, data) => openDeleteModal(type, data)}
                    title={`Riwayat Trade (${getPeriodLabel()})`}
                    requestSort={requestSort}
                    sortConfig={sortConfig}
                    customFields={customFields}
                    currency={activeProfile?.currency}
                  />
                )}
              </>
            )}

            {activeView === "strategy" && activeProfile && (
              <StrategyPage
                activeProfileId={activeProfile.id}
                showToast={showToast}
                openDeleteModal={openDeleteModal}
                strategies={strategies}
                onRefresh={() => refreshAllData(activeProfile.id)}
              />
            )}

            {activeView === "calendar" && (
              <CalendarView
                trades={trades}
                onView={handleShowTradeDetail}
                onEdit={(t) => {
                  setEditingTrade(t);
                  setIsTradeFormVisible(true);
                }}
                onDelete={(type, data) => openDeleteModal(type, data)}
                customFields={customFields}
                currency={activeProfile?.currency}
              />
            )}
            {activeView === "gallery" && (
              <GalleryView
                trades={filteredTrades}
                activePeriod={activePeriod}
                setActivePeriod={setActivePeriod}
                periods={periods}
                onShowTradeDetail={handleShowTradeDetail}
                currency={activeProfile?.currency}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                setCustomStartDate={setCustomStartDate}
                setCustomEndDate={setCustomEndDate}
              />
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default App;
