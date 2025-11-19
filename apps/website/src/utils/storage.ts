/**
 * Local Storage Helper
 *
 * Type-safe localStorage wrapper with error handling
 */

import { logger } from './logger';

export class StorageService {
  private static instance: StorageService;
  private storage: Storage | null = null;

  private constructor() {
    try {
      this.storage = window.localStorage;
      // Test if localStorage is available
      const test = '__storage_test__';
      this.storage.setItem(test, test);
      this.storage.removeItem(test);
    } catch (error) {
      logger.warn('localStorage not available', 'StorageService', error);
      this.storage = null;
    }
  }

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    return this.storage !== null;
  }

  /**
   * Get item from storage
   */
  get<T>(key: string, defaultValue?: T): T | undefined {
    if (!this.storage) {
      return defaultValue;
    }

    try {
      const item = this.storage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      logger.warn(`Failed to get item: ${key}`, 'StorageService', error);
      return defaultValue;
    }
  }

  /**
   * Set item in storage
   */
  set<T>(key: string, value: T): boolean {
    if (!this.storage) {
      return false;
    }

    try {
      this.storage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.warn(`Failed to set item: ${key}`, 'StorageService', error);
      return false;
    }
  }

  /**
   * Remove item from storage
   */
  remove(key: string): boolean {
    if (!this.storage) {
      return false;
    }

    try {
      this.storage.removeItem(key);
      return true;
    } catch (error) {
      logger.warn(`Failed to remove item: ${key}`, 'StorageService', error);
      return false;
    }
  }

  /**
   * Clear all items from storage
   */
  clear(): boolean {
    if (!this.storage) {
      return false;
    }

    try {
      this.storage.clear();
      return true;
    } catch (error) {
      logger.warn('Failed to clear storage', 'StorageService', error);
      return false;
    }
  }

  /**
   * Get all keys in storage
   */
  keys(): string[] {
    if (!this.storage) {
      return [];
    }

    try {
      return Object.keys(this.storage);
    } catch (error) {
      logger.warn('Failed to get keys', 'StorageService', error);
      return [];
    }
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    if (!this.storage) {
      return false;
    }

    return this.storage.getItem(key) !== null;
  }

  /**
   * Get item with expiry
   */
  getWithExpiry<T>(key: string, defaultValue?: T): T | undefined {
    const item = this.get<{ value: T; expiry: number }>(key);

    if (!item) {
      return defaultValue;
    }

    if (Date.now() > item.expiry) {
      this.remove(key);
      return defaultValue;
    }

    return item.value;
  }

  /**
   * Set item with expiry (in milliseconds)
   */
  setWithExpiry<T>(key: string, value: T, ttl: number): boolean {
    const item = {
      value,
      expiry: Date.now() + ttl,
    };

    return this.set(key, item);
  }
}

// Export singleton instance
export const storage = StorageService.getInstance();

// Convenience exports for common operations
export const localStore = {
  get: <T>(key: string, defaultValue?: T) => storage.get<T>(key, defaultValue),
  set: <T>(key: string, value: T) => storage.set(key, value),
  remove: (key: string) => storage.remove(key),
  clear: () => storage.clear(),
  has: (key: string) => storage.has(key),
};
