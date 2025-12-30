/**
 * IndexedDB Wrapper for Email Caching
 *
 * Provides a simple API to store and retrieve emails, email lists, and mailboxes
 * in the browser's IndexedDB for offline access and performance optimization.
 *
 * Database Structure:
 * - Store: "emails" → Individual email details (key: messageId)
 * - Store: "emailLists" → Lists of emails by mailbox (key: mailboxId:pageToken)
 * - Store: "mailboxes" → Mailbox metadata (key: "mailboxes")
 * - Store: "metadata" → Cache timestamps and versioning (key: various)
 */

const DB_NAME = 'GmailCacheDB';
const DB_VERSION = 1;

// Store names
export const STORES = {
  EMAILS: 'emails',
  EMAIL_LISTS: 'emailLists',
  MAILBOXES: 'mailboxes',
  METADATA: 'metadata',
} as const;

// Cache TTL (Time To Live) - how long before cache is considered stale
export const CACHE_TTL = {
  EMAILS: 1000 * 60 * 30, // 30 minutes for email details
  EMAIL_LISTS: 1000 * 60 * 5, // 5 minutes for email lists
  MAILBOXES: 1000 * 60 * 10, // 10 minutes for mailbox list
} as const;

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize and open the IndexedDB database
 * Creates object stores if they don't exist
 */
export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB failed to open:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    // Create object stores on first run or version upgrade
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Store for individual email details
      if (!db.objectStoreNames.contains(STORES.EMAILS)) {
        const emailStore = db.createObjectStore(STORES.EMAILS, {
          keyPath: 'id',
        });
        emailStore.createIndex('timestamp', 'cachedAt', { unique: false });
      }

      // Store for email lists (paginated)
      if (!db.objectStoreNames.contains(STORES.EMAIL_LISTS)) {
        const listStore = db.createObjectStore(STORES.EMAIL_LISTS, {
          keyPath: 'cacheKey',
        });
        listStore.createIndex('mailboxId', 'mailboxId', { unique: false });
        listStore.createIndex('timestamp', 'cachedAt', { unique: false });
      }

      // Store for mailboxes
      if (!db.objectStoreNames.contains(STORES.MAILBOXES)) {
        db.createObjectStore(STORES.MAILBOXES, { keyPath: 'cacheKey' });
      }

      // Store for metadata (cache timestamps, versions, etc.)
      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
      }

      console.log('IndexedDB stores created successfully');
    };
  });
};

/**
 * Generic get function for any store
 */
export const getFromStore = async <T>(
  storeName: string,
  key: string
): Promise<T | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error getting from ${storeName}:`, error);
    return null;
  }
};

/**
 * Generic set function for any store
 */
export const setInStore = async <T>(
  storeName: string,
  data: T
): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    store.put(data);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error(`Error setting in ${storeName}:`, error);
    throw error;
  }
};

/**
 * Generic delete function for any store
 */
export const deleteFromStore = async (
  storeName: string,
  key: string
): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    store.delete(key);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error(`Error deleting from ${storeName}:`, error);
  }
};

/**
 * Clear all data from a specific store
 */
export const clearStore = async (storeName: string): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    store.clear();

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error(`Error clearing ${storeName}:`, error);
  }
};

/**
 * Clear all cached data (useful on logout)
 */
export const clearAllCache = async (): Promise<void> => {
  await Promise.all([
    clearStore(STORES.EMAILS),
    clearStore(STORES.EMAIL_LISTS),
    clearStore(STORES.MAILBOXES),
    clearStore(STORES.METADATA),
  ]);
  console.log('All cache cleared');
};

/**
 * Get all items from a store (useful for debugging or bulk operations)
 */
export const getAllFromStore = async <T>(storeName: string): Promise<T[]> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error getting all from ${storeName}:`, error);
    return [];
  }
};

/**
 * Check if cached data is still fresh (not stale)
 */
export const isCacheFresh = (cachedAt: number, ttl: number): boolean => {
  const now = Date.now();
  return now - cachedAt < ttl;
};

/**
 * Delete old/stale entries from a store based on timestamp index
 * Useful for periodic cleanup to prevent unlimited growth
 */
export const deleteStaleEntries = async (
  storeName: string,
  ttl: number
): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const index = store.index('timestamp');
    const now = Date.now();
    const cutoff = now - ttl;

    const request = index.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const cachedAt = cursor.value.cachedAt;
        if (cachedAt < cutoff) {
          cursor.delete();
        }
        cursor.continue();
      }
    };

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error(`Error deleting stale entries from ${storeName}:`, error);
  }
};
