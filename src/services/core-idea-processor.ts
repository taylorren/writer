// AI-powered core idea processing service using Ollama

import { OllamaClient, createOllamaClient } from './ollama-client';

export interface CoreIdeaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  wordCount: number;
  characterCount: number;
}

export interface ExtractedElements {
  theme: string;
  characters: string[];
  setting: string;
  conflict: string;
  genre: string;
  mood: string;
  keyWords: string[];
}

export interface CoreIdeaAnalysisResult {
  validation: CoreIdeaValidationResult;
  elements: ExtractedElements;
  suggestions: string[];
  aiAnalysis?: {
    confidence: number;
    reasoning: string;
    modelUsed: string;
    processingTime: number;
  };
}

export class CoreIdeaProcessor {
  private readonly MIN_LENGTH = 300;
  private readonly MAX_LENGTH = 500;
  private ollamaClient: OllamaClient;

  constructor() {
    this.ollamaClient = createOllamaClient();
  }

  /**
   * 验证核心思想输入
   */
  public validateCoreIdea(coreIdea: string): CoreIdeaValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 基本输入检查
    if (!coreIdea || typeof coreIdea !== 'string') {
      errors.push('核心思想不能为空');
      return {
        isValid: false,
        errors,
        warnings,
        wordCount: 0,
        characterCount: 0
      };
    }

    const trimmedIdea = coreIdea.trim();
    const characterCount = trimmedIdea.length;
    const wordCount = this.countWords(trimmedIdea);

    // 长度验证
    if (characterCount < this.MIN_LENGTH) {
      errors.push(`核心思想过短，当前${characterCount}字，需要至少${this.MIN_LENGTH}字`);
    } else if (characterCount > this.MAX_LENGTH) {
      errors.push(`核心思想过长，当前${characterCount}字，不能超过${this.MAX_LENGTH}字`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      wordCount,
      characterCount
    };
  }

  /**
   * 使用AI提取核心思想中的关键元素
   */
  public async extractElements(coreIdea: string): Promise<ExtractedElements> {
    const systemPrompt = `你是一个专业的小说创作分析师。请分析用户提供的核心思想，提取出以下关键元素：

1. 主题(theme): 故事的核心主题，如"成长"、"爱情"、"冒险"等
2. 角色(characters): 主要角色列表，包括主角和重要配角
3. 设定(setting): 故事发生的时空背景
4. 冲突(conflict): 主要矛盾和冲突
5. 体裁(genre): 小说类型，如"玄幻"、"科幻"、"言情"等
6. 情绪氛围(mood): 故事的整体情绪基调
7. 关键词(keyWords): 重要的描述性词汇

请以JSON格式返回分析结果，格式如下：
{
  "theme": "主题",
  "characters": ["角色1", "角色2"],
  "setting": "设定描述",
  "conflict": "冲突描述", 
  "genre": "体裁",
  "mood": "情绪氛围",
  "keyWords": ["关键词1", "关键词2", "关键词3"]
}

请确保分析准确、深入，充分理解故事的核心要素。`;

    try {
      const response = await this.ollamaClient.chat(coreIdea, systemPrompt);
      
      // 尝试解析JSON响应
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          theme: parsed.theme || '未知主题',
          characters: Array.isArray(parsed.characters) ? parsed.characters : [],
          setting: parsed.setting || '未知设定',
          conflict: parsed.conflict || '未知冲突',
          genre: parsed.genre || '其他',
          mood: parsed.mood || '平和',
          keyWords: Array.isArray(parsed.keyWords) ? parsed.keyWords : []
        };
      }
      
      // 如果JSON解析失败，使用传统方法作为后备
      return this.extractElementsFallback(coreIdea);
    } catch (error) {
      console.error('AI元素提取失败，使用后备方法:', error);
      return this.extractElementsFallback(coreIdea);
    }
  }

  /**
   * 完整分析核心思想（使用AI）
   */
  public async analyzeCoreIdea(coreIdea: string): Promise<CoreIdeaAnalysisResult> {
    const startTime = Date.now();
    const validation = this.validateCoreIdea(coreIdea);
    let elements: ExtractedElements;
    let suggestions: string[] = [];
    let aiAnalysis: any = undefined;

    if (validation.isValid) {
      try {
        elements = await this.extractElements(coreIdea);
        suggestions = await this.generateAISuggestions(coreIdea, elements);
        
        const processingTime = Date.now() - startTime;
        aiAnalysis = {
          confidence: this.calculateAIConfidence(elements),
          reasoning: '基于AI模型深度分析核心思想的各个要素',
          modelUsed: 'qwen3:1.7b',
          processingTime
        };
      } catch (error) {
        console.error('AI分析失败，使用后备方法:', error);
        elements = this.extractElementsFallback(coreIdea);
        suggestions = this.generateValidationSuggestions(validation);
      }
    } else {
      // 如果验证失败，返回空的元素结构
      elements = {
        theme: '',
        characters: [],
        setting: '',
        conflict: '',
        genre: '',
        mood: '',
        keyWords: []
      };
      suggestions = this.generateValidationSuggestions(validation);
    }

    return {
      validation,
      elements,
      suggestions,
      aiAnalysis
    };
  }

  /**
   * 使用AI生成改进建议
   */
  private async generateAISuggestions(coreIdea: string, elements: ExtractedElements): Promise<string[]> {
    const systemPrompt = `你是一个专业的小说创作指导师。基于用户的核心思想和已分析的元素，请提供3-5条具体的改进建议，帮助完善这个故事构思。

分析结果：
- 主题: ${elements.theme}
- 角色: ${elements.characters.join(', ')}
- 设定: ${elements.setting}
- 冲突: ${elements.conflict}
- 体裁: ${elements.genre}
- 情绪: ${elements.mood}

请提供实用的建议，每条建议应该：
1. 具体可操作
2. 有助于故事发展
3. 符合该体裁的特点

请严格按照以下JSON数组格式返回建议，不要包含任何其他文字：
["建议1", "建议2", "建议3"]

注意：
- 必须是有效的JSON格式
- 每个建议都用双引号包围
- 建议内容不要包含换行符或特殊字符
- 只返回JSON数组，不要有其他解释文字`;

    try {
      const response = await this.ollamaClient.chat(coreIdea, systemPrompt);
      
      // 清理响应内容，移除控制字符和多余空白
      const cleanContent = response.content
        .replace(/[\x00-\x1F\x7F]/g, '') // 移除控制字符
        .replace(/\n/g, ' ') // 将换行符替换为空格
        .replace(/\s+/g, ' ') // 合并多个空格
        .trim();
      
      // 多种策略尝试解析JSON数组
      const parseStrategies = [
        // 策略1: 直接匹配标准JSON数组
        () => {
          const arrayMatch = cleanContent.match(/\[[\s\S]*?\]/);
          if (arrayMatch) {
            return JSON.parse(arrayMatch[0]);
          }
          return null;
        },
        
        // 策略2: 提取引号内的内容作为数组元素
        () => {
          const quotes = cleanContent.match(/"([^"]+)"/g);
          if (quotes && quotes.length > 0) {
            return quotes.map(q => q.slice(1, -1)); // 移除引号
          }
          return null;
        },
        
        // 策略3: 按数字序号分割建议
        () => {
          const numbered = cleanContent.match(/\d+[\.、]\s*([^0-9]+?)(?=\d+[\.、]|$)/g);
          if (numbered && numbered.length > 0) {
            return numbered.map(item => 
              item.replace(/^\d+[\.、]\s*/, '').trim()
            ).filter(item => item.length > 0);
          }
          return null;
        }
      ];
      
      // 依次尝试各种解析策略
      for (const strategy of parseStrategies) {
        try {
          const result = strategy();
          if (result && Array.isArray(result) && result.length > 0) {
            return result.slice(0, 5); // 最多返回5条建议
          }
        } catch (parseError) {
          console.warn('解析策略失败:', parseError instanceof Error ? parseError.message : '未知错误');
          continue;
        }
      }
      
      // 所有策略都失败，使用文本提取作为最后手段
      const lines = cleanContent.split(/[。！？]/).filter(line => 
        line.trim().length > 10 && (
          line.includes('建议') || 
          line.includes('可以') || 
          line.includes('应该') ||
          line.includes('考虑') ||
          line.includes('尝试')
        )
      );
      
      if (lines.length > 0) {
        return lines.slice(0, 5).map(line => line.trim());
      }
      
      // 如果完全无法提取，返回后备建议
      return this.generateSuggestionsFallback(elements);
      
    } catch (error) {
      console.error('AI建议生成失败:', error);
      return this.generateSuggestionsFallback(elements);
    }
  }

  /**
   * 计算AI分析的置信度
   */
  private calculateAIConfidence(elements: ExtractedElements): number {
    let score = 0;
    let maxScore = 0;

    // 主题分析 (20分)
    maxScore += 20;
    if (elements.theme && elements.theme !== '未知主题') {
      score += 20;
    }

    // 角色分析 (20分)
    maxScore += 20;
    if (elements.characters.length > 0) {
      score += Math.min(20, elements.characters.length * 10);
    }

    // 设定分析 (15分)
    maxScore += 15;
    if (elements.setting && elements.setting !== '未知设定') {
      score += 15;
    }

    // 冲突分析 (15分)
    maxScore += 15;
    if (elements.conflict && elements.conflict !== '未知冲突') {
      score += 15;
    }

    // 体裁识别 (15分)
    maxScore += 15;
    if (elements.genre && elements.genre !== '其他') {
      score += 15;
    }

    // 情绪氛围 (10分)
    maxScore += 10;
    if (elements.mood && elements.mood !== '平和') {
      score += 10;
    }

    // 关键词提取 (5分)
    maxScore += 5;
    if (elements.keyWords.length >= 3) {
      score += 5;
    }

    return Math.round((score / maxScore) * 100);
  }

  /**
   * 计算字数（中文按字符计算，英文按单词计算）
   */
  private countWords(text: string): number {
    // 移除标点符号和空格
    const cleanText = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
    
    // 中文字符数
    const chineseChars = (cleanText.match(/[\u4e00-\u9fa5]/g) || []).length;
    
    // 英文单词数
    const englishWords = cleanText.replace(/[\u4e00-\u9fa5]/g, '').split(/\s+/).filter(word => word.length > 0).length;
    
    return chineseChars + englishWords;
  }

  /**
   * 检查内容质量
   */
  private checkContentQuality(text: string): string[] {
    const warnings: string[] = [];

    // 检查是否过于简单
    if (text.split('。').length < 3) {
      warnings.push('建议增加更多句子来丰富核心思想的描述');
    }

    // 检查是否包含基本要素
    const hasCharacter = /人|角色|主角|主人公|他|她/.test(text);
    const hasSetting = /世界|地方|时代|背景|环境/.test(text);
    const hasConflict = /冲突|矛盾|问题|挑战|困难|敌人/.test(text);

    if (!hasCharacter) {
      warnings.push('建议在核心思想中明确提及主要角色');
    }
    if (!hasSetting) {
      warnings.push('建议在核心思想中描述故事背景或设定');
    }
    if (!hasConflict) {
      warnings.push('建议在核心思想中包含主要冲突或挑战');
    }

    // 检查重复内容
    const sentences = text.split(/[。！？]/).filter(s => s.trim().length > 0);
    const uniqueSentences = new Set(sentences.map(s => s.trim()));
    if (sentences.length > uniqueSentences.size) {
      warnings.push('发现重复内容，建议精简表达');
    }

    return warnings;
  }

  /**
   * 提取主题
   */
  private extractTheme(text: string): string {
    const themeKeywords = [
      '爱情', '友情', '成长', '冒险', '复仇', '救赎', '正义', '自由',
      '权力', '背叛', '牺牲', '希望', '绝望', '勇气', '恐惧', '梦想',
      '家庭', '战争', '和平', '生存', '死亡', '重生', '命运', '选择'
    ];

    for (const keyword of themeKeywords) {
      if (text.includes(keyword)) {
        return keyword;
      }
    }

    // 如果没有找到明确的主题关键词，尝试从上下文推断
    if (text.includes('拯救') || text.includes('英雄')) {
      return '英雄主义';
    }
    if (text.includes('魔法') || text.includes('法术')) {
      return '魔幻冒险';
    }
    if (text.includes('科技') || text.includes('未来')) {
      return '科幻探索';
    }

    return '人生成长'; // 默认主题
  }

  /**
   * 提取角色信息
   */
  private extractCharacters(text: string): string[] {
    const characters: string[] = [];
    
    // 查找明确的角色描述（包括英文名字）
    const characterPatterns = [
      /(?:主角|主人公|男主|女主)(?:是|为)?([^，。！？]*)/g,
      /([^，。！？]*?)(?:是|为)(?:主角|主人公|男主|女主)/g,
      /一个([^，。！？]*?)(?:少年|少女|男人|女人|人)/g,
      /主角([A-Za-z][\w-]*)/g, // 匹配英文名字
      /([A-Za-z][\w-]*)(?:是|为)(?:主角|主人公)/g // 英文名字作为主角
    ];

    for (const pattern of characterPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const character = match[1]?.trim();
        if (character && character.length > 0 && character.length < 20) {
          characters.push(character);
        }
      }
    }

    // 如果没有找到明确的角色描述，添加通用描述
    if (characters.length === 0) {
      if (text.includes('少年') || text.includes('年轻人')) {
        characters.push('年轻主角');
      } else if (text.includes('英雄')) {
        characters.push('英雄');
      } else {
        characters.push('主角');
      }
    }

    return [...new Set(characters)]; // 去重
  }

  /**
   * 提取设定信息
   */
  private extractSetting(text: string): string {
    const settingKeywords = [
      '古代', '现代', '未来', '中世纪', '近代', '当代',
      '魔法世界', '仙侠世界', '科幻世界', '现实世界',
      '学校', '城市', '乡村', '宫廷', '江湖', '战场',
      '异世界', '平行世界', '虚拟世界'
    ];

    for (const keyword of settingKeywords) {
      if (text.includes(keyword)) {
        return keyword;
      }
    }

    // 推断设定
    if (text.includes('魔法') || text.includes('法术') || text.includes('魔王')) {
      return '魔法世界';
    }
    if (text.includes('修仙') || text.includes('仙人') || text.includes('武功')) {
      return '仙侠世界';
    }
    if (text.includes('科技') || text.includes('机器人') || text.includes('太空')) {
      return '科幻世界';
    }

    return '现代世界'; // 默认设定
  }

  /**
   * 提取冲突信息
   */
  private extractConflict(text: string): string {
    const conflictKeywords = [
      '邪恶势力', '黑暗力量', '敌人', '反派', '魔王', '恶龙',
      '战争', '灾难', '危机', '威胁', '挑战', '困难',
      '内心斗争', '道德冲突', '选择困境', '身份危机'
    ];

    for (const keyword of conflictKeywords) {
      if (text.includes(keyword)) {
        return keyword;
      }
    }

    // 推断冲突类型
    if (text.includes('拯救') || text.includes('保护')) {
      return '拯救使命';
    }
    if (text.includes('复仇') || text.includes('报仇')) {
      return '复仇之路';
    }
    if (text.includes('成长') || text.includes('蜕变')) {
      return '成长挑战';
    }

    return '未知挑战'; // 默认冲突
  }

  /**
   * 提取体裁信息
   */
  private extractGenre(text: string): string {
    // 按优先级顺序检查，避免关键词重叠导致的误判
    const genreKeywords = [
      { genre: '仙侠', keywords: ['修仙', '仙人', '武功', '江湖', '门派', '仙界'] },
      { genre: '玄幻', keywords: ['魔法', '法术', '魔王', '异世界', '修炼'] },
      { genre: '科幻', keywords: ['科技', '未来', '机器人', '太空', '外星', 'AI', '虚拟'] },
      { genre: '悬疑', keywords: ['谜团', '推理', '犯罪', '侦探', '秘密', '调查'] },
      { genre: '言情', keywords: ['爱情', '恋爱', '情感', '浪漫', '婚姻', '相遇'] },
      { genre: '历史', keywords: ['古代', '历史', '朝代', '皇帝', '战争', '将军'] },
      { genre: '都市', keywords: ['现代', '都市', '职场', '商业', '生活'] }
    ];

    for (const { genre, keywords } of genreKeywords) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return genre;
      }
    }

    return '其他'; // 默认体裁
  }

  /**
   * 提取情绪氛围
   */
  private extractMood(text: string): string {
    const moodKeywords = {
      '热血': ['热血', '激情', '战斗', '冒险', '挑战'],
      '温馨': ['温馨', '温暖', '家庭', '友情', '治愈'],
      '悲伤': ['悲伤', '痛苦', '失去', '死亡', '离别'],
      '紧张': ['紧张', '危险', '威胁', '追逐', '逃亡'],
      '神秘': ['神秘', '未知', '秘密', '谜团', '隐藏'],
      '浪漫': ['浪漫', '爱情', '甜蜜', '温柔', '美好']
    };

    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return mood;
      }
    }

    return '平和'; // 默认情绪
  }

  /**
   * 提取关键词
   */
  private extractKeyWords(text: string): string[] {
    // 移除标点符号，分割成词语
    const cleanText = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ');
    
    // 提取中文词语（2-4个字符）和英文单词
    const chineseWords = cleanText.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
    const englishWords = cleanText.match(/[a-zA-Z]{2,}/g) || [];
    
    const allWords = [...chineseWords, ...englishWords]
      .filter(word => word.length >= 2);

    if (allWords.length === 0) {
      return [];
    }

    // 统计词频
    const wordCount = new Map<string, number>();
    allWords.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    // 排序并取前10个关键词
    return Array.from(wordCount.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([word]) => word);
  }

  /**
   * 生成改进建议
   */
  private generateSuggestions(elements: ExtractedElements, validation: CoreIdeaValidationResult): string[] {
    const suggestions: string[] = [];

    // 基于提取的元素生成建议
    if (elements.characters.length === 0) {
      suggestions.push('建议明确描述主要角色的特征或身份');
    }

    if (!elements.setting || elements.setting === '现代世界') {
      suggestions.push('考虑添加更具体的故事背景设定');
    }

    if (!elements.conflict || elements.conflict === '未知挑战') {
      suggestions.push('建议明确描述主要冲突或故事的核心矛盾');
    }

    if (elements.keyWords.length < 5) {
      suggestions.push('可以增加更多描述性词汇来丰富故事内容');
    }

    // 基于字数给出建议
    if (validation.characterCount < 400) {
      suggestions.push('可以进一步扩展核心思想，添加更多细节描述');
    }

    return suggestions;
  }

  /**
   * 生成验证失败时的建议
   */
  private generateValidationSuggestions(validation: CoreIdeaValidationResult): string[] {
    const suggestions: string[] = [];

    if (validation.characterCount < this.MIN_LENGTH) {
      suggestions.push('请扩展您的核心思想，可以添加：');
      suggestions.push('- 主要角色的背景和特征');
      suggestions.push('- 故事发生的时间和地点');
      suggestions.push('- 主要冲突或挑战');
      suggestions.push('- 故事的情感基调');
    }

    if (validation.characterCount > this.MAX_LENGTH) {
      suggestions.push('请精简您的核心思想，可以：');
      suggestions.push('- 去除不必要的细节描述');
      suggestions.push('- 合并相似的表达');
      suggestions.push('- 专注于最核心的故事元素');
    }

    return suggestions;
  }

  /**
   * 后备元素提取方法（当AI失败时使用）
   */
  private extractElementsFallback(coreIdea: string): ExtractedElements {
    return {
      theme: this.extractTheme(coreIdea),
      characters: this.extractCharacters(coreIdea),
      setting: this.extractSetting(coreIdea),
      conflict: this.extractConflict(coreIdea),
      genre: this.extractGenre(coreIdea),
      mood: this.extractMood(coreIdea),
      keyWords: this.extractKeyWords(coreIdea)
    };
  }

  /**
   * 后备建议生成方法（当AI失败时使用）
   */
  private generateSuggestionsFallback(elements: ExtractedElements): string[] {
    const suggestions: string[] = [];

    if (elements.characters.length === 0) {
      suggestions.push('建议明确描述主要角色的特征或身份');
    }

    if (!elements.setting || elements.setting === '现代世界') {
      suggestions.push('考虑添加更具体的故事背景设定');
    }

    if (!elements.conflict || elements.conflict === '未知挑战') {
      suggestions.push('建议明确描述主要冲突或故事的核心矛盾');
    }

    if (elements.keyWords.length < 5) {
      suggestions.push('可以增加更多描述性词汇来丰富故事内容');
    }

    return suggestions;
  }
}