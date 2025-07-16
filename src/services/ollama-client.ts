// Ollama client service for AI-powered text processing

import { Ollama } from 'ollama';

export interface OllamaConfig {
  host?: string;
  port?: number;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface OllamaResponse {
  content: string;
  model: string;
  done: boolean;
  totalDuration?: number;
  loadDuration?: number;
  promptEvalCount?: number;
  evalCount?: number;
}

export class OllamaClient {
  private client: Ollama;
  private config: OllamaConfig;

  constructor(config: OllamaConfig) {
    this.config = {
      host: 'http://localhost',
      port: 11434,
      temperature: 0.7,
      maxTokens: 2048,
      ...config
    };

    this.client = new Ollama({
      host: `${this.config.host}:${this.config.port}`
    });
  }

  /**
   * 动态切换模型
   */
  switchModel(model: string): void {
    this.config.model = model;
  }

  /**
   * 获取当前使用的模型
   */
  getCurrentModel(): string {
    return this.config.model;
  }

  /**
   * 发送聊天请求到ollama
   */
  async chat(prompt: string, systemPrompt?: string): Promise<OllamaResponse> {
    try {
      const messages = [];
      
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt
        });
      }
      
      messages.push({
        role: 'user',
        content: prompt
      });

      const response = await this.client.chat({
        model: this.config.model,
        messages,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens
        }
      });

      return {
        content: response.message.content,
        model: this.config.model,
        done: response.done || false,
        totalDuration: response.total_duration,
        loadDuration: response.load_duration,
        promptEvalCount: response.prompt_eval_count,
        evalCount: response.eval_count
      };
    } catch (error) {
      console.error('Ollama chat error:', error);
      throw new Error(`Ollama请求失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 发送生成请求到ollama
   */
  async generate(prompt: string): Promise<OllamaResponse> {
    try {
      const response = await this.client.generate({
        model: this.config.model,
        prompt,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens
        }
      });

      return {
        content: response.response,
        model: this.config.model,
        done: response.done,
        totalDuration: response.total_duration,
        loadDuration: response.load_duration,
        promptEvalCount: response.prompt_eval_count,
        evalCount: response.eval_count
      };
    } catch (error) {
      console.error('Ollama generate error:', error);
      throw new Error(`Ollama生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 检查模型是否可用
   */
  async checkModel(): Promise<boolean> {
    try {
      const models = await this.client.list();
      return models.models.some(model => model.name === this.config.model);
    } catch (error) {
      console.error('检查模型失败:', error);
      return false;
    }
  }

  /**
   * 获取可用模型列表
   */
  async listModels(): Promise<string[]> {
    try {
      const models = await this.client.list();
      return models.models.map(model => model.name);
    } catch (error) {
      console.error('获取模型列表失败:', error);
      return [];
    }
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.list();
      return true;
    } catch (error) {
      console.error('Ollama连接测试失败:', error);
      return false;
    }
  }
}

// 默认配置
export const getDefaultOllamaConfig = (): OllamaConfig => ({
  host: 'http://localhost',
  port: 11434,
  model: 'qwen3:1.7b', // 使用轻量快速的qwen3:1.7b模型
  temperature: 0.7,
  maxTokens: 2048
});

// 创建默认客户端实例
export const createOllamaClient = (config?: Partial<OllamaConfig>): OllamaClient => {
  const defaultConfig = getDefaultOllamaConfig();
  return new OllamaClient({ ...defaultConfig, ...config });
};

// 便捷的模型特定客户端创建方法
export const createFastOllamaClient = (config?: Partial<OllamaConfig>): OllamaClient => {
  return createOllamaClient({ model: 'qwen3:1.7b', ...config });
};

export const createBalancedOllamaClient = (config?: Partial<OllamaConfig>): OllamaClient => {
  return createOllamaClient({ model: 'qwen3:4b', ...config });
};

export const createPowerfulOllamaClient = (config?: Partial<OllamaConfig>): OllamaClient => {
  return createOllamaClient({ model: 'qwen3:latest', ...config });
};

// 根据任务类型创建合适的客户端
export const createOllamaClientForTask = (taskType: 'fast' | 'balanced' | 'powerful', config?: Partial<OllamaConfig>): OllamaClient => {
  switch (taskType) {
    case 'fast':
      return createFastOllamaClient(config);
    case 'balanced':
      return createBalancedOllamaClient(config);
    case 'powerful':
      return createPowerfulOllamaClient(config);
    default:
      return createOllamaClient(config);
  }
};