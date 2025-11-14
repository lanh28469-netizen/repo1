// IndexedDB utility for caching posts data
const DB_NAME = 'DaklakPostsDB';
const DB_VERSION = 1;
const STORE_NAME = 'posts';

class PostsIndexedDBCache {
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
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result && this.isCacheValid(result)) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
    });
  }

  async set(key, data, ttl = 5 * 60 * 1000) { // 5 minutes default TTL
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const cacheItem = {
        key,
        data,
        timestamp: Date.now(),
        ttl
      };
      const request = store.put(cacheItem);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(key) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear() {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  isCacheValid(cacheItem) {
    if (!cacheItem || !cacheItem.timestamp || !cacheItem.ttl) {
      return false;
    }
    return Date.now() - cacheItem.timestamp < cacheItem.ttl;
  }

  // Generate cache key for posts
  generatePostsKey(params = {}) {
    const { page = 0, size = 5, q = '', language } = params;
    return `posts_${page}_${size}_${q}_${language || 'vi'}`;
  }

  // Generate cache key for posts by category
  generatePostsByCategoryKey(params = {}) {
    const { page = 0, size = 10, category, language } = params;
    return `postsByCategory_${category}_${page}_${size}_${language || 'vi'}`;
  }

  // Invalidate all posts-related cache
  async invalidatePostsCache() {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const items = request.result;
        const deletePromises = items
          .filter(item => item.key.startsWith('posts_') || item.key.startsWith('postsByCategory_'))
          .map(item => this.delete(item.key));
        
        Promise.all(deletePromises)
          .then(() => resolve())
          .catch(reject);
      };
    });
  }

  // Invalidate specific category cache
  async invalidateCategoryCache(category) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const items = request.result;
        const deletePromises = items
          .filter(item => item.key.includes(`postsByCategory_${category}_`))
          .map(item => this.delete(item.key));
        
        Promise.all(deletePromises)
          .then(() => resolve())
          .catch(reject);
      };
    });
  }
}

// Create singleton instance
const postsCache = new PostsIndexedDBCache();

export default postsCache;
