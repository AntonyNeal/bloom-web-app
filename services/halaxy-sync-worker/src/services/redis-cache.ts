/**
 * Redis Cache Service
 * 
 * Provides <1ms read access to hot data like dashboard metrics,
 * appointment counts, and patient lists. Implements graceful degradation
 * if Redis is unavailable.
 */

import Redis from 'ioredis';
import { config } from '../config';

// Cache key prefixes for different data types
export const CacheKeys = {
  DASHBOARD_METRICS: 'bloom:dashboard:',
  APPOINTMENTS: 'bloom:appointments:',
  PATIENTS: 'bloom:patients:',
  PRACTITIONERS: 'bloom:practitioners:',
  SYNC_STATE: 'bloom:sync:state',
  SYNC_LAST_RUN: 'bloom:sync:lastRun',
} as const;

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  invalidatePattern(pattern: string): Promise<number>;
  isConnected(): boolean;
  close(): Promise<void>;
}

class RedisCacheService implements CacheService {
  private client: Redis | null = null;
  private isReady = false;
  
  async connect(): Promise<void> {
    if (!config.redisConnectionString) {
      console.warn('[RedisCache] No connection string provided - caching disabled');
      return;
    }
    
    try {
      this.client = new Redis(config.redisConnectionString, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          if (times > 3) {
            console.error('[RedisCache] Max retries exceeded, giving up');
            return null;
          }
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
      });
      
      this.client.on('connect', () => {
        console.log('[RedisCache] Connected to Redis');
        this.isReady = true;
      });
      
      this.client.on('error', (err: Error) => {
        console.error('[RedisCache] Redis error:', err.message);
        this.isReady = false;
      });
      
      this.client.on('close', () => {
        console.log('[RedisCache] Connection closed');
        this.isReady = false;
      });
      
      await this.client.connect();
    } catch (error) {
      console.error('[RedisCache] Failed to connect:', error);
      this.client = null;
      this.isReady = false;
    }
  }
  
  async get<T>(key: string): Promise<T | null> {
    if (!this.isReady || !this.client) {
      return null;
    }
    
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`[RedisCache] Error getting key ${key}:`, error);
      return null;
    }
  }
  
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.isReady || !this.client) {
      return;
    }
    
    const ttl = ttlSeconds ?? config.redisCacheTtlSeconds;
    
    try {
      const serialized = JSON.stringify(value);
      await this.client.set(key, serialized, 'EX', ttl);
    } catch (error) {
      console.error(`[RedisCache] Error setting key ${key}:`, error);
    }
  }
  
  async delete(key: string): Promise<void> {
    if (!this.isReady || !this.client) {
      return;
    }
    
    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`[RedisCache] Error deleting key ${key}:`, error);
    }
  }
  
  /**
   * Invalidate all keys matching a pattern
   * @param pattern Redis glob pattern (e.g., 'bloom:dashboard:*')
   * @returns Number of keys deleted
   */
  async invalidatePattern(pattern: string): Promise<number> {
    if (!this.isReady || !this.client) {
      return 0;
    }
    
    try {
      let cursor = '0';
      let deletedCount = 0;
      
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100
        );
        cursor = nextCursor;
        
        if (keys.length > 0) {
          await this.client.del(...keys);
          deletedCount += keys.length;
        }
      } while (cursor !== '0');
      
      console.log(`[RedisCache] Invalidated ${deletedCount} keys matching ${pattern}`);
      return deletedCount;
    } catch (error) {
      console.error(`[RedisCache] Error invalidating pattern ${pattern}:`, error);
      return 0;
    }
  }
  
  isConnected(): boolean {
    return this.isReady;
  }
  
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isReady = false;
      console.log('[RedisCache] Connection closed');
    }
  }
}

/**
 * Null cache implementation for when Redis is unavailable
 * All operations are no-ops, enabling graceful degradation
 */
class NullCacheService implements CacheService {
  async get<T>(): Promise<T | null> {
    return null;
  }
  
  async set(): Promise<void> {
    // No-op
  }
  
  async delete(): Promise<void> {
    // No-op
  }
  
  async invalidatePattern(): Promise<number> {
    return 0;
  }
  
  isConnected(): boolean {
    return false;
  }
  
  async close(): Promise<void> {
    // No-op
  }
}

// Singleton instance
let cacheInstance: CacheService | null = null;

/**
 * Get or create the cache service instance
 * Returns a NullCacheService if Redis is not configured
 */
export async function getCacheService(): Promise<CacheService> {
  if (cacheInstance) {
    return cacheInstance;
  }
  
  if (!config.redisConnectionString) {
    console.log('[RedisCache] No connection string - using null cache');
    cacheInstance = new NullCacheService();
    return cacheInstance;
  }
  
  const service = new RedisCacheService();
  await service.connect();
  cacheInstance = service;
  return cacheInstance;
}

/**
 * Close the cache service connection
 */
export async function closeCacheService(): Promise<void> {
  if (cacheInstance) {
    await cacheInstance.close();
    cacheInstance = null;
  }
}

export default { getCacheService, closeCacheService, CacheKeys };
