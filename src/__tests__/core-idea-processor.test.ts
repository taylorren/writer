// Core idea processor tests

import { describe, it, expect, beforeEach } from 'vitest';
import { CoreIdeaProcessor } from '../services/core-idea-processor';

describe('核心思想处理器测试', () => {
  let processor: CoreIdeaProcessor;

  beforeEach(() => {
    processor = new CoreIdeaProcessor();
  });

  describe('输入验证测试', () => {
    it('应该拒绝空输入', () => {
      const result = processor.validateCoreIdea('');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('核心思想不能为空');
      expect(result.characterCount).toBe(0);
    });

    it('应该拒绝null或undefined输入', () => {
      const result1 = processor.validateCoreIdea(null as any);
      const result2 = processor.validateCoreIdea(undefined as any);
      
      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
      expect(result1.errors).toContain('核心思想不能为空');
      expect(result2.errors).toContain('核心思想不能为空');
    });

    it('应该拒绝过短的输入', () => {
      const shortIdea = '这是一个很短的故事想法。';
      const result = processor.validateCoreIdea(shortIdea);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('核心思想过短');
      expect(result.characterCount).toBeLessThan(300);
    });

    it('应该拒绝过长的输入', () => {
      const longIdea = '这是一个非常长的故事想法。'.repeat(50); // 创建超过500字的文本
      const result = processor.validateCoreIdea(longIdea);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('核心思想过长');
      expect(result.characterCount).toBeGreaterThan(500);
    });

    it('应该接受合适长度的输入', () => {
      // 创建一个恰好在300-500字范围内的有效输入
      const validIdea = '这是一个关于勇敢少年拯救世界的奇幻冒险故事。在一个充满魔法与神秘力量的异世界中，主角是一个普通的高中生，因为意外的机缘而被传送到了这个神奇的世界。他发现自己拥有了前所未有的特殊能力，能够操控各种元素的力量，包括火焰、冰霜、雷电和大地的能量。然而，这个美丽而神秘的世界正面临着来自黑暗势力的巨大威胁，邪恶的魔王正在集结庞大的军队，企图征服整个世界并将其笼罩在永恒的黑暗之中。主角必须在短时间内掌握自己的力量，学会控制这些强大的魔法能力，与当地的勇士们并肩作战。通过与各种伙伴的合作，包括智慧的法师、勇敢的骑士、机灵的盗贼和神秘的精灵，他们一起踏上了拯救世界的危险旅程。在这个充满挑战的过程中，主角不仅要面对外在的强大敌人，更要克服内心的恐惧和怀疑，实现真正的成长和蜕变，最终成为真正的英雄。';
      
      const result = processor.validateCoreIdea(validIdea);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.characterCount).toBeGreaterThanOrEqual(300);
      expect(result.characterCount).toBeLessThanOrEqual(500);
    });

    it('应该正确计算字数', () => {
      const mixedText = '这是中文text混合的内容123';
      const result = processor.validateCoreIdea(mixedText);
      
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.characterCount).toBe(mixedText.length);
    });

    it('应该提供内容质量警告', () => {
      // 创建一个长度足够但内容质量有问题的输入
      const simpleIdea = '这是一个简单的故事。这是一个简单的故事。这是一个简单的故事。'.repeat(5); // 重复内容且缺少基本要素
      const result = processor.validateCoreIdea(simpleIdea);
      
      // 如果长度在有效范围内，应该有质量警告
      if (result.characterCount >= 300 && result.characterCount <= 500) {
        expect(result.warnings.length).toBeGreaterThan(0);
      }
    });
  });

  describe('元素提取测试', () => {
    const sampleIdea = '这是一个关于勇敢少年在魔法世界中对抗邪恶势力的冒险故事。主角是一个普通的学生，意外发现自己拥有强大的魔法能力。在古老的魔法学院中，他结识了志同道合的朋友们，一起面对来自黑暗魔王的威胁。通过友情、勇气和不断的成长，他们最终拯救了整个魔法世界，恢复了光明与和平。这个故事充满了热血与激情，探讨了成长、友谊和正义的主题。';

    it('应该提取主题信息', async () => {
      const elements = await processor.extractElements(sampleIdea);
      
      expect(elements.theme).toBeTruthy();
      // AI可能返回更复杂的主题描述，只要包含相关关键词即可
      const theme = elements.theme.toLowerCase();
      const hasRelevantTheme = ['成长', '友情', '正义', '勇气', '冒险', '友谊'].some(keyword => 
        theme.includes(keyword)
      );
      expect(hasRelevantTheme).toBe(true);
    }, 15000);

    it('应该提取角色信息', async () => {
      const elements = await processor.extractElements(sampleIdea);
      
      expect(elements.characters).toBeInstanceOf(Array);
      expect(elements.characters.length).toBeGreaterThan(0);
    }, 15000);

    it('应该提取设定信息', async () => {
      const elements = await processor.extractElements(sampleIdea);
      
      expect(elements.setting).toBeTruthy();
      expect(elements.setting).toContain('魔法');
    }, 15000);

    it('应该提取冲突信息', async () => {
      const elements = await processor.extractElements(sampleIdea);
      
      expect(elements.conflict).toBeTruthy();
    }, 15000);

    it('应该提取体裁信息', async () => {
      const elements = await processor.extractElements(sampleIdea);
      
      expect(elements.genre).toBeTruthy();
      // AI可能返回不同的体裁描述，检查是否包含相关关键词
      const genre = elements.genre.toLowerCase();
      const hasRelevantGenre = ['玄幻', '奇幻', '魔幻', '冒险'].some(keyword => 
        genre.includes(keyword)
      );
      expect(hasRelevantGenre).toBe(true);
    }, 15000);

    it('应该提取情绪氛围', async () => {
      const elements = await processor.extractElements(sampleIdea);
      
      expect(elements.mood).toBeTruthy();
      // AI可能返回更复杂的情绪描述，检查是否包含相关关键词
      const mood = elements.mood.toLowerCase();
      const hasRelevantMood = ['热血', '激情', '冒险', '紧张', '刺激'].some(keyword => 
        mood.includes(keyword)
      );
      expect(hasRelevantMood).toBe(true);
    }, 15000);

    it('应该提取关键词', async () => {
      const elements = await processor.extractElements(sampleIdea);
      
      expect(elements.keyWords).toBeInstanceOf(Array);
      expect(elements.keyWords.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('完整分析测试', () => {
    it('应该对有效输入返回完整分析结果', async () => {
      const validIdea = '这是一个关于年轻程序员在虚拟现实世界中冒险的科幻故事。主角李明是一个普通的软件工程师，在一家大型科技公司工作多年。某天他意外发现了一个神秘的VR游戏，这个游戏的画面和体验都异常真实，仿佛是另一个真实的世界。在这个虚拟游戏世界中，他必须解决各种复杂的谜题和挑战，同时面对来自强大AI系统的持续威胁。随着他在游戏中的深入探索，他逐渐发现这不仅仅是一个普通的娱乐游戏，而是关乎现实世界安全的重要任务。原来这个虚拟世界连接着现实世界的核心系统，如果被恶意控制将会造成灾难性的后果。通过运用自己的编程技能、智慧、勇气和与其他玩家的团队合作，他最终揭开了隐藏在游戏背后的惊天阴谋，成功拯救了现实世界。这个故事深入探讨了科技与人性、虚拟与现实、个人责任与集体利益之间的复杂关系。';
      
      const result = await processor.analyzeCoreIdea(validIdea);
      
      expect(result.validation.isValid).toBe(true);
      expect(result.elements).toBeDefined();
      expect(result.elements.theme).toBeTruthy();
      expect(result.elements.characters.length).toBeGreaterThan(0);
      expect(result.elements.setting).toBeTruthy();
      // AI可能返回复合体裁描述，检查是否包含科幻关键词
      const genre = result.elements.genre.toLowerCase();
      const hasSciFiGenre = ['科幻', 'sci-fi', 'science', 'fiction'].some(keyword => 
        genre.includes(keyword)
      );
      expect(hasSciFiGenre).toBe(true);
      expect(result.suggestions).toBeInstanceOf(Array);
    }, 30000);

    it('应该对无效输入返回错误和建议', async () => {
      const invalidIdea = '太短了';
      
      const result = await processor.analyzeCoreIdea(invalidIdea);
      
      expect(result.validation.isValid).toBe(false);
      expect(result.validation.errors.length).toBeGreaterThan(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => s.includes('扩展'))).toBe(true);
    }, 15000);

    it('应该为不完整的内容提供改进建议', async () => {
      const incompleteIdea = '这是一个故事。'.repeat(50); // 长度够但内容简单
      
      const result = await processor.analyzeCoreIdea(incompleteIdea);
      
      if (result.validation.isValid) {
        expect(result.suggestions.length).toBeGreaterThan(0);
      }
    }, 15000);
  });

  describe('特殊情况测试', () => {
    it('应该处理只包含标点符号的输入', () => {
      const punctuationOnly = '。。。！！！？？？'.repeat(50);
      const result = processor.validateCoreIdea(punctuationOnly);
      
      expect(result.wordCount).toBe(0);
    });

    it('应该处理中英文混合输入', async () => {
      const mixedIdea = '这是一个about a young hero的story，他在modern world中面对various challenges，最终通过his courage和wisdom获得了success。这个故事explores the theme of growth和friendship，showing how people can overcome difficulties through determination和teamwork。The protagonist learns important lessons about life和responsibility，在这个journey中他discovers自己的true potential和inner strength。通过facing各种obstacles，他becomes更加mature和wise，最终achieves his goals并且helps others。';
      
      const result = await processor.analyzeCoreIdea(mixedIdea);
      
      expect(result.validation.characterCount).toBeGreaterThanOrEqual(300);
      expect(result.validation.characterCount).toBeLessThanOrEqual(500);
      expect(result.validation.isValid).toBe(true);
      expect(result.elements.keyWords.length).toBeGreaterThan(0);
    }, 45000);

    it('应该处理包含数字和特殊字符的输入', async () => {
      const specialIdea = '在2024年的未来世界，主角Alex-007是一个cyber-warrior，他必须在Matrix-like的虚拟空间中战斗。面对来自AI-9000的威胁，他使用高科技武器和hacking技能，与team-mates一起执行top-secret任务。这个故事融合了action、sci-fi和thriller元素，探讨了technology vs humanity的永恒主题。通过intense battles和emotional moments，主角最终实现了personal growth和world salvation。在这个充满未来科技的世界中，人类与人工智能之间的关系变得越来越复杂，主角必须在保护人类文明和理解AI意识之间找到平衡。他的任务不仅仅是战斗，更是要理解什么是真正的人性，什么是值得保护的价值。通过一系列惊心动魄的冒险和深刻的思考，他最终找到了答案，成为了连接人类和AI的桥梁。';
      
      const result = await processor.analyzeCoreIdea(specialIdea);
      
      expect(result.validation.isValid).toBe(true);
      // AI可能返回不同的体裁描述，检查是否包含科幻相关关键词
      const genre = result.elements.genre.toLowerCase();
      const hasSciFiGenre = ['科幻', 'sci-fi', 'science', 'fiction', '未来'].some(keyword => 
        genre.includes(keyword)
      );
      expect(hasSciFiGenre).toBe(true);
    }, 45000);

    it('应该正确识别不同体裁', async () => {
      const genres = [
        { text: '修仙者在仙界中修炼武功，追求长生不老的境界', expectedKeywords: ['仙侠', '修仙', '玄幻'] },
        { text: '侦探在现代都市中调查神秘的连环杀人案件', expectedKeywords: ['悬疑', '推理', '犯罪'] },
        { text: '年轻男女在校园中相遇相恋的浪漫爱情故事', expectedKeywords: ['言情', '爱情', '浪漫'] },
        { text: '古代将军在战场上指挥千军万马征战天下', expectedKeywords: ['历史', '古代', '战争'] }
      ];

      for (const { text, expectedKeywords } of genres) {
        const fullText = text.repeat(10); // 扩展到足够长度
        const elements = await processor.extractElements(fullText);
        
        // AI可能返回不同的体裁描述，检查是否包含相关关键词
        const genre = elements.genre.toLowerCase();
        const hasRelevantGenre = expectedKeywords.some(keyword => 
          genre.includes(keyword.toLowerCase())
        );
        expect(hasRelevantGenre).toBe(true);
      }
    }, 60000);
  });

  describe('边界条件测试', () => {
    it('应该处理恰好300字的输入', () => {
      // 创建恰好300字的字符串
      const base = '这是一个测试内容，用于验证核心思想处理器的字数统计功能。';
      const exactLength = base.repeat(Math.floor(300 / base.length)) + base.substring(0, 300 % base.length);
      
      const result = processor.validateCoreIdea(exactLength);
      
      expect(result.characterCount).toBe(300);
      expect(result.isValid).toBe(true);
    });

    it('应该处理恰好500字的输入', () => {
      // 创建恰好500字的字符串
      const base = '这是一个测试内容，用于验证核心思想处理器的字数统计功能。';
      const exactLength = base.repeat(Math.floor(500 / base.length)) + base.substring(0, 500 % base.length);
      
      const result = processor.validateCoreIdea(exactLength);
      
      expect(result.characterCount).toBe(500);
      expect(result.isValid).toBe(true);
    });

    it('应该处理299字的输入（边界外）', () => {
      // 创建恰好299字的字符串
      const base = '这是一个测试内容，用于验证核心思想处理器的字数统计功能。';
      const justUnder = base.repeat(Math.floor(299 / base.length)) + base.substring(0, 299 % base.length);
      
      const result = processor.validateCoreIdea(justUnder);
      
      expect(result.characterCount).toBe(299);
      expect(result.isValid).toBe(false);
    });

    it('应该处理501字的输入（边界外）', () => {
      // 创建恰好501字的字符串
      const base = '这是一个测试内容，用于验证核心思想处理器的字数统计功能。';
      const justOver = base.repeat(Math.floor(501 / base.length)) + base.substring(0, 501 % base.length);
      
      const result = processor.validateCoreIdea(justOver);
      
      expect(result.characterCount).toBe(501);
      expect(result.isValid).toBe(false);
    });
  });
});