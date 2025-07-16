// AI-powered core idea processor integration tests

import { describe, it, expect, beforeAll } from 'vitest';
import { CoreIdeaProcessor } from '../services/core-idea-processor';
import { CoreIdeaParser } from '../services/core-idea-parser';

describe('AI驱动的核心思想处理器集成测试', () => {
  let processor: CoreIdeaProcessor;
  let parser: CoreIdeaParser;

  beforeAll(() => {
    processor = new CoreIdeaProcessor();
    parser = new CoreIdeaParser();
  });

  const VALID_FANTASY_IDEA = '这是一个关于勇敢少年拯救世界的奇幻冒险故事。在一个充满魔法与神秘力量的异世界中，主角李明是一个普通的高中生，因为意外的机缘而被传送到了这个神奇的世界。他发现自己拥有了前所未有的特殊能力，能够操控各种元素的力量，包括火焰、冰霜、雷电和大地的能量。然而，这个美丽而神秘的世界正面临着来自黑暗势力的巨大威胁，邪恶的魔王正在集结庞大的军队，企图征服整个世界并将其笼罩在永恒的黑暗之中。主角必须在短时间内掌握自己的力量，学会控制这些强大的魔法能力，与当地的勇士们并肩作战。通过与各种伙伴的合作，包括智慧的法师、勇敢的骑士、机灵的盗贼和神秘的精灵，他们一起踏上了拯救世界的危险旅程。在这个充满挑战的过程中，主角不仅要面对外在的强大敌人，更要克服内心的恐惧和怀疑，实现真正的成长和蜕变，最终成为真正的英雄。';

  describe('基础验证功能', () => {
    it('应该能够验证核心思想输入', () => {
      const result = processor.validateCoreIdea(VALID_FANTASY_IDEA);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.characterCount).toBeGreaterThanOrEqual(300);
      expect(result.characterCount).toBeLessThanOrEqual(500);
      expect(result.wordCount).toBeGreaterThan(0);
    });

    it('应该拒绝过短的输入', () => {
      const result = processor.validateCoreIdea('太短了');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('过短');
    });

    it('应该拒绝过长的输入', () => {
      const longIdea = VALID_FANTASY_IDEA.repeat(2); // 超过500字
      const result = processor.validateCoreIdea(longIdea);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('过长');
    });
  });

  describe('AI元素提取功能', () => {
    it('应该能够使用AI提取核心思想元素', async () => {
      const elements = await processor.extractElements(VALID_FANTASY_IDEA);

      expect(elements).toBeDefined();
      expect(elements.theme).toBeTruthy();
      expect(elements.characters).toBeInstanceOf(Array);
      expect(elements.setting).toBeTruthy();
      expect(elements.conflict).toBeTruthy();
      expect(elements.genre).toBeTruthy();
      expect(elements.mood).toBeTruthy();
      expect(elements.keyWords).toBeInstanceOf(Array);

      // 验证AI能够识别奇幻元素
      expect(elements.genre).toBeTruthy();
      expect(['玄幻', '奇幻', '奇幻冒险', '魔幻']).toContain(elements.genre);
      expect(elements.characters.length).toBeGreaterThan(0);
      expect(elements.keyWords.length).toBeGreaterThan(0);
    }, 30000); // 30秒超时，给AI足够时间

    it('应该能够完整分析核心思想', async () => {
      const analysis = await processor.analyzeCoreIdea(VALID_FANTASY_IDEA);

      expect(analysis.validation.isValid).toBe(true);
      expect(analysis.elements).toBeDefined();
      expect(analysis.suggestions).toBeInstanceOf(Array);
      expect(analysis.aiAnalysis).toBeDefined();

      if (analysis.aiAnalysis) {
        expect(analysis.aiAnalysis.confidence).toBeGreaterThan(0);
        expect(analysis.aiAnalysis.confidence).toBeLessThanOrEqual(100);
        expect(analysis.aiAnalysis.modelUsed).toBe('qwen3:1.7b');
        expect(analysis.aiAnalysis.processingTime).toBeGreaterThan(0);
      }
    }, 30000);
  });

  describe('AI解析器功能', () => {
    it('应该能够解析并返回结构化数据', async () => {
      const result = await parser.parse(VALID_FANTASY_IDEA);

      expect(result).toBeDefined();
      expect(result.originalText).toBe(VALID_FANTASY_IDEA);
      expect(result.elements).toBeDefined();
      expect(result.structuredData).toBeDefined();
      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(100);

      // 验证结构化数据
      const { structuredData } = result;
      expect(structuredData.mainCharacter).toBeTruthy();
      expect(structuredData.supportingCharacters).toBeInstanceOf(Array);
      expect(structuredData.worldSetting).toBeDefined();
      expect(structuredData.plotStructure).toBeDefined();
      expect(structuredData.themes).toBeInstanceOf(Array);
      expect(structuredData.genre).toBeTruthy();
      expect(structuredData.targetAudience).toBeTruthy();
    }, 30000);

    it('应该能够验证解析能力', () => {
      const canParse = parser.canParse(VALID_FANTASY_IDEA);
      expect(canParse).toBe(true);

      const cannotParse = parser.canParse('太短');
      expect(cannotParse).toBe(false);
    });

    it('应该能够提供预览解析', async () => {
      const preview = await parser.previewParse(VALID_FANTASY_IDEA);

      expect(preview.originalText).toBe(VALID_FANTASY_IDEA);
      expect(preview.elements).toBeDefined();
      expect(preview.structuredData).toBeDefined();
      expect(preview.confidence).toBeGreaterThan(0);
    }, 30000);
  });

  describe('错误处理和后备机制', () => {
    it('应该能够处理无效输入', async () => {
      const invalidIdea = '太短了';

      await expect(parser.parse(invalidIdea)).rejects.toThrow('核心思想验证失败');
    });

    it('应该能够为无效输入提供预览', async () => {
      const preview = await parser.previewParse('太短');

      expect(preview.originalText).toBe('太短');
      expect(preview.confidence).toBe(0);
      expect(preview.suggestions).toBeDefined();
      expect(preview.suggestions.length).toBeGreaterThan(0);
    });
  });
});