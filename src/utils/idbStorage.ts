/**
 * IndexedDB Key-Value Storage Helper
 * Provides virtually unlimited browser storage for high-res images and custom course data,
 * bypassing localStorage's strict ~5MB quota limit.
 */

const DB_NAME = 'HealWithHeer_AppDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_key_value_store';

let dbInstance: IDBDatabase | null = null;
const memoryCache: Record<string, any> = {};

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      return resolve(dbInstance);
    }

    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not available'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.warn('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Saves a key-value item into IndexedDB and memory cache.
 */
export async function setDBItem(key: string, value: any): Promise<void> {
  memoryCache[key] = value;
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`IndexedDB save fallback for ${key}:`, err);
  }
}

/**
 * Gets a key-value item from memory cache or IndexedDB.
 */
export async function getDBItem<T = any>(key: string): Promise<T | null> {
  if (key in memoryCache) {
    return memoryCache[key] as T;
  }

  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        const result = req.result;
        if (result !== undefined) {
          memoryCache[key] = result;
          resolve(result as T);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn(`IndexedDB read fallback for ${key}:`, err);
    return null;
  }
}

/**
 * Synchronous get from memory cache (populated on app init or prior saves).
 */
export function getSyncMemoryItem<T = any>(key: string): T | null {
  return (key in memoryCache) ? (memoryCache[key] as T) : null;
}

/**
 * Deletes a key-value item from IndexedDB and memory cache.
 */
export async function deleteDBItem(key: string): Promise<void> {
  delete memoryCache[key];
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`IndexedDB delete fallback for ${key}:`, err);
  }
}

/**
 * Pre-warms memory cache from IndexedDB asynchronously at startup.
 */
export async function initStorageCache(keys: string[]): Promise<void> {
  for (const key of keys) {
    await getDBItem(key);
  }
}
