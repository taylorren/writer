// Database and repository error handling

export enum DatabaseErrorType {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  QUERY_ERROR = 'QUERY_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_KEY = 'DUPLICATE_KEY',
  FOREIGN_KEY_CONSTRAINT = 'FOREIGN_KEY_CONSTRAINT',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

export class DatabaseError extends Error {
  public readonly type: DatabaseErrorType;
  public readonly originalError?: Error;
  public readonly query?: string;
  public readonly params?: any[];

  constructor(
    type: DatabaseErrorType,
    message: string,
    originalError?: Error,
    query?: string,
    params?: any[]
  ) {
    super(message);
    this.name = 'DatabaseError';
    this.type = type;
    this.originalError = originalError;
    this.query = query;
    this.params = params;

    // 保持堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError);
    }
  }

  public toJSON() {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      query: this.query,
      params: this.params,
      originalError: this.originalError?.message,
      stack: this.stack
    };
  }
}

export class RepositoryError extends Error {
  public readonly operation: string;
  public readonly entityType: string;
  public readonly entityId?: string;
  public readonly originalError?: Error;

  constructor(
    operation: string,
    entityType: string,
    message: string,
    entityId?: string,
    originalError?: Error
  ) {
    super(message);
    this.name = 'RepositoryError';
    this.operation = operation;
    this.entityType = entityType;
    this.entityId = entityId;
    this.originalError = originalError;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RepositoryError);
    }
  }

  public toJSON() {
    return {
      name: this.name,
      operation: this.operation,
      entityType: this.entityType,
      entityId: this.entityId,
      message: this.message,
      originalError: this.originalError?.message,
      stack: this.stack
    };
  }
}

// 错误处理工具函数
export function handleDatabaseError(error: any, query?: string, params?: any[]): DatabaseError {
  // MySQL 错误代码映射
  if (error.code) {
    switch (error.code) {
      case 'ECONNREFUSED':
      case 'ENOTFOUND':
      case 'ETIMEDOUT':
        return new DatabaseError(
          DatabaseErrorType.CONNECTION_ERROR,
          `Database connection failed: ${error.message}`,
          error,
          query,
          params
        );

      case 'ER_DUP_ENTRY':
        return new DatabaseError(
          DatabaseErrorType.DUPLICATE_KEY,
          `Duplicate entry: ${error.message}`,
          error,
          query,
          params
        );

      case 'ER_NO_REFERENCED_ROW':
      case 'ER_NO_REFERENCED_ROW_2':
        return new DatabaseError(
          DatabaseErrorType.FOREIGN_KEY_CONSTRAINT,
          `Foreign key constraint failed: ${error.message}`,
          error,
          query,
          params
        );

      case 'ER_PARSE_ERROR':
      case 'ER_BAD_FIELD_ERROR':
      case 'ER_NO_SUCH_TABLE':
        return new DatabaseError(
          DatabaseErrorType.QUERY_ERROR,
          `Query error: ${error.message}`,
          error,
          query,
          params
        );

      case 'PROTOCOL_CONNECTION_LOST':
        return new DatabaseError(
          DatabaseErrorType.CONNECTION_ERROR,
          `Connection lost: ${error.message}`,
          error,
          query,
          params
        );

      default:
        return new DatabaseError(
          DatabaseErrorType.QUERY_ERROR,
          `Database error: ${error.message}`,
          error,
          query,
          params
        );
    }
  }

  // 通用错误处理
  if (error.message?.includes('timeout')) {
    return new DatabaseError(
      DatabaseErrorType.TIMEOUT_ERROR,
      `Operation timeout: ${error.message}`,
      error,
      query,
      params
    );
  }

  return new DatabaseError(
    DatabaseErrorType.QUERY_ERROR,
    `Unknown database error: ${error.message}`,
    error,
    query,
    params
  );
}

// 重试机制
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // 如果是最后一次尝试，直接抛出错误
      if (attempt === maxRetries) {
        break;
      }

      // 检查是否是可重试的错误
      if (error instanceof DatabaseError) {
        const retryableTypes = [
          DatabaseErrorType.CONNECTION_ERROR,
          DatabaseErrorType.TIMEOUT_ERROR
        ];
        
        if (!retryableTypes.includes(error.type)) {
          // 不可重试的错误，直接抛出
          throw error;
        }
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
}

// 连接池健康检查
export interface HealthCheckResult {
  healthy: boolean;
  message: string;
  timestamp: Date;
  responseTime?: number;
}

export async function performHealthCheck(
  checkFunction: () => Promise<boolean>
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const healthy = await checkFunction();
    const responseTime = Date.now() - startTime;
    
    return {
      healthy,
      message: healthy ? 'Database connection is healthy' : 'Database connection failed',
      timestamp: new Date(),
      responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      healthy: false,
      message: `Health check failed: ${(error as Error).message}`,
      timestamp: new Date(),
      responseTime
    };
  }
}

// 事务辅助函数
export interface TransactionOptions {
  timeout?: number;
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
}

export async function executeInTransaction<T>(
  connection: any,
  callback: (connection: any) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  try {
    // 设置隔离级别
    if (options.isolationLevel) {
      await connection.execute(`SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`);
    }

    await connection.beginTransaction();
    
    // 设置超时
    if (options.timeout) {
      setTimeout(() => {
        connection.rollback().catch(() => {});
      }, options.timeout);
    }

    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}