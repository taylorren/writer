// MySQL database configuration and connection management

import mysql from 'mysql2/promise';
import { env } from './env';

export interface DatabaseConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    connectionLimit?: number;
    acquireTimeout?: number;
    timeout?: number;
    reconnect?: boolean;
}

export class DatabaseManager {
    private static instance: DatabaseManager;
    private pool: mysql.Pool | null = null;
    private config: DatabaseConfig;

    private constructor(config: DatabaseConfig) {
        this.config = config;
    }

    public static getInstance(config?: DatabaseConfig): DatabaseManager {
        if (!DatabaseManager.instance) {
            if (!config) {
                throw new Error('Database configuration is required for first initialization');
            }
            DatabaseManager.instance = new DatabaseManager(config);
        }
        return DatabaseManager.instance;
    }

    public async connect(): Promise<mysql.Pool> {
        if (!this.pool) {
            try {
                this.pool = mysql.createPool({
                    host: this.config.host,
                    port: this.config.port,
                    user: this.config.user,
                    password: this.config.password,
                    database: this.config.database,
                    connectionLimit: this.config.connectionLimit || 10,
                    charset: 'utf8mb4',
                    timezone: '+00:00'
                });

                // 测试连接
                const connection = await this.pool.getConnection();
                console.log('MySQL database connected successfully');
                connection.release();

                // 初始化数据库表
                await this.initializeTables();
            } catch (error) {
                console.error('Failed to connect to MySQL database:', error);
                throw error;
            }
        }
        return this.pool;
    }

    public async close(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            console.log('MySQL database connection closed');
        }
    }

    public async getPool(): Promise<mysql.Pool> {
        if (!this.pool) {
            return await this.connect();
        }
        return this.pool;
    }

    public async getConnection(): Promise<mysql.PoolConnection> {
        const pool = await this.getPool();
        return await pool.getConnection();
    }

    private async initializeTables(): Promise<void> {
        if (!this.pool) return;

        try {
            const connection = await this.pool.getConnection();

            // 创建项目表
            await connection.execute(`
        CREATE TABLE IF NOT EXISTS projects (
          id VARCHAR(255) PRIMARY KEY,
          core_idea TEXT NOT NULL,
          outline JSON,
          style JSON,
          current_word_count INT DEFAULT 0,
          target_word_count INT DEFAULT 1000000,
          language VARCHAR(10) DEFAULT 'zh-CN',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_created_at (created_at),
          INDEX idx_updated_at (updated_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

            // 创建角色表
            await connection.execute(`
        CREATE TABLE IF NOT EXISTS characters (
          id VARCHAR(255) PRIMARY KEY,
          project_id VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          personality JSON,
          background TEXT,
          relationships JSON,
          development_arc TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
          INDEX idx_project_id (project_id),
          INDEX idx_name (name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

            // 创建章节表
            await connection.execute(`
        CREATE TABLE IF NOT EXISTS chapters (
          id VARCHAR(255) PRIMARY KEY,
          project_id VARCHAR(255) NOT NULL,
          title VARCHAR(500) NOT NULL,
          summary TEXT,
          content LONGTEXT,
          key_plot_points JSON,
          required_elements JSON,
          estimated_word_count INT DEFAULT 0,
          actual_word_count INT DEFAULT 0,
          status ENUM('not_started', 'in_progress', 'completed', 'reviewed') DEFAULT 'not_started',
          chapter_order INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
          INDEX idx_project_id (project_id),
          INDEX idx_chapter_order (project_id, chapter_order),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

            // 创建世界设定表
            await connection.execute(`
        CREATE TABLE IF NOT EXISTS world_settings (
          id VARCHAR(255) PRIMARY KEY,
          project_id VARCHAR(255) NOT NULL,
          timeperiod TEXT,
          location TEXT,
          social_context TEXT,
          rules JSON,
          atmosphere TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
          INDEX idx_project_id (project_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

            // 创建情节结构表
            await connection.execute(`
        CREATE TABLE IF NOT EXISTS plot_structures (
          id VARCHAR(255) PRIMARY KEY,
          project_id VARCHAR(255) NOT NULL,
          exposition TEXT,
          rising_action JSON,
          climax TEXT,
          falling_action JSON,
          resolution TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
          INDEX idx_project_id (project_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

            // 创建冲突表
            await connection.execute(`
        CREATE TABLE IF NOT EXISTS conflicts (
          id VARCHAR(255) PRIMARY KEY,
          project_id VARCHAR(255) NOT NULL,
          type ENUM('internal', 'interpersonal', 'societal', 'environmental') NOT NULL,
          description TEXT NOT NULL,
          participants JSON,
          resolution TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
          INDEX idx_project_id (project_id),
          INDEX idx_type (type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

            // 创建图片输入表
            await connection.execute(`
        CREATE TABLE IF NOT EXISTS image_inputs (
          id VARCHAR(255) PRIMARY KEY,
          project_id VARCHAR(255),
          filename VARCHAR(500) NOT NULL,
          file_size BIGINT NOT NULL,
          file_type VARCHAR(100) NOT NULL,
          description TEXT,
          metadata JSON,
          analysis_result JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
          INDEX idx_project_id (project_id),
          INDEX idx_file_type (file_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

            // 创建情节需求表
            await connection.execute(`
        CREATE TABLE IF NOT EXISTS plot_requirements (
          id VARCHAR(255) PRIMARY KEY,
          project_id VARCHAR(255),
          type ENUM('text', 'image', 'mixed') NOT NULL,
          content TEXT NOT NULL,
          visual_elements JSON,
          priority INT DEFAULT 5,
          chapter_hint VARCHAR(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
          INDEX idx_project_id (project_id),
          INDEX idx_type (type),
          INDEX idx_priority (priority)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

            connection.release();
            console.log('Database tables initialized successfully');
        } catch (error) {
            console.error('Failed to initialize database tables:', error);
            throw error;
        }
    }

    // 数据库迁移方法
    public async migrate(): Promise<void> {
        try {
            await this.initializeTables();
            console.log('Database migration completed successfully');
        } catch (error) {
            console.error('Database migration failed:', error);
            throw error;
        }
    }

    // 获取数据库统计信息
    public async getStats(): Promise<{ tables: number; totalRows: number }> {
        const pool = await this.getPool();
        const connection = await pool.getConnection();

        try {
            // 获取表数量
            const [tablesResult] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = ? AND table_type = 'BASE TABLE'
      `, [this.config.database]);

            // 获取总行数
            const [rowsResult] = await connection.execute(`
        SELECT 
          (SELECT COUNT(*) FROM projects) +
          (SELECT COUNT(*) FROM characters) +
          (SELECT COUNT(*) FROM chapters) +
          (SELECT COUNT(*) FROM world_settings) +
          (SELECT COUNT(*) FROM plot_structures) +
          (SELECT COUNT(*) FROM conflicts) +
          (SELECT COUNT(*) FROM image_inputs) +
          (SELECT COUNT(*) FROM plot_requirements) as total
      `);

            const tables = (tablesResult as any[])[0];
            const rows = (rowsResult as any[])[0];

            return {
                tables: tables.count,
                totalRows: rows.total || 0
            };
        } finally {
            connection.release();
        }
    }

    // 健康检查
    public async healthCheck(): Promise<boolean> {
        try {
            const pool = await this.getPool();
            const connection = await pool.getConnection();
            await connection.execute('SELECT 1');
            connection.release();
            return true;
        } catch (error) {
            console.error('Database health check failed:', error);
            return false;
        }
    }
}

// 从环境变量获取数据库配置
export const getDefaultDatabaseConfig = (): DatabaseConfig => {
    const isTest = process.env.NODE_ENV === 'test';
    
    return {
        host: env[isTest ? 'TEST_DB_HOST' : 'DB_HOST'],
        port: env[isTest ? 'TEST_DB_PORT' : 'DB_PORT'],
        user: env[isTest ? 'TEST_DB_USER' : 'DB_USER'],
        password: env[isTest ? 'TEST_DB_PASSWORD' : 'DB_PASSWORD'],
        database: env[isTest ? 'TEST_DB_NAME' : 'DB_NAME'],
        connectionLimit: 10,
        reconnect: true
    };
};

// 导出单例实例获取函数
export const getDatabase = async (): Promise<mysql.Pool> => {
    const manager = DatabaseManager.getInstance(getDefaultDatabaseConfig());
    return await manager.getPool();
};

// 导出连接获取函数
export const getDatabaseConnection = async (): Promise<mysql.PoolConnection> => {
    const manager = DatabaseManager.getInstance(getDefaultDatabaseConfig());
    return await manager.getConnection();
};