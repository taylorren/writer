// 中文小说创作辅助工具

import { 
  Project, 
  Language, 
  LocalizationConfig,
  WritingStyle 
} from '../models';
import { chineseLocalization, chineseWritingStyles } from '../config/chinese-styles';

export class ChineseNovelHelper {
  
  /**
   * 创建中文小说项目的默认配置
   */
  static createChineseProject(coreIdea: string, styleId?: string): Partial<Project> {
    const selectedStyle = styleId 
      ? chineseWritingStyles.find(s => s.id === styleId) || chineseWritingStyles[0]
      : chineseWritingStyles[0];

    return {
      coreIdea,
      language: Language.CHINESE,
      style: selectedStyle,
      currentWordCount: 0,
      targetWordCount: 100000, // 默认10万字中篇小说
      chapters: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * 获取中文写作风格列表
   */
  static getChineseStyles(): WritingStyle[] {
    return chineseWritingStyles;
  }

  /**
   * 获取中文本地化配置
   */
  static getChineseLocalization(): LocalizationConfig {
    return chineseLocalization;
  }

  /**
   * 验证中文文本格式
   */
  static validateChineseText(text: string): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // 检查是否包含中文字符
    if (!/[\u4e00-\u9fff]/.test(text)) {
      issues.push('文本中没有检测到中文字符');
      suggestions.push('请确保使用中文进行创作');
    }

    // 检查标点符号使用 - 检测英文引号
    if (/["'`]/.test(text)) {
      issues.push('检测到英文引号');
      suggestions.push('建议使用中文引号："“”" 和 "‘’"');
    }

    // 检查段落格式（只对多段落文本进行检查）
    const paragraphs = text.split('\n').filter(p => p.trim());
    if (paragraphs.length > 1) {
      const hasProperIndentation = paragraphs.every(p => 
        p.startsWith('　　') || p.length < 10 // 短段落可能是标题
      );

      if (!hasProperIndentation) {
        issues.push('段落缩进格式不规范');
        suggestions.push('建议每段开头使用两个全角空格（　　）缩进');
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * 格式化中文章节标题
   */
  static formatChapterTitle(chapterNumber: number, title?: string): string {
    const baseTitle = `第${this.numberToChinese(chapterNumber)}章`;
    return title ? `${baseTitle}　${title}` : baseTitle;
  }

  /**
   * 数字转中文
   */
  private static numberToChinese(num: number): string {
    const chineseNumbers = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const units = ['', '十', '百', '千'];
    
    if (num < 10) {
      return chineseNumbers[num];
    }
    
    if (num < 100) {
      const tens = Math.floor(num / 10);
      const ones = num % 10;
      
      if (tens === 1) {
        return ones === 0 ? '十' : `十${chineseNumbers[ones]}`;
      }
      
      return ones === 0 
        ? `${chineseNumbers[tens]}十`
        : `${chineseNumbers[tens]}十${chineseNumbers[ones]}`;
    }
    
    // 简化处理，实际项目中可以扩展更复杂的数字转换
    return num.toString();
  }

  /**
   * 统计中文字符数（不包括标点和空格）
   */
  static countChineseCharacters(text: string): {
    totalChars: number;
    chineseChars: number;
    punctuation: number;
    spaces: number;
  } {
    const totalChars = text.length;
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const punctuation = (text.match(/[，。！？；：""''（）【】《》]/g) || []).length;
    const spaces = (text.match(/\s/g) || []).length;

    return {
      totalChars,
      chineseChars,
      punctuation,
      spaces
    };
  }

  /**
   * 生成中文小说创作提示
   */
  static generateWritingPrompt(
    coreIdea: string, 
    style: WritingStyle, 
    chapterInfo?: { title: string; summary: string }
  ): string {
    let prompt = `请创作一部中文小说。\n\n`;
    prompt += `核心创意：${coreIdea}\n`;
    prompt += `写作风格：${style.name} - ${style.description}\n`;
    prompt += `语调特点：${style.characteristics.tone}\n`;
    prompt += `叙述方式：${style.characteristics.narrativeVoice}\n\n`;

    if (chapterInfo) {
      prompt += `章节标题：${chapterInfo.title}\n`;
      prompt += `章节概要：${chapterInfo.summary}\n\n`;
    }

    prompt += `创作要求：\n`;
    prompt += `1. 使用纯中文写作，符合中文表达习惯\n`;
    prompt += `2. 保持指定的写作风格特色\n`;
    prompt += `3. 情节生动有趣，人物形象鲜明\n`;
    prompt += `4. 对话自然流畅，符合人物性格\n`;
    prompt += `5. 使用正确的中文标点符号\n`;
    prompt += `6. 段落格式规范，首行缩进\n\n`;

    prompt += `请开始创作：`;

    return prompt;
  }
}