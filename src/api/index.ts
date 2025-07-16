// API interfaces and types for external communication

import { Project, Chapter } from '../models';
import { PlotRequirement } from '../models/multimodal';
import { ValidationResult } from '../models/errors';

// API Request/Response Types
export interface CreateProjectRequest {
  coreIdea: string;
  title?: string;
  targetWordCount?: number;
}

export interface CreateProjectResponse {
  project: Project;
  success: boolean;
  message: string;
}

export interface GenerateOutlineRequest {
  projectId: string;
  coreIdea: string;
}

export interface GenerateOutlineResponse {
  outline: any;
  success: boolean;
  message: string;
}

export interface SelectStyleRequest {
  projectId: string;
  styleId: string;
}

export interface SelectStyleResponse {
  success: boolean;
  message: string;
}

export interface GenerateChapterRequest {
  projectId: string;
  chapterId: string;
  requirements?: PlotRequirement[];
}

export interface GenerateChapterResponse {
  chapter: Chapter;
  success: boolean;
  message: string;
}

export interface AddPlotRequirementRequest {
  projectId: string;
  chapterId?: string;
  requirement: Omit<PlotRequirement, 'id'>;
}

export interface AddPlotRequirementResponse {
  requirement: PlotRequirement;
  success: boolean;
  message: string;
}

export interface UploadImageRequest {
  projectId: string;
  image: File;
  description?: string;
  chapterHint?: string;
}

export interface UploadImageResponse {
  requirement: PlotRequirement;
  success: boolean;
  message: string;
}

export interface GetProjectStatusRequest {
  projectId: string;
}

export interface GetProjectStatusResponse {
  project: Project;
  progress: {
    currentWordCount: number;
    targetWordCount: number;
    completedChapters: number;
    totalChapters: number;
    percentComplete: number;
  };
  success: boolean;
  message: string;
}

export interface ValidateInputRequest {
  input: string;
  type: 'coreIdea' | 'plotRequirement' | 'chapterContent';
}

export interface ValidateInputResponse {
  validation: ValidationResult;
  success: boolean;
  message: string;
}

// API Controller Interface
export interface NovelWritingAPI {
  createProject(request: CreateProjectRequest): Promise<CreateProjectResponse>;
  generateOutline(request: GenerateOutlineRequest): Promise<GenerateOutlineResponse>;
  selectStyle(request: SelectStyleRequest): Promise<SelectStyleResponse>;
  generateChapter(request: GenerateChapterRequest): Promise<GenerateChapterResponse>;
  addPlotRequirement(request: AddPlotRequirementRequest): Promise<AddPlotRequirementResponse>;
  uploadImage(request: UploadImageRequest): Promise<UploadImageResponse>;
  getProjectStatus(request: GetProjectStatusRequest): Promise<GetProjectStatusResponse>;
  validateInput(request: ValidateInputRequest): Promise<ValidateInputResponse>;
}