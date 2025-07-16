// Base repository interface and implementation

import mysql from 'mysql2/promise';
import { getDatabaseConnection } from '../config/database';

export interface BaseEntity {
    id: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Repository<T extends BaseEntity> {
    create(entity: Omit<T, 'createdAt' | 'updatedAt'>): Promise<T>;
    findById(id: string): Promise<T | null>;
    findAll(): Promise<T[]>;
    update(id: string, updates: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T | null>;
    delete(id: string): Promise<boolean>;
}

export abstract class BaseRepository<T extends BaseEntity> implements Repository<T> {
    protected abstract tableName: string;
    protected abstract mapRowToEntity(row: any): T;
    protected abstract mapEntityToRow(entity: any): any;

    protected async executeQuery<R = any>(
        query: string,
        params: any[] = []
    ): Promise<[R[], mysql.FieldPacket[]]> {
        const connection = await getDatabaseConnection();
        try {
            const result = await connection.execute(query, params);
            return result as [R[], mysql.FieldPacket[]];
        } finally {
            connection.release();
        }
    }

    protected async executeTransaction<R>(
        callback: (connection: mysql.PoolConnection) => Promise<R>
    ): Promise<R> {
        const connection = await getDatabaseConnection();
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    public async create(entity: Omit<T, 'createdAt' | 'updatedAt'>): Promise<T> {
        const row = this.mapEntityToRow(entity);
        const columns = Object.keys(row);
        const placeholders = columns.map(() => '?').join(', ');
        const values = Object.values(row);

        const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
    `;

        await this.executeQuery(query, values);

        // 返回创建的实体
        const created = await this.findById(entity.id);
        if (!created) {
            throw new Error(`Failed to create entity in ${this.tableName}`);
        }
        return created;
    }

    public async findById(id: string): Promise<T | null> {
        const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
        const [rows] = await this.executeQuery(query, [id]);

        if (rows.length === 0) {
            return null;
        }

        return this.mapRowToEntity(rows[0]);
    }

    public async findAll(): Promise<T[]> {
        const query = `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`;
        const [rows] = await this.executeQuery(query);

        return rows.map(row => this.mapRowToEntity(row));
    }

    public async update(
        id: string,
        updates: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
    ): Promise<T | null> {
        const row = this.mapEntityToRow(updates);
        const columns = Object.keys(row);

        if (columns.length === 0) {
            return this.findById(id);
        }

        const setClause = columns.map(col => `${col} = ?`).join(', ');
        const values = [...Object.values(row), id];

        const query = `
      UPDATE ${this.tableName} 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

        const [result] = await this.executeQuery(query, values);

        if ((result as any).affectedRows === 0) {
            return null;
        }

        return this.findById(id);
    }

    public async delete(id: string): Promise<boolean> {
        const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
        const [result] = await this.executeQuery(query, [id]);

        return (result as any).affectedRows > 0;
    }

    // 辅助方法：按项目ID查找
    protected async findByProjectId(projectId: string): Promise<T[]> {
        const query = `SELECT * FROM ${this.tableName} WHERE project_id = ? ORDER BY created_at DESC`;
        const [rows] = await this.executeQuery(query, [projectId]);

        return rows.map(row => this.mapRowToEntity(row));
    }

    // 辅助方法：计数
    public async count(): Promise<number> {
        const query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
        const [rows] = await this.executeQuery(query);

        return (rows[0] as any).count;
    }

    // 辅助方法：分页查询
    public async findWithPagination(
        page: number = 1,
        limit: number = 10
    ): Promise<{ data: T[]; total: number; page: number; limit: number }> {
        const offset = (page - 1) * limit;

        const countQuery = `SELECT COUNT(*) as count FROM ${this.tableName}`;
        const [countRows] = await this.executeQuery(countQuery);
        const total = (countRows[0] as any).count;

        const dataQuery = `
      SELECT * FROM ${this.tableName} 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
        const [dataRows] = await this.executeQuery(dataQuery, [limit, offset]);

        return {
            data: dataRows.map(row => this.mapRowToEntity(row)),
            total,
            page,
            limit
        };
    }
}