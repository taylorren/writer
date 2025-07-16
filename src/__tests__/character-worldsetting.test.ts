// Unit tests for Character and WorldSetting models with enhanced validation

import { describe, it, expect } from 'vitest';
import {
  Character,
  WorldSetting,
  PlotStructure,
  RelationshipType,
  ConflictType
} from '../models/index';
import {
  validateCharacter,
  validateWorldSetting,
  validatePlotStructure
} from '../models/validation';

describe('角色和世界设定模型测试', () => {
  describe('Character 增强验证', () => {
    it('应该验证完整的角色数据', () => {
      const completeCharacter: Character = {
        id: 'char-001',
        name: '李明轩',
        description: '一个来自普通家庭的十八岁少年，拥有坚定的意志和善良的心灵。他身材中等，黑发黑眼，总是带着温和的笑容。虽然出身平凡，但内心充满对正义的渴望和对未来的憧憬。',
        personality: ['勇敢', '善良', '坚韧', '乐观', '责任感强'],
        background: '出生在一个普通的工人家庭，从小就展现出与众不同的品格。父母都是勤劳朴实的人，给了他良好的家庭教育。在学校里成绩优异，深受老师和同学的喜爱。',
        relationships: [
          {
            characterId: 'char-002',
            type: RelationshipType.FRIEND,
            description: '从小一起长大的挚友，彼此信任，互相支持'
          },
          {
            characterId: 'char-003',
            type: RelationshipType.MENTOR,
            description: '指导他成长的智者，传授给他重要的人生道理'
          }
        ],
        developmentArc: '从一个普通少年成长为承担重大责任的英雄，在过程中学会了勇气、智慧和牺牲精神'
      };

      const result = validateCharacter(completeCharacter);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该警告角色描述过于简单', () => {
      const character: Character = {
        id: 'char-002',
        name: '张三',
        description: '一个普通人', // 少于50字
        personality: ['善良'],
        background: '普通背景',
        relationships: [],
        developmentArc: '成长轨迹'
      };

      const result = validateCharacter(character);
      expect(result.warnings.some(w => w.field === 'description' && w.message.includes('过于简单'))).toBe(true);
    });

    it('应该警告性格特征过少', () => {
      const character: Character = {
        id: 'char-003',
        name: '李四',
        description: '这是一个详细的角色描述，包含了足够的信息来描述这个角色的外貌、性格和背景，确保描述长度超过五十个字符。',
        personality: ['勇敢', '善良'], // 少于3个特征
        background: '详细的背景描述',
        relationships: [],
        developmentArc: '详细的发展轨迹'
      };

      const result = validateCharacter(character);
      expect(result.warnings.some(w => w.field === 'personality' && w.message.includes('更多性格特征'))).toBe(true);
    });

    it('应该检测自我关系错误', () => {
      const character: Character = {
        id: 'char-004',
        name: '王五',
        description: '这是一个详细的角色描述，包含了足够的信息来描述这个角色的外貌、性格和背景，确保描述长度超过五十个字符。',
        personality: ['聪明', '机智', '幽默'],
        background: '详细的背景描述',
        relationships: [
          {
            characterId: 'char-004', // 与自己建立关系
            type: RelationshipType.FRIEND,
            description: '自己的朋友'
          }
        ],
        developmentArc: '详细的发展轨迹'
      };

      const result = validateCharacter(character);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'SELF_RELATIONSHIP_NOT_ALLOWED')).toBe(true);
    });

    it('应该警告重复的角色关系', () => {
      const character: Character = {
        id: 'char-005',
        name: '赵六',
        description: '这是一个详细的角色描述，包含了足够的信息来描述这个角色的外貌、性格和背景，确保描述长度超过五十个字符。',
        personality: ['冷静', '理智', '果断'],
        background: '详细的背景描述',
        relationships: [
          {
            characterId: 'char-006',
            type: RelationshipType.FRIEND,
            description: '好朋友'
          },
          {
            characterId: 'char-006', // 重复的角色ID
            type: RelationshipType.COLLEAGUE,
            description: '同事关系'
          }
        ],
        developmentArc: '详细的发展轨迹'
      };

      const result = validateCharacter(character);
      expect(result.warnings.some(w => w.field === 'relationships' && w.message.includes('重复'))).toBe(true);
    });

    it('应该警告缺少关系描述', () => {
      const character: Character = {
        id: 'char-007',
        name: '孙七',
        description: '这是一个详细的角色描述，包含了足够的信息来描述这个角色的外貌、性格和背景，确保描述长度超过五十个字符。',
        personality: ['热情', '开朗', '活泼'],
        background: '详细的背景描述',
        relationships: [
          {
            characterId: 'char-008',
            type: RelationshipType.ROMANTIC,
            description: '' // 空描述
          }
        ],
        developmentArc: '详细的发展轨迹'
      };

      const result = validateCharacter(character);
      expect(result.warnings.some(w => w.field.includes('relationships') && w.message.includes('关系描述'))).toBe(true);
    });
  });

  describe('WorldSetting 增强验证', () => {
    it('应该验证完整的世界设定', () => {
      const completeWorldSetting: WorldSetting = {
        timeperiod: '21世纪初的现代都市，科技发达但仍保留着传统文化的痕迹',
        location: '虚构的东方大都市"新华市"，拥有现代化的摩天大楼和古老的文化街区，地理位置优越，交通便利',
        socialContext: '一个多元化的现代社会，科技与传统并存，不同阶层的人们在这里生活工作，社会结构相对稳定但也存在各种矛盾和冲突',
        rules: [
          '科技发展必须符合伦理道德标准',
          '传统文化受到法律保护不得随意破坏',
          '社会公平正义是最高原则',
          '个人自由不得侵犯他人权利'
        ],
        atmosphere: '充满希望但也暗藏危机的现代都市氛围，快节奏的生活中蕴含着人文关怀'
      };

      const result = validateWorldSetting(completeWorldSetting);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该警告时间设定过于简单', () => {
      const worldSetting: WorldSetting = {
        timeperiod: '现代', // 少于10字
        location: '城市环境，包含各种现代化设施和传统建筑',
        socialContext: '现代社会结构，多元化发展',
        rules: ['基本法律法规'],
        atmosphere: '现代都市氛围'
      };

      const result = validateWorldSetting(worldSetting);
      expect(result.warnings.some(w => w.field === 'timeperiod' && w.message.includes('过于简单'))).toBe(true);
    });

    it('应该警告地点设定过于简单', () => {
      const worldSetting: WorldSetting = {
        timeperiod: '21世纪的现代社会',
        location: '大城市', // 少于10字
        socialContext: '现代化的社会结构，包含各个阶层的人群',
        rules: ['法律制度完善'],
        atmosphere: '繁华都市的生活氛围'
      };

      const result = validateWorldSetting(worldSetting);
      expect(result.warnings.some(w => w.field === 'location' && w.message.includes('过于简单'))).toBe(true);
    });

    it('应该警告社会背景描述过于简单', () => {
      const worldSetting: WorldSetting = {
        timeperiod: '现代科技时代，信息发达',
        location: '国际化大都市，交通便利设施完善',
        socialContext: '现代社会', // 少于20字
        rules: ['遵守法律法规', '维护社会秩序'],
        atmosphere: '积极向上的社会氛围'
      };

      const result = validateWorldSetting(worldSetting);
      expect(result.warnings.some(w => w.field === 'socialContext' && w.message.includes('过于简单'))).toBe(true);
    });

    it('应该警告世界规则描述过于简单', () => {
      const worldSetting: WorldSetting = {
        timeperiod: '未来科幻时代，科技高度发达',
        location: '太空殖民地，拥有先进的生活设施',
        socialContext: '高科技社会，人工智能与人类和谐共存，社会结构高度发达',
        rules: [
          '守法', // 少于10字
          '人工智能必须服务于人类福祉',
          '环保'  // 少于10字
        ],
        atmosphere: '充满科技感的未来世界氛围'
      };

      const result = validateWorldSetting(worldSetting);
      expect(result.warnings.some(w => w.field === 'rules' && w.message.includes('过于简单'))).toBe(true);
    });

    it('应该检测时间设定与社会背景的不一致性', () => {
      const worldSetting: WorldSetting = {
        timeperiod: '21世纪现代科技社会', // 现代关键词
        location: '现代化国际都市',
        socialContext: '古代封建社会结构，等级森严', // 古代关键词
        rules: ['现代法律制度'],
        atmosphere: '现代都市氛围'
      };

      const result = validateWorldSetting(worldSetting);
      expect(result.warnings.some(w => w.field === 'socialContext' && w.message.includes('不一致'))).toBe(true);
    });

    it('应该警告缺少各种设定要素', () => {
      const incompleteWorldSetting: WorldSetting = {
        timeperiod: '',
        location: '',
        socialContext: '',
        rules: [],
        atmosphere: ''
      };

      const result = validateWorldSetting(incompleteWorldSetting);
      expect(result.warnings.some(w => w.field === 'timeperiod')).toBe(true);
      expect(result.warnings.some(w => w.field === 'location')).toBe(true);
      expect(result.warnings.some(w => w.field === 'socialContext')).toBe(true);
      expect(result.warnings.some(w => w.field === 'rules')).toBe(true);
      expect(result.warnings.some(w => w.field === 'atmosphere')).toBe(true);
    });
  });

  describe('PlotStructure 验证', () => {
    it('应该验证完整的情节结构', () => {
      const completePlotStructure: PlotStructure = {
        exposition: '故事开始于一个平凡的小镇，主角过着普通的生活',
        risingAction: [
          {
            id: 'rising-1',
            description: '主角发现了一个神秘的秘密',
            importance: 4
          },
          {
            id: 'rising-2',
            description: '冲突开始升级，主角面临选择',
            importance: 5
          }
        ],
        climax: '最终的决战时刻，主角必须做出最重要的决定',
        fallingAction: [
          {
            id: 'falling-1',
            description: '战斗结束后的后续处理',
            importance: 3
          }
        ],
        resolution: '故事圆满结束，主角完成了成长和蜕变'
      };

      const result = validatePlotStructure(completePlotStructure);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该警告缺少情节结构要素', () => {
      const incompletePlotStructure: PlotStructure = {
        exposition: '',
        risingAction: [],
        climax: '',
        fallingAction: [],
        resolution: ''
      };

      const result = validatePlotStructure(incompletePlotStructure);
      expect(result.warnings.some(w => w.field === 'exposition')).toBe(true);
      expect(result.warnings.some(w => w.field === 'climax')).toBe(true);
      expect(result.warnings.some(w => w.field === 'resolution')).toBe(true);
      expect(result.warnings.some(w => w.field === 'risingAction')).toBe(true);
      expect(result.warnings.some(w => w.field === 'fallingAction')).toBe(true);
    });
  });

  describe('角色关系类型测试', () => {
    it('应该支持所有关系类型', () => {
      const relationshipTypes = Object.values(RelationshipType);
      expect(relationshipTypes).toContain(RelationshipType.FAMILY);
      expect(relationshipTypes).toContain(RelationshipType.FRIEND);
      expect(relationshipTypes).toContain(RelationshipType.ENEMY);
      expect(relationshipTypes).toContain(RelationshipType.ROMANTIC);
      expect(relationshipTypes).toContain(RelationshipType.MENTOR);
      expect(relationshipTypes).toContain(RelationshipType.COLLEAGUE);
    });

    it('应该正确验证关系类型', () => {
      const character: Character = {
        id: 'char-test',
        name: '测试角色',
        description: '这是一个用于测试关系类型验证的角色，描述足够详细以满足验证要求。',
        personality: ['测试', '验证', '完整'],
        background: '测试背景',
        relationships: [
          {
            characterId: 'char-other',
            type: 'INVALID_TYPE' as RelationshipType, // 无效类型
            description: '测试关系'
          }
        ],
        developmentArc: '测试发展'
      };

      const result = validateCharacter(character);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_RELATIONSHIP_TYPE')).toBe(true);
    });
  });
});