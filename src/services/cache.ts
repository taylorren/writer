// Cache management system for generated content

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  createdAt: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessedAt: Date;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  cleanupInterval?: number; // Cleanup interval in milliseconds
}

export interface CacheStats {
  totalEntries: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  memoryUsage: number;
}

export abstract class BaseCache {
  protected hitCount = 0;
  protected missCount = 0;
  protected options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 30 * 60 * 1000, // 30 minutes default
      maxSize: options.maxSize || 1000,
      cleanupInterval: options.cleanupInterval || 5 * 60 * 1000 // 5 minutes
    };
  }

  abstract set<T>(key: string, value: T, ttl?: number): Promise<void>;
  abstract get<T>(key: string): Promise<T | null>;
  abstract delete(key: string): Promise<boolean>;
  abstract clear(): Promise<void>;
  abstract exists(key: string): Promise<boolean>;
  abstract keys(pattern?: string): Promise<string[]>;
  abstract size(): Promise<number>;

  // 获取缓存统计信息
  public getStats(): CacheStats {
    const total = this.hitCount + this.missCount;
    return {
      totalEntries: 0, // 子类实现
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: total > 0 ? this.hitCount / total : 0,
      memoryUsage: 0 // 子类实现
    };
  }

  // 重置统计信息
  public resetStats(): void {
    this.hitCount = 0;
    this.missCount = 0;
  }

  protected recordHit(): void {
    this.hitCount++;
  }

  protected recordMiss(): void {
    this.missCount++;
  }
}

/**
 * 内存缓存实现
 */
export class MemoryCache extends BaseCache {
  private cache = new Map<string, CacheEntry>();
  private cleanupTimer?: NodeJS.Timeout;

  constructor(options: CacheOptions = {}) {
    super(options);
    this.startCleanup();
  }

  public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const actualTtl = ttl || this.options.ttl;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + actualTtl);

    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.options.maxSize) {
      await this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      createdAt: now,
      expiresAt,
      accessCount: 0,
      lastAccessedAt: now
    };

    this.cache.set(key, entry);
  }

  public async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.recordMiss();
      return null;
    }

    // 检查是否过期
    if (new Date() > entry.expiresAt) {
      this.cache.delete(key);
      this.recordMiss();
      return null;
    }

    // 更新访问信息
    entry.accessCount++;
    entry.lastAccessedAt = new Date();
    
    this.recordHit();
    return entry.value as T;
  }

  public async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  public async clear(): Promise<void> {
    this.cache.clear();
    this.resetStats();
  }

  public async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // 检查是否过期
    if (new Date() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  public async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.cache.keys());
    
    if (!pattern) {
      return allKeys;
    }

    // 简单的通配符匹配
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return allKeys.filter(key => regex.test(key));
  }

  public async size(): Promise<number> {
    return this.cache.size;
  }

  public getStats(): CacheStats {
    const baseStats = super.getStats();
    return {
      ...baseStats,
      totalEntries: this.cache.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  // 清理过期条目
  private async cleanup(): Promise<void> {
    const now = new Date();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
    }
  }

  // 驱逐最旧的条目
  private async evictOldest(): Promise<void> {
    let oldestKey: string | null = null;
    let oldestTime = new Date();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // 启动清理定时器
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup().catch(console.error);
    }, this.options.cleanupInterval);
  }

  // 停止清理定时器
  public stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  // 估算内存使用量
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const entry of this.cache.values()) {
      // 粗略估算每个条目的内存使用量
      totalSize += JSON.stringify(entry).length * 2; // UTF-16 字符
    }
    
    return totalSize;
  }

  // 析构函数
  public destroy(): void {
    this.stopCleanup();
    this.cache.clear();
  }
}

/**
 * 缓存管理器 - 提供高级缓存功能
 */
export class CacheManager {
  private cache: BaseCache;

  constructor(cache?: BaseCache) {
    this.cache = cache || new MemoryCache();
  }

  // 获取或设置缓存
  public async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.cache.set(key, value, ttl);
    return value;
  }

  // 批量获取
  public async getMany<T>(keys: string[]): Promise<Map<string, T | null>> {
    const result = new Map<string, T | null>();
    
    for (const key of keys) {
      const value = await this.cache.get<T>(key);
      result.set(key, value);
    }
    
    return result;
  }

  // 批量设置
  public async setMany<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    for (const entry of entries) {
      await this.cache.set(entry.key, entry.value, entry.ttl);
    }
  }

  // 批量删除
  public async deleteMany(keys: string[]): Promise<number> {
    let deletedCount = 0;
    
    for (const key of keys) {
      const deleted = await this.cache.delete(key);
      if (deleted) deletedCount++;
    }
    
    return deletedCount;
  }

  // 按模式删除
  public async deleteByPattern(pattern: string): Promise<number> {
    const keys = await this.cache.keys(pattern);
    return await this.deleteMany(keys);
  }

  // 获取缓存统计信息
  public getStats(): CacheStats {
    return this.cache.getStats();
  }

  // 重置统计信息
  public resetStats(): void {
    this.cache.resetStats();
  }

  // 清空缓存
  public async clear(): Promise<void> {
    await this.cache.clear();
  }

  // 获取缓存大小
  public async size(): Promise<number> {
    return await this.cache.size();
  }

  // 检查键是否存在
  public async exists(key: string): Promise<boolean> {
    return await this.cache.exists(key);
  }

  // 获取所有键
  public async keys(pattern?: string): Promise<string[]> {
    return await this.cache.keys(pattern);
  }

  // 销毁缓存管理器
  public destroy(): void {
    if (this.cache instanceof MemoryCache) {
      this.cache.destroy();
    }
  }
}

// 默认缓存管理器实例
let defaultCacheManager: CacheManager | null = null;

export function getDefaultCacheManager(): CacheManager {
  if (!defaultCacheManager) {
    defaultCacheManager = new CacheManager(new MemoryCache({
      ttl: 30 * 60 * 1000, // 30 minutes
      maxSize: 1000,
      cleanupInterval: 5 * 60 * 1000 // 5 minutes
    }));
  }
  return defaultCacheManager;
}

// 缓存键生成工具
export class CacheKeyBuilder {
  private parts: string[] = [];

  public static create(): CacheKeyBuilder {
    return new CacheKeyBuilder();
  }

  public add(part: string | number): CacheKeyBuilder {
    this.parts.push(String(part));
    return this;
  }

  public addHash(obj: any): CacheKeyBuilder {
    const hash = this.simpleHash(JSON.stringify(obj));
    this.parts.push(hash);
    return this;
  }

  public build(): string {
    return this.parts.join(':');
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}