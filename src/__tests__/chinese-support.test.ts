// 中文小说创作支持功能测试

import { describe, it, expect } from 'vitest';
import { ChineseNovelHelper } from '../utils/chinese-novel-helper';
import { Language } from '../models';
import { chineseWritingStyles } from '../config/chinese-styles';

describe('中文小说创作支持', () => {

    it('应该能创建中文小说项目配置', () => {
        const coreIdea = '一个现代程序员穿越到古代成为书生的故事';
        const project = ChineseNovelHelper.createChineseProject(coreIdea, 'ancient-fantasy');

        expect(project.coreIdea).toBe(coreIdea);
        expect(project.language).toBe(Language.CHINESE);
        expect(project.style?.name).toBe('古风仙侠');
        expect(project.targetWordCount).toBe(100000);
    });

    it('应该能获取中文写作风格列表', () => {
        const styles = ChineseNovelHelper.getChineseStyles();

        expect(styles).toHaveLength(5);
        expect(styles[0].name).toBe('现代都市');
        expect(styles[1].name).toBe('古风仙侠');
        expect(styles[2].name).toBe('言情温馨');
        expect(styles[3].name).toBe('悬疑推理');
        expect(styles[4].name).toBe('民国风格');
    });

    it('应该能验证中文文本格式', () => {
        const validText = '　　这是一个正确格式的中文段落，使用了正确的标点符号。\n　　“对话也使用了中文引号。”';
        const invalidText = 'This is English text with "wrong quotes".';

        const validResult = ChineseNovelHelper.validateChineseText(validText);
        const invalidResult = ChineseNovelHelper.validateChineseText(invalidText);

        console.log('Valid text:', JSON.stringify(validText));
        console.log('Valid result:', validResult);

        expect(validResult.isValid).toBe(true);
        expect(validResult.issues).toHaveLength(0);

        expect(invalidResult.isValid).toBe(false);
        expect(invalidResult.issues.length).toBeGreaterThan(0);
    });

    it('应该能格式化中文章节标题', () => {
        const title1 = ChineseNovelHelper.formatChapterTitle(1);
        const title2 = ChineseNovelHelper.formatChapterTitle(5, '初入江湖');
        const title3 = ChineseNovelHelper.formatChapterTitle(10);

        expect(title1).toBe('第一章');
        expect(title2).toBe('第五章　初入江湖');
        expect(title3).toBe('第十章');
    });

    it('应该能统计中文字符数', () => {
        const text = '这是一段中文文本，包含标点符号！还有English words。';
        const stats = ChineseNovelHelper.countChineseCharacters(text);

        expect(stats.chineseChars).toBeGreaterThan(0);
        expect(stats.punctuation).toBeGreaterThan(0);
        expect(stats.totalChars).toBe(text.length);
    });

    it('应该能生成中文创作提示', () => {
        const coreIdea = '一个关于时间旅行的故事';
        const style = chineseWritingStyles[0]; // 现代都市风格
        const chapterInfo = {
            title: '第一章　意外的开始',
            summary: '主人公发现了时间旅行的秘密'
        };

        const prompt = ChineseNovelHelper.generateWritingPrompt(coreIdea, style, chapterInfo);

        expect(prompt).toContain('中文小说');
        expect(prompt).toContain(coreIdea);
        expect(prompt).toContain(style.name);
        expect(prompt).toContain(chapterInfo.title);
        expect(prompt).toContain('纯中文写作');
    });

    it('应该能获取中文本地化配置', () => {
        const localization = ChineseNovelHelper.getChineseLocalization();

        expect(localization.language).toBe(Language.CHINESE);
        expect(localization.culturalContext).toContain('中华文化传统');
        expect(localization.writingConventions).toContain('使用中文标点符号');
        expect(localization.characterNamingRules).toContain('中文姓名结构：姓+名');
    });

    it('应该能创建民国风格的小说项目', () => {
        const coreIdea = '一个关于民国时期上海滩的爱情故事';
        const project = ChineseNovelHelper.createChineseProject(coreIdea, 'republican-era');

        expect(project.coreIdea).toBe(coreIdea);
        expect(project.language).toBe(Language.CHINESE);
        expect(project.style?.name).toBe('民国风格');
        expect(project.style?.characteristics.tone).toBe('典雅怀旧，含蓄深沉');
        expect(project.style?.characteristics.vocabulary).toBe('文白相间，雅俗共赏');
        expect(project.style?.examples).toContain('那年春日，梧桐叶正绿，她撑着油纸伞走过石板路。');
    });
});