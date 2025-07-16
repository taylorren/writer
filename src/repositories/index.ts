// Repository interfaces for data persistence

import { Project, Chapter, WritingStyle } from '../models';
import { PlotRequirement } from '../models/multimodal';

// Base Repository Interface
export interface BaseRepository<T> {
  create(entity: T): Promise<T>;
  findById(id: string): Promise<T | null>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  findAll(): Promise<T[]>;
}

// Project Repository Interface
export interface ProjectRepository extends BaseRepository<Project> {
  findByTitle(title: string): Promise<Project[]>;
  findRecent(limit: number): Promise<Project[]>;
  updateProgress(id: string, wordCount: number): Promise<void>;
}

// Chapter Repository Interface
export interface ChapterRepository extends BaseRepository<Chapter> {
  findByProjectId(projectId: string): Promise<Chapter[]>;
  updateContent(id: string, content: string): Promise<void>;
  updateStatus(id: string, status: string): Promise<void>;
}

// Style Repository Interface
export interface StyleRepository extends BaseRepository<WritingStyle> {
  findByCategory(category: string): Promise<WritingStyle[]>;
  getDefaultStyles(): Promise<WritingStyle[]>;
}

// Plot Requirement Repository Interface
export interface PlotRequirementRepository extends BaseRepository<PlotRequirement> {
  findByChapterId(chapterId: string): Promise<PlotRequirement[]>;
  findByType(type: string): Promise<PlotRequirement[]>;
}

// Cache Repository Interface
export interface CacheRepository {
  set(key: string, value: any, ttl?: number): Promise<void>;
  get(key: string): Promise<any | null>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  exists(key: string): Promise<boolean>;
}