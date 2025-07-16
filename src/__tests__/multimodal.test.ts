// Unit tests for multimodal input data models

import { describe, it, expect } from 'vitest';
import {
  ImageInput,
  ImageMetadata,
  ImageAnalysisResult,
  VisualElement,
  VisualElementType,
  PlotRequirement,
  PlotRequirementType
} from '../models/multimodal';
import {
  validateImageInput,
  validateImageMetadata,
  validateImageAnalysisResult,
  validateVisualElement,
  validatePlotRequirement
} from '../models/validation';

// Mock File object for testing
class MockFile implements File {
  constructor(
    public name: string,
    public size: number,
    public type: string,
    public lastModified: number = Date.now()
  ) {}

  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(0));
  }

  slice(): Blob {
    return new Blob();
  }

  stream(): ReadableStream<Uint8Array> {
    return new ReadableStream();
  }

  text(): Promise<string> {
    return Promise.resolve('');
  }

  get webkitRelativePath(): string {
    return '';
  }
}

describe('多模态输入数据模型测试', () => {
  describe('ImageInput 验证', () => {
    it('应该验证有效的图片输入', () => {
      const validImageInput: ImageInput = {
        id: 'img-001',
        file: new MockFile('test.jpg', 1024 * 1024, 'image/jpeg'), // 1MB JPEG
        description: '这是一张测试图片，用于验证图片输入功能',
        metadata: {
          filename: 'test.jpg',
          size: 1024 * 1024,
          format: 'JPEG',
          dimensions: {
            width: 1920,
            height: 1080
          },
          uploadedAt: new Date()
        }
      };

      const result = validateImageInput(validImageInput);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测图片ID为空', () => {
      const invalidImageInput: ImageInput = {
        id: '', // 空ID
        file: new MockFile('test.jpg', 1024 * 1024, 'image/jpeg'),
        metadata: {
          filename: 'test.jpg',
          size: 1024 * 1024,
          format: 'JPEG',
          dimensions: { width: 1920, height: 1080 },
          uploadedAt: new Date()
        }
      };

      const result = validateImageInput(invalidImageInput);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'IMAGE_ID_EMPTY')).toBe(true);
    });

    it('应该检测文件过大', () => {
      const largeFileInput: ImageInput = {
        id: 'img-002',
        file: new MockFile('large.jpg', 15 * 1024 * 1024, 'image/jpeg'), // 15MB
        metadata: {
          filename: 'large.jpg',
          size: 15 * 1024 * 1024,
          format: 'JPEG',
          dimensions: { width: 4000, height: 3000 },
          uploadedAt: new Date()
        }
      };

      const result = validateImageInput(largeFileInput);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'IMAGE_FILE_TOO_LARGE')).toBe(true);
    });

    it('应该检测不支持的文件格式', () => {
      const unsupportedFormatInput: ImageInput = {
        id: 'img-003',
        file: new MockFile('test.bmp', 1024 * 1024, 'image/bmp'), // BMP格式
        metadata: {
          filename: 'test.bmp',
          size: 1024 * 1024,
          format: 'BMP',
          dimensions: { width: 1920, height: 1080 },
          uploadedAt: new Date()
        }
      };

      const result = validateImageInput(unsupportedFormatInput);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'UNSUPPORTED_IMAGE_FORMAT')).toBe(true);
    });

    it('应该警告描述过长', () => {
      const longDescriptionInput: ImageInput = {
        id: 'img-004',
        file: new MockFile('test.png', 1024 * 1024, 'image/png'),
        description: '这是一个非常长的描述，'.repeat(50), // 超过500字
        metadata: {
          filename: 'test.png',
          size: 1024 * 1024,
          format: 'PNG',
          dimensions: { width: 1920, height: 1080 },
          uploadedAt: new Date()
        }
      };

      const result = validateImageInput(longDescriptionInput);
      expect(result.warnings.some(w => w.field === 'description' && w.message.includes('过长'))).toBe(true);
    });
  });

  describe('ImageMetadata 验证', () => {
    it('应该验证有效的图片元数据', () => {
      const validMetadata: ImageMetadata = {
        filename: 'photo.jpg',
        size: 2 * 1024 * 1024,
        format: 'JPEG',
        dimensions: {
          width: 2048,
          height: 1536
        },
        uploadedAt: new Date('2024-01-01')
      };

      const result = validateImageMetadata(validMetadata);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测无效的文件大小', () => {
      const invalidMetadata: ImageMetadata = {
        filename: 'test.jpg',
        size: -1, // 无效大小
        format: 'JPEG',
        dimensions: { width: 1920, height: 1080 },
        uploadedAt: new Date()
      };

      const result = validateImageMetadata(invalidMetadata);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_FILE_SIZE')).toBe(true);
    });

    it('应该检测无效的图片尺寸', () => {
      const invalidDimensionsMetadata: ImageMetadata = {
        filename: 'test.jpg',
        size: 1024 * 1024,
        format: 'JPEG',
        dimensions: {
          width: -100, // 无效宽度
          height: 1080
        },
        uploadedAt: new Date()
      };

      const result = validateImageMetadata(invalidDimensionsMetadata);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_DIMENSIONS')).toBe(true);
    });

    it('应该警告图片尺寸过小', () => {
      const smallImageMetadata: ImageMetadata = {
        filename: 'small.jpg',
        size: 1024,
        format: 'JPEG',
        dimensions: {
          width: 50, // 小于100像素
          height: 50
        },
        uploadedAt: new Date()
      };

      const result = validateImageMetadata(smallImageMetadata);
      expect(result.warnings.some(w => w.field === 'dimensions' && w.message.includes('过小'))).toBe(true);
    });

    it('应该警告图片尺寸过大', () => {
      const largeImageMetadata: ImageMetadata = {
        filename: 'huge.jpg',
        size: 10 * 1024 * 1024,
        format: 'JPEG',
        dimensions: {
          width: 5000, // 大于4000像素
          height: 4000
        },
        uploadedAt: new Date()
      };

      const result = validateImageMetadata(largeImageMetadata);
      expect(result.warnings.some(w => w.field === 'dimensions' && w.message.includes('过大'))).toBe(true);
    });

    it('应该检测未来的上传时间', () => {
      const futureTimeMetadata: ImageMetadata = {
        filename: 'future.jpg',
        size: 1024 * 1024,
        format: 'JPEG',
        dimensions: { width: 1920, height: 1080 },
        uploadedAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 明天
      };

      const result = validateImageMetadata(futureTimeMetadata);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_UPLOAD_TIME')).toBe(true);
    });
  });

  describe('ImageAnalysisResult 验证', () => {
    it('应该验证有效的图片分析结果', () => {
      const validAnalysisResult: ImageAnalysisResult = {
        description: '这是一张展现美丽自然风景的照片，包含山脉、湖泊和蓝天白云',
        elements: [
          {
            type: VisualElementType.SCENE,
            description: '山脉背景',
            confidence: 0.9
          },
          {
            type: VisualElementType.SCENE,
            description: '湖泊水面',
            confidence: 0.85
          }
        ],
        mood: '宁静祥和',
        setting: '自然风景区',
        characters: [],
        actions: ['欣赏风景'],
        emotions: ['平静', '愉悦']
      };

      const result = validateImageAnalysisResult(validAnalysisResult);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测描述为空', () => {
      const emptyDescriptionResult: ImageAnalysisResult = {
        description: '', // 空描述
        elements: [],
        mood: '测试情绪',
        setting: '测试场景',
        characters: [],
        actions: [],
        emotions: []
      };

      const result = validateImageAnalysisResult(emptyDescriptionResult);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'ANALYSIS_DESCRIPTION_EMPTY')).toBe(true);
    });

    it('应该警告描述过于简单', () => {
      const shortDescriptionResult: ImageAnalysisResult = {
        description: '简单图片', // 少于20字
        elements: [],
        mood: '普通',
        setting: '室内',
        characters: [],
        actions: [],
        emotions: []
      };

      const result = validateImageAnalysisResult(shortDescriptionResult);
      expect(result.warnings.some(w => w.field === 'description' && w.message.includes('过于简单'))).toBe(true);
    });

    it('应该警告角色数量过多', () => {
      const manyCharactersResult: ImageAnalysisResult = {
        description: '这是一张包含很多人物的集体照片，展现了热闹的聚会场面',
        elements: [],
        mood: '热闹',
        setting: '聚会现场',
        characters: Array.from({ length: 15 }, (_, i) => `角色${i + 1}`), // 15个角色
        actions: [],
        emotions: []
      };

      const result = validateImageAnalysisResult(manyCharactersResult);
      expect(result.warnings.some(w => w.field === 'characters' && w.message.includes('过多'))).toBe(true);
    });
  });

  describe('VisualElement 验证', () => {
    it('应该验证有效的视觉元素', () => {
      const validElement: VisualElement = {
        type: VisualElementType.PERSON,
        description: '一个穿着蓝色衣服的年轻人',
        confidence: 0.85,
        position: {
          x: 100,
          y: 200,
          width: 150,
          height: 300
        }
      };

      const result = validateVisualElement(validElement);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测无效的视觉元素类型', () => {
      const invalidTypeElement: VisualElement = {
        type: 'INVALID_TYPE' as VisualElementType,
        description: '测试元素',
        confidence: 0.8
      };

      const result = validateVisualElement(invalidTypeElement);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_VISUAL_ELEMENT_TYPE')).toBe(true);
    });

    it('应该检测无效的置信度', () => {
      const invalidConfidenceElement: VisualElement = {
        type: VisualElementType.OBJECT,
        description: '测试对象',
        confidence: 1.5 // 超过1.0
      };

      const result = validateVisualElement(invalidConfidenceElement);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_CONFIDENCE_VALUE')).toBe(true);
    });

    it('应该警告低置信度', () => {
      const lowConfidenceElement: VisualElement = {
        type: VisualElementType.EMOTION,
        description: '不确定的情绪',
        confidence: 0.2 // 低于0.3
      };

      const result = validateVisualElement(lowConfidenceElement);
      expect(result.warnings.some(w => w.field === 'confidence' && w.message.includes('较低'))).toBe(true);
    });

    it('应该检测无效的位置信息', () => {
      const invalidPositionElement: VisualElement = {
        type: VisualElementType.SCENE,
        description: '场景元素',
        confidence: 0.7,
        position: {
          x: -10, // 负数坐标
          y: 50,
          width: 100,
          height: 100
        }
      };

      const result = validateVisualElement(invalidPositionElement);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_POSITION_INFO')).toBe(true);
    });
  });

  describe('PlotRequirement 验证', () => {
    it('应该验证有效的情节需求', () => {
      const validRequirement: PlotRequirement = {
        id: 'req-001',
        type: PlotRequirementType.TEXT,
        content: '主角需要在这个章节中展现出勇气和决心，面对前所未有的挑战',
        priority: 8,
        chapterHint: '第三章：勇气的考验'
      };

      const result = validatePlotRequirement(validRequirement);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测情节需求ID为空', () => {
      const emptyIdRequirement: PlotRequirement = {
        id: '', // 空ID
        type: PlotRequirementType.TEXT,
        content: '测试内容',
        priority: 5
      };

      const result = validatePlotRequirement(emptyIdRequirement);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'PLOT_REQUIREMENT_ID_EMPTY')).toBe(true);
    });

    it('应该检测无效的情节需求类型', () => {
      const invalidTypeRequirement: PlotRequirement = {
        id: 'req-002',
        type: 'INVALID_TYPE' as PlotRequirementType,
        content: '测试内容',
        priority: 5
      };

      const result = validatePlotRequirement(invalidTypeRequirement);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_PLOT_REQUIREMENT_TYPE')).toBe(true);
    });

    it('应该检测无效的优先级', () => {
      const invalidPriorityRequirement: PlotRequirement = {
        id: 'req-003',
        type: PlotRequirementType.TEXT,
        content: '测试内容',
        priority: 15 // 超过10
      };

      const result = validatePlotRequirement(invalidPriorityRequirement);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_PRIORITY_VALUE')).toBe(true);
    });

    it('应该警告内容过长', () => {
      const longContentRequirement: PlotRequirement = {
        id: 'req-004',
        type: PlotRequirementType.TEXT,
        content: '这是一个非常长的情节需求内容，'.repeat(100), // 超过1000字
        priority: 5
      };

      const result = validatePlotRequirement(longContentRequirement);
      expect(result.warnings.some(w => w.field === 'content' && w.message.includes('过长'))).toBe(true);
    });

    it('应该警告章节提示过长', () => {
      const longHintRequirement: PlotRequirement = {
        id: 'req-005',
        type: PlotRequirementType.TEXT,
        content: '正常的情节需求内容',
        priority: 5,
        chapterHint: '这是一个非常长的章节提示，'.repeat(20) // 超过200字
      };

      const result = validatePlotRequirement(longHintRequirement);
      expect(result.warnings.some(w => w.field === 'chapterHint' && w.message.includes('过长'))).toBe(true);
    });

    it('应该验证包含视觉元素的混合类型需求', () => {
      const mixedRequirement: PlotRequirement = {
        id: 'req-006',
        type: PlotRequirementType.MIXED,
        content: '结合图片和文字的情节需求',
        priority: 7,
        visualElements: [
          {
            type: VisualElementType.PERSON,
            description: '主角形象',
            confidence: 0.9
          },
          {
            type: VisualElementType.SCENE,
            description: '战斗场景',
            confidence: 0.8
          }
        ]
      };

      const result = validatePlotRequirement(mixedRequirement);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('视觉元素类型测试', () => {
    it('应该支持所有视觉元素类型', () => {
      const elementTypes = Object.values(VisualElementType);
      expect(elementTypes).toContain(VisualElementType.PERSON);
      expect(elementTypes).toContain(VisualElementType.OBJECT);
      expect(elementTypes).toContain(VisualElementType.SCENE);
      expect(elementTypes).toContain(VisualElementType.EMOTION);
      expect(elementTypes).toContain(VisualElementType.ACTION);
      expect(elementTypes).toContain(VisualElementType.SETTING);
    });
  });

  describe('情节需求类型测试', () => {
    it('应该支持所有情节需求类型', () => {
      const requirementTypes = Object.values(PlotRequirementType);
      expect(requirementTypes).toContain(PlotRequirementType.TEXT);
      expect(requirementTypes).toContain(PlotRequirementType.IMAGE);
      expect(requirementTypes).toContain(PlotRequirementType.MIXED);
    });
  });
});