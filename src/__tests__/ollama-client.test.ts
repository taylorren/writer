// Ollama client tests

import { describe, it, expect, beforeAll } from 'vitest';
import { 
  OllamaClient, 
  createOllamaClient, 
  createFastOllamaClient,
  createBalancedOllamaClient,
  createPowerfulOllamaClient,
  createOllamaClientForTask,
  getDefaultOllamaConfig
} from '../services/ollama-client';

describe('Ollama客户端测试', () => {
  let client: OllamaClient;

  beforeAll(() => {
    client = createOllamaClient();
  });

  it('应该能够连接到ollama服务', async () => {
    const connected = await client.testConnection();
    expect(connected).toBe(true);
  }, 10000); // 10秒超时

  it('应该能够获取可用模型列表', async () => {
    const models = await client.listModels();
    expect(models).toBeInstanceOf(Array);
    expect(models.length).toBeGreaterThan(0);
    // 检查是否包含我们期望的模型之一
    const hasExpectedModel = models.some(model => 
      model.includes('qwen3') || model.includes('llama') || model.includes('mistral')
    );
    expect(hasExpectedModel).toBe(true);
  }, 10000);

  it('应该能够检查模型是否可用', async () => {
    const available = await client.checkModel();
    expect(available).toBe(true);
  }, 10000);

  it('应该能够进行简单的聊天', async () => {
    const response = await client.chat('你好，请回复"测试成功"');
    
    expect(response).toBeDefined();
    expect(response.content).toBeTruthy();
    expect(response.model).toBe('qwen3:1.7b'); // 更新为默认模型
    expect(response.done).toBe(true);
  }, 15000); // 15秒超时，因为AI响应需要时间

  it('应该能够使用系统提示进行聊天', async () => {
    const systemPrompt = '你是一个测试助手，只回复"系统测试成功"';
    const response = await client.chat('测试', systemPrompt);
    
    expect(response).toBeDefined();
    expect(response.content).toBeTruthy();
    expect(response.content).toContain('测试成功');
  }, 15000);

  it('应该能够动态切换模型', () => {
    const originalModel = client.getCurrentModel();
    expect(originalModel).toBe('qwen3:1.7b');
    
    client.switchModel('qwen3:4b');
    expect(client.getCurrentModel()).toBe('qwen3:4b');
    
    // 恢复原始模型
    client.switchModel(originalModel);
    expect(client.getCurrentModel()).toBe(originalModel);
  });

  it('应该能够使用generate方法', async () => {
    const response = await client.generate('请简单回复"生成测试成功"');
    
    expect(response).toBeDefined();
    expect(response.content).toBeTruthy();
    expect(response.model).toBe('qwen3:1.7b');
    expect(response.done).toBe(true);
  }, 15000);
});

describe('工厂方法测试', () => {
  it('应该能够创建快速客户端', () => {
    const fastClient = createFastOllamaClient();
    expect(fastClient.getCurrentModel()).toBe('qwen3:1.7b');
  });

  it('应该能够创建平衡客户端', () => {
    const balancedClient = createBalancedOllamaClient();
    expect(balancedClient.getCurrentModel()).toBe('qwen3:4b');
  });

  it('应该能够创建强力客户端', () => {
    const powerfulClient = createPowerfulOllamaClient();
    expect(powerfulClient.getCurrentModel()).toBe('qwen3:latest');
  });

  it('应该能够根据任务类型创建客户端', () => {
    const fastClient = createOllamaClientForTask('fast');
    const balancedClient = createOllamaClientForTask('balanced');
    const powerfulClient = createOllamaClientForTask('powerful');

    expect(fastClient.getCurrentModel()).toBe('qwen3:1.7b');
    expect(balancedClient.getCurrentModel()).toBe('qwen3:4b');
    expect(powerfulClient.getCurrentModel()).toBe('qwen3:latest');
  });

  it('应该能够使用自定义配置覆盖默认设置', () => {
    const customClient = createFastOllamaClient({ 
      temperature: 0.5,
      maxTokens: 1024 
    });
    
    expect(customClient.getCurrentModel()).toBe('qwen3:1.7b');
    // 注意：temperature 和 maxTokens 是私有配置，我们无法直接测试
    // 但可以通过实际调用来验证它们是否生效
  });

  it('应该返回正确的默认配置', () => {
    const defaultConfig = getDefaultOllamaConfig();
    
    expect(defaultConfig.host).toBe('http://localhost');
    expect(defaultConfig.port).toBe(11434);
    expect(defaultConfig.model).toBe('qwen3:1.7b');
    expect(defaultConfig.temperature).toBe(0.7);
    expect(defaultConfig.maxTokens).toBe(2048);
  });
});