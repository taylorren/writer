// Core service interfaces

import { 
  Project, 
  Outline, 
  Chapter, 
  WritingStyle,
  OutlineSection,
  LocalizationConfig 
} from '../models';
import { 
  GenerationContext,
  CreationStep,
  StepResult,
  CreationState,
  KeyInformation 
} from '../models/generation';
import { 
  ImageInput, 
  ImageAnalysisResult, 
  PlotRequirement 
} from '../models/multimodal';
import { 
  ValidationResult, 
  StyleValidationResult,
  CreationError,
  ErrorResponse,
  RecoveryResult 
} from '../models/errors';

// Creation Flow Manager Interface
export interface CreationFlowManager {
  initializeProject(coreIdea: string): Promise<Project>;
  executeStep(step: CreationStep): Promise<StepResult>;
  getCurrentState(): CreationState;
  saveProgress(): Promise<void>;
}

// Outline Generator Interface
export interface OutlineGenerator {
  generateOutline(coreIdea: string): Promise<Outline>;
  expandOutlineSection(section: OutlineSection): Promise<OutlineSection>;
  validateOutline(outline: Outline): ValidationResult;
}

// Style Controller Interface
export interface StyleController {
  getAvailableStyles(): WritingStyle[];
  applyStyle(style: WritingStyle): void;
  validateStyleConsistency(text: string): StyleValidationResult;
}

// Chapter Manager Interface
export interface ChapterManager {
  divideIntoChapters(outline: Outline): Chapter[];
  adjustChapterStructure(chapters: Chapter[]): Chapter[];
  validateChapterLength(chapter: Chapter): boolean;
}

// Text Generator Interface
export interface TextGenerator {
  generateChapterContent(chapter: Chapter, context: GenerationContext): Promise<string>;
  continueText(existingText: string, requirements: string[]): Promise<string>;
  refineText(text: string): Promise<string>;
  generateWithLocalization(prompt: string, localization: LocalizationConfig): Promise<string>;
}

// Context Manager Interface
export interface ContextManager {
  compressHistory(content: string[]): string;
  extractKeyInformation(text: string): KeyInformation;
  manageContextWindow(currentContext: string, newContent: string): string;
}

// Multimodal Processor Interface
export interface MultimodalProcessor {
  processImageInput(image: ImageInput): Promise<ImageAnalysisResult>;
  convertImageToPlotRequirement(analysis: ImageAnalysisResult): PlotRequirement;
  processMixedInput(textInput: string, imageInputs: ImageInput[]): Promise<PlotRequirement>;
  validateImageContent(image: ImageInput): ValidationResult;
}

// Error Handler Interface
export interface ErrorHandler {
  handleError(error: CreationError): ErrorResponse;
  recoverFromError(error: CreationError): Promise<RecoveryResult>;
}