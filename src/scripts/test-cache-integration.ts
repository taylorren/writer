// Cache integration test with project data

import { CacheManager, MemoryCache, CacheKeyBuilder } from '../services/cache';
import { ProjectRepository, CreateProjectData } from '../repositories/project';
import { DatabaseManager, getDefaultDatabaseConfig } from '../config/database';
import { Language } from '../models/index';

// 模拟生成内容的服务
class ContentGenerationService {
  private cache: CacheManager;

  constructor(cache: CacheManager) {
    this.cache = cache;
  }

  // 生成章节大纲（模拟耗时操作）
  async generateChapterOutline(projectId: string, chapterNumber: number): Promise<string> {
    const cacheKey = CacheKeyBuilder.create()
      .add('chapter-outline')
      .add(projectId)
      .add(chapterNumber)
      .build();

    return await this.cache.getOrSet(cacheKey, async () => {
      // 模拟耗时的AI生成过程
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return `第${chapterNumber}章大纲：这是一个自动生成的章节大纲，包含了关键情节点和角色发展。本章将推进主线剧情，同时深化角色关系。预计字数3000-4000字。`;
    }, 10 * 60 * 1000); // 缓存10分钟
  }

  // 生成角色描述
  async generateCharacterDescription(projectId: string, characterName: string): Promise<string> {
    const cacheKey = CacheKeyBuilder.create()
      .add('character-desc')
      .add(projectId)
      .addHash({ name: characterName })
      .build();

    return await this.cache.getOrSet(cacheKey, async () => {
      await new Promise(resolve => setTimeout(resolve, 80));
      
      return `${characterName}是一个复杂而立体的角色，拥有独特的性格特征和成长轨迹。在故事中扮演重要角色，与主角有着深刻的互动关系。`;
    }, 15 * 60 * 1000); // 缓存15分钟
  }

  // 生成世界设定描述
  async generateWorldDescription(projectId: string, settingType: string): Promise<string> {
    const cacheKey = CacheKeyBuilder.create()
      .add('world-desc')
      .add(projectId)
      .add(settingType)
      .build();

    return await this.cache.getOrSet(cacheKey, async () => {
      await new Promise(resolve => setTimeout(resolve, 120));
      
      return `${settingType}的详细描述：这是一个精心构建的世界设定，包含了丰富的历史背景、文化特色和独特的规则体系。为故事提供了真实可信的背景环境。`;
    }, 30 * 60 * 1000); // 缓存30分钟
  }

  // 获取缓存统计信息
  getCacheStats() {
    return this.cache.getStats();
  }

  // 清理项目相关缓存
  async clearProjectCache(projectId: string): Promise<number> {
    return await this.cache.deleteByPattern(`*:${projectId}:*`);
  }
}

async function testCacheIntegration() {
  console.log('开始缓存集成测试...');

  // 初始化数据库和缓存
  const dbManager = DatabaseManager.getInstance(getDefaultDatabaseConfig());
  await dbManager.connect();
  await dbManager.migrate();

  const cache = new MemoryCache({
    ttl: 5 * 60 * 1000, // 5分钟
    maxSize: 100,
    cleanupInterval: 60 * 1000 // 1分钟清理一次
  });
  const cacheManager = new CacheManager(cache);
  const contentService = new ContentGenerationService(cacheManager);
  const projectRepo = new ProjectRepository();

  try {
    // 创建测试项目
    const projectData: CreateProjectData = {
      coreIdea: '这是一个关于缓存集成测试的项目核心思想。在这个测试中，我们将验证缓存系统与项目数据存储的集成效果。通过模拟内容生成服务，我们可以测试缓存的命中率、性能提升和内存使用情况。这个测试项目包含了多个角色、复杂的世界设定和详细的章节规划。我们将通过生成各种类型的内容来验证缓存系统的有效性，包括章节大纲、角色描述和世界设定等。测试过程中会监控缓存的命中率和性能指标，确保系统能够有效减少重复计算，提高响应速度。缓存系统采用内存存储，支持TTL过期机制和LRU淘汰策略，能够智能管理内存使用。通过这个综合测试，我们可以验证缓存在实际应用场景中的表现，包括并发访问、数据一致性和性能优化等关键指标。测试将涵盖多种使用场景，确保系统的稳定性和可靠性。',
      targetWordCount: 500000,
      language: Language.CHINESE
    };

    const project = await projectRepo.createProject(projectData);
    console.log(`✓ 创建测试项目: ${project.id}`);

    // 测试内容生成和缓存
    console.log('\n测试内容生成和缓存...');
    
    // 第一次生成（应该执行实际生成）
    console.time('第一次生成章节大纲');
    const outline1 = await contentService.generateChapterOutline(project.id, 1);
    console.timeEnd('第一次生成章节大纲');
    console.log(`生成结果: ${outline1.substring(0, 50)}...`);

    // 第二次生成（应该从缓存获取）
    console.time('第二次生成章节大纲');
    const outline2 = await contentService.generateChapterOutline(project.id, 1);
    console.timeEnd('第二次生成章节大纲');
    console.log(`缓存结果: ${outline2.substring(0, 50)}...`);
    console.log(`结果一致: ${outline1 === outline2}`);

    // 生成多个角色描述
    console.log('\n生成角色描述...');
    const characters = ['李明轩', '张雨萱', '王志强'];
    for (const character of characters) {
      console.time(`生成${character}描述`);
      const desc = await contentService.generateCharacterDescription(project.id, character);
      console.timeEnd(`生成${character}描述`);
      console.log(`${character}: ${desc.substring(0, 30)}...`);
    }

    // 重复生成相同角色（测试缓存命中）
    console.log('\n测试缓存命中...');
    console.time('缓存命中测试');
    await contentService.generateCharacterDescription(project.id, '李明轩');
    await contentService.generateCharacterDescription(project.id, '张雨萱');
    console.timeEnd('缓存命中测试');

    // 生成世界设定
    console.log('\n生成世界设定...');
    const settings = ['地理环境', '政治制度', '文化背景'];
    for (const setting of settings) {
      const desc = await contentService.generateWorldDescription(project.id, setting);
      console.log(`${setting}: ${desc.substring(0, 30)}...`);
    }

    // 显示缓存统计信息
    console.log('\n缓存统计信息:');
    const stats = contentService.getCacheStats();
    console.log(`- 总条目数: ${stats.totalEntries}`);
    console.log(`- 命中次数: ${stats.hitCount}`);
    console.log(`- 未命中次数: ${stats.missCount}`);
    console.log(`- 命中率: ${(stats.hitRate * 100).toFixed(2)}%`);
    console.log(`- 内存使用: ${(stats.memoryUsage / 1024).toFixed(2)} KB`);

    // 测试批量操作
    console.log('\n测试批量缓存操作...');
    await cacheManager.setMany([
      { key: 'batch:1', value: '批量数据1' },
      { key: 'batch:2', value: '批量数据2' },
      { key: 'batch:3', value: '批量数据3' }
    ]);

    const batchResults = await cacheManager.getMany(['batch:1', 'batch:2', 'batch:3']);
    console.log(`批量获取结果: ${batchResults.size} 个条目`);

    // 测试模式删除
    const deletedCount = await cacheManager.deleteByPattern('batch:*');
    console.log(`按模式删除: ${deletedCount} 个条目`);

    // 清理项目缓存
    console.log('\n清理项目缓存...');
    const projectCacheCount = await contentService.clearProjectCache(project.id);
    console.log(`清理项目缓存: ${projectCacheCount} 个条目`);

    // 最终统计
    const finalStats = contentService.getCacheStats();
    console.log('\n最终缓存统计:');
    console.log(`- 总条目数: ${finalStats.totalEntries}`);
    console.log(`- 命中率: ${(finalStats.hitRate * 100).toFixed(2)}%`);

    // 清理测试数据
    await projectRepo.delete(project.id);
    console.log('✓ 清理测试数据');

  } catch (error) {
    console.error('✗ 缓存集成测试失败:', error);
    throw error;
  } finally {
    cache.destroy();
    await dbManager.close();
    console.log('✓ 清理资源');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testCacheIntegration()
    .then(() => {
      console.log('\n🎉 缓存集成测试完成!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 缓存集成测试失败:', error);
      process.exit(1);
    });
}

export { testCacheIntegration };