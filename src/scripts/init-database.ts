// Database initialization script

import mysql from 'mysql2/promise';
import { getDefaultDatabaseConfig } from '../config/database';

async function initializeDatabase() {
  const config = getDefaultDatabaseConfig();
  
  // 连接到 MySQL 服务器（不指定数据库）
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    charset: 'utf8mb4'
  });

  try {
    console.log('Connected to MySQL server');

    // 创建主数据库
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Database '${config.database}' created or already exists`);

    // 创建测试数据库
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${config.database}_test\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Test database '${config.database}_test' created or already exists`);

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database initialization script failed:', error);
      process.exit(1);
    });
}

export { initializeDatabase };