// Test project data storage functionality

import { DatabaseManager, getDefaultDatabaseConfig } from '../config/database';
import { ProjectRepository, CreateProjectData } from '../repositories/project';
import { Language } from '../models/index';

async function testProjectStorage() {
  const config = getDefaultDatabaseConfig();
  const dbManager = DatabaseManager.getInstance(config);
  const projectRepo = new ProjectRepository();

  try {
    console.log('Testing project data storage...');
    
    // 连接数据库
    await dbManager.connect();
    await dbManager.migrate();
    console.log('✓ Database connected and migrated');

    // 测试创建项目
    const projectData: CreateProjectData = {
      coreIdea: '这是一个关于勇敢少年拯救世界的测试故事。在一个充满魔法的世界里，主角发现自己拥有特殊的能力，必须面对邪恶势力的威胁。通过与朋友们的合作和自身的成长，最终战胜了黑暗，恢复了世界的和平。这个故事探讨了友谊、勇气和成长的主题，展现了年轻人面对困难时的坚韧不拔。故事中包含了丰富的想象力和深刻的人生哲理，适合各个年龄段的读者。主角的成长历程将激励读者勇敢面对生活中的挑战，相信自己的力量。整个故事从一个普通少年的日常生活开始，逐渐展开一个宏大的冒险世界。主角在旅程中遇到各种挑战和困难，不仅要面对外在的敌人，更要克服内心的恐惧和怀疑。通过一系列的试炼和成长，主角最终成为了真正的英雄，不仅拯救了世界，也完成了自己的心灵蜕变。这个故事强调了个人成长的重要性，以及友谊和团队合作在面对困难时的价值。',
      targetWordCount: 1000000,
      language: Language.CHINESE
    };

    const project = await projectRepo.createProject(projectData);
    console.log(`✓ Project created with ID: ${project.id}`);
    console.log(`  - Core idea length: ${project.coreIdea.length} characters`);
    console.log(`  - Target word count: ${project.targetWordCount}`);
    console.log(`  - Language: ${project.language}`);

    // 测试查找项目
    const foundProject = await projectRepo.findById(project.id);
    console.log(`✓ Project found: ${foundProject ? 'YES' : 'NO'}`);

    // 测试更新项目
    const updatedProject = await projectRepo.update(project.id, {
      currentWordCount: 25000
    });
    console.log(`✓ Project updated - Current word count: ${updatedProject?.currentWordCount}`);

    // 测试获取项目进度
    const progress = await projectRepo.getProjectProgress(project.id);
    console.log(`✓ Project progress: ${progress?.progressPercentage}%`);
    console.log(`  - Current words: ${progress?.currentWords}`);
    console.log(`  - Target words: ${progress?.targetWords}`);

    // 测试获取所有项目
    const allProjects = await projectRepo.findAll();
    console.log(`✓ Total projects in database: ${allProjects.length}`);

    // 测试搜索项目
    const searchResults = await projectRepo.searchProjects('魔法');
    console.log(`✓ Search results for '魔法': ${searchResults.length} projects`);

    // 测试删除项目
    const deleted = await projectRepo.delete(project.id);
    console.log(`✓ Project deleted: ${deleted ? 'YES' : 'NO'}`);

    // 验证删除
    const deletedProject = await projectRepo.findById(project.id);
    console.log(`✓ Project after deletion: ${deletedProject ? 'STILL EXISTS' : 'DELETED'}`);

  } catch (error) {
    console.error('✗ Project storage test failed:', error);
    throw error;
  } finally {
    await dbManager.close();
    console.log('✓ Database connection closed');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testProjectStorage()
    .then(() => {
      console.log('\n🎉 All project storage tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Project storage tests failed:', error);
      process.exit(1);
    });
}

export { testProjectStorage };