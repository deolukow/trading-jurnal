// --- IndexedDB HELPER FUNCTIONS for ALL Local Storage ---
const DB_NAME = "WzGoldTradingJournalDB";
const DB_VERSION = 2; // Upgrade version to support strategies store
let dbInstance = null;

const ALL_STORES = [
  "profiles",
  "trades",
  "balance_transactions",
  "pairs",
  "templates",
  "custom_fields",
  "goals",
  "trade_images",
  "strategies", // New store for strategies
];

export const initDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      ALL_STORES.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: "id" });
          if (
            [
              "trades",
              "balance_transactions",
              "pairs",
              "templates",
              "custom_fields",
              "goals",
              "strategies",
            ].includes(storeName)
          ) {
            store.createIndex("profileId", "profileId", { unique: false });
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
  return initDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction(storeName, mode);
          const store = transaction.objectStore(storeName);
          action(store, resolve, reject);
        } catch (error) {
          reject(error);
        }
      }),
  );
};

export const addItem = (storeName, item) =>
  dbAction(storeName, "readwrite", (store, resolve) => {
    const request = store.add(item);
    request.onsuccess = () => resolve(request.result);
  });

export const updateItem = (storeName, item) =>
  dbAction(storeName, "readwrite", (store, resolve) => {
    const request = store.put(item);
    request.onsuccess = () => resolve(request.result);
  });

export const deleteItem = (storeName, id) =>
  dbAction(storeName, "readwrite", (store, resolve) => {
    store.delete(id).onsuccess = () => resolve(true);
  });

export const getItem = (storeName, id) =>
  dbAction(storeName, "readonly", (store, resolve) => {
    store.get(id).onsuccess = (e) => resolve(e.target.result);
  });

export const getAllItems = (storeName) =>
  dbAction(storeName, "readonly", (store, resolve) => {
    store.getAll().onsuccess = (e) => resolve(e.target.result);
  });

export const getItemsByProfileId = (storeName, profileId) =>
  dbAction(storeName, "readonly", (store, resolve) => {
    const index = store.index("profileId");
    index.getAll(profileId).onsuccess = (e) => resolve(e.target.result);
  });

export const exportIndexedDB = async () => {
  const backup = {
    version: 2,
    timestamp: Date.now(),
    stores: {}
  };

  for (const storeName of ALL_STORES) {
    const items = await getAllItems(storeName);
    if (storeName === "trade_images") {
      const processedItems = [];
      for (const item of items) {
        if (item.file) {
          try {
            const base64 = await blobToBase64(item.file);
            processedItems.push({
              id: item.id,
              base64: base64,
              name: item.file.name || "screenshot.png",
              type: item.file.type || "image/png"
            });
          } catch (err) {
            console.error("Failed to convert image to base64:", err);
          }
        }
      }
      backup.stores[storeName] = processedItems;
    } else {
      backup.stores[storeName] = items;
    }
  }

  return backup;
};

export const importIndexedDB = async (backupData) => {
  if (!backupData || !backupData.stores) {
    throw new Error("Format data cadangan tidak valid.");
  }

  await initDB();

  for (const storeName of ALL_STORES) {
    const items = backupData.stores[storeName];
    if (!items) continue;

    // Clear current store entries
    await dbAction(storeName, "readwrite", (store, resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });

    // Populate with imported entries
    for (let item of items) {
      if (storeName === "trade_images" && item.base64) {
        try {
          const blob = base64ToBlob(item.base64);
          const file = new File([blob], item.name || "screenshot.png", { type: item.type || "image/png" });
          item = {
            id: item.id,
            file: file
          };
        } catch (err) {
          console.error("Failed to restore image from base64:", err);
          continue;
        }
      }
      
      await dbAction(storeName, "readwrite", (store, resolve, reject) => {
        const request = store.put(item);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
  }

  return true;
};

// Base64 helper conversion utilities
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const base64ToBlob = (base64DataUrl) => {
  const parts = base64DataUrl.split(",");
  if (parts.length < 2) throw new Error("Invalid base64 format");
  const mime = parts[0].match(/:(.*?);/)[1];
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

