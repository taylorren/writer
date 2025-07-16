// 中文小说写作风格预设配置

import { WritingStyle, Language, LocalizationConfig } from '../models';

// 中文本地化配置
export const chineseLocalization: LocalizationConfig = {
  language: Language.CHINESE,
  culturalContext: [
    '中华文化传统',
    '现代都市生活',
    '古代历史背景',
    '武侠仙侠世界观'
  ],
  writingConventions: [
    '使用中文标点符号',
    '章节标题格式：第X章',
    '对话使用双引号',
    '段落首行缩进两个字符'
  ],
  characterNamingRules: [
    '中文姓名结构：姓+名',
    '古风名字可用单字',
    '现代名字通常两到三字',
    '避免生僻字和谐音'
  ]
};

// 中文写作风格预设
export const chineseWritingStyles: WritingStyle[] = [
  {
    id: 'modern-urban',
    name: '现代都市',
    description: '现代都市背景的小说风格，语言简洁明快，贴近生活',
    characteristics: {
      tone: '轻松幽默，贴近生活',
      pacing: '节奏明快，情节紧凑',
      vocabulary: '现代汉语，网络用语适量',
      sentenceStructure: '短句为主，长短结合',
      narrativeVoice: '第三人称全知视角'
    },
    examples: [
      '她推开咖啡厅的门，熟悉的铃声响起。',
      '手机屏幕亮起，又是一条工作消息。',
      '这座城市总是这样，匆忙而冷漠。'
    ]
  },
  {
    id: 'ancient-fantasy',
    name: '古风仙侠',
    description: '古代背景的仙侠小说风格，文言色彩浓厚，意境深远',
    characteristics: {
      tone: '古雅庄重，意境深远',
      pacing: '徐缓有致，张弛有度',
      vocabulary: '文言词汇，古典雅致',
      sentenceStructure: '长句为主，对仗工整',
      narrativeVoice: '第三人称限制视角'
    },
    examples: [
      '青山如黛，白云悠悠，一袭青衫立于山巅。',
      '剑光如虹，破空而来，直指那人眉心。',
      '此间风月，皆为过眼云烟，唯有此心不变。'
    ]
  },
  {
    id: 'romantic-drama',
    name: '言情温馨',
    description: '言情小说风格，注重情感描写，语言优美细腻',
    characteristics: {
      tone: '温馨浪漫，情感丰富',
      pacing: '舒缓细腻，重视情感铺垫',
      vocabulary: '优美词汇，情感色彩浓厚',
      sentenceStructure: '长短句结合，富有韵律',
      narrativeVoice: '第一人称或第三人称限制视角'
    },
    examples: [
      '夕阳西下，他的侧脸在金色光晕中显得格外温柔。',
      '心跳声在安静的房间里显得格外清晰。',
      '那一刻，时间仿佛静止了。'
    ]
  },
  {
    id: 'suspense-thriller',
    name: '悬疑推理',
    description: '悬疑推理小说风格，节奏紧张，逻辑严密',
    characteristics: {
      tone: '紧张悬疑，冷静客观',
      pacing: '节奏紧凑，悬念迭起',
      vocabulary: '精确词汇，逻辑性强',
      sentenceStructure: '短句为主，营造紧张感',
      narrativeVoice: '第三人称客观视角'
    },
    examples: [
      '房间里一片死寂，只有时钟滴答声。',
      '证据指向了一个不可能的结论。',
      '真相往往隐藏在最不起眼的细节中。'
    ]
  },
  {
    id: 'republican-era',
    name: '民国风格',
    description: '民国时期文学风格，融合传统与现代，语言典雅而不失时代感',
    characteristics: {
      tone: '典雅怀旧，含蓄深沉',
      pacing: '舒缓从容，娓娓道来',
      vocabulary: '文白相间，雅俗共赏',
      sentenceStructure: '长短句交替，韵律感强',
      narrativeVoice: '第一人称回忆或第三人称全知'
    },
    examples: [
      '那年春日，梧桐叶正绿，她撑着油纸伞走过石板路。',
      '先生总是穿着那件青布长衫，手持折扇，谈笑风生。',
      '时局动荡，人心惶惶，唯有书香依旧飘散在这座古城里。',
      '月色如水，洒在庭院的青砖上，她独自凭栏而立。',
      '那是个风雨飘摇的年代，却也是个充满希望的时代。'
    ]
  }
];

// 中文写作提示词模板
export const chinesePromptTemplates = {
  outlineGeneration: `
请根据以下核心创意生成中文小说大纲：
核心创意：{coreIdea}

要求：
1. 使用中文写作
2. 结构完整，包含开头、发展、高潮、结局
3. 人物设定鲜明，关系清晰
4. 情节逻辑合理，冲突明确
5. 适合中文读者阅读习惯
`,

  chapterGeneration: `
请根据以下信息生成中文小说章节内容：
章节标题：{chapterTitle}
章节概要：{chapterSummary}
关键情节点：{keyPlotPoints}
写作风格：{writingStyle}
前文回顾：{previousContext}

要求：
1. 使用纯中文写作
2. 符合指定的写作风格
3. 情节连贯，与前文呼应
4. 人物对话自然，符合中文表达习惯
5. 字数控制在 {wordCount} 字左右
`,

  styleConsistency: `
请检查以下中文文本的风格一致性：
目标风格：{targetStyle}
文本内容：{textContent}

请分析：
1. 语言风格是否一致
2. 人物对话是否符合设定
3. 叙述语调是否统一
4. 中文表达是否自然流畅
`
};