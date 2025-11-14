// IndexedDB utility for caching images data
const DB_NAME = 'DaklakImagesDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

class ImagesIndexedDBCache {
  constructor() {
    this.db = null;
    this.initPromise = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
    });
  }

  async get(key) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const result = req.result;
        if (result && this.isCacheValid(result)) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
    });
  }

  async set(key, data, ttl = 10 * 60 * 1000) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ key, data, timestamp: Date.now(), ttl });
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
    });
  }

  async delete(key) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
    });
  }

  async clear() {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
    });
  }

  async invalidateImagesCache(ethnic = null) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const items = req.result;
        
        // Filter items to delete based on ethnic parameter
        let itemsToDelete;
        if (ethnic) {
          // Delete only items matching this ethnic group
          itemsToDelete = items.filter(item => {
            // Match pattern: images_{ethnic}_{page}_{size}
            const ethnicPattern = `images_${ethnic}_`;
            return item.key.startsWith('images_') && item.key.includes(ethnicPattern);
          });
        } else {
          // Delete all images cache
          itemsToDelete = items.filter(item => item.key.startsWith('images_'));
        }
        
        const deletePromises = itemsToDelete.map(item => this.delete(item.key));
        
        Promise.all(deletePromises)
          .then(() => resolve())
          .catch(reject);
      };
    });
  }

  isCacheValid(cacheItem) {
    if (!cacheItem || !cacheItem.timestamp || !cacheItem.ttl) return false;
    return Date.now() - cacheItem.timestamp < cacheItem.ttl;
  }

  generateImagesKey(params = {}) {
    const { ethnic, page = 0, size = 10 } = params;
    return `images_${ethnic || 'ALL'}_${page}_${size}`;
  }
}

const imagesCache = new ImagesIndexedDBCache();
export default imagesCache;
