import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'; // Re-added Firestore
import { ArrowUpRight, ArrowDownRight, Edit3, Trash2, PlusCircle, AlertTriangle, CheckCircle, XCircle, Save, Wallet, BarChartHorizontal, LayoutDashboard, DollarSign, Target, Divide, CalendarDays, Ratio, ExternalLink, Camera, Image, ChevronLeft, ChevronRight, Hash, Copy, Zap, Info, Clock, Maximize2, Calculator, TrendingUp, Users, ChevronDown, UploadCloud, ListPlus, Menu, Sun, Moon, LogOut, LogIn, Eye, EyeOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, Bar } from 'recharts';


// Firebase Configuration (Now includes Firestore)
const firebaseConfig = {
  apiKey: "AIzaSyB_YYYPlskKtC_LEed63_ZGlSJeA_1UhuI",
  authDomain: "trading-jurnal-deo.firebaseapp.com",
  projectId: "trading-jurnal-deo",
  storageBucket: "trading-jurnal-deo.firebasestorage.app",
  messagingSenderId: "1085442544675",
  appId: "1:1085442544675:web:2bad6464f7be4673de8d96",
  measurementId: "G-NR89QZDXEE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore
const appId = typeof __app_id !== 'undefined' ? __app_id : 'trading-journal-kazekage20-v14.0';

// --- IndexedDB HELPER FUNCTIONS for ALL Local Storage ---
const DB_NAME = 'WzGoldTradingJournalDB';
const DB_VERSION = 1;
let dbInstance = null;

const ALL_STORES = [
    'profiles', 
    'trades', 
    'balance_transactions', 
    'pairs', 
    'templates', 
    'custom_fields', 
    'goals',
    'trade_images'
];

const initDB = () => {
  
    return new Promise((resolve, reject) => {
        if (dbInstance) return resolve(dbInstance);
        
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            ALL_STORES.forEach(storeName => {
                if (!db.objectStoreNames.contains(storeName)) {
                    const store = db.createObjectStore(storeName, { keyPath: 'id' });
                    if (['trades', 'balance_transactions', 'pairs', 'templates', 'custom_fields', 'goals'].includes(storeName)) {
                        store.createIndex('profileId', 'profileId', { unique: false });
                    }
                }
            });
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            resolve(dbInstance);
        };

        request.onerror = (event) => {
            console.error("IndexedDB error:", event.target.errorCode);
            reject("IndexedDB error");
        };
    });
};

const dbAction = (storeName, mode, action) => {
    return initDB().then(db => new Promise((resolve, reject) => {
        try {
            const transaction = db.transaction(storeName, mode);
            const store = transaction.objectStore(storeName);
            action(store, resolve, reject);
        } catch (error) {
            reject(error);
        }
    }));
};

const addItem = (storeName, item) => dbAction(storeName, 'readwrite', (store, resolve) => {
    const request = store.add(item);
    request.onsuccess = () => resolve(request.result);
});

const updateItem = (storeName, item) => dbAction(storeName, 'readwrite', (store, resolve) => {
    const request = store.put(item);
    request.onsuccess = () => resolve(request.result);
});

const deleteItem = (storeName, id) => dbAction(storeName, 'readwrite', (store, resolve) => {
    store.delete(id).onsuccess = () => resolve(true);
});

const getItem = (storeName, id) => dbAction(storeName, 'readonly', (store, resolve) => {
    store.get(id).onsuccess = (e) => resolve(e.target.result);
});

const getAllItems = (storeName) => dbAction(storeName, 'readonly', (store, resolve) => {
    store.getAll().onsuccess = (e) => resolve(e.target.result);
});

const getItemsByProfileId = (storeName, profileId) => dbAction(storeName, 'readonly', (store, resolve) => {
    const index = store.index('profileId');
    index.getAll(profileId).onsuccess = (e) => resolve(e.target.result);
});

// --- HELPER FUNCTION to generate a unique device fingerprint ---
const generateDeviceFingerprint = async () => {
    const components = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        timezone: new Date().getTimezoneOffset(),
        platform: navigator.platform,
    };
    const json = JSON.stringify(components);
    // Use Web Crypto API to create a consistent and secure hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(json));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
};

// --- Custom Hook to load local images ---
const useLocalImage = (imageId) => {
    const [imageUrl, setImageUrl] = useState(null);

    useEffect(() => {
        let objectUrl = null;
        if (imageId) {
            getItem('trade_images', imageId)
                .then(imageRecord => {
                    if (imageRecord && imageRecord.file) {
                        objectUrl = URL.createObjectURL(imageRecord.file);
                        setImageUrl(objectUrl);
                    } else {
                        setImageUrl(null);
                    }
                })
                .catch(err => {
                    console.error("Failed to load image from DB", err);
                    setImageUrl(null);
                });
        } else {
            setImageUrl(null);
        }

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [imageId]);

    return imageUrl;
};


// --- HELPER FUNCTIONS ---
const formatDate = (date) => { if (!date) return 'N/A'; const d = date instanceof Date ? date : new Date(date); return d.toLocaleDateString('en-CA'); }; // YYYY-MM-DD
const formatDateTime = (timestamp) => { if (!timestamp) return 'N/A'; const d = timestamp instanceof Date ? timestamp : new Date(timestamp); if (isNaN(d.getTime())) return 'Invalid Date'; return d.toLocaleString('id-ID', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };
const toDateTimeLocalInput = (date) => { if (!date) return ''; const d = date instanceof Date ? date : new Date(date); if (isNaN(d.getTime())) return ''; const pad = (num) => (num < 10 ? '0' : '') + num; return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const formatCurrency = (value, currency = 'USD') => {
    const locale = currency === 'IDR' ? 'id-ID' : 'en-US';
    const options = {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: currency === 'IDR' ? 0 : 2,
        maximumFractionDigits: currency === 'IDR' ? 0 : 2,
    };
    if (typeof value !== 'number' || isNaN(value)) {
        return new Intl.NumberFormat(locale, options).format(0);
    }
    return new Intl.NumberFormat(locale, options).format(value);
};
const formatLotSize = (value) => { if (typeof value !== 'number') return '0.00 LOT'; return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} LOT`; };
const classNames = (...classes) => classes.filter(Boolean).join(' ');


// --- REUSABLE UI COMPONENTS ---
const Toast = ({ message, type, onClose }) => {
    if (!message) return null;
    let style;
    switch (type) {
        case 'success':
            style = { bg: 'bg-green-600', icon: <CheckCircle /> };
            break;
        case 'error':
            style = { bg: 'bg-red-600', icon: <AlertTriangle /> };
            break;
        case 'info':
            style = { bg: 'bg-blue-600', icon: <Info /> };
            break;
        default:
            style = { bg: 'bg-gray-700', icon: <Info /> };
            break;
    }
    return (<div className={`fixed top-5 right-5 ${style.bg} text-white p-4 rounded-lg shadow-xl flex items-center z-[100] animate-fadeIn`}><div className="mr-3">{style.icon}</div><span>{message}</span><button onClick={onClose} className="ml-4 text-2xl font-semibold leading-none hover:text-gray-200">&times;</button></div>);
};
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => { if (!isOpen) return null; return (<div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[90] p-4 animate-fadeIn"><div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-md w-full"><h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{title}</h3><p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{message}</p><div className="flex justify-end space-x-3"><button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Batal</button><button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Konfirmasi</button></div></div></div>);};
const SidebarLink = ({ icon, text, active, onClick }) => (<li className={`mb-2`}><a href="#" onClick={onClick} className={`flex items-center p-3 rounded-lg transition-colors ${active ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}>{icon}<span className="ml-3">{text}</span></a></li>);


// --- THEME SWITCHER COMPONENT ---
const ThemeSwitcher = ({ theme, onToggle }) => {
    return (
        <button
            onClick={onToggle}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            title={`Ganti ke mode ${theme === 'dark' ? 'terang' : 'gelap'}`}
        >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
};


// --- LOGIN PAGE COMPONENT ---
const LoginPage = ({ onLogin, error, theme, onToggleTheme }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        await onLogin(email, password);
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center font-sans relative">
            <div className="absolute top-5 right-5">
                <ThemeSwitcher theme={theme} onToggle={onToggleTheme} />
            </div>
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Wz<span className="text-blue-500 dark:text-blue-400">Gold</span> Trading Jurnal
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Silakan masuk untuk melanjutkan</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Alamat email"
                            />
                        </div>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={isPasswordVisible ? 'text' : 'password'}
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Kata sandi"
                            />
                            <button
                                type="button"
                                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                title={isPasswordVisible ? "Sembunyikan password" : "Tampilkan password"}
                            >
                                {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center text-sm text-red-500 dark:text-red-400 bg-red-500/10 p-3 rounded-lg">
                            <AlertTriangle size={16} className="mr-2" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 dark:disabled:bg-blue-800 disabled:cursor-not-allowed"
                        >
                             {isLoading ? (
                                <>
                                    <span className="animate-spin h-5 w-5 mr-3 border-2 border-white border-t-transparent rounded-full"></span>
                                    <span>Memproses...</span>
                                </>
                            ) : (
                                 <>
                                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                        <LogIn className="h-5 w-5 text-blue-500 group-hover:text-blue-400" aria-hidden="true" />
                                    </span>
                                    Masuk
                                </>
                            )}
                        </button>
                    </div>
                </form>
                 <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                    Tidak punya akun? Hubungi administrator untuk mendapatkan kredensial login.
                </p>
            </div>
        </div>
    );
};


// --- FULLSCREEN IMAGE MODAL ---
const FullscreenImageModal = ({ imageUrl, onClose }) => { if (!imageUrl) return null; return (<div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[100] p-4 animate-fadeIn"><button onClick={onClose} className="absolute top-4 right-4 text-white text-4xl font-light z-[101] p-3 rounded-full hover:bg-gray-800 transition-colors" title="Tutup (Esc)">&times;</button><div className="w-full h-full flex items-center justify-center"><img src={imageUrl} alt="Fullscreen Trade Screenshot" className="max-w-full max-h-full object-contain" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/1200x800/374151/ffffff?text=Image+Gagal+Load"; }}/></div></div>); };


// --- TRADE DETAIL MODAL ---
const TradeDetailModal = ({ trade, onClose, customFields, currency }) => {
    const [fullscreenImage, setFullscreenImage] = useState(null);
    if (!trade) return null;

    const ImageCard = ({ title, imageId, icon }) => {
        const imageUrl = useLocalImage(imageId);
        return (<div className="flex-1 min-w-0"><h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center">{icon} <span className="ml-1">{title}</span></h3>{imageUrl ? (<div className="relative aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 cursor-pointer group" onClick={() => setFullscreenImage(imageUrl)}><img src={imageUrl} alt={title} className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-80" /><div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity"><Maximize2 size={32} className="text-white"/></div></div>) : (<div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 text-center text-sm p-4">Tidak Ada Gambar</div>)}</div>);
    };

    const isWin = trade.pnl > 0; const pnlColor = isWin ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'; const typeIcon = trade.type === 'long' ? <ArrowUpRight size={20} className="text-green-500" /> : <ArrowDownRight size={20} className="text-red-500" />;
    
    const filledCustomFields = customFields.filter(field => trade.customData && trade.customData[field.name]);

    return (<><FullscreenImageModal imageUrl={fullscreenImage} onClose={() => setFullscreenImage(null)} /><div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn"><div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"><div className="flex justify-between items-start mb-6 border-b border-gray-200 dark:border-gray-700 pb-4"><h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">{typeIcon} <span className="ml-2">{trade.pair}</span></h2><button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-3xl font-light">&times;</button></div><div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="space-y-4 lg:col-span-1"><div className="flex items-center space-x-4 border-b border-gray-200 dark:border-gray-700 pb-2"><Clock size={20} className="text-gray-400 dark:text-gray-500" /><span className="text-lg text-gray-700 dark:text-gray-300 font-medium">{formatDateTime(trade.tradeDate)}</span></div><div className="grid grid-cols-2 gap-3"><div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg"><p className="text-sm text-gray-500 dark:text-gray-400">P&L</p><p className={`text-2xl font-extrabold ${pnlColor}`}>{formatCurrency(trade.pnl, currency)}</p></div><div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg"><p className="text-sm text-gray-500 dark:text-gray-400">Lot Size</p><p className="text-xl font-bold text-gray-900 dark:text-white">{formatLotSize(trade.lotSize)}</p></div></div><div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg"><p className="text-sm text-gray-500 dark:text-gray-400">Risk/Reward Ratio</p><p className="text-xl font-bold text-gray-900 dark:text-white">{trade.riskRewardRatio > 0 ? `1 : ${trade.riskRewardRatio.toFixed(2)}` : 'N/A'}</p></div><div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg"><p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Setup / Strategi</p><p className="text-gray-800 dark:text-white font-medium">{trade.setup || 'Tidak Ada Setup Dicatat'}</p></div> {(trade.entryPrice > 0 || trade.takeProfit > 0 || trade.stopLoss > 0) && (<div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg space-y-2"><h4 className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-semibold">Detail Harga</h4><div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Entry Price:</span><span className="text-gray-800 dark:text-white font-medium">{trade.entryPrice > 0 ? trade.entryPrice.toLocaleString() : 'N/A'}</span></div><div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Take Profit:</span><span className="text-green-600 dark:text-green-400 font-medium">{trade.takeProfit > 0 ? trade.takeProfit.toLocaleString() : 'N/A'}</span></div><div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Stop Loss:</span><span className="text-red-600 dark:text-red-400 font-medium">{trade.stopLoss > 0 ? trade.stopLoss.toLocaleString() : 'N/A'}</span></div></div>)} {filledCustomFields.length > 0 && (<div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg space-y-2"><h4 className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-semibold border-b border-gray-300 dark:border-gray-600 pb-2">Field Tambahan</h4>{filledCustomFields.map(field => (<div key={field.id} className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400 capitalize">{field.name}:</span><span className="text-gray-800 dark:text-white font-medium text-right">{trade.customData[field.name]}</span></div>))}</div>)} </div><div className="lg:col-span-2 space-y-6"><div className="flex flex-col sm:flex-row gap-4"><ImageCard title="Screenshot Sebelum Trade" imageId={trade.screenshotBeforeId} icon={<Camera size={18} className="text-blue-500 dark:text-blue-400"/>}/><ImageCard title="Screenshot Sesudah Trade" imageId={trade.screenshotAfterId} icon={<Image size={18} className="text-green-500 dark:text-green-400"/>}/></div><div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg"><p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Catatan Trade</p><p className="text-gray-800 dark:text-white text-sm whitespace-pre-wrap">{trade.notes || 'Tidak ada catatan.'}</p></div></div></div><div className="flex justify-end mt-6 border-t border-gray-200 dark:border-gray-700 pt-4"><button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Tutup</button></div></div></div></>);
};

// --- LOT SIZE CALCULATOR MODAL ---
const LotSizeCalculatorModal = ({ isOpen, onClose, currentBalance, currency }) => {
    const [balance, setBalance] = useState(''); const [riskPercent, setRiskPercent] = useState('1'); const [stopLossPips, setStopLossPips] = useState('20'); const [pipValue, setPipValue] = useState('1'); const [toastMessage, setToastMessage] = useState('');
    useEffect(() => { if (isOpen && currentBalance) { setBalance(currentBalance.toFixed(2)); } }, [isOpen, currentBalance]);
    const calculation = useMemo(() => { const numBalance = parseFloat(balance); const numRiskPercent = parseFloat(riskPercent); const numStopLossPips = parseFloat(stopLossPips); const numPipValue = parseFloat(pipValue); if (isNaN(numBalance) || isNaN(numRiskPercent) || isNaN(numStopLossPips) || isNaN(numPipValue) || numBalance <= 0 || numStopLossPips <= 0 || numPipValue <= 0) { return { riskAmount: 0, lotSize: 0, isValid: false }; } const riskAmount = numBalance * (numRiskPercent / 100); const totalStopLossValue = numStopLossPips * numPipValue; const lotSize = totalStopLossValue > 0 ? riskAmount / totalStopLossValue : 0; return { riskAmount, lotSize, isValid: true }; }, [balance, riskPercent, stopLossPips, pipValue]);
    const handleCopyToClipboard = () => { if (calculation.isValid && calculation.lotSize > 0) { const lotSizeToCopy = calculation.lotSize.toFixed(2); navigator.clipboard.writeText(lotSizeToCopy).then(() => { setToastMessage('Lot Size disalin!'); setTimeout(() => setToastMessage(''), 2000); }).catch(err => { console.error('Failed to copy: ', err); try { const textArea = document.createElement("textarea"); textArea.value = lotSizeToCopy; textArea.style.position = "fixed"; textArea.style.left = "-9999px"; document.body.appendChild(textArea); textArea.focus(); textArea.select(); document.execCommand('copy'); document.body.removeChild(textArea); setToastMessage('Lot Size disalin!'); setTimeout(() => setToastMessage(''), 2000); } catch (e) { setToastMessage('Gagal menyalin.'); setTimeout(() => setToastMessage(''), 2000); } }); } };
    if (!isOpen) return null;
    return (<div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4 animate-fadeIn"><div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md relative">{toastMessage && (<div className="absolute top-4 right-4 bg-green-600 text-white text-xs px-3 py-1 rounded-full animate-fadeIn z-10">{toastMessage}</div>)}<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center"><Calculator size={24} className="mr-2 text-blue-500 dark:text-blue-400"/> Kalkulator Lot Size</h2><div className="space-y-4"><div><label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Saldo Akun ({currency})</label><input type="number" step="any" value={balance} onChange={e => setBalance(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded" /></div><div><label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Risiko per Trade (%)</label><input type="number" step="any" value={riskPercent} onChange={e => setRiskPercent(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded" /></div><div><label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Jarak Stop Loss (Poin/Pips)</label><input type="number" step="any" value={stopLossPips} onChange={e => setStopLossPips(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded" /></div><div><label className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Nilai per Poin/Pip per Lot ({currency})<Info size={14} className="ml-1 text-gray-400 dark:text-gray-500 cursor-help" title="Nilai profit/loss dalam Dolar jika harga bergerak 1 poin/pip dengan ukuran 1.00 Lot. Contoh: XAU/USD = $1, EUR/USD = $10."/></label><input type="number" step="any" value={pipValue} onChange={e => setPipValue(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded" /></div></div><div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3"><div className="flex justify-between items-center text-lg"><span className="text-gray-600 dark:text-gray-400">Risiko Maksimal:</span><span className="font-bold text-red-500 dark:text-red-400">{formatCurrency(calculation.riskAmount, currency)}</span></div><div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg text-center"><p className="text-sm text-gray-600 dark:text-gray-400">Rekomendasi Lot Size</p><div className="flex items-center justify-center mt-1"><p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{calculation.isValid ? calculation.lotSize.toFixed(2) : '0.00'}</p><button onClick={handleCopyToClipboard} className="ml-3 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors" title="Salin Lot Size"><Copy size={20} /></button></div></div></div><div className="flex justify-end mt-6"><button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Tutup</button></div></div></div>);
};

// --- GOAL SETTING MODAL ---
const GoalSettingModal = ({ activeProfileId, showToast, onClose, currentGoal, currency }) => {
    const [goalType, setGoalType] = useState('weekly');
    const [goalAmount, setGoalAmount] = useState('');
    const [dailyProfitTarget, setDailyProfitTarget] = useState('');
    const [dailyLossTarget, setDailyLossTarget] = useState('');

    useEffect(() => {
        if (currentGoal) {
            setGoalType(currentGoal.type || 'weekly');
            setGoalAmount(currentGoal.amount || '');
            setDailyProfitTarget(currentGoal.dailyProfitTarget || '');
            setDailyLossTarget(currentGoal.dailyLossTarget || '');
        } else {
            setGoalType('weekly');
            setGoalAmount('');
            setDailyProfitTarget('');
            setDailyLossTarget('');
        }
    }, [currentGoal]);

    const handleSave = async () => {
        const amount = parseFloat(goalAmount) || 0;
        const dailyProfit = parseFloat(dailyProfitTarget) || 0;
        const dailyLoss = parseFloat(dailyLossTarget) || 0;

        if (amount < 0 || dailyProfit < 0 || dailyLoss < 0) {
            showToast("Target tidak boleh angka negatif.", "error");
            return;
        }
        if (amount === 0 && dailyProfit === 0 && dailyLoss === 0) {
            showToast("Mohon isi setidaknya satu target.", "info");
            return;
        }

        const goalData = {
            id: activeProfileId,
            profileId: activeProfileId,
            type: goalType,
            amount: amount,
            dailyProfitTarget: dailyProfit,
            dailyLossTarget: dailyLoss,
            updatedAt: new Date()
        };
        try {
            await updateItem('goals', goalData);
            showToast("Target berhasil disimpan!", "success");
            onClose();
        } catch (error) {
            console.error("Error saving goal:", error);
            showToast("Gagal menyimpan target.", "error");
        }
    };

    const handleDelete = async () => {
        try {
            await deleteItem('goals', activeProfileId);
            showToast("Target berhasil dihapus.", "success");
            setGoalAmount('');
            setDailyProfitTarget('');
            setDailyLossTarget('');
            onClose();
        } catch (error) {
            console.error("Error deleting goal:", error);
            showToast("Gagal menghapus target.", "error");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                    <TrendingUp size={24} className="mr-2 text-yellow-400"/> Tetapkan Target
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Target harian hanya tampil di periode 'Harian'. Target mingguan/bulanan tampil di periode masing-masing.</p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Target Mingguan/Bulanan</label>
                        <div className="flex space-x-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
                            <button onClick={() => setGoalType('weekly')} className={`flex-1 py-2 text-sm rounded-md transition-colors ${goalType === 'weekly' ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Mingguan</button>
                            <button onClick={() => setGoalType('monthly')} className={`flex-1 py-2 text-sm rounded-md transition-colors ${goalType === 'monthly' ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Bulanan</button>
                        </div>
                        <input id="goalAmount" type="number" step="any" value={goalAmount} onChange={e => setGoalAmount(e.target.value)} placeholder={`Jumlah Target ${goalType === 'weekly' ? 'Mingguan' : 'Bulanan'}`} className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded mt-2"/>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                         <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Target Harian</label>
                         <div className="grid grid-cols-2 gap-3">
                            <input id="dailyProfitTarget" type="number" step="any" value={dailyProfitTarget} onChange={e => setDailyProfitTarget(e.target.value)} placeholder={`Profit Harian (${currency})`} className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"/>
                             <input id="dailyLossTarget" type="number" step="any" value={dailyLossTarget} onChange={e => setDailyLossTarget(e.target.value)} placeholder={`Batas Loss Harian (${currency})`} className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"/>
                         </div>
                    </div>
                </div>
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-3">
                        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"><Save size={18} className="inline mr-1" /> Simpan</button>
                        {currentGoal && (currentGoal.amount > 0 || currentGoal.dailyProfitTarget > 0 || currentGoal.dailyLossTarget > 0) && (
                            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"><Trash2 size={18} className="inline mr-1" /> Hapus</button>
                        )}
                    </div>
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Tutup</button>
                </div>
            </div>
        </div>
    );
};

// --- NEW PROFILE MANAGEMENT MODAL ---
const ProfileManagementModal = ({ showToast, onClose, profiles, openDeleteModal }) => {
    const [profileName, setProfileName] = useState('');
    const [profileDesc, setProfileDesc] = useState('');
    const [currency, setCurrency] = useState('USD');

    const handleAddProfile = async (e) => {
        e.preventDefault();
        const name = profileName.trim();
        const description = profileDesc.trim();

        if (!name) {
            showToast("Nama profil tidak boleh kosong.", "error");
            return;
        }

        try {
            const newProfile = {
                id: crypto.randomUUID(),
                name,
                description,
                currency,
                createdAt: new Date()
            };
            await addItem('profiles', newProfile);
            showToast(`Profil '${name}' berhasil ditambahkan.`, "success");
            onClose(); // Automatically close modal on success
        } catch (error) {
            console.error("Error adding profile:", error);
            showToast("Gagal menambah profil.", "error");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Users size={24} className="mr-2 text-blue-500 dark:text-blue-400" /> Kelola Profil Trading
                    </h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-3xl font-light">&times;</button>
                </div>

                <form onSubmit={handleAddProfile} className="flex-shrink-0 mb-6 p-4 bg-gray-100/50 dark:bg-gray-700/50 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Tambah Profil Baru</h3>
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="Nama Profil (e.g., Akun Pro)"
                            value={profileName}
                            onChange={e => setProfileName(e.target.value)}
                            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
                            required
                        />
                        <textarea
                            placeholder="Deskripsi (e.g., Akun di broker XM, leverage 1:500)"
                            value={profileDesc}
                            onChange={e => setProfileDesc(e.target.value)}
                            rows="2"
                            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
                        />
                         <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded">
                            <option value="USD">USD ($)</option>
                            <option value="IDR">IDR (Rp)</option>
                        </select>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <PlusCircle size={18} className="inline mr-1" /> Tambah Profil
                        </button>
                    </div>
                </form>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex-shrink-0">Daftar Profil ({profiles.length})</h3>
                <div className="overflow-y-auto flex-grow space-y-2 pr-2">
                    {profiles.map(p => (
                        <div key={p.id} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{p.name} <span className="text-xs font-normal text-gray-500 dark:text-gray-400">({p.currency})</span></p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{p.description || 'Tidak ada deskripsi'}</p>
                            </div>
                            <button onClick={() => openDeleteModal('profile', p)} className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors" title={`Hapus Profil ${p.name}`}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end mt-6 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Tutup</button>
                </div>
            </div>
        </div>
    );
};


// --- CUSTOM FIELD MANAGEMENT MODAL ---
const CustomFieldManagementModal = ({ activeProfileId, showToast, onClose, customFields, openDeleteModal }) => {
    const [newFieldName, setNewFieldName] = useState('');

    const handleAddField = async (e) => {
        e.preventDefault();
        const fieldName = newFieldName.trim();
        if (!fieldName) {
            showToast("Nama field tidak boleh kosong.", "error");
            return;
        }
        if (customFields.some(f => f.name.toLowerCase() === fieldName.toLowerCase())) {
            showToast(`Field '${fieldName}' sudah ada.`, "error");
            setNewFieldName('');
            return;
        }
        try {
            const newField = {
                id: crypto.randomUUID(),
                profileId: activeProfileId,
                name: fieldName,
                createdAt: new Date(),
            };
            await addItem('custom_fields', newField);
            showToast(`Field '${fieldName}' berhasil ditambahkan.`, "success");
            setNewFieldName('');
        } catch (error) {
            showToast("Gagal menambah field.", "error");
            console.error("Error adding custom field:", error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                        <ListPlus size={24} className="mr-2 text-green-500 dark:text-green-400" /> Kelola Field Tambahan
                    </h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-3xl font-light">&times;</button>
                </div>

                <form onSubmit={handleAddField} className="flex-shrink-0 mb-6 flex space-x-2">
                    <input
                        type="text"
                        placeholder="Nama Field Baru (e.g., Sesi)"
                        value={newFieldName}
                        onChange={e => setNewFieldName(e.target.value)}
                        className="flex-grow bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
                        required
                    />
                    <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        Tambah
                    </button>
                </form>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex-shrink-0">Daftar Field ({customFields.length})</h3>
                <div className="overflow-y-auto flex-grow space-y-2 pr-2">
                    {customFields.length === 0 ? (
                        <p className="text-gray-500 text-sm p-4 text-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                            Anda belum menambahkan field tambahan.
                        </p>
                    ) : (
                        customFields.map(f => (
                            <div key={f.id} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                                <span className="font-semibold text-gray-900 dark:text-white">{f.name}</span>
                                <button
                                    onClick={() => openDeleteModal('custom_field', f)}
                                    className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                                    title={`Hapus Field ${f.name}`}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
                <div className="flex justify-end mt-6 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Tutup</button>
                </div>
            </div>
        </div>
    );
};


// --- GALLERY VIEW COMPONENT ---
const GalleryView = ({ trades, activePeriod, setActivePeriod, periods, onShowTradeDetail, currency }) => {
    
    const GalleryImage = ({ trade }) => {
        const imageUrl = useLocalImage(trade.screenshotAfterId);
        const isWin = trade.pnl > 0;
        const pnlColor = isWin ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400';

        if (!imageUrl) {
             return (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 relative aspect-video flex flex-col justify-between p-3">
                    <div>
                         <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex justify-between items-center">{trade.pair}</h3>
                         <p className="text-xs text-gray-400 dark:text-gray-500">Memuat gambar...</p>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                        <div><p className="text-xs text-gray-500 dark:text-gray-400">P&L</p><p className={`text-lg font-bold ${pnlColor}`}>{formatCurrency(trade.pnl, currency)}</p></div>
                        <div className="text-right"><p className="text-xs text-gray-500 dark:text-gray-400">R:R</p><p className="text-sm text-gray-700 dark:text-gray-300">{trade.riskRewardRatio > 0 ? `${trade.riskRewardRatio.toFixed(2)}R` : 'N/A'}</p></div>
                    </div>
                </div>
             );
        }
        
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] border border-gray-200 dark:border-gray-700 relative group" onClick={() => onShowTradeDetail(trade)}>
                <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img src={imageUrl} alt={`Trade ${trade.pair}`} className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-80" />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-white bg-blue-600 p-3 rounded-full hover:bg-blue-700"><Info size={24} /></button>
                    </div>
                </div>
                <div className="p-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex justify-between items-center">
                        {trade.pair}
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${trade.type === 'long' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>{trade.type.toUpperCase()}</span>
                    </h3>
                    <div className="flex justify-between items-end mt-2">
                        <div><p className="text-xs text-gray-500 dark:text-gray-400">P&L</p><p className={`text-lg font-bold ${pnlColor}`}>{formatCurrency(trade.pnl, currency)}</p></div>
                        <div className="text-right"><p className="text-xs text-gray-500 dark:text-gray-400">R:R</p><p className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[120px]" title={trade.riskRewardRatio > 0 ? `${trade.riskRewardRatio.toFixed(2)}R` : 'N/A'}>{trade.riskRewardRatio > 0 ? `${trade.riskRewardRatio.toFixed(2)}R` : 'N/A'}</p></div>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">{formatDateTime(trade.tradeDate)}</p>
                </div>
            </div>
        );
    };

    const galleryTrades = trades.filter(trade => trade.screenshotAfterId);
    return (<div className="animate-fadeIn"><h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Galeri Visual Trade</h2><div className="flex space-x-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6">{periods.map(p => (<button key={p.key} onClick={() => setActivePeriod(p.key)} className={classNames("px-4 py-2 text-sm font-medium rounded-lg transition-colors flex-grow", activePeriod === p.key ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700')}>{p.label}</button>))}</div>{galleryTrades.length === 0 ? (<div className="bg-white dark:bg-gray-800 p-10 rounded-xl text-center text-gray-500 mt-10"><Image size={48} className="mx-auto mb-3 text-gray-400 dark:text-gray-600"/><p className="text-lg">Tidak ada trade dengan gambar di periode ini.</p><p className="text-sm mt-1">Pastikan Anda mengupload gambar saat menambahkan trade.</p></div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{galleryTrades.map(trade => <GalleryImage key={trade.id} trade={trade} />)}</div>)}</div>);
};


// --- STATISTICS & GOALS COMPONENTS ---
const GaugeChart = ({ value, size = 80, strokeWidth = 8 }) => { const center = size / 2; const radius = center - strokeWidth; const circumference = 2 * Math.PI * radius; const offset = circumference - (value / 100) * circumference; return (<div className="relative" style={{ width: size, height: size }}><svg width={size} height={size} className="-rotate-90"><circle cx={center} cy={center} r={radius} strokeWidth={strokeWidth} className="stroke-gray-200 dark:stroke-gray-700" fill="transparent" /><circle cx={center} cy={center} r={radius} strokeWidth={strokeWidth} className="stroke-blue-500 transition-all duration-500 ease-out" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" /></svg><span className="absolute inset-0 flex items-center justify-center text-gray-900 dark:text-white font-bold text-lg">{`${Math.round(value)}%`}</span></div>);};
const RatioBar = ({ winValue, lossValue }) => { const total = winValue + lossValue; if (total === 0) return <div className="h-2 w-full bg-gray-300 dark:bg-gray-600 rounded-full"></div>; const winPercentage = (winValue / total) * 100; return (<div className="w-full bg-red-500/50 rounded-full h-2.5 flex overflow-hidden"><div className="bg-green-500 h-2.5" style={{ width: `${winPercentage}%` }}></div></div>);};
const StatCard = ({ title, value, children, footer, icon }) => ( <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col justify-between min-h-[160px]"><div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-2">{icon}<span className="ml-2">{title}</span></div><div className="flex-grow flex items-center justify-center">{value && <h3 className="text-3xl font-bold text-gray-900 dark:text-white my-2">{value}</h3>}{children}</div><div className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2 h-8 flex items-center justify-center">{footer}</div></div>);
const GoalProgress = ({ goal, currentPnl, period, currency }) => { if (!goal || !goal.type || !goal.amount || (goal.type !== 'weekly' && goal.type !== 'monthly') || goal.type !== period) { return null; } const { amount: goalAmount, type: goalType } = goal; const progress = currentPnl > 0 ? (currentPnl / goalAmount) * 100 : 0; const clampedProgress = Math.min(progress, 100); const isAchieved = currentPnl >= goalAmount; return (<div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg mb-6 animate-fadeIn"><div className="flex justify-between items-center mb-2"><h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center"><TrendingUp size={20} className="mr-2 text-yellow-400" />Target Profit {goalType === 'weekly' ? 'Mingguan' : 'Bulanan'}</h3>{isAchieved && (<span className="flex items-center text-sm font-bold bg-green-500/20 text-green-300 px-3 py-1 rounded-full"><CheckCircle size={16} className="mr-1.5" />Target Tercapai!</span>)}</div><div className="flex items-center space-x-4"><div className="flex-grow"><div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative overflow-hidden"><div className={`h-4 rounded-full transition-all duration-500 ease-out ${isAchieved ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${clampedProgress}%` }}></div></div></div><div className="flex-shrink-0 w-40 text-right"><span className={`font-bold text-lg ${isAchieved ? 'text-green-400 dark:text-green-300' : 'text-gray-900 dark:text-white'}`}>{formatCurrency(currentPnl, currency)}</span><span className="text-sm text-gray-500 dark:text-gray-400"> / {formatCurrency(goalAmount, currency)}</span></div></div><p className="text-right text-sm text-gray-500 dark:text-gray-400 mt-1">{progress.toFixed(1)}%</p></div>);};
const DailyGoalProgress = ({ goal, currentPnl, currency }) => {
    if (!goal || (goal.dailyProfitTarget <= 0 && goal.dailyLossTarget <= 0)) {
        return null;
    }

    const { dailyProfitTarget, dailyLossTarget } = goal;
    const profitProgress = dailyProfitTarget > 0 && currentPnl > 0 ? (currentPnl / dailyProfitTarget) * 100 : 0;
    const clampedProfitProgress = Math.min(profitProgress, 100);
    const isProfitAchieved = dailyProfitTarget > 0 && currentPnl >= dailyProfitTarget;

    const lossProgress = dailyLossTarget > 0 && currentPnl < 0 ? (Math.abs(currentPnl) / dailyLossTarget) * 100 : 0;
    const clampedLossProgress = Math.min(lossProgress, 100);
    const isLossLimitHit = dailyLossTarget > 0 && Math.abs(currentPnl) >= dailyLossTarget;

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg mb-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <CheckCircle size={20} className="mr-2 text-cyan-400" />Target Harian
                </h3>
                {isProfitAchieved && (
                    <span className="flex items-center text-sm font-bold bg-green-500/20 text-green-300 px-3 py-1 rounded-full">
                        <CheckCircle size={16} className="mr-1.5" />Profit Tercapai!
                    </span>
                )}
                {isLossLimitHit && (
                    <span className="flex items-center text-sm font-bold bg-red-500/20 text-red-300 px-3 py-1 rounded-full">
                        <AlertTriangle size={16} className="mr-1.5" />Batas Loss Tercapai!
                    </span>
                )}
            </div>
            {dailyProfitTarget > 0 && (
                <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500 dark:text-gray-400">Target Profit</span>
                        <div>
                            <span className={`font-bold ${isProfitAchieved ? 'text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                {formatCurrency(currentPnl > 0 ? currentPnl : 0, currency)}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400"> / {formatCurrency(dailyProfitTarget, currency)}</span>
                        </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                            className={`h-3 rounded-full transition-all duration-500 ease-out ${isProfitAchieved ? 'bg-green-500' : 'bg-cyan-500'}`}
                            style={{ width: `${clampedProfitProgress}%` }}
                        ></div>
                    </div>
                </div>
            )}
            {dailyLossTarget > 0 && (
                 <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500 dark:text-gray-400">Batas Loss</span>
                        <div>
                            <span className={`font-bold ${isLossLimitHit ? 'text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                {formatCurrency(currentPnl < 0 ? currentPnl : 0, currency)}
                            </span>
                             <span className="text-gray-500 dark:text-gray-400"> / {formatCurrency(-dailyLossTarget, currency)}</span>
                        </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                            className={`h-3 rounded-full transition-all duration-500 ease-out bg-red-500`}
                            style={{ width: `${clampedLossProgress}%` }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    );
};
const StatisticsDashboard = ({ stats, currency }) => {
    if (!stats) return null;

    const displayProfitFactor = isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : '∞';
    const displayAvgWinLossRatio = isFinite(stats.avgWinLossRatio) ? stats.avgWinLossRatio.toFixed(2) : '∞';

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6 animate-fadeIn">
            <StatCard title="Net P&L" value={formatCurrency(stats.netPnl, currency)} icon={<DollarSign size={16} />} footer={ <span className={stats.netPnl >= 0 ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"}> {stats.netPnl >= 0 ? "Profit" : "Loss"} </span> } />
            <StatCard title="Trade Win %" icon={<Target size={16} />} footer={<span><span className="text-green-500 dark:text-green-400">{stats.wins} menang</span> / <span className="text-red-500 dark:text-red-400">{stats.losses} kalah</span></span>}> <GaugeChart value={stats.tradeWinRate} /> </StatCard>
            <StatCard title="Profit Factor" value={displayProfitFactor} icon={<Divide size={16} />} footer={<div className="w-full flex flex-col items-center"><span className="text-green-500">{formatCurrency(stats.grossProfit, currency)}</span><span className="text-gray-500 mx-1">/</span><span className="text-red-500">{formatCurrency(stats.grossLoss, currency)}</span></div>} />
            <StatCard title="Day Win %" icon={<CalendarDays size={16} />} footer={<span><span className="text-green-500 dark:text-green-400">{stats.profitableDays} hari</span> / <span className="text-red-500 dark:text-red-400">{stats.losingDays} hari</span></span>}> <GaugeChart value={stats.dayWinRate} /> </StatCard>
            <StatCard title="Avg Win/Loss" icon={<BarChartHorizontal size={16} />} footer={<div className="w-full flex flex-col items-center"><RatioBar winValue={stats.avgWin} lossValue={Math.abs(stats.avgLoss)} /><div className="w-full flex justify-between mt-1"><span className="text-green-500 dark:text-green-400">{formatCurrency(stats.avgWin, currency)}</span><span className="text-red-500 dark:text-red-400">{formatCurrency(stats.avgLoss, currency)}</span></div></div>} value={displayAvgWinLossRatio} />
            <StatCard title="Avg R:R Ratio" value={`${stats.avgRiskReward.toFixed(2)}R`} icon={<Ratio size={16}/>} footer={<span>Rata-rata Risk to Reward</span>} />
            <StatCard title="Total Lot Digunakan" value={formatLotSize(stats.totalLotUsed)} icon={<Hash size={16}/>} footer={<span>Volum Trading Akumulatif</span>} />
        </div>
    );
};


// --- CHART COMPONENT ---
const AccountBalanceChart = ({ data, period, currency, theme }) => { 
    const axisColor = theme === 'dark' ? '#A0AEC0' : '#4A5568';
    const gridColor = theme === 'dark' ? '#4A5568' : '#E2E8F0';
    const getXAxisFormat = (dateStr) => { const date = new Date(dateStr); if (isNaN(date)) return dateStr; if (period === 'monthly') return date.toLocaleString('id-ID', { month: 'short', year: 'numeric' }); if (period === 'weekly') return date.toLocaleString('id-ID', { month: 'short', day: 'numeric' }); if (period === 'daily') return date.toLocaleString('id-ID', { month: 'short', day: 'numeric' }); if (period === 'yearly') return date.getFullYear(); return date.toLocaleDateString('id-ID'); }; 
    const CustomTooltip = ({ active, payload, label }) => { if (active && payload && payload.length) { return (<div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm p-3 rounded-lg border border-gray-300 dark:border-gray-600"><p className="text-gray-700 dark:text-gray-300 text-sm">{`Tanggal: ${label}`}</p><p className="text-gray-900 dark:text-white font-bold">{`Saldo: ${formatCurrency(payload[0].value, currency)}`}</p></div>); } return null; }; 
    return (<div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg mb-6 h-80 animate-fadeIn"><h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Riwayat Saldo Akun</h3><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}><CartesianGrid strokeDasharray="3 3" stroke={gridColor} /><XAxis dataKey="name" stroke={axisColor} tickFormatter={getXAxisFormat} tick={{ fontSize: 12 }} /><YAxis stroke={axisColor} tickFormatter={(value) => currency === 'IDR' ? `${(value/1000000)}jt` : `$${(value/1000)}k` } tick={{ fontSize: 12 }} /><Tooltip content={<CustomTooltip />} /><defs><linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs><Area type="monotone" dataKey="balance" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBalance)" strokeWidth={2} /></AreaChart></ResponsiveContainer></div>);};


// --- TEMPLATE MANAGEMENT MODAL ---
const TemplateManagementModal = ({ activeProfileId, showToast, onClose, templates, openDeleteModal }) => {
    const defaultTemplate = { name: '', pair: '', type: 'long', lotSize: '0.01', setup: '', pnl: '0', riskRewardRatio: '0' };
    const [templateData, setTemplateData] = useState(defaultTemplate); const [editingTemplate, setEditingTemplate] = useState(null);
    const handleTemplateChange = (e) => { const { name, value } = e.target; setTemplateData(prev => ({ ...prev, [name]: value })); };
    const handleEditClick = (template) => { setEditingTemplate(template); setTemplateData({ ...template, lotSize: String(template.lotSize), pnl: String(template.pnl), riskRewardRatio: String(template.riskRewardRatio || '0'), }); };
    const handleSubmit = async (e) => { e.preventDefault(); const finalData = { ...templateData, lotSize: parseFloat(templateData.lotSize) || 0, pnl: parseFloat(templateData.pnl) || 0, riskRewardRatio: parseFloat(templateData.riskRewardRatio) || 0, }; if (!finalData.name.trim()) { showToast("Nama Template wajib diisi.", "error"); return; } try { if (editingTemplate) { await updateItem('templates', { ...finalData, id: editingTemplate.id, profileId: activeProfileId, updatedAt: new Date() }); showToast(`Template '${finalData.name}' berhasil diupdate.`, "success"); } else { const newId = crypto.randomUUID(); await addItem('templates', { ...finalData, id: newId, profileId: activeProfileId, createdAt: new Date() }); showToast(`Template '${finalData.name}' berhasil ditambahkan.`, "success"); } setTemplateData(defaultTemplate); setEditingTemplate(null); } catch (error) { showToast("Gagal menyimpan Template.", "error"); console.error("Error saving template:", error); } };
    const handleCancelEdit = () => { setEditingTemplate(null); setTemplateData(defaultTemplate); };
    return (<div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn"><div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center"><Zap size={24} className="mr-2 text-yellow-400" /> Kelola Template Trade</h2>
            <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-3xl font-light">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="flex-shrink-0 mb-6 p-4 bg-gray-100/50 dark:bg-gray-700/50 rounded-lg"><h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{editingTemplate ? `Edit Template: ${editingTemplate.name}` : "Buat Template Baru"}</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-3"><input type="text" name="name" placeholder="Nama Template (Wajib)" value={templateData.name} onChange={handleTemplateChange} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-4" required /><input type="text" name="pair" placeholder="Pair Default (e.g., XAU/USD)" value={templateData.pair} onChange={handleTemplateChange} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-1" /><select name="type" value={templateData.type} onChange={handleTemplateChange} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-1"><option value="long">Long (Buy)</option><option value="short">Short (Sell)</option></select><input type="number" step="any" name="lotSize" placeholder="Lot Size Default" value={templateData.lotSize} onChange={handleTemplateChange} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-1" /><input type="number" step="any" name="pnl" placeholder="P&L Default (0 jika kosong)" value={templateData.pnl} onChange={handleTemplateChange} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-1" /><input type="number" step="any" name="riskRewardRatio" placeholder="R:R Ratio (e.g., 2)" value={templateData.riskRewardRatio} onChange={handleTemplateChange} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-2" /><input type="text" name="setup" placeholder="Setup/Strategi Default" value={templateData.setup} onChange={handleTemplateChange} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded col-span-2 md:col-span-4" /></div><div className="flex justify-end space-x-3 mt-4">{editingTemplate && (<button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Batal Edit</button>)}<button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"><Save size={18} className="inline mr-1" /> {editingTemplate ? 'Update Template' : 'Simpan Template'}</button></div></form><h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex-shrink-0">Daftar Template ({templates.length})</h3><div className="overflow-y-auto flex-grow space-y-2 pr-2">{templates.length === 0 ? (<p className="text-gray-500 text-sm p-4 text-center bg-gray-100 dark:bg-gray-700 rounded-lg">Buat template pertama Anda di atas.</p>) : (templates.map(t => (<div key={t.id} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg flex justify-between items-center transition-shadow hover:shadow-md hover:shadow-gray-700/50"><div className="flex flex-col text-sm"><span className="font-semibold text-gray-900 dark:text-white">{t.name}</span><span className="text-gray-500 dark:text-gray-400 text-xs">{t.pair || '-'} | {t.type} | Lot: {t.lotSize.toFixed(2)} | R:R: {parseFloat(t.riskRewardRatio || 0) > 0 ? `${t.riskRewardRatio}R` : 'N/A'}</span></div><div className="flex space-x-2"><button onClick={() => handleEditClick(t)} className="p-1 text-gray-500 dark:text-gray-400 hover:text-yellow-400 transition-colors" title={`Edit Template ${t.name}`}><Edit3 size={16} /></button><button onClick={() => openDeleteModal('template', t)} className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors" title={`Hapus Template ${t.name}`}><Trash2 size={16} /></button></div></div>)))}</div><div className="flex justify-end mt-6 flex-shrink-0"><button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Tutup</button></div></div></div>);
};


// --- PAIR MANAGEMENT MODAL ---
const PairManagementModal = ({ activeProfileId, showToast, onClose, pairs, openDeleteModal }) => {
    const [newPair, setNewPair] = useState('');
    const handleAddPair = async (e) => { e.preventDefault(); const pairName = newPair.trim().toUpperCase(); if (!pairName) { showToast("Nama Pair tidak boleh kosong.", "error"); return; } if (pairs.some(p => p.name?.toUpperCase() === pairName)) { showToast(`Pair '${pairName}' sudah ada.`, "error"); setNewPair(''); return; } try { const newPairData = { id: crypto.randomUUID(), profileId: activeProfileId, name: pairName, createdAt: new Date() }; await addItem('pairs', newPairData); showToast(`Pair ${pairName} berhasil ditambahkan.`, "success"); setNewPair(''); } catch (error) { showToast("Gagal menambah Pair.", "error"); console.error("Error adding pair:", error); } };
    return (<div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn"><div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center"><Target size={24} className="mr-2 text-yellow-400" /> Kelola Pair Trading</h2>
            <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-3xl font-light">&times;</button>
        </div>
        <form onSubmit={handleAddPair} className="flex-shrink-0 mb-6 flex space-x-2"><input type="text" placeholder="Nama Pair (e.g., EUR/USD)" value={newPair} onChange={e => setNewPair(e.target.value.toUpperCase())} className="flex-grow bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded" required maxLength={10} /><button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Tambah</button></form><h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex-shrink-0">Daftar Pair ({pairs.length})</h3><div className="overflow-y-auto flex-grow space-y-2 pr-2">{pairs.length === 0 ? (<p className="text-gray-500 text-sm p-4 text-center bg-gray-100 dark:bg-gray-700 rounded-lg">Tambahkan pair trading yang sering Anda gunakan di atas.</p>) : (pairs.map(p => (<div key={p.id} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg flex justify-between items-center transition-shadow hover:shadow-md hover:shadow-gray-700/50"><span className="font-semibold text-gray-900 dark:text-white">{p.name}</span><button onClick={() => openDeleteModal('pair', p)} className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors" title={`Hapus Pair ${p.name}`}><Trash2 size={16} /></button></div>)))}</div><div className="flex justify-end mt-6 flex-shrink-0"><button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Tutup</button></div></div></div>);
};


// --- TRADE FORM COMPONENT ---
const TradeForm = ({ onSaveTrade, editingTrade, onCancelEdit, pairs, templates, customFields, activeProfileId }) => { 
    const initialTradeData = useMemo(() => {
        const baseData = { tradeDate: toDateTimeLocalInput(new Date()), pair: '', type: 'long', lotSize: '0.01', pnl: '0', setup: '', notes: '', screenshotBeforeId: null, screenshotAfterId: null, entryPrice: '', takeProfit: '', stopLoss: '', riskRewardRatio: '0', customData: {} };
        customFields.forEach(field => {
            baseData.customData[field.name] = '';
        });
        return baseData;
    }, [customFields]);
    
    const [formData, setFormData] = useState(initialTradeData); 
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [screenshotBeforeFile, setScreenshotBeforeFile] = useState(null);
    const [screenshotAfterFile, setScreenshotAfterFile] = useState(null);

    const existingBeforeImageUrl = useLocalImage(formData.screenshotBeforeId);
    const existingAfterImageUrl = useLocalImage(formData.screenshotAfterId);


    useEffect(() => { 
        let dataToEdit = editingTrade ? { ...initialTradeData, ...editingTrade, tradeDate: toDateTimeLocalInput(editingTrade.tradeDate), pnl: String(editingTrade.pnl || '0'), lotSize: String(editingTrade.lotSize || '0.01'), riskRewardRatio: String(editingTrade.riskRewardRatio || '0'), entryPrice: String(editingTrade.entryPrice || ''), takeProfit: String(editingTrade.takeProfit || ''), stopLoss: String(editingTrade.stopLoss || '') } : initialTradeData; 
        
        // Ensure customData object exists and has all current custom fields
        dataToEdit.customData = dataToEdit.customData || {};
        customFields.forEach(field => {
            if (!dataToEdit.customData.hasOwnProperty(field.name)) {
                dataToEdit.customData[field.name] = '';
            }
        });

        if (editingTrade && editingTrade.pair && !pairs.some(p => p.name === editingTrade.pair)) { 
            setFormData({...dataToEdit, pair: editingTrade.pair}); 
        } else if (pairs.length > 0 && !dataToEdit.pair) { 
            setFormData({...dataToEdit, pair: pairs[0].name}); 
        } else { 
            setFormData(dataToEdit); 
        } 
        setSelectedTemplate(''); 
        setScreenshotBeforeFile(null);
        setScreenshotAfterFile(null);
    }, [editingTrade, pairs, initialTradeData, customFields]); 
    
    // Auto-calculate R:R Ratio
    useEffect(() => {
        const entry = parseFloat(formData.entryPrice);
        const tp = parseFloat(formData.takeProfit);
        const sl = parseFloat(formData.stopLoss);
        const type = formData.type;

        if (entry > 0 && tp > 0 && sl > 0) {
            let risk, reward;
            if (type === 'long') {
                reward = tp - entry;
                risk = entry - sl;
            } else { // short
                reward = entry - tp;
                risk = sl - entry;
            }

            if (risk > 0 && reward > 0) {
                const ratio = reward / risk;
                setFormData(prev => ({ ...prev, riskRewardRatio: ratio.toFixed(2) }));
            } else {
                setFormData(prev => ({ ...prev, riskRewardRatio: '0' }));
            }
        }
    }, [formData.entryPrice, formData.takeProfit, formData.stopLoss, formData.type]);


    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); setSelectedTemplate(''); }; 
    
    const handleCustomFieldChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            customData: {
                ...prev.customData,
                [name]: value
            }
        }));
    };

    const handleFileChange = (e, fileType) => {
        const file = e.target.files[0];
        if (file) {
            if (fileType === 'before') {
                setScreenshotBeforeFile(file);
                setFormData(prev => ({...prev, screenshotBeforeId: null})); 
            } else {
                setScreenshotAfterFile(file);
                setFormData(prev => ({...prev, screenshotAfterId: null}));
            }
        }
    };
    
    const handleTemplateSelect = (e) => { const templateId = e.target.value; setSelectedTemplate(templateId); if (templateId) { const template = templates.find(t => t.id === templateId); if (template) { setFormData(prev => ({ ...prev, pair: template.pair || '', type: template.type || 'long', lotSize: String(template.lotSize || '0.01'), pnl: String(template.pnl || '0'), setup: template.setup || '', riskRewardRatio: String(template.riskRewardRatio || '0'), notes: '', screenshotBeforeId: null, screenshotAfterId: null, })); } } else { setFormData(prev => ({ ...initialTradeData, tradeDate: prev.tradeDate, pair: pairs.length > 0 ? pairs[0].name : '', })); } };
    
    const handleSubmit = (e) => { 
        e.preventDefault(); 
        const finalData = { 
            ...formData, 
            id: editingTrade ? editingTrade.id : crypto.randomUUID(),
            profileId: activeProfileId,
            pnl: parseFloat(formData.pnl) || 0, 
            lotSize: parseFloat(formData.lotSize) || 0, 
            riskRewardRatio: parseFloat(formData.riskRewardRatio) || 0, 
            entryPrice: parseFloat(formData.entryPrice) || 0,
            takeProfit: parseFloat(formData.takeProfit) || 0,
            stopLoss: parseFloat(formData.stopLoss) || 0,
            tradeDate: new Date(formData.tradeDate), 
        }; 
        onSaveTrade(finalData, screenshotBeforeFile, screenshotAfterFile); 
    }; 
    
    const FileInput = ({ id, label, file, onChange, existingImageUrl }) => {
        const [preview, setPreview] = useState(null);

        useEffect(() => {
            if (!file) {
                setPreview(null);
                return;
            }
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);

            return () => URL.revokeObjectURL(objectUrl);
        }, [file]);

        const currentImage = preview || existingImageUrl;

        return (
            <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{label}</label>
                <div className="flex items-center gap-4">
                    <div className="w-24 h-24 flex-shrink-0">
                        {currentImage ? (
                            <div className="relative group w-full h-full">
                                <img src={currentImage} alt="Preview" className="h-full w-full object-cover rounded-lg" />
                                <label htmlFor={id} className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg cursor-pointer">
                                    <Edit3 size={24} className="text-white"/>
                                </label>
                            </div>
                        ) : (
                           <div className="h-full w-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              <Camera size={32} className="text-gray-400 dark:text-gray-500"/>
                           </div>
                        )}
                    </div>
                     <label htmlFor={id} className="cursor-pointer bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white py-2 px-4 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 text-sm w-full">
                        <UploadCloud size={16} className="mr-2"/>
                        <span className="truncate">{file ? file.name : 'Upload Gambar'}</span>
                    </label>
                    <input id={id} type="file" onChange={onChange} className="hidden" accept="image/*" />
                </div>
            </div>
        );
    };
    
    return ( 
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn"> 
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"> 
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{editingTrade ? "Edit Trade" : "Tambah Trade Baru"}</h2> 
                <div className="mb-4"><label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Pilih Template (Opsional)</label><select value={selectedTemplate} onChange={handleTemplateSelect} className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"><option value="">-- Tanpa Template --</option>{templates.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}</select></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {pairs.length > 0 ? (<select name="pair" value={formData.pair || ''} onChange={handleChange} className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded" required><option value="" disabled>Pilih Pair</option>{pairs.map(p => (<option key={p.id} value={p.name}>{p.name}</option>))}{(editingTrade && editingTrade.pair && !pairs.some(p => p.name === editingTrade.pair)) && (<option value={editingTrade.pair} className="text-gray-400 bg-gray-800">{editingTrade.pair} (Lama)</option>)}</select>) : (<input name="pair" value={formData.pair || ''} onChange={handleChange} placeholder="Pair (e.g., BTC/USD)" className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded" required />)}
                    <input type="datetime-local" name="tradeDate" value={formData.tradeDate || ''} onChange={handleChange} className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded" required /> 
                    <select name="type" value={formData.type || 'long'} onChange={handleChange} className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"><option value="long">Long</option><option value="short">Short</option></select> 
                    <input type="number" step="any" name="pnl" value={formData.pnl || ''} onChange={handleChange} placeholder="P&L (Hasil Trade)" className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded font-bold" required /> 
                    <input type="number" step="any" name="lotSize" value={formData.lotSize || ''} onChange={handleChange} placeholder="Lot Size" className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded" required /> 
                    <input name="setup" value={formData.setup || ''} onChange={handleChange} placeholder="Setup/Strategi Trade" className="md:col-span-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded" /> 
                    <input type="number" step="any" name="entryPrice" value={formData.entryPrice || ''} onChange={handleChange} placeholder="Harga Entry" className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded" />
                    <input type="number" step="any" name="takeProfit" value={formData.takeProfit || ''} onChange={handleChange} placeholder="Harga Take Profit" className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded" />
                    <input type="number" step="any" name="stopLoss" value={formData.stopLoss || ''} onChange={handleChange} placeholder="Harga Stop Loss" className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded" />
                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">R:R Ratio</label>
                        <input type="number" step="any" name="riskRewardRatio" value={formData.riskRewardRatio || ''} onChange={handleChange} placeholder="R:R Ratio (Otomatis)" className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded" />
                    </div>
                    {customFields.map(field => (
                        <div key={field.id} className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{field.name}</label>
                            <input
                                name={field.name}
                                value={formData.customData?.[field.name] || ''}
                                onChange={handleCustomFieldChange}
                                placeholder={`Input untuk ${field.name}`}
                                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"
                            />
                        </div>
                    ))}
                    
                    <FileInput id="ss-before" label="Screenshot (Sebelum)" file={screenshotBeforeFile} onChange={(e) => handleFileChange(e, 'before')} existingImageUrl={existingBeforeImageUrl} />
                    <FileInput id="ss-after" label="Screenshot (Sesudah)" file={screenshotAfterFile} onChange={(e) => handleFileChange(e, 'after')} existingImageUrl={existingAfterImageUrl} />
                    
                    <textarea name="notes" value={formData.notes || ''} onChange={handleChange} placeholder="Catatan..." rows="3" className="md:col-span-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"></textarea>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                    <button type="button" onClick={onCancelEdit} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Batal</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"><Save size={18} className="mr-2"/>{editingTrade ? 'Update' : 'Simpan'}</button>
                </div>
            </form>
        </div> 
    ); 
};


// --- BALANCE TRANSACTION MODAL ---
const BalanceTransactionModal = ({ activeProfileId, showToast, onClose, openDeleteModal, currency }) => { 
    const [transactions, setTransactions] = useState([]); 
    const [type, setType] = useState('deposit'); 
    const [amount, setAmount] = useState(''); 
    const [date, setDate] = useState(toDateTimeLocalInput(new Date())); 
    
    useEffect(() => { 
        if (!activeProfileId) return; 
        getItemsByProfileId('balance_transactions', activeProfileId).then(data => {
            setTransactions(data.sort((a, b) => b.date - a.date));
        });
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
                date: new Date(date)
            };
            await addItem('balance_transactions', newTransaction);
            showToast("Transaksi berhasil ditambahkan!", "success"); 
            setAmount(''); 
            setDate(toDateTimeLocalInput(new Date()));
            // Refresh list
            getItemsByProfileId('balance_transactions', activeProfileId).then(data => {
                setTransactions(data.sort((a, b) => b.date - a.date));
            });
        } catch (error) { 
            showToast("Error menambah transaksi", "error"); 
            console.error(error); 
        } 
    }; 
    return ( <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn"> <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"> <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex-shrink-0">Kelola Saldo</h2> <form onSubmit={handleAddTransaction} className="flex-shrink-0 mb-6"> <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3"> <select value={type} onChange={e => setType(e.target.value)} className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded"><option value="deposit">Deposit</option><option value="withdrawal">Withdrawal</option></select> <input type="number" placeholder="Jumlah" value={amount} onChange={e => setAmount(e.target.value)} className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded" required /> <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded" required/> </div> <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center">Tambah Transaksi</button> </form> <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex-shrink-0">Riwayat</h3> <div className="overflow-y-auto flex-grow"> <ul className="space-y-2"> {transactions.map(t => ( <li key={t.id} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg flex justify-between items-center"> <div className="flex items-center"> {t.type === 'deposit' ? <ArrowUpRight className="text-green-500 dark:text-green-400 mr-3" /> : <ArrowDownRight className="text-red-500 dark:text-red-400 mr-3" />} <div> <p className="font-semibold text-gray-900 dark:text-white capitalize">{t.type}: {formatCurrency(t.amount, currency)}</p> <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(t.date)}</p> </div> </div> <button onClick={() => openDeleteModal('transaction', t)} className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-500"><Trash2 size={16}/></button> </li> ))} </ul> </div> <div className="flex justify-end mt-6 flex-shrink-0"> <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Tutup</button> </div> </div> </div> ); };

// --- TRADE LIST COMPONENT ---
const TradeList = ({ trades, onEdit, onDelete, onView, title = "Riwayat Trade", requestSort, sortConfig, customFields, currency }) => {
    const getSortIndicator = (key) => {
        if (sortConfig && sortConfig.key === key) {
            return sortConfig.direction === 'ascending' ? '▲' : '▼';
        }
        return null;
    };

    const handleHeaderClick = (key) => {
        if (requestSort) {
            requestSort(key);
        }
    };

    const headerProps = (key, isRightAligned = false) => {
        let className = "p-3";
        if (isRightAligned) className += " text-right";
        if (requestSort) className += " cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors";

        return {
            scope: "col",
            className: className,
            onClick: () => handleHeaderClick(key)
        };
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg animate-fadeIn overflow-hidden mt-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white p-4">{title}</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th {...headerProps('tradeDate')}>Tanggal <span className="text-blue-500 dark:text-blue-400">{getSortIndicator('tradeDate')}</span></th>
                            <th {...headerProps('pair')}>Pair <span className="text-blue-500 dark:text-blue-400">{getSortIndicator('pair')}</span></th>
                            <th {...headerProps('type')}>Tipe <span className="text-blue-500 dark:text-blue-400">{getSortIndicator('type')}</span></th>
                            <th {...headerProps('lotSize', true)}>Lot <span className="text-blue-500 dark:text-blue-400">{getSortIndicator('lotSize')}</span></th>
                            <th {...headerProps('pnl', true)}>P&L <span className="text-blue-500 dark:text-blue-400">{getSortIndicator('pnl')}</span></th>
                            <th {...headerProps('riskRewardRatio', true)}>R:R <span className="text-blue-500 dark:text-blue-400">{getSortIndicator('riskRewardRatio')}</span></th>
                            <th {...headerProps('setup')}>Setup <span className="text-blue-500 dark:text-blue-400">{getSortIndicator('setup')}</span></th>
                            {customFields.map(field => (
                                <th key={field.id} {...headerProps(field.name)}>
                                    {field.name} <span className="text-blue-500 dark:text-blue-400">{getSortIndicator(field.name)}</span>
                                </th>
                            ))}
                            <th scope="col" className="p-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trades.length === 0 ? (
                            <tr><td colSpan={8 + customFields.length} className="text-center p-6 text-gray-500">Tidak ada trade untuk ditampilkan.</td></tr>
                        ) : (
                            trades.map((trade) => (
                                <tr key={trade.id} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-3">{formatDateTime(trade.tradeDate)}</td>
                                    <td className="p-3 font-medium text-gray-900 dark:text-white">{trade.pair}</td>
                                    <td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${trade.type === 'long' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>{trade.type}</span></td>
                                    <td className="p-3 text-right">{trade.lotSize.toFixed(2)}</td>
                                    <td className={`p-3 text-right font-bold ${trade.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(trade.pnl, currency)}</td>
                                    <td className="p-3 text-right">{trade.riskRewardRatio > 0 ? `${trade.riskRewardRatio.toFixed(2)}R` : '-'}</td>
                                    <td className="p-3">{trade.setup || '-'}</td>
                                    {customFields.map(field => (
                                        <td key={field.id} className="p-3">{trade.customData?.[field.name] || '-'}</td>
                                    ))}
                                    <td className="p-3 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            <button onClick={() => onView(trade)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400" title="Lihat Rincian"><Info size={16}/></button>
                                            <button onClick={() => onEdit(trade)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400" title="Edit Trade"><Edit3 size={16}/></button>
                                            <button onClick={() => onDelete('trade', trade)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500" title="Delete Trade"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- CALENDAR VIEW COMPONENT ---
const CalendarView = ({ trades, onEdit, onDelete, onView, customFields, currency }) => {
    const [currentDate, setCurrentDate] = useState(new Date()); const [selectedDate, setSelectedDate] = useState(null);
    const tradesByDate = useMemo(() => { const map = new Map(); trades.forEach(trade => { const dateStr = formatDate(trade.tradeDate); if (!map.has(dateStr)) { map.set(dateStr, { pnl: 0, trades: [], wins: 0, losses: 0 }); } const dayData = map.get(dateStr); dayData.pnl += trade.pnl; dayData.trades.push(trade); if (trade.pnl > 0) dayData.wins++; else if (trade.pnl < 0) dayData.losses++; }); return map; }, [trades]);
    const handleDayClick = (day) => { const dayStr = formatDate(day); if (tradesByDate.has(dayStr)) { setSelectedDate(day); } };
    const renderHeader = () => { const currentYear = currentDate.getFullYear(); const currentMonth = currentDate.getMonth(); const currentFullYear = new Date().getFullYear(); const startYear = currentFullYear - 5; const endYear = currentFullYear + 5; const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i); const months = [ { value: 0, label: 'Januari' }, { value: 1, label: 'Februari' }, { value: 2, label: 'Maret' }, { value: 3, label: 'April' }, { value: 4, label: 'Mei' }, { value: 5, label: 'Juni' }, { value: 6, label: 'Juli' }, { value: 7, label: 'Agustus' }, { value: 8, label: 'September' }, { value: 9, label: 'Oktober' }, { value: 10, label: 'November' }, { value: 11, label: 'Desember' }, ]; return (<div className="flex justify-between items-center p-4"><button onClick={()=>setCurrentDate(p=>new Date(p.getFullYear(), p.getMonth()-1,1))} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"><ChevronLeft /></button><div className="flex space-x-3"><select value={currentMonth} onChange={(e)=>setCurrentDate(p=>new Date(p.getFullYear(),parseInt(e.target.value),1))} className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold py-2 px-3 rounded-lg appearance-none cursor-pointer">{months.map(m => (<option key={m.value} value={m.value}>{m.label}</option>))}</select><select value={currentYear} onChange={(e)=>setCurrentDate(p=>new Date(parseInt(e.target.value), p.getMonth(),1))} className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold py-2 px-3 rounded-lg appearance-none cursor-pointer">{years.map(y => (<option key={y} value={y}>{y}</option>))}</select></div><button onClick={()=>setCurrentDate(p=>new Date(p.getFullYear(), p.getMonth()+1,1))} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"><ChevronRight /></button></div>); };
    const renderCells = () => { const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); const startDate = new Date(monthStart); startDate.setDate(startDate.getDate() - monthStart.getDay()); const rows = []; let day = new Date(startDate); for (let i = 0; i < 6; i++) { const daysInWeek = []; let weeklyPnl = 0; let weeklyTradeDays = 0; for (let j = 0; j < 7; j++) { const cloneDay = new Date(day); const dayStr = formatDate(cloneDay); const dayData = tradesByDate.get(dayStr); if (dayData) { weeklyPnl += dayData.pnl; weeklyTradeDays++; } const winRate = dayData ? (dayData.wins / (dayData.wins + dayData.losses)) * 100 : 0; daysInWeek.push(<div key={day} className={classNames('relative p-2 h-28 md:h-32 border-t border-l border-gray-200 dark:border-gray-700 flex flex-col', day.getMonth() !== currentDate.getMonth() ? 'text-gray-500 dark:text-gray-600 bg-gray-50 dark:bg-gray-900/50' : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800', dayData ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : '', formatDate(selectedDate) === dayStr ? 'bg-blue-600/20 dark:bg-blue-600/50 ring-2 ring-blue-400' : '')} onClick={() => handleDayClick(cloneDay)}><span className={classNames("font-medium", formatDate(new Date()) === dayStr ? 'text-blue-500 dark:text-blue-400 font-bold' : '')}>{cloneDay.getDate()}</span>{dayData && (<div className="mt-1 text-xs flex-grow flex flex-col justify-end"><p className={classNames('font-bold', dayData.pnl > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>{formatCurrency(dayData.pnl, currency)}</p><p className="text-gray-500 dark:text-gray-400">{dayData.trades.length} trade{dayData.trades.length > 1 ? 's' : ''}</p><p className={classNames(dayData.wins > dayData.losses ? "text-green-500" : "text-red-500")}>{isNaN(winRate) ? 'N/A' : `${winRate.toFixed(0)}% win`}</p></div>)}</div>); day.setDate(day.getDate() + 1); } rows.push(<div className="grid grid-cols-8" key={`week-${i}`}>{daysInWeek}<div className="p-2 h-28 md:h-32 border-t border-l border-r border-gray-200 dark:border-gray-700 flex flex-col justify-center items-center text-center bg-white dark:bg-gray-800">{weeklyTradeDays > 0 ? (<><p className="text-xs text-gray-500 dark:text-gray-400">Week {i+1}</p><p className={classNames('font-bold text-sm', weeklyPnl > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>{formatCurrency(weeklyPnl, currency)}</p><p className="text-xs text-gray-400 dark:text-gray-500">{weeklyTradeDays} hari</p></>) : (<p className="text-xs text-gray-500 dark:text-gray-600">Week {i+1}</p>)}</div></div>); } return <div>{rows}</div>; };
    const selectedTrades = selectedDate ? (tradesByDate.get(formatDate(selectedDate))?.trades || []).sort((a,b) => (b.tradeDate?.getTime() || 0) - (a.tradeDate?.getTime() || 0)) : [];
    return (<div className="animate-fadeIn"><div className="bg-white/50 dark:bg-gray-800/50 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">{renderHeader()}<div className="grid grid-cols-8 text-center font-semibold text-gray-500 dark:text-gray-400 text-xs px-2 pb-2">{['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => <div key={day}>{day}</div>)}<div className="text-blue-500 dark:text-blue-400">Mingguan</div></div>{renderCells()}</div>{selectedDate && <TradeList trades={selectedTrades} onEdit={onEdit} onView={onView} onDelete={onDelete} title={`Trade untuk ${selectedDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`} customFields={customFields} currency={currency} />}</div>);
};

// --- NEW PROFILE SELECTOR COMPONENT ---
const ProfileSelector = ({ profiles, activeProfile, onSelectProfile, onManageProfiles }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (profile) => {
        onSelectProfile(profile);
        setIsOpen(false);
    };

    if (!activeProfile) {
        return <div className="text-gray-900 dark:text-white">Memuat profil...</div>;
    }

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 w-full text-left">
                <Users size={20} className="text-blue-500 dark:text-blue-400"/>
                <div className="flex-grow">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{activeProfile.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{activeProfile.description || 'Tidak ada deskripsi'}</p>
                </div>
                <ChevronDown size={16} className={`transition-transform text-gray-600 dark:text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20">
                    <ul>
                        {profiles.map(p => (
                            <li key={p.id}>
                                <a href="#" onClick={() => handleSelect(p)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    {p.name} <span className="text-xs text-gray-500">({p.currency})</span>
                                </a>
                            </li>
                        ))}
                        <li>
                            <button onClick={() => { onManageProfiles(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-blue-500 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700">
                                Tambah/Kelola Akun...
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

// --- MAIN APP COMPONENT ---
function App() {
    // Core Data State
    const [trades, setTrades] = useState([]);
    const [pairs, setPairs] = useState([]); 
    const [templates, setTemplates] = useState([]); 
    const [customFields, setCustomFields] = useState([]);
    const [balanceTransactions, setBalanceTransactions] = useState([]);
    const [initialBalance, setInitialBalance] = useState(0);
    const [goalSettings, setGoalSettings] = useState(null);

    // Auth & Profile State
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [tradingProfiles, setTradingProfiles] = useState([]);
    const [activeProfile, setActiveProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loginError, setLoginError] = useState('');

    // UI State
    const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'dark');
    const [toast, setToast] = useState({ message: '', type: '' });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isTradeFormVisible, setIsTradeFormVisible] = useState(false);
    const [editingTrade, setEditingTrade] = useState(null);
    const [viewingTrade, setViewingTrade] = useState(null);
    const [isTransactionModalVisible, setIsTransactionModalVisible] = useState(false);
    const [isPairModalVisible, setIsPairModalVisible] = useState(false); 
    const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false); 
    const [isCustomFieldModalVisible, setIsCustomFieldModalVisible] = useState(false);
    const [isCalculatorVisible, setIsCalculatorVisible] = useState(false);
    const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
    const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [activeView, setActiveView] = useState('dashboard');
    const [activePeriod, setActivePeriod] = useState('all'); 
    const [sortConfig, setSortConfig] = useState({ key: 'tradeDate', direction: 'descending' });
    
    const periods = useMemo(() => [ { key: 'all', label: 'Semua' }, { key: 'daily', label: 'Harian' }, { key: 'weekly', label: 'Mingguan' }, { key: 'monthly', label: 'Bulanan' }, { key: 'yearly', label: 'Tahunan' } ], []);
useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('appTheme', theme);
    }, [theme]);
    
    const handleToggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const refreshProfiles = useCallback(async () => {
        const profilesData = await getAllItems('profiles');
        const sortedProfiles = profilesData.sort((a, b) => a.createdAt - b.createdAt);
        setTradingProfiles(sortedProfiles);

        if (activeProfile && !sortedProfiles.some(p => p.id === activeProfile.id)) {
            // Active profile was deleted, switch to first available or null
            const newActiveProfile = sortedProfiles.length > 0 ? sortedProfiles[0] : null;
            setActiveProfile(newActiveProfile);
            if (newActiveProfile) {
                localStorage.setItem('activeProfileId', newActiveProfile.id);
            } else {
                localStorage.removeItem('activeProfileId');
            }
        } else if (!activeProfile && sortedProfiles.length > 0) {
            // No active profile, but profiles exist (e.g., first launch with data)
            const lastProfileId = localStorage.getItem('activeProfileId');
            const lastProfile = sortedProfiles.find(p => p.id === lastProfileId);
            setActiveProfile(lastProfile || sortedProfiles[0]);
        }
    }, [activeProfile]);


    const refreshAllData = useCallback(async (profileId) => {
        if (!profileId) {
            // Clear all data if no profile is active
            setTrades([]);
            setPairs([]);
            setTemplates([]);
            setCustomFields([]);
            setBalanceTransactions([]);
            setGoalSettings(null);
            setInitialBalance(0);
            return;
        }
        
        const [
            tradesData, pairsData, templatesData, 
            customFieldsData, balanceData, goalData
        ] = await Promise.all([
            getItemsByProfileId('trades', profileId),
            getItemsByProfileId('pairs', profileId),
            getItemsByProfileId('templates', profileId),
            getItemsByProfileId('custom_fields', profileId),
            getItemsByProfileId('balance_transactions', profileId),
            getItem('goals', profileId)
        ]);

        setTrades(tradesData);
        setPairs(pairsData.sort((a,b) => a.createdAt - b.createdAt));
        setTemplates(templatesData.sort((a,b) => a.name.localeCompare(b.name)));
        setCustomFields(customFieldsData.sort((a,b) => a.createdAt - b.createdAt));
        setBalanceTransactions(balanceData.sort((a,b) => b.date - a.date));
        setGoalSettings(goalData);

        // Calculate initial balance based on transactions
        const totalDeposits = balanceData.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
        const totalWithdrawals = balanceData.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);
        setInitialBalance(totalDeposits - totalWithdrawals);

    }, []);

    // --- Initializations ---
    useEffect(() => {
        initDB().then(() => {
            console.log("Database initialized");
            // Profile loading is now conditional on user being logged in
        });
        
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsAuthReady(true);
            if (currentUser) {
                // If user is logged in, load their profiles.
                refreshProfiles().then(() => setIsLoading(false));
            } else {
                // If user is logged out, clear data and stop loading.
                setActiveProfile(null);
                setTradingProfiles([]);
                refreshAllData(null);
                setIsLoading(false);
            }
        });
        
        return () => unsubscribe();
    }, [refreshProfiles, refreshAllData]);
    
    // --- Data Fetching based on Active Profile ---
    useEffect(() => {
        if (activeProfile) {
            refreshAllData(activeProfile.id);
        } else if (!isLoading && user) {
             // If logged in but no active profile (e.g. after deleting one)
             refreshAllData(null); // Clear data
        }
    }, [activeProfile, isLoading, user, refreshAllData]);

    const handleSelectProfile = (profile) => {
        setActiveProfile(profile);
        localStorage.setItem('activeProfileId', profile.id);
    };

    // --- Auth Handlers ---
    const handleLogin = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // --- Device Fingerprint Verification Logic ---
            const currentFingerprint = await generateDeviceFingerprint();
            const deviceDocRef = doc(db, 'device_auths', user.uid);
            const docSnap = await getDoc(deviceDocRef);

            if (docSnap.exists()) {
                // User has logged in before, check if it's the same device
                const storedFingerprint = docSnap.data().fingerprint;
                if (storedFingerprint !== currentFingerprint) {
                    // Mismatch, force logout and show error
                    setLoginError("Akun ini sudah terdaftar di perangkat lain. Silakan login di perangkat pertama Anda.");
                    await signOut(auth); // Force sign out
                    return; // Stop the login process
                }
                // Fingerprints match, proceed with login
            } else {
                // First time login for this user on any device, store the fingerprint
                await setDoc(deviceDocRef, {
                    fingerprint: currentFingerprint,
                    createdAt: new Date(),
                    email: user.email, // Store email for reference
                    userAgent: navigator.userAgent,
                });
            }
            // --- End of Device Verification ---

            setLoginError(''); // Clear any previous errors on success
        } catch (error) {
            console.error("Login failed:", error);
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
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


    // --- Handlers & Callbacks ---
    const showToast = (message, type) => { setToast({ message, type }); setTimeout(() => setToast({ message: '', type: '' }), 3000); };
    const handleShowTradeDetail = (trade) => {
        setViewingTrade(trade);
    };

    const handleSaveTrade = async (tradeData, beforeFile, afterFile) => {
        if (!activeProfile) return;
        
        const isEditing = !!editingTrade?.id;
        const finalTradeData = { ...tradeData };

        try {
            if (isEditing) {
                if (beforeFile && editingTrade.screenshotBeforeId) await deleteItem('trade_images', editingTrade.screenshotBeforeId);
                if (afterFile && editingTrade.screenshotAfterId) await deleteItem('trade_images', editingTrade.screenshotAfterId);
            }

            if (beforeFile) {
                const newId = crypto.randomUUID();
                await addItem('trade_images', { id: newId, file: beforeFile });
                finalTradeData.screenshotBeforeId = newId;
            }
            if (afterFile) {
                const newId = crypto.randomUUID();
                await addItem('trade_images', { id: newId, file: afterFile });
                finalTradeData.screenshotAfterId = newId;
            }

            if (isEditing) {
                await updateItem('trades', { ...finalTradeData, updatedAt: new Date() });
            } else {
                await addItem('trades', { ...finalTradeData, createdAt: new Date(), updatedAt: new Date() });
            }

            showToast(isEditing ? "Trade berhasil diupdate!" : "Trade berhasil ditambah!", "success");
            setEditingTrade(null);
            setIsTradeFormVisible(false);
            refreshAllData(activeProfile.id); // Refresh data
        } catch (e) {
            console.error(e);
            showToast("Gagal menyimpan trade.", "error");
        }
    };

    const openDeleteModal = (type, data) => { setItemToDelete({ type, data }); setIsDeleteModalOpen(true); };
    
    const handleDeleteItem = async () => {
        if (!itemToDelete) return;
        const { type, data } = itemToDelete;
        
        try {
            if (type === 'profile') {
                await handleDeleteProfile(data);
                return;
            }
    
            if (type === 'trade') {
                if (data.screenshotBeforeId) await deleteItem('trade_images', data.screenshotBeforeId);
                if (data.screenshotAfterId) await deleteItem('trade_images', data.screenshotAfterId);
            }
    
            if (!activeProfile) return;

            let storeName = '';
            let itemName = '';
            switch (type) {
                case 'trade': storeName = 'trades'; itemName = 'Trade'; break;
                case 'transaction': storeName = 'balance_transactions'; itemName = 'Transaksi'; break;
                case 'pair': storeName = 'pairs'; itemName = 'Pair'; break;
                case 'template': storeName = 'templates'; itemName = 'Template'; break;
                case 'custom_field': storeName = 'custom_fields'; itemName = 'Field'; break;
                default: return;
            }

            await deleteItem(storeName, data.id);
            showToast(`${itemName} berhasil dihapus.`, "success");
            refreshAllData(activeProfile.id);
        } catch(e) {
             console.error(`Error deleting ${type}:`, e);
             showToast(`Gagal menghapus item.`, "error");
        } finally {
            setItemToDelete(null);
            setIsDeleteModalOpen(false);
        }
    };

    const handleDeleteProfile = async (profileToDelete) => {
        if (!profileToDelete) return;

        showToast(`Menghapus profil '${profileToDelete.name}'...`, 'info');
        
        try {
            const storesToClear = ['trades', 'balance_transactions', 'pairs', 'templates', 'custom_fields', 'goals'];
            
            const tradesToDelete = await getItemsByProfileId('trades', profileToDelete.id);
            for(const trade of tradesToDelete){
                if (trade.screenshotBeforeId) await deleteItem('trade_images', trade.screenshotBeforeId);
                if (trade.screenshotAfterId) await deleteItem('trade_images', trade.screenshotAfterId);
            }

            for (const storeName of storesToClear) {
                const items = await getItemsByProfileId(storeName, profileToDelete.id);
                for (const item of items) {
                    await deleteItem(storeName, item.id);
                }
            }

            await deleteItem('profiles', profileToDelete.id);
            showToast(`Profil '${profileToDelete.name}' dan semua datanya berhasil dihapus.`, "success");
            
            refreshProfiles();

        } catch (error) {
            console.error("Error deleting profile and its data:", error);
            showToast("Gagal menghapus profil secara lengkap.", "error");
        } finally {
            setItemToDelete(null);
            setIsDeleteModalOpen(false);
        }
    };


    // --- Memoized Calculations ---
    const filteredTrades = useMemo(() => {
        if (!activeProfile) return [];
        const filterFn = (allTrades, period) => { 
            if (period === 'all') return allTrades; 
            const now = new Date(); 
            const startOfPeriod = new Date(now); 
            switch(period){ 
                case 'daily': startOfPeriod.setHours(0,0,0,0); break; 
                case 'weekly': const d=now.getDay();startOfPeriod.setDate(now.getDate()-d+(d===0?-6:1));startOfPeriod.setHours(0,0,0,0); break; 
                case 'monthly': startOfPeriod.setDate(1);startOfPeriod.setHours(0,0,0,0); break; 
                case 'yearly': startOfPeriod.setMonth(0,1);startOfPeriod.setHours(0,0,0,0); break; 
                default: break; 
            } 
            return allTrades.filter(t => (t.tradeDate || new Date(0)) >= startOfPeriod); 
        };
        return filterFn(trades, activePeriod);
    }, [trades, activePeriod, activeProfile]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedTrades = useMemo(() => {
        let sortableTrades = [...filteredTrades];
        if (sortConfig.key !== null) {
            sortableTrades.sort((a, b) => {
                const isCustom = customFields.some(f => f.name === sortConfig.key);
                
                const aValue = isCustom ? a.customData?.[sortConfig.key] ?? '' : a[sortConfig.key] ?? '';
                const bValue = isCustom ? b.customData?.[sortConfig.key] ?? '' : b[sortConfig.key] ?? '';

                let comparison = 0;

                if (aValue instanceof Date && bValue instanceof Date) {
                    comparison = aValue.getTime() - bValue.getTime();
                } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                    comparison = aValue - bValue;
                } else {
                    comparison = String(aValue).localeCompare(String(bValue), undefined, {numeric: true, sensitivity: 'base'});
                }
                
                if (comparison === 0) {
                    return (b.tradeDate?.getTime() || 0) - (a.tradeDate?.getTime() || 0);
                }

                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
        }
        return sortableTrades;
    }, [filteredTrades, sortConfig, customFields]);
    
    const performanceStats = useMemo(() => {
        const defaultStats = { netPnl: 0, tradeWinRate: 0, wins: 0, losses: 0, profitFactor: 0, dayWinRate: 0, profitableDays: 0, losingDays: 0, avgWinLossRatio: 0, avgWin: 0, avgLoss: 0, grossProfit: 0, grossLoss: 0, avgRiskReward: 0, totalLotUsed: 0 };
        if (!activeProfile) return defaultStats;
    
        const statsTrades = filteredTrades;
        if (statsTrades.length === 0) return defaultStats;
    
        const winningTrades = statsTrades.filter(t => parseFloat(t.pnl) > 0);
        const losingTrades = statsTrades.filter(t => parseFloat(t.pnl) < 0);
        const wins = winningTrades.length;
        const losses = losingTrades.length;
        const totalTrades = statsTrades.length;
        const grossProfit = winningTrades.reduce((s, t) => s + parseFloat(t.pnl), 0);
        const grossLoss = Math.abs(losingTrades.reduce((s, t) => s + parseFloat(t.pnl), 0));
        const netPnl = grossProfit - grossLoss;
        const tradeWinRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
        const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : Infinity;
        const avgWin = wins > 0 ? grossProfit / wins : 0;
        const avgLoss = losses > 0 ? -grossLoss / losses : 0;
        const avgWinLossRatio = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : Infinity;
        const dailyPnl = new Map();
        statsTrades.forEach(t => {
            const d = formatDate(t.tradeDate);
            if(d && d !== 'N/A') dailyPnl.set(d, (dailyPnl.get(d) || 0) + (parseFloat(t.pnl) || 0));
        });
        let pDays = 0, lDays = 0;
        dailyPnl.forEach(pnl => { if (pnl > 0) pDays++; else if (pnl < 0) lDays++; });
        const totalTradingDays = pDays + lDays;
        const dayWinRate = totalTradingDays > 0 ? (pDays / totalTradingDays) * 100 : 0;
        const tradesWithRR = statsTrades.map(t => parseFloat(t.riskRewardRatio) || 0).filter(rr => rr > 0);
        const totalRR = tradesWithRR.reduce((s, rr) => s + rr, 0);
        const avgRiskReward = tradesWithRR.length > 0 ? totalRR / tradesWithRR.length : 0;
        const totalLotUsed = statsTrades.reduce((s, t) => s + (parseFloat(t.lotSize) || 0), 0);
    
        return { netPnl, tradeWinRate, wins, losses, profitFactor, dayWinRate, profitableDays: pDays, losingDays: lDays, avgWinLossRatio, avgWin, avgLoss, grossProfit, grossLoss, avgRiskReward, totalLotUsed };
    }, [filteredTrades, activeProfile]);
    
    const accountStats = useMemo(() => { 
        if (!activeProfile) return {accountBalanceData: []}; 
        
        const allTradesForProfile = trades; // All trades for the current profile
        const allTransactionsForProfile = balanceTransactions; // All transactions for the current profile

        const combinedEvents = [
            ...allTradesForProfile.map(t => ({ type: 'trade', date: t.tradeDate, pnl: t.pnl })),
            ...allTransactionsForProfile.map(t => ({ type: t.type, date: t.date, amount: t.amount }))
        ].sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));

        let cumulativeBalance = 0;
        const data = [{ name: 'Initial', balance: 0 }];

        combinedEvents.forEach(e => {
            if (e.type === 'trade') {
                cumulativeBalance += parseFloat(e.pnl) || 0;
            } else if (e.type === 'deposit') {
                cumulativeBalance += parseFloat(e.amount) || 0;
            } else if (e.type === 'withdrawal') {
                cumulativeBalance -= parseFloat(e.amount) || 0;
            }
            data.push({ name: formatDate(e.date), balance: cumulativeBalance });
        });

        // Filter data based on active period for display
        const periodFilteredData = () => {
             if (activePeriod === 'all') return data;
             const now = new Date();
             let startOfPeriod = new Date(now);
             switch(activePeriod){ 
                case 'daily': startOfPeriod.setHours(0,0,0,0); break; 
                case 'weekly': const d=now.getDay();startOfPeriod.setDate(now.getDate()-d+(d===0?-6:1));startOfPeriod.setHours(0,0,0,0); break; 
                case 'monthly': startOfPeriod.setDate(1);startOfPeriod.setHours(0,0,0,0); break; 
                case 'yearly': startOfPeriod.setMonth(0,1);startOfPeriod.setHours(0,0,0,0); break; 
                default: break; 
            }
            
            // Find the last balance entry before the start of the period to use as the initial balance for the chart
            const lastBalanceBeforePeriod = [...data].reverse().find(d => new Date(d.name).getTime() < startOfPeriod.getTime());
            const initialChartBalance = lastBalanceBeforePeriod ? lastBalanceBeforePeriod.balance : 0;
            
            const filteredData = data.filter(d => new Date(d.name).getTime() >= startOfPeriod.getTime());
            return [{ name: 'Start', balance: initialChartBalance }, ...filteredData];
        }

        return { accountBalanceData: periodFilteredData() }; 
    }, [trades, balanceTransactions, activeProfile, activePeriod]);
    
    const currentBalance = accountStats.accountBalanceData.slice(-1)[0]?.balance || 0;

    // --- RENDER LOGIC ---
    if (!isAuthReady || isLoading) { return <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-gray-900 dark:text-white">Memuat Autentikasi...</div>; }
    
    if (!user) {
        return <LoginPage onLogin={handleLogin} error={loginError} theme={theme} onToggleTheme={handleToggleTheme}/>;
    }
    
    if (isAuthReady && !isLoading && tradingProfiles.length === 0) {
        return <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center text-gray-900 dark:text-white">
            {isProfileModalVisible && <ProfileManagementModal showToast={showToast} onClose={() => { setIsProfileModalVisible(false); refreshProfiles(); }} profiles={tradingProfiles} openDeleteModal={openDeleteModal} />}
            <Toast message={toast.message} type={toast.type} onClose={()=>setToast({message:'',type:''})} />
            <h2 className="text-2xl font-bold mb-4">Selamat Datang, {user.email}!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Untuk memulai, silakan buat profil trading pertama Anda.</p>
            <button onClick={() => setIsProfileModalVisible(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                <PlusCircle size={20} className="mr-2"/> Buat Profil Trading
            </button>
        </div>
    }
    
    const SidebarContent = () => (
        <>
            <a href="https://www.instagram.com/deolukow_" target="_blank" rel="noopener noreferrer" className="block mb-4 hover:opacity-80 transition-opacity">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wz<span className="text-blue-500 dark:text-blue-400">Gold</span> Trading Jurnal</h1>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">created by Deo Lukow (2025)</p>
            </a>
            <div className="mb-4">
                 <ProfileSelector profiles={tradingProfiles} activeProfile={activeProfile} onSelectProfile={handleSelectProfile} onManageProfiles={() => { setIsProfileModalVisible(true); setIsSidebarOpen(false); }} />
            </div>
            <button onClick={()=> { setEditingTrade(null); setIsTradeFormVisible(true); setIsSidebarOpen(false); }} className="w-full px-4 py-3 mb-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg flex items-center justify-center text-sm font-semibold"><PlusCircle size={18} className="mr-2"/> Tambah Trade</button>
            <nav className="flex-grow">
                <ul>
                    <SidebarLink icon={<LayoutDashboard size={20}/>} text="Dashboard" active={activeView === 'dashboard'} onClick={() => { setActiveView('dashboard'); setIsSidebarOpen(false); }} />
                    <SidebarLink icon={<CalendarDays size={20}/>} text="Kalender" active={activeView === 'calendar'} onClick={() => { setActiveView('calendar'); setIsSidebarOpen(false); }} />
                    <SidebarLink icon={<Image size={20}/>} text="Galeri Trade" active={activeView === 'gallery'} onClick={() => { setActiveView('gallery'); setActivePeriod('all'); setIsSidebarOpen(false); }} />
                </ul>
                <ul className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <li className="px-3 pb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Alat Bantu</li>
                    <li className={`mb-2`}><a href="#" onClick={() => { setIsGoalModalVisible(true); setIsSidebarOpen(false); }} className={`flex items-center p-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white`}><TrendingUp size={20} className="text-yellow-500 dark:text-yellow-400"/><span className="ml-3">Tetapkan Target</span></a></li>
                    <li className={`mb-2`}><a href="#" onClick={() => { setIsCalculatorVisible(true); setIsSidebarOpen(false); }} className={`flex items-center p-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white`}><Calculator size={20} className="text-green-500 dark:text-green-400"/><span className="ml-3">Kalkulator Lot Size</span></a></li>
                    <li className={`mb-2`}><a href="#" onClick={() => { setIsPairModalVisible(true); setIsSidebarOpen(false); }} className={`flex items-center p-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white`}><Target size={20} className="text-yellow-500 dark:text-yellow-400"/><span className="ml-3">Kelola Pair</span></a></li>
                    <li className={`mb-2`}><a href="#" onClick={() => { setIsTemplateModalVisible(true); setIsSidebarOpen(false); }} className={`flex items-center p-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white`}><Zap size={20} className="text-blue-500 dark:text-blue-400"/><span className="ml-3">Kelola Template</span></a></li>
                    <li className={`mb-2`}><a href="#" onClick={() => { setIsCustomFieldModalVisible(true); setIsSidebarOpen(false); }} className={`flex items-center p-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white`}><ListPlus size={20} className="text-indigo-500 dark:text-indigo-400"/><span className="ml-3">Kelola Field Tambahan</span></a></li>
                </ul>
            </nav>
            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                 <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 truncate" title={user.email}>Masuk sebagai: {user.email}</div>
                 <button onClick={handleLogout} className="w-full flex items-center p-3 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20">
                    <LogOut size={20}/>
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
                <Toast message={toast.message} type={toast.type} onClose={()=>setToast({message:'',type:''})} />
                <ConfirmationModal isOpen={isDeleteModalOpen} onClose={()=>setIsDeleteModalOpen(false)} onConfirm={handleDeleteItem} title="Konfirmasi Hapus" message={`Yakin ingin menghapus ${itemToDelete?.type} ini? Aksi ini tidak dapat dibatalkan.`} />
                
                {activeProfile && isTradeFormVisible && <TradeForm onSaveTrade={handleSaveTrade} editingTrade={editingTrade} onCancelEdit={() => {setEditingTrade(null); setIsTradeFormVisible(false);}} pairs={pairs} templates={templates} customFields={customFields} activeProfileId={activeProfile.id} />}
                {viewingTrade && <TradeDetailModal trade={viewingTrade} onClose={() => setViewingTrade(null)} customFields={customFields} currency={activeProfile?.currency} />}
                {activeProfile && isCalculatorVisible && <LotSizeCalculatorModal isOpen={isCalculatorVisible} onClose={() => setIsCalculatorVisible(false)} currentBalance={currentBalance} currency={activeProfile?.currency} />}
                {activeProfile && isGoalModalVisible && <GoalSettingModal activeProfileId={activeProfile.id} showToast={showToast} onClose={() => {setIsGoalModalVisible(false); refreshAllData(activeProfile.id);}} currentGoal={goalSettings} currency={activeProfile?.currency} />}
                {activeProfile && isTransactionModalVisible && <BalanceTransactionModal activeProfileId={activeProfile.id} showToast={showToast} onClose={() => {setIsTransactionModalVisible(false); refreshAllData(activeProfile.id);}} openDeleteModal={openDeleteModal} currency={activeProfile?.currency} />}
                {activeProfile && isPairModalVisible && <PairManagementModal activeProfileId={activeProfile.id} showToast={showToast} onClose={() => {setIsPairModalVisible(false); refreshAllData(activeProfile.id);}} pairs={pairs} openDeleteModal={openDeleteModal} />}
                {activeProfile && isTemplateModalVisible && <TemplateManagementModal activeProfileId={activeProfile.id} showToast={showToast} onClose={() => {setIsTemplateModalVisible(false); refreshAllData(activeProfile.id);}} templates={templates} openDeleteModal={openDeleteModal} />}
                {activeProfile && isCustomFieldModalVisible && <CustomFieldManagementModal activeProfileId={activeProfile.id} showToast={showToast} onClose={() => {setIsCustomFieldModalVisible(false); refreshAllData(activeProfile.id);}} customFields={customFields} openDeleteModal={openDeleteModal} />}
                {isProfileModalVisible && <ProfileManagementModal showToast={showToast} onClose={() => {setIsProfileModalVisible(false); refreshProfiles();}} profiles={tradingProfiles} openDeleteModal={openDeleteModal} />}
                
                {/* Mobile Sidebar */}
                {isSidebarOpen && (
                    <>
                        <div className="fixed inset-0 bg-black bg-opacity-75 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
                        <aside className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 p-4 z-50 flex flex-col md:hidden animate-slideIn overflow-y-auto">
                            <SidebarContent />
                        </aside>
                    </>
                )}

                {/* Desktop Sidebar */}
                <aside className="w-64 bg-white dark:bg-gray-800 p-4 flex-shrink-0 flex-col hidden md:flex overflow-y-auto">
                    <SidebarContent />
                </aside>

                <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto">
                    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <div className="flex items-center gap-4">
                            <button className="md:hidden text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white" onClick={() => setIsSidebarOpen(true)}>
                                <Menu size={28} />
                            </button>
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
                                {activeView === 'dashboard' ? 'Dashboard' : activeView === 'calendar' ? 'Kalender Trade' : 'Galeri Trade'}
                            </h2>
                        </div>
                        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                            <ThemeSwitcher theme={theme} onToggle={handleToggleTheme} />
                             <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center border border-gray-200 dark:border-gray-700">
                                <div className="text-xs text-gray-500 dark:text-gray-400">Saldo Saat Ini</div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(currentBalance, activeProfile?.currency)}</div>
                            </div>
                            <button onClick={() => setIsTransactionModalVisible(true)} className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg flex items-center text-sm font-semibold"><Wallet size={16} className="mr-2"/> Kelola Saldo</button>
                        </div>
                    </header>

                    <div className="flex-grow">
                        {activeView === 'dashboard' && (
                            <>
                                <div className="flex space-x-1 sm:space-x-2 p-1 bg-gray-200 dark:bg-gray-800 rounded-xl mb-6">
                                    {periods.map(p => (
                                        <button key={p.key} onClick={() => setActivePeriod(p.key)} className={classNames("px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors flex-grow", activePeriod === p.key ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700')}>
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                                
                                <GoalProgress goal={goalSettings} currentPnl={performanceStats.netPnl} period={activePeriod} currency={activeProfile?.currency} />
                                {activePeriod === 'daily' && <DailyGoalProgress goal={goalSettings} currentPnl={performanceStats.netPnl} currency={activeProfile?.currency} />}
                                <StatisticsDashboard stats={performanceStats} currency={activeProfile?.currency} />
                                <AccountBalanceChart data={accountStats.accountBalanceData} period={activePeriod} currency={activeProfile?.currency} theme={theme} />
                                <TradeList 
                                    trades={sortedTrades} 
                                    onView={handleShowTradeDetail} 
                                    onEdit={(t)=> {setEditingTrade(t); setIsTradeFormVisible(true);}} 
                                    onDelete={(type, data) => openDeleteModal(type, data)} 
                                    title={`Riwayat Trade (${periods.find(p => p.key === activePeriod)?.label})`}
                                    requestSort={requestSort}
                                    sortConfig={sortConfig}
                                    customFields={customFields}
                                    currency={activeProfile?.currency}
                                 />
                            </>
                        )}

                        {activeView === 'calendar' && (<CalendarView trades={trades} onView={handleShowTradeDetail} onEdit={(t)=> {setEditingTrade(t); setIsTradeFormVisible(true);}} onDelete={(type, data) => openDeleteModal(type, data)} customFields={customFields} currency={activeProfile?.currency} />)}
                        {activeView === 'gallery' && (<GalleryView trades={filteredTrades} activePeriod={activePeriod} setActivePeriod={setActivePeriod} periods={periods} onShowTradeDetail={handleShowTradeDetail} currency={activeProfile?.currency}/>)}
                    </div>
                </main>
            </div>
        </>
    );
}

export default App;






