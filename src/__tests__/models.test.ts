// Unit tests for core data models and validation

import { describe, it, expect } from 'vitest';
import {
  Project,
  Outline,
  Chapter,
  Character,
  WorldSetting,
  PlotStructure,
  Conflict,
  WritingStyle,
  ChapterStatus,
  ConflictType,
  RelationshipType,
  Language
} from '../models/index';
import {
  validateProject,
  validateOutline,
  validateChapter,
  validateCharacter,
  validateWorldSetting,
  validatePlotStructure,
  validateConflict,
  validateWritingStyle
} from '../models/validation';

describe('数据模型验证测试', () => {
  describe('Project 验证', () => {
    it('应该验证有效的项目数据', () => {
      const validProject: Project = {
        id: 'test-project-1',
        coreIdea: '这是一个关于勇敢少年拯救世界的故事。在一个充满魔法的世界里，主角发现自己拥有特殊的能力，必须面对邪恶势力的威胁。通过与朋友们的合作和自身的成长，最终战胜了黑暗，恢复了世界的和平。这个故事探讨了友谊、勇气和成长的主题，展现了年轻人面对困难时的坚韧不拔。故事中包含了丰富的想象力和深刻的人生哲理，适合各个年龄段的读者。主角的成长历程将激励读者勇敢面对生活中的挑战，相信自己的力量。整个故事从一个普通少年的日常生活开始，逐渐展开一个宏大的冒险世界。主角在旅程中遇到各种挑战和困难，不仅要面对外在的敌人，更要克服内心的恐惧和怀疑。通过一系列的试炼和成长，主角最终成为了真正的英雄，不仅拯救了世界，也完成了自己的心灵蜕变。',
        outline: {
          mainTheme: '成长与勇气',
          characters: [],
          worldSetting: {
            timeperiod: '现代奇幻',
            location: '虚构的魔法世界',
            socialContext: '魔法与科技并存的社会',
            rules: ['魔法需要天赋', '善恶有报'],
            atmosphere: '充满希望的冒险'
          },
          plotStructure: {
            exposition: '介绍主角和世界背景',
            risingAction: [],
            climax: '最终决战',
            fallingAction: [],
            resolution: '和平恢复'
          },
          conflicts: []
        },
        style: {
          id: 'adventure-style',
          name: '冒险风格',
          description: '充满激情的冒险叙述',
          characteristics: {
            tone: '积极向上',
            pacing: '快节奏',
            vocabulary: '生动形象',
            sentenceStructure: '简洁有力',
            narrativeVoice: '第三人称'
          },
          examples: []
        },
        chapters: [],
        currentWordCount: 0,
        targetWordCount: 1000000,
        language: Language.CHINESE,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02')
      };

      const result = validateProject(validProject);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测核心思想长度不足', () => {
      const invalidProject: Project = {
        id: 'test-project-2',
        coreIdea: '太短的核心思想',
        outline: {
          mainTheme: '测试主题',
          characters: [],
          worldSetting: {
            timeperiod: '现代',
            location: '城市',
            socialContext: '现代社会',
            rules: [],
            atmosphere: '现实'
          },
          plotStructure: {
            exposition: '开端',
            risingAction: [],
            climax: '高潮',
            fallingAction: [],
            resolution: '结局'
          },
          conflicts: []
        },
        style: {
          id: 'test-style',
          name: '测试风格',
          description: '测试用风格',
          characteristics: {
            tone: '中性',
            pacing: '中等',
            vocabulary: '普通',
            sentenceStructure: '标准',
            narrativeVoice: '第三人称'
          },
          examples: []
        },
        chapters: [],
        currentWordCount: 0,
        targetWordCount: 1000000,
        language: Language.CHINESE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = validateProject(invalidProject);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'CORE_IDEA_TOO_SHORT')).toBe(true);
    });

    it('应该检测核心思想长度过长', () => {
      const longIdea = '这是一个非常长的核心思想，'.repeat(50); // 超过500字
      const invalidProject: Project = {
        id: 'test-project-3',
        coreIdea: longIdea,
        outline: {
          mainTheme: '测试主题',
          characters: [],
          worldSetting: {
            timeperiod: '现代',
            location: '城市',
            socialContext: '现代社会',
            rules: [],
            atmosphere: '现实'
          },
          plotStructure: {
            exposition: '开端',
            risingAction: [],
            climax: '高潮',
            fallingAction: [],
            resolution: '结局'
          },
          conflicts: []
        },
        style: {
          id: 'test-style',
          name: '测试风格',
          description: '测试用风格',
          characteristics: {
            tone: '中性',
            pacing: '中等',
            vocabulary: '普通',
            sentenceStructure: '标准',
            narrativeVoice: '第三人称'
          },
          examples: []
        },
        chapters: [],
        currentWordCount: 0,
        targetWordCount: 1000000,
        language: Language.CHINESE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = validateProject(invalidProject);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'CORE_IDEA_TOO_LONG')).toBe(true);
    });

    it('应该警告目标字数少于100万字', () => {
      const project: Project = {
        id: 'test-project-4',
        coreIdea: '这是一个关于勇敢少年拯救世界的故事。在一个充满魔法的世界里，主角发现自己拥有特殊的能力，必须面对邪恶势力的威胁。通过与朋友们的合作和自身的成长，最终战胜了黑暗，恢复了世界的和平。这个故事探讨了友谊、勇气和成长的主题，展现了年轻人面对困难时的坚韧不拔。故事中包含了丰富的想象力和深刻的人生哲理，适合各个年龄段的读者。主角的成长历程将激励读者勇敢面对生活中的挑战，相信自己的力量。',
        outline: {
          mainTheme: '测试主题',
          characters: [],
          worldSetting: {
            timeperiod: '现代',
            location: '城市',
            socialContext: '现代社会',
            rules: [],
            atmosphere: '现实'
          },
          plotStructure: {
            exposition: '开端',
            risingAction: [],
            climax: '高潮',
            fallingAction: [],
            resolution: '结局'
          },
          conflicts: []
        },
        style: {
          id: 'test-style',
          name: '测试风格',
          description: '测试用风格',
          characteristics: {
            tone: '中性',
            pacing: '中等',
            vocabulary: '普通',
            sentenceStructure: '标准',
            narrativeVoice: '第三人称'
          },
          examples: []
        },
        chapters: [],
        currentWordCount: 0,
        targetWordCount: 500000, // 少于100万字
        language: Language.CHINESE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = validateProject(project);
      expect(result.warnings.some(w => w.field === 'targetWordCount')).toBe(true);
    });
  });

  describe('Chapter 验证', () => {
    it('应该验证有效的章节数据', () => {
      const validChapter: Chapter = {
        id: 'chapter-1',
        title: '第一章：开始的冒险',
        summary: '主角踏上了冒险的旅程',
        keyPlotPoints: [
          {
            id: 'plot-1',
            description: '主角发现自己的能力',
            importance: 5
          }
        ],
        requiredElements: ['角色介绍', '世界观展示'],
        estimatedWordCount: 3000,
        actualWordCount: 0,
        content: '',
        status: ChapterStatus.NOT_STARTED
      };

      const result = validateChapter(validChapter);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该警告章节字数过少', () => {
      const chapter: Chapter = {
        id: 'chapter-2',
        title: '第二章',
        summary: '简短章节',
        keyPlotPoints: [],
        requiredElements: [],
        estimatedWordCount: 1000, // 少于建议的2000字
        actualWordCount: 0,
        content: '',
        status: ChapterStatus.NOT_STARTED
      };

      const result = validateChapter(chapter);
      expect(result.warnings.some(w => w.field === 'estimatedWordCount')).toBe(true);
    });

    it('应该警告章节字数过多', () => {
      const chapter: Chapter = {
        id: 'chapter-3',
        title: '第三章',
        summary: '很长的章节',
        keyPlotPoints: [],
        requiredElements: [],
        estimatedWordCount: 5000, // 超过建议的4000字
        actualWordCount: 0,
        content: '',
        status: ChapterStatus.NOT_STARTED
      };

      const result = validateChapter(chapter);
      expect(result.warnings.some(w => w.field === 'estimatedWordCount')).toBe(true);
    });
  });

  describe('Character 验证', () => {
    it('应该验证有效的角色数据', () => {
      const validCharacter: Character = {
        id: 'char-1',
        name: '李小明',
        description: '勇敢的少年主角',
        personality: ['勇敢', '善良', '坚韧'],
        background: '普通家庭出身的少年',
        relationships: [
          {
            characterId: 'char-2',
            type: RelationshipType.FRIEND,
            description: '最好的朋友'
          }
        ],
        developmentArc: '从普通少年成长为英雄'
      };

      const result = validateCharacter(validCharacter);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测角色姓名为空', () => {
      const invalidCharacter: Character = {
        id: 'char-2',
        name: '', // 空姓名
        description: '测试角色',
        personality: ['测试'],
        background: '测试背景',
        relationships: [],
        developmentArc: '测试发展'
      };

      const result = validateCharacter(invalidCharacter);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'CHARACTER_NAME_EMPTY')).toBe(true);
    });
  });

  describe('WorldSetting 验证', () => {
    it('应该验证有效的世界设定', () => {
      const validWorldSetting: WorldSetting = {
        timeperiod: '现代奇幻时代',
        location: '虚构的魔法大陆',
        socialContext: '魔法师与普通人共存的社会',
        rules: ['魔法有代价', '力量需要责任'],
        atmosphere: '神秘而充满希望'
      };

      const result = validateWorldSetting(validWorldSetting);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该警告缺少时间设定', () => {
      const worldSetting: WorldSetting = {
        timeperiod: '', // 空时间设定
        location: '某个地方',
        socialContext: '某种社会',
        rules: [],
        atmosphere: '某种氛围'
      };

      const result = validateWorldSetting(worldSetting);
      expect(result.warnings.some(w => w.field === 'timeperiod')).toBe(true);
    });
  });

  describe('PlotStructure 验证', () => {
    it('应该验证有效的情节结构', () => {
      const validPlotStructure: PlotStructure = {
        exposition: '故事开端，介绍主角和背景',
        risingAction: [
          {
            id: 'rising-1',
            description: '主角发现能力',
            importance: 4
          }
        ],
        climax: '最终决战，主角面对最大挑战',
        fallingAction: [
          {
            id: 'falling-1',
            description: '战后处理',
            importance: 3
          }
        ],
        resolution: '和平恢复，主角成长完成'
      };

      const result = validatePlotStructure(validPlotStructure);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该警告缺少高潮描述', () => {
      const plotStructure: PlotStructure = {
        exposition: '开端',
        risingAction: [],
        climax: '', // 空高潮
        fallingAction: [],
        resolution: '结局'
      };

      const result = validatePlotStructure(plotStructure);
      expect(result.warnings.some(w => w.field === 'climax')).toBe(true);
    });
  });

  describe('Conflict 验证', () => {
    it('应该验证有效的冲突数据', () => {
      const validConflict: Conflict = {
        type: ConflictType.INTERPERSONAL,
        description: '主角与反派之间的对立',
        participants: ['主角', '反派'],
        resolution: '通过战斗解决'
      };

      const result = validateConflict(validConflict);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测冲突描述为空', () => {
      const invalidConflict: Conflict = {
        type: ConflictType.INTERNAL,
        description: '', // 空描述
        participants: ['主角'],
        resolution: '内心成长'
      };

      const result = validateConflict(invalidConflict);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'CONFLICT_DESCRIPTION_EMPTY')).toBe(true);
    });
  });

  describe('WritingStyle 验证', () => {
    it('应该验证有效的写作风格', () => {
      const validStyle: WritingStyle = {
        id: 'style-1',
        name: '现实主义风格',
        description: '贴近生活的写作风格',
        characteristics: {
          tone: '平实自然',
          pacing: '稳健',
          vocabulary: '日常用语',
          sentenceStructure: '简洁明了',
          narrativeVoice: '第三人称全知'
        },
        examples: ['示例1', '示例2']
      };

      const result = validateWritingStyle(validStyle);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测风格ID为空', () => {
      const invalidStyle: WritingStyle = {
        id: '', // 空ID
        name: '测试风格',
        description: '测试描述',
        characteristics: {
          tone: '测试',
          pacing: '测试',
          vocabulary: '测试',
          sentenceStructure: '测试',
          narrativeVoice: '测试'
        },
        examples: []
      };

      const result = validateWritingStyle(invalidStyle);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'STYLE_ID_EMPTY')).toBe(true);
    });
  });
});

describe('数据模型结构测试', () => {
  it('应该正确创建Project实例', () => {
    const project: Project = {
      id: 'test-id',
      coreIdea: '这是一个测试的核心思想，用于验证项目数据模型的正确性。这个思想包含了足够的字数来满足验证要求，同时展示了项目创建的基本流程。通过这个测试，我们可以确保数据模型的结构是正确的，各个字段都能正常工作。这个核心思想描述了一个关于测试的故事，主角是一个勇敢的开发者，通过编写测试来确保代码质量。在这个过程中，开发者学会了如何设计好的数据结构，如何编写有效的验证逻辑，以及如何创建全面的测试用例。',
      outline: {
        mainTheme: '测试主题',
        characters: [],
        worldSetting: {
          timeperiod: '现代',
          location: '开发环境',
          socialContext: '软件开发',
          rules: ['代码质量第一', '测试驱动开发'],
          atmosphere: '专业严谨'
        },
        plotStructure: {
          exposition: '项目开始',
          risingAction: [],
          climax: '测试通过',
          fallingAction: [],
          resolution: '项目成功'
        },
        conflicts: []
      },
      style: {
        id: 'technical-style',
        name: '技术文档风格',
        description: '清晰准确的技术描述',
        characteristics: {
          tone: '专业',
          pacing: '稳定',
          vocabulary: '技术术语',
          sentenceStructure: '逻辑清晰',
          narrativeVoice: '客观'
        },
        examples: []
      },
      chapters: [],
      currentWordCount: 0,
      targetWordCount: 1000000,
      language: Language.CHINESE,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(project.id).toBe('test-id');
    expect(project.coreIdea).toContain('测试');
    expect(project.targetWordCount).toBe(1000000);
    expect(project.language).toBe(Language.CHINESE);
  });

  it('应该正确创建Chapter实例', () => {
    const chapter: Chapter = {
      id: 'chapter-test',
      title: '测试章节',
      summary: '这是一个测试章节',
      keyPlotPoints: [],
      requiredElements: ['测试元素'],
      estimatedWordCount: 3000,
      actualWordCount: 0,
      content: '',
      status: ChapterStatus.NOT_STARTED
    };

    expect(chapter.id).toBe('chapter-test');
    expect(chapter.title).toBe('测试章节');
    expect(chapter.status).toBe(ChapterStatus.NOT_STARTED);
    expect(chapter.estimatedWordCount).toBe(3000);
  });

  it('应该正确创建Character实例', () => {
    const character: Character = {
      id: 'char-test',
      name: '测试角色',
      description: '用于测试的角色',
      personality: ['认真', '细致'],
      background: '测试背景',
      relationships: [],
      developmentArc: '测试发展轨迹'
    };

    expect(character.id).toBe('char-test');
    expect(character.name).toBe('测试角色');
    expect(character.personality).toContain('认真');
  });
});