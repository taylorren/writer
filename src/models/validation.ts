// Validation functions for core data models

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
  RelationshipType
} from './index';
import { ValidationResult, ValidationError, ValidationWarning } from './errors';

/**
 * 验证项目数据模型
 */
export function validateProject(project: Project): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 验证核心思想长度 (需求 1.1)
  if (!project.coreIdea || project.coreIdea.trim().length === 0) {
    errors.push({
      field: 'coreIdea',
      message: '核心思想不能为空',
      code: 'CORE_IDEA_EMPTY'
    });
  } else {
    const ideaLength = project.coreIdea.trim().length;
    if (ideaLength < 300) {
      errors.push({
        field: 'coreIdea',
        message: '核心思想长度不足300字',
        code: 'CORE_IDEA_TOO_SHORT'
      });
    } else if (ideaLength > 500) {
      errors.push({
        field: 'coreIdea',
        message: '核心思想长度超过500字',
        code: 'CORE_IDEA_TOO_LONG'
      });
    }
  }

  // 验证项目ID
  if (!project.id || project.id.trim().length === 0) {
    errors.push({
      field: 'id',
      message: '项目ID不能为空',
      code: 'PROJECT_ID_EMPTY'
    });
  }

  // 验证目标字数 (需求 8.1)
  if (project.targetWordCount <= 0) {
    errors.push({
      field: 'targetWordCount',
      message: '目标字数必须大于0',
      code: 'INVALID_TARGET_WORD_COUNT'
    });
  } else if (project.targetWordCount < 1000000) {
    warnings.push({
      field: 'targetWordCount',
      message: '目标字数少于100万字，可能不符合长篇小说要求',
      suggestion: '建议设置为100万字左右'
    });
  }

  // 验证当前字数
  if (project.currentWordCount < 0) {
    errors.push({
      field: 'currentWordCount',
      message: '当前字数不能为负数',
      code: 'INVALID_CURRENT_WORD_COUNT'
    });
  }

  // 验证日期
  if (project.createdAt > project.updatedAt) {
    errors.push({
      field: 'updatedAt',
      message: '更新时间不能早于创建时间',
      code: 'INVALID_UPDATE_TIME'
    });
  }

  // 验证大纲
  if (project.outline) {
    const outlineValidation = validateOutline(project.outline);
    errors.push(...outlineValidation.errors);
    warnings.push(...outlineValidation.warnings);
  }

  // 验证写作风格
  if (project.style) {
    const styleValidation = validateWritingStyle(project.style);
    errors.push(...styleValidation.errors);
    warnings.push(...styleValidation.warnings);
  }

  // 验证章节
  project.chapters.forEach((chapter, index) => {
    const chapterValidation = validateChapter(chapter);
    chapterValidation.errors.forEach(error => {
      errors.push({
        ...error,
        field: `chapters[${index}].${error.field}`
      });
    });
    chapterValidation.warnings.forEach(warning => {
      warnings.push({
        ...warning,
        field: `chapters[${index}].${warning.field}`
      });
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 验证大纲数据模型
 */
export function validateOutline(outline: Outline): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 验证主题
  if (!outline.mainTheme || outline.mainTheme.trim().length === 0) {
    errors.push({
      field: 'mainTheme',
      message: '主题不能为空',
      code: 'MAIN_THEME_EMPTY'
    });
  }

  // 验证角色 (需求 2.2)
  if (!outline.characters || outline.characters.length === 0) {
    warnings.push({
      field: 'characters',
      message: '建议至少包含一个主要角色',
      suggestion: '添加主角或重要配角'
    });
  } else {
    outline.characters.forEach((character, index) => {
      const characterValidation = validateCharacter(character);
      characterValidation.errors.forEach(error => {
        errors.push({
          ...error,
          field: `characters[${index}].${error.field}`
        });
      });
      characterValidation.warnings.forEach(warning => {
        warnings.push({
          ...warning,
          field: `characters[${index}].${warning.field}`
        });
      });
    });
  }

  // 验证世界设定
  if (outline.worldSetting) {
    const worldValidation = validateWorldSetting(outline.worldSetting);
    errors.push(...worldValidation.errors);
    warnings.push(...worldValidation.warnings);
  }

  // 验证情节结构
  if (outline.plotStructure) {
    const plotValidation = validatePlotStructure(outline.plotStructure);
    errors.push(...plotValidation.errors);
    warnings.push(...plotValidation.warnings);
  }

  // 验证冲突
  outline.conflicts.forEach((conflict, index) => {
    const conflictValidation = validateConflict(conflict);
    conflictValidation.errors.forEach(error => {
      errors.push({
        ...error,
        field: `conflicts[${index}].${error.field}`
      });
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 验证章节数据模型
 */
export function validateChapter(chapter: Chapter): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 验证章节ID
  if (!chapter.id || chapter.id.trim().length === 0) {
    errors.push({
      field: 'id',
      message: '章节ID不能为空',
      code: 'CHAPTER_ID_EMPTY'
    });
  }

  // 验证章节标题
  if (!chapter.title || chapter.title.trim().length === 0) {
    errors.push({
      field: 'title',
      message: '章节标题不能为空',
      code: 'CHAPTER_TITLE_EMPTY'
    });
  }

  // 验证章节摘要
  if (!chapter.summary || chapter.summary.trim().length === 0) {
    warnings.push({
      field: 'summary',
      message: '建议为章节添加摘要',
      suggestion: '摘要有助于保持情节连贯性'
    });
  }

  // 验证预估字数 (需求 4.2 - 网络小说章节长度)
  if (chapter.estimatedWordCount <= 0) {
    errors.push({
      field: 'estimatedWordCount',
      message: '预估字数必须大于0',
      code: 'INVALID_ESTIMATED_WORD_COUNT'
    });
  } else if (chapter.estimatedWordCount < 2000) {
    warnings.push({
      field: 'estimatedWordCount',
      message: '章节字数可能过少，建议2000-4000字',
      suggestion: '适合网络小说的章节长度'
    });
  } else if (chapter.estimatedWordCount > 4000) {
    warnings.push({
      field: 'estimatedWordCount',
      message: '章节字数可能过多，建议2000-4000字',
      suggestion: '过长的章节可能影响阅读体验'
    });
  }

  // 验证实际字数
  if (chapter.actualWordCount < 0) {
    errors.push({
      field: 'actualWordCount',
      message: '实际字数不能为负数',
      code: 'INVALID_ACTUAL_WORD_COUNT'
    });
  }

  // 验证章节状态
  if (!Object.values(ChapterStatus).includes(chapter.status)) {
    errors.push({
      field: 'status',
      message: '无效的章节状态',
      code: 'INVALID_CHAPTER_STATUS'
    });
  }

  // 验证关键情节点
  if (!chapter.keyPlotPoints || chapter.keyPlotPoints.length === 0) {
    warnings.push({
      field: 'keyPlotPoints',
      message: '建议为章节添加关键情节点',
      suggestion: '有助于保持故事结构清晰'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 验证角色数据模型
 */
export function validateCharacter(character: Character): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 验证角色ID
  if (!character.id || character.id.trim().length === 0) {
    errors.push({
      field: 'id',
      message: '角色ID不能为空',
      code: 'CHARACTER_ID_EMPTY'
    });
  }

  // 验证角色姓名
  if (!character.name || character.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: '角色姓名不能为空',
      code: 'CHARACTER_NAME_EMPTY'
    });
  }

  // 验证角色描述
  if (!character.description || character.description.trim().length === 0) {
    warnings.push({
      field: 'description',
      message: '建议添加角色描述',
      suggestion: '详细的角色描述有助于保持角色一致性'
    });
  } else if (character.description.length < 50) {
    warnings.push({
      field: 'description',
      message: '角色描述可能过于简单',
      suggestion: '建议提供更详细的角色描述（至少50字）'
    });
  }

  // 验证性格特征
  if (!character.personality || character.personality.length === 0) {
    warnings.push({
      field: 'personality',
      message: '建议添加角色性格特征',
      suggestion: '性格特征有助于角色塑造'
    });
  } else if (character.personality.length < 3) {
    warnings.push({
      field: 'personality',
      message: '建议添加更多性格特征',
      suggestion: '至少3个性格特征有助于角色立体化'
    });
  }

  // 验证角色背景
  if (!character.background || character.background.trim().length === 0) {
    warnings.push({
      field: 'background',
      message: '建议添加角色背景故事',
      suggestion: '背景故事有助于角色深度塑造'
    });
  }

  // 验证发展轨迹
  if (!character.developmentArc || character.developmentArc.trim().length === 0) {
    warnings.push({
      field: 'developmentArc',
      message: '建议设定角色发展轨迹',
      suggestion: '明确的发展轨迹有助于角色成长'
    });
  }

  // 验证角色关系
  character.relationships.forEach((relationship, index) => {
    if (!relationship.characterId || relationship.characterId.trim().length === 0) {
      errors.push({
        field: `relationships[${index}].characterId`,
        message: '关系中的角色ID不能为空',
        code: 'RELATIONSHIP_CHARACTER_ID_EMPTY'
      });
    }

    if (!Object.values(RelationshipType).includes(relationship.type)) {
      errors.push({
        field: `relationships[${index}].type`,
        message: '无效的关系类型',
        code: 'INVALID_RELATIONSHIP_TYPE'
      });
    }

    if (!relationship.description || relationship.description.trim().length === 0) {
      warnings.push({
        field: `relationships[${index}].description`,
        message: '建议添加关系描述',
        suggestion: '详细的关系描述有助于角色互动'
      });
    }

    // 检查自我关系
    if (relationship.characterId === character.id) {
      errors.push({
        field: `relationships[${index}].characterId`,
        message: '角色不能与自己建立关系',
        code: 'SELF_RELATIONSHIP_NOT_ALLOWED'
      });
    }
  });

  // 检查重复关系
  const relationshipIds = character.relationships.map(r => r.characterId);
  const duplicateIds = relationshipIds.filter((id, index) => relationshipIds.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    warnings.push({
      field: 'relationships',
      message: '存在重复的角色关系',
      suggestion: '每个角色只应建立一种关系类型'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 验证世界设定数据模型
 */
export function validateWorldSetting(worldSetting: WorldSetting): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 验证时间设定
  if (!worldSetting.timeperiod || worldSetting.timeperiod.trim().length === 0) {
    warnings.push({
      field: 'timeperiod',
      message: '建议设定故事的时间背景',
      suggestion: '明确的时间设定有助于世界观构建'
    });
  } else if (worldSetting.timeperiod.length < 10) {
    warnings.push({
      field: 'timeperiod',
      message: '时间设定可能过于简单',
      suggestion: '建议提供更详细的时间背景描述'
    });
  }

  // 验证地点设定
  if (!worldSetting.location || worldSetting.location.trim().length === 0) {
    warnings.push({
      field: 'location',
      message: '建议设定故事的地点背景',
      suggestion: '明确的地点设定有助于场景描写'
    });
  } else if (worldSetting.location.length < 10) {
    warnings.push({
      field: 'location',
      message: '地点设定可能过于简单',
      suggestion: '建议提供更详细的地理环境描述'
    });
  }

  // 验证社会背景
  if (!worldSetting.socialContext || worldSetting.socialContext.trim().length === 0) {
    warnings.push({
      field: 'socialContext',
      message: '建议添加社会背景描述',
      suggestion: '社会背景有助于角色行为的合理性'
    });
  } else if (worldSetting.socialContext.length < 20) {
    warnings.push({
      field: 'socialContext',
      message: '社会背景描述可能过于简单',
      suggestion: '建议提供更详细的社会结构和文化背景'
    });
  }

  // 验证世界规则
  if (!worldSetting.rules || worldSetting.rules.length === 0) {
    warnings.push({
      field: 'rules',
      message: '建议设定世界规则',
      suggestion: '明确的世界规则有助于保持故事逻辑一致性'
    });
  } else {
    // 检查规则是否过于简单
    const simpleRules = worldSetting.rules.filter(rule => rule.length < 10);
    if (simpleRules.length > 0) {
      warnings.push({
        field: 'rules',
        message: '部分世界规则描述过于简单',
        suggestion: '建议为每个规则提供更详细的说明'
      });
    }
  }

  // 验证氛围设定
  if (!worldSetting.atmosphere || worldSetting.atmosphere.trim().length === 0) {
    warnings.push({
      field: 'atmosphere',
      message: '建议设定世界氛围',
      suggestion: '氛围设定有助于营造故事基调'
    });
  } else if (worldSetting.atmosphere.length < 10) {
    warnings.push({
      field: 'atmosphere',
      message: '氛围描述可能过于简单',
      suggestion: '建议提供更丰富的氛围描述'
    });
  }

  // 验证设定一致性
  if (worldSetting.timeperiod && worldSetting.socialContext) {
    // 检查时间设定与社会背景的一致性
    const modernKeywords = ['现代', '当代', '21世纪', '科技'];
    const ancientKeywords = ['古代', '中世纪', '封建', '传统'];
    
    const isModernTime = modernKeywords.some(keyword => 
      worldSetting.timeperiod.includes(keyword)
    );
    const isAncientSocial = ancientKeywords.some(keyword => 
      worldSetting.socialContext.includes(keyword)
    );
    
    if (isModernTime && isAncientSocial) {
      warnings.push({
        field: 'socialContext',
        message: '时间设定与社会背景可能存在不一致',
        suggestion: '请确保时间背景与社会结构相匹配'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 验证情节结构数据模型
 */
export function validatePlotStructure(plotStructure: PlotStructure): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 验证开端
  if (!plotStructure.exposition || plotStructure.exposition.trim().length === 0) {
    warnings.push({
      field: 'exposition',
      message: '建议添加故事开端描述',
      suggestion: '清晰的开端有助于故事结构'
    });
  }

  // 验证高潮
  if (!plotStructure.climax || plotStructure.climax.trim().length === 0) {
    warnings.push({
      field: 'climax',
      message: '建议添加故事高潮描述',
      suggestion: '明确的高潮是故事的核心'
    });
  }

  // 验证结局
  if (!plotStructure.resolution || plotStructure.resolution.trim().length === 0) {
    warnings.push({
      field: 'resolution',
      message: '建议添加故事结局描述',
      suggestion: '完整的结局有助于故事完整性'
    });
  }

  // 验证上升动作
  if (!plotStructure.risingAction || plotStructure.risingAction.length === 0) {
    warnings.push({
      field: 'risingAction',
      message: '建议添加上升动作情节点',
      suggestion: '上升动作推动故事发展'
    });
  }

  // 验证下降动作
  if (!plotStructure.fallingAction || plotStructure.fallingAction.length === 0) {
    warnings.push({
      field: 'fallingAction',
      message: '建议添加下降动作情节点',
      suggestion: '下降动作完善故事结构'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 验证冲突数据模型
 */
export function validateConflict(conflict: Conflict): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 验证冲突类型
  if (!Object.values(ConflictType).includes(conflict.type)) {
    errors.push({
      field: 'type',
      message: '无效的冲突类型',
      code: 'INVALID_CONFLICT_TYPE'
    });
  }

  // 验证冲突描述
  if (!conflict.description || conflict.description.trim().length === 0) {
    errors.push({
      field: 'description',
      message: '冲突描述不能为空',
      code: 'CONFLICT_DESCRIPTION_EMPTY'
    });
  }

  // 验证参与者
  if (!conflict.participants || conflict.participants.length === 0) {
    warnings.push({
      field: 'participants',
      message: '建议添加冲突参与者',
      suggestion: '明确的参与者有助于冲突展开'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 验证写作风格数据模型
 */
export function validateWritingStyle(style: WritingStyle): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 验证风格ID
  if (!style.id || style.id.trim().length === 0) {
    errors.push({
      field: 'id',
      message: '写作风格ID不能为空',
      code: 'STYLE_ID_EMPTY'
    });
  }

  // 验证风格名称
  if (!style.name || style.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: '写作风格名称不能为空',
      code: 'STYLE_NAME_EMPTY'
    });
  }

  // 验证风格描述
  if (!style.description || style.description.trim().length === 0) {
    warnings.push({
      field: 'description',
      message: '建议添加风格描述',
      suggestion: '详细的描述有助于风格应用'
    });
  }

  // 验证风格特征
  if (!style.characteristics) {
    errors.push({
      field: 'characteristics',
      message: '风格特征不能为空',
      code: 'STYLE_CHARACTERISTICS_EMPTY'
    });
  } else {
    if (!style.characteristics.tone || style.characteristics.tone.trim().length === 0) {
      warnings.push({
        field: 'characteristics.tone',
        message: '建议设定语调特征',
        suggestion: '语调是风格的重要组成部分'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
// Import multimodal types
import { 
  ImageInput, 
  ImageMetadata, 
  ImageAnalysisResult, 
  VisualElement, 
  VisualElementType,
  PlotRequirement,
  PlotRequirementType
} from './multimodal';

/**
 * 验证图片输入数据模型
 */
export function validateImageInput(imageInput: ImageInput): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 验证图片ID
  if (!imageInput.id || imageInput.id.trim().length === 0) {
    errors.push({
      field: 'id',
      message: '图片ID不能为空',
      code: 'IMAGE_ID_EMPTY'
    });
  }

  // 验证文件对象
  if (!imageInput.file) {
    errors.push({
      field: 'file',
      message: '图片文件不能为空',
      code: 'IMAGE_FILE_EMPTY'
    });
  } else {
    // 验证文件大小 (需求 5.1)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageInput.file.size > maxSize) {
      errors.push({
        field: 'file',
        message: '图片文件大小不能超过10MB',
        code: 'IMAGE_FILE_TOO_LARGE'
      });
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageInput.file.type)) {
      errors.push({
        field: 'file',
        message: '不支持的图片格式，请使用JPEG、PNG、GIF或WebP格式',
        code: 'UNSUPPORTED_IMAGE_FORMAT'
      });
    }
  }

  // 验证元数据
  if (imageInput.metadata) {
    const metadataValidation = validateImageMetadata(imageInput.metadata);
    errors.push(...metadataValidation.errors);
    warnings.push(...metadataValidation.warnings);
  } else {
    warnings.push({
      field: 'metadata',
      message: '建议提供图片元数据',
      suggestion: '元数据有助于更好地处理图片'
    });
  }

  // 验证描述
  if (imageInput.description && imageInput.description.length > 500) {
    warnings.push({
      field: 'description',
      message: '图片描述过长',
      suggestion: '建议将描述控制在500字以内'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 验证图片元数据
 */
export function validateImageMetadata(metadata: ImageMetadata): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 验证文件名
  if (!metadata.filename || metadata.filename.trim().length === 0) {
    errors.push({
      field: 'filename',
      message: '文件名不能为空',
      code: 'FILENAME_EMPTY'
    });
  }

  // 验证文件大小
  if (metadata.size <= 0) {
    errors.push({
      field: 'size',
      message: '文件大小必须大于0',
      code: 'INVALID_FILE_SIZE'
    });
  }

  // 验证格式
  if (!metadata.format || metadata.format.trim().length === 0) {
    errors.push({
      field: 'format',
      message: '图片格式不能为空',
      code: 'FORMAT_EMPTY'
    });
  }

  // 验证尺寸
  if (!metadata.dimensions) {
    errors.push({
      field: 'dimensions',
      message: '图片尺寸信息不能为空',
      code: 'DIMENSIONS_EMPTY'
    });
  } else {
    if (metadata.dimensions.width <= 0 || metadata.dimensions.height <= 0) {
      errors.push({
        field: 'dimensions',
        message: '图片尺寸必须大于0',
        code: 'INVALID_DIMENSIONS'
      });
    }

    // 检查图片尺寸是否过小
    if (metadata.dimensions.width < 100 || metadata.dimensions.height < 100) {
      warnings.push({
        field: 'dimensions',
        message: '图片尺寸可能过小',
        suggestion: '建议使用至少100x100像素的图片以获得更好的分析效果'
      });
    }

    // 检查图片尺寸是否过大
    if (metadata.dimensions.width > 4000 || metadata.dimensions.height > 4000) {
      warnings.push({
        field: 'dimensions',
        message: '图片尺寸可能过大',
        suggestion: '过大的图片可能影响处理速度'
      });
    }
  }

  // 验证上传时间
  if (!metadata.uploadedAt) {
    errors.push({
      field: 'uploadedAt',
      message: '上传时间不能为空',
      code: 'UPLOAD_TIME_EMPTY'
    });
  } else if (metadata.uploadedAt > new Date()) {
    errors.push({
      field: 'uploadedAt',
      message: '上传时间不能是未来时间',
      code: 'INVALID_UPLOAD_TIME'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 验证图片分析结果
 */
export function validateImageAnalysisResult(result: ImageAnalysisResult): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 验证描述
  if (!result.description || result.description.trim().length === 0) {
    errors.push({
      field: 'description',
      message: '图片描述不能为空',
      code: 'ANALYSIS_DESCRIPTION_EMPTY'
    });
  } else if (result.description.length < 20) {
    warnings.push({
      field: 'description',
      message: '图片描述可能过于简单',
      suggestion: '建议提供更详细的图片描述'
    });
  }

  // 验证视觉元素
  if (!result.elements || result.elements.length === 0) {
    warnings.push({
      field: 'elements',
      message: '建议识别图片中的视觉元素',
      suggestion: '视觉元素有助于情节生成'
    });
  } else {
    result.elements.forEach((element, index) => {
      const elementValidation = validateVisualElement(element);
      elementValidation.errors.forEach(error => {
        errors.push({
          ...error,
          field: `elements[${index}].${error.field}`
        });
      });
      elementValidation.warnings.forEach(warning => {
        warnings.push({
          ...warning,
          field: `elements[${index}].${warning.field}`
        });
      });
    });
  }

  // 验证情绪
  if (!result.mood || result.mood.trim().length === 0) {
    warnings.push({
      field: 'mood',
      message: '建议识别图片的情绪氛围',
      suggestion: '情绪氛围有助于故事基调设定'
    });
  }

  // 验证设定
  if (!result.setting || result.setting.trim().length === 0) {
    warnings.push({
      field: 'setting',
      message: '建议识别图片的场景设定',
      suggestion: '场景设定有助于世界观构建'
    });
  }

  // 验证角色列表
  if (result.characters && result.characters.length > 10) {
    warnings.push({
      field: 'characters',
      message: '识别的角色数量可能过多',
      suggestion: '建议重点关注主要角色'
    });
  }

  // 验证动作列表
  if (result.actions && result.actions.length > 15) {
    warnings.push({
      field: 'actions',
      message: '识别的动作数量可能过多',
      suggestion: '建议重点关注关键动作'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 验证视觉元素
 */
export function validateVisualElement(element: VisualElement): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 验证类型
  if (!Object.values(VisualElementType).includes(element.type)) {
    errors.push({
      field: 'type',
      message: '无效的视觉元素类型',
      code: 'INVALID_VISUAL_ELEMENT_TYPE'
    });
  }

  // 验证描述
  if (!element.description || element.description.trim().length === 0) {
    errors.push({
      field: 'description',
      message: '视觉元素描述不能为空',
      code: 'VISUAL_ELEMENT_DESCRIPTION_EMPTY'
    });
  }

  // 验证置信度
  if (element.confidence < 0 || element.confidence > 1) {
    errors.push({
      field: 'confidence',
      message: '置信度必须在0到1之间',
      code: 'INVALID_CONFIDENCE_VALUE'
    });
  } else if (element.confidence < 0.3) {
    warnings.push({
      field: 'confidence',
      message: '视觉元素识别置信度较低',
      suggestion: '低置信度的元素可能不够准确'
    });
  }

  // 验证位置信息
  if (element.position) {
    if (element.position.x < 0 || element.position.y < 0 || 
        element.position.width <= 0 || element.position.height <= 0) {
      errors.push({
        field: 'position',
        message: '位置信息格式无效',
        code: 'INVALID_POSITION_INFO'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 验证情节需求
 */
export function validatePlotRequirement(requirement: PlotRequirement): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 验证ID
  if (!requirement.id || requirement.id.trim().length === 0) {
    errors.push({
      field: 'id',
      message: '情节需求ID不能为空',
      code: 'PLOT_REQUIREMENT_ID_EMPTY'
    });
  }

  // 验证类型
  if (!Object.values(PlotRequirementType).includes(requirement.type)) {
    errors.push({
      field: 'type',
      message: '无效的情节需求类型',
      code: 'INVALID_PLOT_REQUIREMENT_TYPE'
    });
  }

  // 验证内容
  if (!requirement.content || requirement.content.trim().length === 0) {
    errors.push({
      field: 'content',
      message: '情节需求内容不能为空',
      code: 'PLOT_REQUIREMENT_CONTENT_EMPTY'
    });
  } else if (requirement.content.length > 1000) {
    warnings.push({
      field: 'content',
      message: '情节需求内容可能过长',
      suggestion: '建议将内容控制在1000字以内'
    });
  }

  // 验证优先级 (需求 5.2)
  if (requirement.priority < 1 || requirement.priority > 10) {
    errors.push({
      field: 'priority',
      message: '优先级必须在1到10之间',
      code: 'INVALID_PRIORITY_VALUE'
    });
  }

  // 验证视觉元素（如果是图片或混合类型）
  if ((requirement.type === PlotRequirementType.IMAGE || requirement.type === PlotRequirementType.MIXED) 
      && requirement.visualElements) {
    requirement.visualElements.forEach((element, index) => {
      const elementValidation = validateVisualElement(element);
      elementValidation.errors.forEach(error => {
        errors.push({
          ...error,
          field: `visualElements[${index}].${error.field}`
        });
      });
      elementValidation.warnings.forEach(warning => {
        warnings.push({
          ...warning,
          field: `visualElements[${index}].${warning.field}`
        });
      });
    });
  }

  // 验证章节提示
  if (requirement.chapterHint && requirement.chapterHint.length > 200) {
    warnings.push({
      field: 'chapterHint',
      message: '章节提示可能过长',
      suggestion: '建议将章节提示控制在200字以内'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}