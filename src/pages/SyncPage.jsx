import React, { useState, useEffect } from "react";
import {
  Cloud,
  Database,
  CloudRain,
  Loader2,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Key,
  RefreshCw,
  ArrowDownCircle,
  ArrowUpCircle
} from "lucide-react";
import { exportIndexedDB, importIndexedDB } from "../config/db";

// Placeholder standard client ID in case user doesn't have one
// (This would be pre-registered by developer, but they can input their own)
const DEFAULT_CLIENT_ID = "713176227043-71hterdm3emrl9jrcsm25ptu18510umk.apps.googleusercontent.com";

export const SyncPage = ({ activeProfile, showToast, onRefresh }) => {
  const [clientId, setClientId] = useState(() => {
    return localStorage.getItem("gdrive_sync_client_id") || DEFAULT_CLIENT_ID;
  });
  const [accessToken, setAccessToken] = useState(() => {
    return localStorage.getItem("gdrive_sync_token") || "";
  });
  const [userInfo, setUserInfo] = useState(() => {
    try {
      const saved = localStorage.getItem("gdrive_connected_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudBackupInfo, setCloudBackupInfo] = useState(null);
  const [localLastSync, setLocalLastSync] = useState(() => {
    if (!activeProfile) return "";
    return localStorage.getItem(`gdrive_last_sync_${activeProfile.id}`) || "Belum pernah sinkron";
  });
  const [showConfigHelp, setShowConfigHelp] = useState(false);

  // Load user profile information if access token exists
  useEffect(() => {
    if (accessToken) {
      fetchUserInfo();
      fetchBackupFileInfo();
    } else {
      setUserInfo(null);
      setCloudBackupInfo(null);
    }
  }, [accessToken]);

  // Fetch user info from Google OAuth API
  const fetchUserInfo = async () => {
    try {
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserInfo(data);
        localStorage.setItem("gdrive_connected_user", JSON.stringify(data));
      } else {
        // Token expired
        handleLogout();
      }
    } catch (e) {
      console.error("Failed to fetch user info:", e);
    }
  };

  // Scan drive appDataFolder for existing backup
  const fetchBackupFileInfo = async () => {
    try {
      const res = await fetch(
        "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name,modifiedTime,size)",
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      if (res.ok) {
        const data = await res.json();
        const backupFile = data.files.find(f => f.name === "trading_journal_backup.json");
        if (backupFile) {
          setCloudBackupInfo(backupFile);
        } else {
          setCloudBackupInfo(null);
        }
      }
    } catch (e) {
      console.error("Failed to fetch backup file info:", e);
    }
  };

  // Trigger Google Identity Services Login flow
  const handleConnect = () => {
    if (!clientId) {
      showToast("Silakan masukkan Client ID terlebih dahulu.", "error");
      return;
    }

    setIsConnecting(true);

    try {
      if (!window.google) {
        showToast("Script Google API belum dimuat. Silakan tunggu sebentar.", "error");
        setIsConnecting(false);
        return;
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
        callback: (response) => {
          setIsConnecting(false);
          if (response && response.access_token) {
            localStorage.setItem("gdrive_sync_token", response.access_token);
            setAccessToken(response.access_token);
            showToast("Berhasil terhubung ke Google Drive!", "success");
          } else {
            showToast("Gagal mendapatkan izin akses dari Google.", "error");
          }
        },
        error_callback: (err) => {
          setIsConnecting(false);
          console.error(err);
          showToast("Terjadi kesalahan saat otentikasi Google.", "error");
        }
      });

      client.requestAccessToken();
    } catch (err) {
      setIsConnecting(false);
      console.error(err);
      showToast("Gagal memicu masuk Google. Periksa Client ID Anda.", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("gdrive_sync_token");
    localStorage.removeItem("gdrive_connected_user");
    setAccessToken("");
    setUserInfo(null);
    setCloudBackupInfo(null);
    showToast("Terputus dari Google Drive.", "info");
  };

  const handleSaveClientId = (newId) => {
    setClientId(newId);
    localStorage.setItem("gdrive_sync_client_id", newId);
    showToast("Client ID berhasil disimpan!", "success");
  };

  // Upload database to Google Drive appDataFolder
  const handleBackup = async () => {
    if (!accessToken || !activeProfile) return;
    setIsSyncing(true);

    try {
      showToast("Sedang mengekspor database lokal...", "info");
      const backupData = await exportIndexedDB();

      // Check if file already exists in cloud
      let fileId = cloudBackupInfo?.id;
      if (!fileId) {
        // Re-scan just to be sure
        const scanRes = await fetch(
          "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name)",
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );
        if (scanRes.ok) {
          const data = await scanRes.json();
          const backupFile = data.files.find(f => f.name === "trading_journal_backup.json");
          fileId = backupFile?.id;
        }
      }

      const fileMetadata = {
        name: "trading_journal_backup.json",
        parents: ["appDataFolder"]
      };

      const fileContent = JSON.stringify(backupData);
      const fileBlob = new Blob([fileContent], { type: "application/json" });
      const form = new FormData();

      let uploadRes;
      if (fileId) {
        // UPDATE (PATCH) Existing file
        showToast("Mengunggah cadangan terbaru...", "info");
        uploadRes = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            },
            body: fileBlob
          }
        );
      } else {
        // CREATE (POST) New file
        showToast("Membuat file cadangan baru di cloud...", "info");
        form.append("metadata", new Blob([JSON.stringify(fileMetadata)], { type: "application/json" }));
        form.append("file", fileBlob);

        uploadRes = await fetch(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
            body: form
          }
        );
      }

      if (uploadRes.ok) {
        const now = new Date().toLocaleString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
        localStorage.setItem(`gdrive_last_sync_${activeProfile.id}`, now);
        setLocalLastSync(now);
        await fetchBackupFileInfo();
        showToast("Cadangan berhasil diunggah ke Google Drive!", "success");
      } else {
        throw new Error("Failed to upload to Drive REST endpoint");
      }
    } catch (e) {
      console.error(e);
      showToast("Gagal melakukan pencadangan data.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  // Download and import database from Google Drive
  const handleRestore = async () => {
    if (!accessToken || !cloudBackupInfo || !activeProfile) return;

    const confirmRestore = window.confirm(
      "PERHATIAN! Mengimpor data cadangan akan menghapus seluruh data lokal Anda saat ini pada perangkat ini dan menggantikannya dengan data cadangan dari Google Drive.\n\nApakah Anda yakin ingin melanjutkan?"
    );
    if (!confirmRestore) return;

    setIsSyncing(true);

    try {
      showToast("Sedang mengunduh file cadangan dari cloud...", "info");
      const downloadRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${cloudBackupInfo.id}?alt=media`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (downloadRes.ok) {
        const backupData = await downloadRes.json();
        showToast("Mempopulasikan database lokal (IndexedDB)...", "info");
        await importIndexedDB(backupData);

        const now = new Date().toLocaleString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
        localStorage.setItem(`gdrive_last_sync_${activeProfile.id}`, now);
        setLocalLastSync(now);

        showToast("Pemulihan data sukses! Aplikasi akan dimuat ulang...", "success");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error("Failed to download from Drive REST endpoint");
      }
    } catch (e) {
      console.error(e);
      showToast("Gagal memulihkan data dari cloud.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 animate-fadeIn select-none text-gray-900 dark:text-gray-100">
      {/* Intro Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-violet-600/10 rounded-xl text-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.2)]">
          <Cloud size={28} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Sinkronisasi Cloud (Google Drive)</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Cadangkan data & gambar trading Anda secara gratis dan aman ke Google Drive pribadi Anda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Status Connection card */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Card: Connection Status */}
          <div className="bg-white/60 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-md p-6 rounded-2xl shadow-xl flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Database size={18} className="text-violet-500" />
                  Koneksi Google Account
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Hubungkan dengan akun Google Anda untuk mengakses folder aman Google Drive.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${accessToken ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {accessToken ? "Tersambung" : "Terputus"}
                </span>
              </div>
            </div>

            {accessToken && userInfo ? (
              <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200/50 dark:border-gray-700/50 p-4 rounded-xl flex items-center gap-4 mb-6">
                {userInfo.picture ? (
                  <img src={userInfo.picture} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-violet-500" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-lg">
                    {userInfo.name?.[0] || "U"}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-sm font-bold truncate">{userInfo.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userInfo.email}</p>
                </div>
              </div>
            ) : (
              <div className="min-h-[80px] flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-700 rounded-xl mb-6">
                <p className="text-xs text-gray-400 dark:text-gray-500 italic text-center p-4">
                  Google Drive belum terhubung. Klik tombol di bawah untuk menyambungkan akun Google Anda secara aman.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 select-none">
              {accessToken ? (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                >
                  Putuskan Koneksi
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-[0_0_12px_rgba(139,92,246,0.3)] transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Sedang Menghubungkan...
                    </>
                  ) : (
                    <>
                      <Cloud size={16} /> Hubungkan Google Drive
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Card: Sync Backup & Restore Operations */}
          <div className="bg-white/60 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-md p-6 rounded-2xl shadow-xl flex flex-col justify-between flex-grow">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2 mb-2">
                <RefreshCw size={18} className="text-violet-500" />
                Cadangkan & Pulihkan Jurnal
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                Lakukan pengunggahan data lokal Anda saat ini ke cloud atau unduh data cadangan dari cloud ke perangkat ini.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Box: Upload to Cloud */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200/50 dark:border-gray-700/50 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500 block mb-1">
                    Cadangkan Lokal ke Cloud
                  </span>
                  <h4 className="font-bold text-sm mb-2">Unggah Data Jurnal</h4>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-4">
                    Mengemas semua log trade, custom layout, profil, pair, dan gambar dari perangkat ini untuk disimpan aman di cloud Google Drive.
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-2">
                    Lokal Sinkron Terakhir: <strong className="text-gray-600 dark:text-gray-300">{localLastSync}</strong>
                  </p>
                  <button
                    onClick={handleBackup}
                    disabled={!accessToken || isSyncing}
                    className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${!accessToken
                      ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-300 dark:border-gray-700"
                      : "bg-violet-600 hover:bg-violet-500 text-white shadow hover:shadow-[0_0_10px_rgba(139,92,246,0.25)] cursor-pointer active:scale-95"
                      }`}
                  >
                    {isSyncing ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <ArrowUpCircle size={14} />
                    )}
                    Cadangkan ke Cloud (Upload)
                  </button>
                </div>
              </div>

              {/* Box: Download from Cloud */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200/50 dark:border-gray-700/50 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500 block mb-1">
                    Pulihkan Cloud ke Lokal
                  </span>
                  <h4 className="font-bold text-sm mb-2">Impor Data Jurnal</h4>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-4">
                    Mengunduh data cadangan dari Google Drive untuk dipulihkan di perangkat ini. Tindakan ini akan menimpa data lokal.
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-2">
                    Cadangan Cloud Ditemukan: <strong className="text-gray-600 dark:text-gray-300">{cloudBackupInfo ? new Date(cloudBackupInfo.modifiedTime).toLocaleString("id-ID") : "Tidak ditemukan"}</strong>
                  </p>
                  <button
                    onClick={handleRestore}
                    disabled={!accessToken || !cloudBackupInfo || isSyncing}
                    className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${!accessToken || !cloudBackupInfo
                      ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-300 dark:border-gray-700"
                      : "bg-blue-600 hover:bg-blue-500 text-white shadow hover:shadow-[0_0_10px_rgba(59,130,246,0.25)] cursor-pointer active:scale-95"
                      }`}
                  >
                    {isSyncing ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <ArrowDownCircle size={14} />
                    )}
                    Impor dari Cloud (Download)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Configuration & Guides Card */}
        <div className="flex flex-col gap-6">
          {/* Card: Client ID configuration */}
          <div className="bg-white/60 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-md p-6 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2 mb-2">
                <Key size={16} className="text-violet-500 animate-pulse" />
                Google Client ID
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                Client ID mengidentifikasi aplikasi ini di sistem Google. Anda dapat memasukkan Client ID buatan sendiri agar 100% independen & gratis.
              </p>

              <div className="flex flex-col gap-2 mb-4">
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Masukkan Google Client ID Anda..."
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-200 focus:outline-none"
                />
                {clientId !== DEFAULT_CLIENT_ID && (
                  <button
                    onClick={() => handleSaveClientId(DEFAULT_CLIENT_ID)}
                    className="text-[10px] text-left text-violet-500 hover:underline font-semibold cursor-pointer"
                  >
                    Gunakan Client ID Default Bawaan
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleSaveClientId(clientId)}
                className="w-full py-2 bg-gray-150 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Simpan Client ID
              </button>

              <button
                onClick={() => setShowConfigHelp(!showConfigHelp)}
                className="w-full py-2 border border-dashed border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <HelpCircle size={14} />
                Cara Buat Client ID Gratis?
              </button>
            </div>
          </div>

          {/* Card: Helper Guides */}
          <div className="bg-white/60 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-md p-6 rounded-2xl shadow-xl flex-grow flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
                <HelpCircle size={16} className="text-violet-500" />
                Panduan Penting
              </h3>
              <ul className="text-[11px] text-gray-500 dark:text-gray-400 flex flex-col gap-2.5 leading-relaxed list-disc pl-4 select-text">
                <li>
                  Data cadangan disimpan di area <strong>AppData</strong> Drive Anda. File backup tersembunyi sehingga aman dan tidak merusak space Drive utama.
                </li>
                <li>
                  Untuk sinkronisasi antarperangkat, pastikan Anda <strong>masuk dengan Akun Google yang sama</strong> di perangkat tujuan.
                </li>
                <li>
                  Cadangan ini mencakup <strong>semua biner gambar screenshot</strong> trading yang telah diunggah ke SOP Strategi dan trade.
                </li>
                <li>
                  Pastikan koneksi internet Anda stabil sebelum melakukan pencadangan atau pemulihan data cloud.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-down Guide Help Modal/Block */}
      {showConfigHelp && (
        <div className="mt-6 bg-white/70 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 p-6 rounded-2xl shadow-xl animate-fadeIn select-text text-xs leading-relaxed text-gray-600 dark:text-gray-400">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2 mb-3">
            <Key size={16} className="text-violet-500" />
            Langkah-Langkah Membuat Google Client ID Gratis (Hanya 2 Menit!):
          </h3>
          <ol className="list-decimal pl-5 flex flex-col gap-2">
            <li>
              Buka Google Cloud Console di <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-violet-500 hover:underline">https://console.cloud.google.com</a> dan masuk menggunakan akun Google Anda.
            </li>
            <li>
              Buat proyek baru dengan menekan opsi <strong>"Create Project"</strong> di bagian atas. Beri nama proyek bebas (contoh: <em>Jurnal Tradingku</em>).
            </li>
            <li>
              Masuk ke tab <strong>"APIs & Services"</strong> &gt; <strong>"OAuth Consent Screen"</strong>. Pilih tipe <strong>"External"</strong>, isi nama aplikasi dan email dukungan Anda, lalu klik simpan sampai selesai.
            </li>
            <li>
              Masuk ke tab <strong>"APIs & Services"</strong> &gt; <strong>"Credentials"</strong>. Klik <strong>"Create Credentials"</strong> di bagian atas and pilih <strong>"OAuth Client ID"</strong>.
            </li>
            <li>
              Pilih tipe aplikasi <strong>"Web Application"</strong>.
            </li>
            <li>
              Di bagian <strong>"Authorized JavaScript Origins"</strong>, masukkan asal domain aplikasi Anda saat dijalankan.
              <ul className="list-disc pl-5 mt-1 text-gray-400">
                <li>Untuk lokal (development): <code>http://localhost:5173</code></li>
                <li>Untuk deploy di GitHub Pages: Masukkan domain GH Pages Anda (contoh: <code>https://username.github.io</code>)</li>
              </ul>
            </li>
            <li>
              Klik **Create**. Anda akan langsung mendapatkan rangkaian kode **Client ID**! Salin dan tempelkan Client ID tersebut ke kolom konfigurasi di halaman ini, lalu klik **Simpan Client ID**.
            </li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default SyncPage;
