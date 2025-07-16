// Database and repository tests

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DatabaseManager, getDefaultDatabaseConfig } from '../config/database';
import { ProjectRepository, CreateProjectData } from '../repositories/project';
import { Language } from '../models/index';
import { v4 as uuidv4 } from 'uuid';

// 确保环境变量被加载
import '../config/env';

// 有效的核心思想文本（超过300字）
const VALID_CORE_IDEA = '这是一个关于勇敢少年拯救世界的故事。在一个充满魔法的世界里，主角发现自己拥有特殊的能力，必须面对邪恶势力的威胁。通过与朋友们的合作和自身的成长，最终战胜了黑暗，恢复了世界的和平。这个故事探讨了友谊、勇气和成长的主题，展现了年轻人面对困难时的坚韧不拔。故事中包含了丰富的想象力和深刻的人生哲理，适合各个年龄段的读者。主角的成长历程将激励读者勇敢面对生活中的挑战，相信自己的力量。整个故事从一个普通少年的日常生活开始，逐渐展开一个宏大的冒险世界。主角在旅程中遇到各种挑战和困难，不仅要面对外在的敌人，更要克服内心的恐惧和怀疑。通过一系列的试炼和成长，主角最终成为了真正的英雄，不仅拯救了世界，也完成了自己的心灵蜕变。';

describe('数据库和存储测试', () => {
  let dbManager: DatabaseManager;
  let projectRepo: ProjectRepository;

  beforeAll(async () => {
    // 使用测试数据库配置
    const testConfig = {
      ...getDefaultDatabaseConfig(),
      database: 'writer_test' // 使用测试数据库
    };
    
    dbManager = DatabaseManager.getInstance(testConfig);
    
    try {
      await dbManager.connect();
      await dbManager.migrate();
      projectRepo = new ProjectRepository();
    } catch (error) {
      console.warn('Database connection failed, skipping database tests:', error);
      return;
    }
  });

  afterAll(async () => {
    if (dbManager) {
      await dbManager.close();
    }
  });

  beforeEach(async () => {
    // 清理测试数据
    if (dbManager) {
      try {
        const pool = await dbManager.getPool();
        const connection = await pool.getConnection();
        
        // 清理所有表的数据
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        await connection.execute('DELETE FROM plot_requirements');
        await connection.execute('DELETE FROM image_inputs');
        await connection.execute('DELETE FROM conflicts');
        await connection.execute('DELETE FROM plot_structures');
        await connection.execute('DELETE FROM world_settings');
        await connection.execute('DELETE FROM chapters');
        await connection.execute('DELETE FROM characters');
        await connection.execute('DELETE FROM projects');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        
        connection.release();
      } catch (error) {
        console.warn('Failed to clean test data:', error);
      }
    }
  });

  describe('数据库连接管理', () => {
    it('应该能够连接到数据库', async () => {
      if (!dbManager) {
        console.warn('Skipping test: Database not available');
        return;
      }

      const healthy = await dbManager.healthCheck();
      expect(healthy).toBe(true);
    });

    it('应该能够获取数据库统计信息', async () => {
      if (!dbManager) {
        console.warn('Skipping test: Database not available');
        return;
      }

      const stats = await dbManager.getStats();
      expect(stats).toHaveProperty('tables');
      expect(stats).toHaveProperty('totalRows');
      expect(typeof stats.tables).toBe('number');
      expect(typeof stats.totalRows).toBe('number');
    });
  });

  describe('项目数据存储', () => {
    it('应该能够创建新项目', async () => {
      if (!projectRepo) {
        console.warn('Skipping test: Database not available');
        return;
      }

      const projectData: CreateProjectData = {
        coreIdea: VALID_CORE_IDEA,
        targetWordCount: 1000000,
        language: Language.CHINESE
      };

      const project = await projectRepo.createProject(projectData);
      
      expect(project).toBeDefined();
      expect(project.id).toBeDefined();
      expect(project.coreIdea).toBe(projectData.coreIdea);
      expect(project.targetWordCount).toBe(projectData.targetWordCount);
      expect(project.language).toBe(projectData.language);
      expect(project.currentWordCount).toBe(0);
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
    });

    it('应该能够通过ID查找项目', async () => {
      if (!projectRepo) {
        console.warn('Skipping test: Database not available');
        return;
      }

      // 先创建一个项目
      const projectData: CreateProjectData = {
        coreIdea: VALID_CORE_IDEA
      };

      const createdProject = await projectRepo.createProject(projectData);
      
      // 通过ID查找项目
      const foundProject = await projectRepo.findById(createdProject.id);
      
      expect(foundProject).toBeDefined();
      expect(foundProject!.id).toBe(createdProject.id);
      expect(foundProject!.coreIdea).toBe(projectData.coreIdea);
    });

    it('应该能够更新项目信息', async () => {
      if (!projectRepo) {
        console.warn('Skipping test: Database not available');
        return;
      }

      // 先创建一个项目
      const projectData: CreateProjectData = {
        coreIdea: VALID_CORE_IDEA
      };

      const createdProject = await projectRepo.createProject(projectData);
      
      // 添加延迟确保更新时间不同
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 更新项目
      const updatedProject = await projectRepo.update(createdProject.id, {
        targetWordCount: 2000000,
        currentWordCount: 50000
      });
      
      expect(updatedProject).toBeDefined();
      expect(updatedProject!.targetWordCount).toBe(2000000);
      expect(updatedProject!.currentWordCount).toBe(50000);
      expect(updatedProject!.updatedAt.getTime()).toBeGreaterThanOrEqual(createdProject.updatedAt.getTime());
    });

    it('应该能够删除项目', async () => {
      if (!projectRepo) {
        console.warn('Skipping test: Database not available');
        return;
      }

      // 先创建一个项目
      const projectData: CreateProjectData = {
        coreIdea: VALID_CORE_IDEA
      };

      const createdProject = await projectRepo.createProject(projectData);
      
      // 删除项目
      const deleted = await projectRepo.delete(createdProject.id);
      expect(deleted).toBe(true);
      
      // 确认项目已被删除
      const foundProject = await projectRepo.findById(createdProject.id);
      expect(foundProject).toBeNull();
    });

    it('应该能够获取所有项目', async () => {
      if (!projectRepo) {
        console.warn('Skipping test: Database not available');
        return;
      }

      // 创建多个项目
      const projectsData: CreateProjectData[] = [
        {
          coreIdea: VALID_CORE_IDEA + ' - 第一个项目'
        },
        {
          coreIdea: VALID_CORE_IDEA + ' - 第二个项目'
        }
      ];

      for (const data of projectsData) {
        await projectRepo.createProject(data);
      }
      
      // 获取所有项目
      const allProjects = await projectRepo.findAll();
      expect(allProjects.length).toBe(2);
      expect(allProjects[0].coreIdea).toContain('项目');
    });

    it('应该能够搜索项目', async () => {
      if (!projectRepo) {
        console.warn('Skipping test: Database not available');
        return;
      }

      // 创建一个包含特定关键词的项目
      const projectData: CreateProjectData = {
        coreIdea: VALID_CORE_IDEA.replace('魔法', '魔法学院') // 确保包含"魔法"关键词
      };

      await projectRepo.createProject(projectData);
      
      // 搜索包含"魔法"关键词的项目
      const searchResults = await projectRepo.searchProjects('魔法');
      expect(searchResults.length).toBe(1);
      expect(searchResults[0].coreIdea).toContain('魔法');
    });

    it('应该能够获取项目进度统计', async () => {
      if (!projectRepo) {
        console.warn('Skipping test: Database not available');
        return;
      }

      // 创建一个项目
      const projectData: CreateProjectData = {
        coreIdea: VALID_CORE_IDEA
      };

      const project = await projectRepo.createProject(projectData);
      
      // 获取项目进度
      const progress = await projectRepo.getProjectProgress(project.id);
      
      expect(progress).toBeDefined();
      expect(progress!.totalChapters).toBe(0);
      expect(progress!.completedChapters).toBe(0);
      expect(progress!.currentWords).toBe(0);
      expect(progress!.targetWords).toBe(project.targetWordCount);
      expect(progress!.progressPercentage).toBe(0);
    });
  });

  describe('数据验证', () => {
    it('应该拒绝无效的核心思想', async () => {
      if (!projectRepo) {
        console.warn('Skipping test: Database not available');
        return;
      }

      const invalidProjectData: CreateProjectData = {
        coreIdea: '太短的核心思想' // 少于300字
      };

      await expect(projectRepo.createProject(invalidProjectData))
        .rejects
        .toThrow('Project validation failed');
    });

    it('应该接受有效的项目数据', async () => {
      if (!projectRepo) {
        console.warn('Skipping test: Database not available');
        return;
      }

      const validProjectData: CreateProjectData = {
        coreIdea: VALID_CORE_IDEA
      };

      const project = await projectRepo.createProject(validProjectData);
      expect(project).toBeDefined();
      expect(project.id).toBeDefined();
    });
  });
});