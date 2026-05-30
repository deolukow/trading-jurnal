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
