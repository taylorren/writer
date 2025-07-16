// Multimodal input models for image and mixed content processing

export interface ImageInput {
  id: string;
  file: File;
  description?: string;
  metadata: ImageMetadata;
}

export interface ImageMetadata {
  filename: string;
  size: number;
  format: string;
  dimensions: {
    width: number;
    height: number;
  };
  uploadedAt: Date;
}

export interface ImageAnalysisResult {
  description: string;
  elements: VisualElement[];
  mood: string;
  setting: string;
  characters: string[];
  actions: string[];
  emotions: string[];
}

export interface VisualElement {
  type: VisualElementType;
  description: string;
  confidence: number;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export enum VisualElementType {
  PERSON = 'person',
  OBJECT = 'object',
  SCENE = 'scene',
  EMOTION = 'emotion',
  ACTION = 'action',
  SETTING = 'setting'
}

export interface PlotRequirement {
  id: string;
  type: PlotRequirementType;
  content: string;
  visualElements?: VisualElement[];
  priority: number;
  chapterHint?: string;
}

export enum PlotRequirementType {
  TEXT = 'text',
  IMAGE = 'image',
  MIXED = 'mixed'
}