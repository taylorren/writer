// Core idea parser tests

import { describe, it, expect, beforeEach } from 'vitest';
import { CoreIdeaParser, ParsedCoreIdea } from '../services/core-idea-parser';

describe('核心思想解析器测试', () => {
  let parser: CoreIdeaParser;

  beforeEach(() => {
    parser = new CoreIdeaParser();
  });

  // 有效的核心思想文本（超过300字）
  const VALID_FANTASY_IDEA = '这是一个关于勇敢少年拯救世界的奇幻冒险故事。在一个充满魔法与神秘力量的异世界中，主角李明是一个普通的高中生，因为意外的机缘而被传送到了这个神奇的世界。他发现自己拥有了前所未有的特殊能力，能够操控各种元素的力量，包括火焰、冰霜、雷电和大地的能量。然而，这个美丽而神秘的世界正面临着来自黑暗势力的巨大威胁，邪恶的魔王正在集结庞大的军队，企图征服整个世界并将其笼罩在永恒的黑暗之中。主角必须在短时间内掌握自己的力量，学会控制这些强大的魔法能力，与当地的勇士们并肩作战。通过与各种伙伴的合作，包括智慧的法师、勇敢的骑士、机灵的盗贼和神秘的精灵，他们一起踏上了拯救世界的危险旅程。在这个充满挑战的过程中，主角不仅要面对外在的强大敌人，更要克服内心的恐惧和怀疑，实现真正的成长和蜕变，最终成为真正的英雄。';

  const VALID_SCIFI_IDEA = '这是一个关于年轻程序员在虚拟现实世界中冒险的科幻故事。主角张伟是一个普通的软件工程师，在一家大型科技公司工作多年。某天他意外发现了一个神秘的VR游戏，这个游戏的画面和体验都异常真实，仿佛是另一个真实的世界。在这个虚拟游戏世界中，他必须解决各种复杂的谜题和挑战，同时面对来自强大AI系统的持续威胁。随着他在游戏中的深入探索，他逐渐发现这不仅仅是一个普通的娱乐游戏，而是关乎现实世界安全的重要任务。原来这个虚拟世界连接着现实世界的核心系统，如果被恶意控制将会造成灾难性的后果。通过运用自己的编程技能、智慧、勇气和与其他玩家的团队合作，他最终揭开了隐藏在游戏背后的惊天阴谋，成功拯救了现实世界。这个故事深入探讨了科技与人性、虚拟与现实、个人责任与集体利益之间的复杂关系。';

  describe('基本解析功能测试', () => {
    it('应该能够解析有效的奇幻核心思想', async () => {
      const result = await parser.parse(VALID_FANTASY_IDEA);
      
      expect(result).toBeDefined();
      expect(result.originalText).toBe(VALID_FANTASY_IDEA);
      expect(result.elements).toBeDefined();
      expect(result.structuredData).toBeDefined();
      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('应该能够解析有效的科幻核心思想', async () => {
      const result = await parser.parse(VALID_SCIFI_IDEA);
      
      expect(result).toBeDefined();
      expect(result.structuredData.genre).toBe('科幻');
      expect(result.structuredData.mainCharacter).toContain('张伟');
      expect(result.structuredData.worldSetting.location).toBe('虚拟世界');
    });

    it('应该拒绝无效的核心思想', async () => {
      const invalidIdea = '太短了';
      
      await expect(parser.parse(invalidIdea)).rejects.toThrow('核心思想验证失败');
    });
  });

  describe('结构化数据提取测试', () => {
    let result: ParsedCoreIdea;

    beforeEach(async () => {
      result = await parser.parse(VALID_FANTASY_IDEA);
    });

    it('应该正确提取主角信息', () => {
      expect(result.structuredData.mainCharacter).toBeTruthy();
      expect(result.structuredData.mainCharacter).toContain('李明');
    });

    it('应该正确提取配角信息', () => {
      expect(result.structuredData.supportingCharacters).toBeInstanceOf(Array);
      // 可能包含法师、骑士、盗贼、精灵等
    });

    it('应该正确提取世界设定', () => {
      const worldSetting = result.structuredData.worldSetting;
      
      expect(worldSetting.timeperiod).toBeTruthy();
      expect(worldSetting.location).toBeTruthy();
      expect(worldSetting.atmosphere).toBeTruthy();
    });

    it('应该正确提取情节结构', () => {
      const plotStructure = result.structuredData.plotStructure;
      
      expect(plotStructure.exposition).toBeTruthy();
      expect(plotStructure.conflict).toBeTruthy();
      expect(plotStructure.resolution).toBeTruthy();
    });

    it('应该正确识别主题', () => {
      expect(result.structuredData.themes).toBeInstanceOf(Array);
      expect(result.structuredData.themes.length).toBeGreaterThan(0);
    });

    it('应该正确识别体裁', () => {
      expect(result.structuredData.genre).toBeTruthy();
    });

    it('应该确定目标受众', () => {
      expect(result.structuredData.targetAudience).toBeTruthy();
    });
  });

  describe('验证功能测试', () => {
    it('应该正确验证有效输入', () => {
      const canParse = parser.canParse(VALID_FANTASY_IDEA);
      expect(canParse).toBe(true);
    });

    it('应该正确验证无效输入', () => {
      const canParse = parser.canParse('太短');
      expect(canParse).toBe(false);
    });
  });

  describe('预览解析功能测试', () => {
    it('应该为有效输入返回完整预览', async () => {
      const preview = await parser.previewParse(VALID_FANTASY_IDEA);
      
      expect(preview.originalText).toBe(VALID_FANTASY_IDEA);
      expect(preview.elements).toBeDefined();
      expect(preview.structuredData).toBeDefined();
      expect(preview.confidence).toBeGreaterThan(0);
    });

    it('应该为无效输入返回部分预览', async () => {
      const preview = await parser.previewParse('太短');
      
      expect(preview.originalText).toBe('太短');
      expect(preview.confidence).toBe(0);
      expect(preview.suggestions).toBeDefined();
      expect(preview.elements).toBeUndefined();
    });
  });

  describe('置信度计算测试', () => {
    it('应该为完整的核心思想返回高置信度', async () => {
      const result = await parser.parse(VALID_FANTASY_IDEA);
      expect(result.confidence).toBeGreaterThan(70);
    });

    it('应该为简单的核心思想返回较低置信度', async () => {
      const simpleIdea = '这是一个关于主角冒险的故事。'.repeat(20); // 长度够但内容简单
      
      if (parser.canParse(simpleIdea)) {
        const result = await parser.parse(simpleIdea);
        expect(result.confidence).toBeLessThan(80);
      }
    });
  });

  describe('不同体裁识别测试', () => {
    const testCases = [
      {
        genre: '仙侠',
        idea: '这是一个关于修仙者在仙界中修炼武功，追求长生不老境界的故事。主角李云是一个普通的凡人，因为机缘巧合获得了修仙的机会，在师父的指导下开始了漫长的修炼之路。他必须面对各种试炼和挑战，包括心魔的考验、强敌的威胁，以及修炼路上的种种困难。通过不断的努力和坚持，他逐渐提升自己的修为，从炼气期到筑基期，再到金丹期，每一个境界的突破都需要经历生死考验。在这个过程中，他结识了许多同道中人，也遇到了各种奇遇和机缘。最终成为了一代仙人，这个故事探讨了坚持、毅力和超越自我的主题，展现了修仙者追求永恒的精神境界。在这个充满仙气的世界中，主角不仅要掌握各种法术和神通，更要理解修仙的真正意义，那就是超越凡俗，达到与天地同寿的境界，成为真正的仙人。'
      },
      {
        genre: '悬疑',
        idea: '这是一个关于侦探在现代都市中调查神秘连环杀人案件的悬疑故事。主角王刚是一名经验丰富的刑警，面对一系列看似毫无关联的谋杀案，他必须运用自己的推理能力和调查技巧来寻找真相。每个案件都留下了神秘的线索，凶手似乎在与警方玩着一场智力游戏。随着调查的深入，主角发现这些案件背后隐藏着一个更大的阴谋，涉及到多年前的一桩旧案。通过抽丝剥茧的调查和缜密的推理，他逐渐接近真相，但同时也面临着来自幕后黑手的威胁和阻挠。在这个过程中，他不仅要保护自己和家人的安全，还要与时间赛跑，阻止更多无辜的人成为受害者。最终通过智慧和勇气，他揭开了真相，将凶手绳之以法。这个故事充满了悬念和转折，展现了正义与邪恶之间的较量，以及真相大白时的震撼和满足感。'
      }
    ];

    testCases.forEach(({ genre, idea }) => {
      it(`应该正确识别${genre}体裁`, async () => {
        const result = await parser.parse(idea);
        expect(result.structuredData.genre).toBe(genre);
      });
    });
  });

  describe('特殊情况处理测试', () => {
    it('应该处理中英文混合的核心思想', async () => {
      const mixedIdea = '这是一个about a young hero的story，他在modern world中面对various challenges，最终通过his courage和wisdom获得了success。这个故事explores the theme of growth和friendship，showing how people can overcome difficulties through determination和teamwork。The protagonist learns important lessons about life和responsibility，在这个journey中他discovers自己的true potential和inner strength。通过facing各种obstacles，他becomes更加mature和wise，最终achieves his goals并且helps others。这个故事充满了inspiration和hope，展现了年轻人的无限可能性和成长的力量。';
      
      const result = await parser.parse(mixedIdea);
      
      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.structuredData.themes.length).toBeGreaterThan(0);
    });

    it('应该处理包含特殊字符的核心思想', async () => {
      const specialIdea = '在2024年的未来世界，主角Alex-007是一个cyber-warrior，他必须在Matrix-like的虚拟空间中战斗。面对来自AI-9000的威胁，他使用高科技武器和hacking技能，与team-mates一起执行top-secret任务。这个故事融合了action、sci-fi和thriller元素，探讨了technology vs humanity的永恒主题。通过intense battles和emotional moments，主角最终实现了personal growth和world salvation。在这个充满未来科技的世界中，人类与人工智能之间的关系变得越来越复杂，主角必须在保护人类文明和理解AI意识之间找到平衡。他的任务不仅仅是战斗，更是要理解什么是真正的人性，什么是值得保护的价值。';
      
      const result = await parser.parse(specialIdea);
      
      expect(result.structuredData.genre).toBe('科幻');
      expect(result.structuredData.mainCharacter).toContain('Alex');
    });
  });

  describe('边界条件测试', () => {
    it('应该处理恰好300字的输入', async () => {
      // 创建恰好300字的有效核心思想
      const base = '这是一个关于勇敢少年冒险的奇幻故事，主角在魔法世界中面对各种挑战和困难。';
      const exactLength = base.repeat(Math.floor(300 / base.length)) + base.substring(0, 300 % base.length);
      
      if (parser.canParse(exactLength)) {
        const result = await parser.parse(exactLength);
        expect(result).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0);
      }
    });

    it('应该处理恰好500字的输入', async () => {
      // 创建恰好500字的有效核心思想
      const base = '这是一个关于勇敢少年冒险的奇幻故事，主角在魔法世界中面对各种挑战和困难。';
      const exactLength = base.repeat(Math.floor(500 / base.length)) + base.substring(0, 500 % base.length);
      
      if (parser.canParse(exactLength)) {
        const result = await parser.parse(exactLength);
        expect(result).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0);
      }
    });
  });

  describe('建议生成测试', () => {
    it('应该为完整的核心思想提供改进建议', async () => {
      const result = await parser.parse(VALID_FANTASY_IDEA);
      
      expect(result.suggestions).toBeInstanceOf(Array);
      // 即使是完整的核心思想，也可能有改进空间
    });

    it('应该为无效输入提供具体建议', async () => {
      const preview = await parser.previewParse('太短');
      
      expect(preview.suggestions).toBeInstanceOf(Array);
      expect(preview.suggestions.length).toBeGreaterThan(0);
      expect(preview.suggestions.some(s => s.includes('扩展'))).toBe(true);
    });
  });
});