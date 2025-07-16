// Repository layer exports

// Export implementations
export * from './base';
export * from './project';
export * from './errors';

// Legacy interfaces (kept for compatibility)
import { Project, Chapter, WritingStyle } from '../models';
import { PlotRequirement } from '../models/multimodal';

// Base Repository Interface
export interface IBaseRepository<T> {
  create(entity: T): Promise<T>;
  findById(id: string): Promise<T | null>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  findAll(): Promise<T[]>;
}

// Project Repository Interface
export interface IProjectRepository extends IBaseRepository<Project> {
  findByTitle(title: string): Promise<Project[]>;
  findRecent(limit: number): Promise<Project[]>;
  updateProgress(id: string, wordCount: number): Promise<void>;
}

// Chapter Repository Interface
export interface IChapterRepository extends IBaseRepository<Chapter> {
  findByProjectId(projectId: string): Promise<Chapter[]>;
  updateContent(id: string, content: string): Promise<void>;
  updateStatus(id: string, status: string): Promise<void>;
}

// Style Repository Interface
export interface IStyleRepository extends IBaseRepository<WritingStyle> {
  findByCategory(category: string): Promise<WritingStyle[]>;
  getDefaultStyles(): Promise<WritingStyle[]>;
}

// Plot Requirement Repository Interface
export interface IPlotRequirementRepository extends IBaseRepository<PlotRequirement> {
  findByChapterId(chapterId: string): Promise<PlotRequirement[]>;
  findByType(type: string): Promise<PlotRequirement[]>;
}

// Cache Repository Interface
export interface ICacheRepository {
  set(key: string, value: any, ttl?: number): Promise<void>;
  get(key: string): Promise<any | null>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  exists(key: string): Promise<boolean>;
}