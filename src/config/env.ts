// Environment configuration validation

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface EnvConfig {
  // Database
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  
  // Test Database
  TEST_DB_HOST: string;
  TEST_DB_PORT: number;
  TEST_DB_USER: string;
  TEST_DB_PASSWORD: string;
  TEST_DB_NAME: string;
  
  // Application
  NODE_ENV: string;
}

/**
 * 验证必要的环境变量是否存在
 */
export function validateEnvironment(): EnvConfig {
  const requiredVars = [
    'DB_HOST',
    'DB_PORT', 
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME'
  ];

  const missing: string[] = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.\n' +
      'You can use .env.example as a template.'
    );
  }

  return {
    DB_HOST: process.env.DB_HOST!,
    DB_PORT: parseInt(process.env.DB_PORT!),
    DB_USER: process.env.DB_USER!,
    DB_PASSWORD: process.env.DB_PASSWORD!,
    DB_NAME: process.env.DB_NAME!,
    
    TEST_DB_HOST: process.env.TEST_DB_HOST || process.env.DB_HOST!,
    TEST_DB_PORT: parseInt(process.env.TEST_DB_PORT || process.env.DB_PORT!),
    TEST_DB_USER: process.env.TEST_DB_USER || process.env.DB_USER!,
    TEST_DB_PASSWORD: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD!,
    TEST_DB_NAME: process.env.TEST_DB_NAME || 'writer_test',
    
    NODE_ENV: process.env.NODE_ENV || 'development'
  };
}

/**
 * 获取验证后的环境配置
 */
export const env = validateEnvironment();