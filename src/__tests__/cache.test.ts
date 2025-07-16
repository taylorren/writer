// Cache management system tests

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  MemoryCache,
  CacheManager,
  CacheKeyBuilder,
  getDefaultCacheManager
} from '../services/cache';

describe('缓存管理系统测试', () => {
  let cache: MemoryCache;
  let cacheManager: CacheManager;

  beforeEach(() => {
    cache = new MemoryCache({
      ttl: 1000, // 1 second for testing
      maxSize: 5,
      cleanupInterval: 100 // 100ms for testing
    });
    cacheManager = new CacheManager(cache);
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('MemoryCache 基础功能', () => {
    it('应该能够设置和获取缓存值', async () => {
      await cache.set('test-key', 'test-value');
      const value = await cache.get('test-key');
      expect(value).toBe('test-value');
    });

    it('应该能够存储复杂对象', async () => {
      const complexObject = {
        id: '123',
        name: '测试项目',
        data: {
          chapters: ['第一章', '第二章'],
          wordCount: 50000
        }
      };

      await cache.set('complex-key', complexObject);
      const retrieved = await cache.get('complex-key');
      expect(retrieved).toEqual(complexObject);
    });

    it('应该能够检查键是否存在', async () => {
      await cache.set('exists-key', 'value');

      const exists = await cache.exists('exists-key');
      const notExists = await cache.exists('not-exists-key');

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });

    it('应该能够删除缓存项', async () => {
      await cache.set('delete-key', 'value');

      const deleted = await cache.delete('delete-key');
      const value = await cache.get('delete-key');

      expect(deleted).toBe(true);
      expect(value).toBeNull();
    });

    it('应该能够清空所有缓存', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');

      await cache.clear();

      const value1 = await cache.get('key1');
      const value2 = await cache.get('key2');
      const size = await cache.size();

      expect(value1).toBeNull();
      expect(value2).toBeNull();
      expect(size).toBe(0);
    });

    it('应该能够获取所有键', async () => {
      await cache.set('user:1', 'user1');
      await cache.set('user:2', 'user2');
      await cache.set('project:1', 'project1');

      const allKeys = await cache.keys();
      const userKeys = await cache.keys('user:*');

      expect(allKeys).toHaveLength(3);
      expect(userKeys).toHaveLength(2);
      expect(userKeys).toContain('user:1');
      expect(userKeys).toContain('user:2');
    });

    it('应该能够获取缓存大小', async () => {
      expect(await cache.size()).toBe(0);

      await cache.set('key1', 'value1');
      expect(await cache.size()).toBe(1);

      await cache.set('key2', 'value2');
      expect(await cache.size()).toBe(2);
    });
  });

  describe('缓存过期功能', () => {
    it('应该在TTL过期后自动删除缓存项', async () => {
      await cache.set('expire-key', 'value', 50); // 50ms TTL

      // 立即获取应该成功
      let value = await cache.get('expire-key');
      expect(value).toBe('value');

      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 100));

      // 过期后应该返回null
      value = await cache.get('expire-key');
      expect(value).toBeNull();
    });

    it('应该使用默认TTL', async () => {
      await cache.set('default-ttl-key', 'value');

      // 立即获取应该成功
      const value = await cache.get('default-ttl-key');
      expect(value).toBe('value');
    });

    it('应该能够设置自定义TTL', async () => {
      await cache.set('custom-ttl-key', 'value', 2000); // 2 seconds

      const value = await cache.get('custom-ttl-key');
      expect(value).toBe('value');
    });
  });

  describe('缓存大小限制', () => {
    it('应该在达到最大大小时驱逐最旧的条目', async () => {
      // 填满缓存 (maxSize = 5)
      for (let i = 1; i <= 5; i++) {
        await cache.set(`key${i}`, `value${i}`);
        // 添加小延迟确保访问时间不同
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      expect(await cache.size()).toBe(5);

      // 添加第6个项目，应该驱逐最旧的
      await cache.set('key6', 'value6');

      expect(await cache.size()).toBe(5);
      expect(await cache.get('key1')).toBeNull(); // 最旧的应该被驱逐
      expect(await cache.get('key6')).toBe('value6'); // 新的应该存在
    });
  });

  describe('缓存统计信息', () => {
    it('应该正确跟踪命中和未命中', async () => {
      await cache.set('stats-key', 'value');

      // 命中
      await cache.get('stats-key');
      await cache.get('stats-key');

      // 未命中
      await cache.get('non-existent-key');

      const stats = cache.getStats();
      expect(stats.hitCount).toBe(2);
      expect(stats.missCount).toBe(1);
      expect(stats.hitRate).toBeCloseTo(2 / 3);
    });

    it('应该能够重置统计信息', async () => {
      await cache.set('reset-key', 'value');
      await cache.get('reset-key');
      await cache.get('non-existent-key');

      cache.resetStats();

      const stats = cache.getStats();
      expect(stats.hitCount).toBe(0);
      expect(stats.missCount).toBe(0);
    });
  });

  describe('CacheManager 高级功能', () => {
    it('应该支持 getOrSet 模式', async () => {
      let factoryCalled = false;
      const factory = async () => {
        factoryCalled = true;
        return '生成的值';
      };

      // 第一次调用应该执行factory
      const value1 = await cacheManager.getOrSet('getOrSet-key', factory);
      expect(value1).toBe('生成的值');
      expect(factoryCalled).toBe(true);

      // 第二次调用应该从缓存获取
      factoryCalled = false;
      const value2 = await cacheManager.getOrSet('getOrSet-key', factory);
      expect(value2).toBe('生成的值');
      expect(factoryCalled).toBe(false);
    });

    it('应该支持批量操作', async () => {
      // 批量设置
      await cacheManager.setMany([
        { key: 'batch1', value: 'value1' },
        { key: 'batch2', value: 'value2' },
        { key: 'batch3', value: 'value3' }
      ]);

      // 批量获取
      const results = await cacheManager.getMany(['batch1', 'batch2', 'batch3', 'not-exists']);

      expect(results.get('batch1')).toBe('value1');
      expect(results.get('batch2')).toBe('value2');
      expect(results.get('batch3')).toBe('value3');
      expect(results.get('not-exists')).toBeNull();

      // 批量删除
      const deletedCount = await cacheManager.deleteMany(['batch1', 'batch2']);
      expect(deletedCount).toBe(2);

      expect(await cacheManager.exists('batch1')).toBe(false);
      expect(await cacheManager.exists('batch2')).toBe(false);
      expect(await cacheManager.exists('batch3')).toBe(true);
    });

    it('应该支持按模式删除', async () => {
      await cacheManager.setMany([
        { key: 'user:1:profile', value: 'profile1' },
        { key: 'user:2:profile', value: 'profile2' },
        { key: 'user:1:settings', value: 'settings1' },
        { key: 'project:1', value: 'project1' }
      ]);

      const deletedCount = await cacheManager.deleteByPattern('user:*');

      expect(deletedCount).toBe(3);
      expect(await cacheManager.exists('user:1:profile')).toBe(false);
      expect(await cacheManager.exists('user:2:profile')).toBe(false);
      expect(await cacheManager.exists('user:1:settings')).toBe(false);
      expect(await cacheManager.exists('project:1')).toBe(true);
    });
  });

  describe('CacheKeyBuilder', () => {
    it('应该能够构建简单的缓存键', () => {
      const key = CacheKeyBuilder.create()
        .add('user')
        .add(123)
        .add('profile')
        .build();

      expect(key).toBe('user:123:profile');
    });

    it('应该能够添加对象哈希', () => {
      const obj = { name: '测试', age: 25 };
      const key = CacheKeyBuilder.create()
        .add('user')
        .addHash(obj)
        .build();

      expect(key).toMatch(/^user:[a-z0-9]+$/);

      // 相同对象应该生成相同的哈希
      const key2 = CacheKeyBuilder.create()
        .add('user')
        .addHash(obj)
        .build();

      expect(key).toBe(key2);
    });

    it('应该为不同对象生成不同的哈希', () => {
      const obj1 = { name: '测试1' };
      const obj2 = { name: '测试2' };

      const key1 = CacheKeyBuilder.create().addHash(obj1).build();
      const key2 = CacheKeyBuilder.create().addHash(obj2).build();

      expect(key1).not.toBe(key2);
    });
  });

  describe('默认缓存管理器', () => {
    it('应该返回单例实例', () => {
      const manager1 = getDefaultCacheManager();
      const manager2 = getDefaultCacheManager();

      expect(manager1).toBe(manager2);
    });

    it('应该能够正常工作', async () => {
      const manager = getDefaultCacheManager();

      await manager.setMany([
        { key: 'default:test1', value: 'value1' },
        { key: 'default:test2', value: 'value2' }
      ]);

      const exists1 = await manager.exists('default:test1');
      const exists2 = await manager.exists('default:test2');

      expect(exists1).toBe(true);
      expect(exists2).toBe(true);

      // 清理
      await manager.deleteByPattern('default:*');
    });
  });

  describe('错误处理', () => {
    it('应该优雅处理无效的键', async () => {
      const value = await cache.get('');
      expect(value).toBeNull();
    });

    it('应该优雅处理null/undefined值', async () => {
      await cache.set('null-key', null);
      await cache.set('undefined-key', undefined);

      const nullValue = await cache.get('null-key');
      const undefinedValue = await cache.get('undefined-key');

      expect(nullValue).toBeNull();
      expect(undefinedValue).toBeUndefined();
    });
  });
});