// Test database connection

import { DatabaseManager, getDefaultDatabaseConfig } from '../config/database';

async function testConnection() {
  const config = getDefaultDatabaseConfig();
  const dbManager = DatabaseManager.getInstance(config);

  try {
    console.log('Testing database connection...');
    
    // 连接数据库
    await dbManager.connect();
    console.log('✓ Database connection successful');

    // 健康检查
    const healthy = await dbManager.healthCheck();
    console.log(`✓ Health check: ${healthy ? 'PASS' : 'FAIL'}`);

    // 获取统计信息
    const stats = await dbManager.getStats();
    console.log(`✓ Database stats: ${stats.tables} tables, ${stats.totalRows} total rows`);

    // 执行迁移
    await dbManager.migrate();
    console.log('✓ Database migration completed');

    // 再次获取统计信息
    const newStats = await dbManager.getStats();
    console.log(`✓ After migration: ${newStats.tables} tables, ${newStats.totalRows} total rows`);

  } catch (error) {
    console.error('✗ Database test failed:', error);
    throw error;
  } finally {
    await dbManager.close();
    console.log('✓ Database connection closed');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testConnection()
    .then(() => {
      console.log('\n🎉 All database tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Database tests failed:', error);
      process.exit(1);
    });
}

export { testConnection };