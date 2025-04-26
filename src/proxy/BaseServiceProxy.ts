import AsyncStorage from '@react-native-async-storage/async-storage';

export abstract class BaseServiceProxy {
  protected async getFromCache<T>(key: string): Promise<T | null> {
    try {
      const cachedItemString = await AsyncStorage.getItem(key);
      if (!cachedItemString) return null;
      try {
        const parsed = JSON.parse(cachedItemString);
        if (parsed.data !== undefined) {
          return parsed.data as T;
        }
        return parsed as T;
      } catch (e) {
        console.error('Invalid cache format:', e);
        return null;
      }
    } catch (error) {
      console.error('Lỗi đọc cache:', error);
      return null;
    }
  }
  
  protected async saveToCache<T>(key: string, data: T): Promise<void> {
    try {
      // Store with timestamp to support cache eviction strategies
      const cacheItem = {
        data,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      await this.handleStorageError();
    }
  }
  
  protected async saveToDirectCache<T>(key: string, data: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(data);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      await this.handleStorageError();
    }
  }
  
  protected async handleStorageError(): Promise<void> {
    try {
      const cacheKeys = await AsyncStorage.getAllKeys();
      if (cacheKeys.length > 0) {
        // Strategy 1: Remove oldest item
        const cacheItems = await AsyncStorage.multiGet(cacheKeys);
        let oldestKey = cacheKeys[0];
        let oldestTime = Infinity;
        
        cacheItems.forEach(([key, value]) => {
          if (value) {
            try {
              const parsed = JSON.parse(value);
              if (parsed.timestamp && parsed.timestamp < oldestTime) {
                oldestTime = parsed.timestamp;
                oldestKey = key;
              }
            } catch (e) {
              // If we can't parse it, consider it a candidate for removal
              oldestKey = key;
            }
          }
        });
        
        // Remove the oldest item
        await AsyncStorage.removeItem(oldestKey);
      }
    } catch (e) {
      console.error('Lỗi khi xử lý lỗi lưu trữ:', e);
    }
  }

  async clearAllCache(): Promise<void> {
    try {
      const cacheKeys = await AsyncStorage.getAllKeys();
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
      console.log('Đã xóa toàn bộ cache');
    } catch (error) {
      console.error('Lỗi khi xóa cache:', error);
    }
  }
  
  async clearCacheByKey(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Lỗi khi xóa cache key ${key}:`, error);
      return false;
    }
  }
}
