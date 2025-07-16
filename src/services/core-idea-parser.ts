// Core idea parser service - extracts structured information from core ideas

import { ExtractedElements, CoreIdeaProcessor, CoreIdeaAnalysisResult } from './core-idea-processor';
import { OllamaClient, createOllamaClient } from './ollama-client';

export interface ParsedCoreIdea {
  originalText: string;
  elements: ExtractedElements;
  structuredData: {
    mainCharacter: string;
    supportingCharacters: string[];
    worldSetting: {
      timeperiod: string;
      location: string;
      atmosphere: string;
    };
    plotStructure: {
      exposition: string;
      conflict: string;
      resolution: string;
    };
    themes: string[];
    genre: string;
    targetAudience: string;
  };
  suggestions: string[];
  confidence: number;
}

export class CoreIdeaParser {
  private processor: CoreIdeaProcessor;

  constructor() {
    this.processor = new CoreIdeaProcessor();
  }

  /**
   * 解析核心思想并返回结构化数据
   */
  public async parse(coreIdea: string): Promise<ParsedCoreIdea> {
    const analysis = await this.processor.analyzeCoreIdea(coreIdea);
    
    if (!analysis.validation.isValid) {
      throw new Error(`核心思想验证失败: ${analysis.validation.errors.join(', ')}`);
    }

    const structuredData = this.buildStructuredData(analysis.elements, coreIdea);
    const confidence = this.calculateConfidence(analysis.elements, analysis.validation);

    return {
      originalText: coreIdea,
      elements: analysis.elements,
      structuredData,
      suggestions: analysis.suggestions,
      confidence
    };
  }

  /**
   * 验证核心思想是否可以解析
   */
  public canParse(coreIdea: string): boolean {
    const validation = this.processor.validateCoreIdea(coreIdea);
    return validation.isValid;
  }

  /**
   * 获取解析预览（不抛出错误）
   */
  public async previewParse(coreIdea: string): Promise<Partial<ParsedCoreIdea>> {
    const analysis = await this.processor.analyzeCoreIdea(coreIdea);
    
    if (!analysis.validation.isValid) {
      return {
        originalText: coreIdea,
        suggestions: analysis.suggestions,
        confidence: 0
      };
    }

    const structuredData = this.buildStructuredData(analysis.elements, coreIdea);
    const confidence = this.calculateConfidence(analysis.elements, analysis.validation);

    return {
      originalText: coreIdea,
      elements: analysis.elements,
      structuredData,
      suggestions: analysis.suggestions,
      confidence
    };
  }

  /**
   * 构建结构化数据
   */
  private buildStructuredData(elements: ExtractedElements, originalText: string) {
    return {
      mainCharacter: this.extractMainCharacter(elements.characters, originalText),
      supportingCharacters: this.extractSupportingCharacters(elements.characters),
      worldSetting: {
        timeperiod: this.extractTimePeriod(elements.setting, originalText),
        location: this.extractLocation(elements.setting, originalText),
        atmosphere: elements.mood || '未知'
      },
      plotStructure: {
        exposition: this.extractExposition(originalText),
        conflict: elements.conflict || '未明确',
        resolution: this.extractResolution(originalText)
      },
      themes: this.extractThemes(elements.theme, originalText),
      genre: elements.genre || '其他',
      targetAudience: this.determineTargetAudience(elements.genre, elements.mood)
    };
  }

  /**
   * 提取主角信息
   */
  private extractMainCharacter(characters: string[], originalText: string): string {
    if (characters.length === 0) {
      // 从原文中推断主角，包括英文名字
      const englishNameMatch = originalText.match(/主角([A-Za-z][\w-]*)/);
      if (englishNameMatch) {
        return englishNameMatch[1];
      }
      
      if (originalText.includes('少年') || originalText.includes('年轻人')) {
        return '年轻主角';
      } else if (originalText.includes('女孩') || originalText.includes('少女')) {
        return '年轻女主角';
      } else if (originalText.includes('英雄')) {
        return '英雄主角';
      }
      return '主角';
    }
    
    return characters[0]; // 第一个角色通常是主角
  }

  /**
   * 提取配角信息
   */
  private extractSupportingCharacters(characters: string[]): string[] {
    return characters.slice(1); // 除主角外的其他角色
  }

  /**
   * 提取时间背景
   */
  private extractTimePeriod(setting: string, originalText: string): string {
    const timeKeywords = {
      '古代': ['古代', '古时', '古典', '传统'],
      '现代': ['现代', '当代', '今天', '现在'],
      '未来': ['未来', '将来', '科幻', '太空'],
      '中世纪': ['中世纪', '骑士', '城堡'],
      '近代': ['近代', '工业', '蒸汽']
    };

    for (const [period, keywords] of Object.entries(timeKeywords)) {
      if (keywords.some(keyword => originalText.includes(keyword))) {
        return period;
      }
    }

    // 基于设定推断
    if (setting.includes('魔法') || setting.includes('仙侠')) {
      return '奇幻时代';
    }
    if (setting.includes('科幻')) {
      return '未来';
    }

    return '现代';
  }

  /**
   * 提取地点信息
   */
  private extractLocation(setting: string, originalText: string): string {
    const locationKeywords = {
      '学校': ['学校', '校园', '学院', '大学'],
      '城市': ['城市', '都市', '市区', '街道'],
      '乡村': ['乡村', '农村', '田野', '山村'],
      '宫廷': ['宫廷', '皇宫', '宫殿', '朝廷'],
      '江湖': ['江湖', '武林', '侠客'],
      '异世界': ['异世界', '另一个世界', '平行世界'],
      '虚拟世界': ['虚拟', '游戏世界', 'VR']
    };

    for (const [location, keywords] of Object.entries(locationKeywords)) {
      if (keywords.some(keyword => originalText.includes(keyword))) {
        return location;
      }
    }

    return setting || '未知地点';
  }

  /**
   * 提取开端信息
   */
  private extractExposition(originalText: string): string {
    // 寻找故事开始的描述
    const sentences = originalText.split(/[。！？]/).filter(s => s.trim().length > 0);
    
    if (sentences.length > 0) {
      const firstSentence = sentences[0].trim();
      if (firstSentence.length > 10) {
        return firstSentence;
      }
    }

    return '故事开始...';
  }

  /**
   * 提取结局信息
   */
  private extractResolution(originalText: string): string {
    // 寻找结局相关的描述
    const resolutionKeywords = ['最终', '最后', '结果', '成功', '失败', '拯救', '胜利'];
    
    const sentences = originalText.split(/[。！？]/).filter(s => s.trim().length > 0);
    
    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentence = sentences[i].trim();
      if (resolutionKeywords.some(keyword => sentence.includes(keyword))) {
        return sentence;
      }
    }

    return '待续...';
  }

  /**
   * 提取主题列表
   */
  private extractThemes(mainTheme: string, originalText: string): string[] {
    const themes = [mainTheme].filter(Boolean);
    
    const additionalThemes = [
      '友情', '爱情', '成长', '冒险', '正义', '勇气', 
      '牺牲', '希望', '家庭', '自由', '命运', '选择'
    ];

    additionalThemes.forEach(theme => {
      if (originalText.includes(theme) && !themes.includes(theme)) {
        themes.push(theme);
      }
    });

    return themes.length > 0 ? themes : ['人生'];
  }

  /**
   * 确定目标受众
   */
  private determineTargetAudience(genre: string, mood: string): string {
    const audienceMap: { [key: string]: string } = {
      '言情': '年轻女性',
      '玄幻': '年轻男性',
      '仙侠': '武侠爱好者',
      '科幻': '科幻爱好者',
      '悬疑': '推理爱好者',
      '历史': '历史爱好者',
      '都市': '都市读者'
    };

    if (audienceMap[genre]) {
      return audienceMap[genre];
    }

    // 基于情绪氛围判断
    if (mood === '温馨') {
      return '全年龄段';
    } else if (mood === '热血') {
      return '年轻读者';
    } else if (mood === '浪漫') {
      return '言情读者';
    }

    return '一般读者';
  }

  /**
   * 计算解析置信度
   */
  private calculateConfidence(elements: ExtractedElements, validation: any): number {
    let score = 0;
    let maxScore = 0;

    // 基础验证通过 (30分)
    maxScore += 30;
    if (validation.isValid) {
      score += 30;
    }

    // 主题提取 (15分)
    maxScore += 15;
    if (elements.theme && elements.theme !== '人生成长') {
      score += 15;
    } else if (elements.theme) {
      score += 10;
    }

    // 角色提取 (15分)
    maxScore += 15;
    if (elements.characters.length > 1) {
      score += 15;
    } else if (elements.characters.length === 1) {
      score += 10;
    }

    // 设定提取 (15分)
    maxScore += 15;
    if (elements.setting && elements.setting !== '现代世界') {
      score += 15;
    } else if (elements.setting) {
      score += 10;
    }

    // 冲突提取 (10分)
    maxScore += 10;
    if (elements.conflict && elements.conflict !== '未知挑战') {
      score += 10;
    } else if (elements.conflict) {
      score += 5;
    }

    // 体裁识别 (10分)
    maxScore += 10;
    if (elements.genre && elements.genre !== '其他') {
      score += 10;
    }

    // 关键词提取 (5分)
    maxScore += 5;
    if (elements.keyWords.length >= 5) {
      score += 5;
    } else if (elements.keyWords.length > 0) {
      score += 3;
    }

    return Math.round((score / maxScore) * 100);
  }
}