// Core data models for the novel writing assistant

export interface Project {
  id: string;
  coreIdea: string;
  outline: Outline;
  style: WritingStyle;
  chapters: Chapter[];
  currentWordCount: number;
  targetWordCount: number;
  language: Language;
  createdAt: Date;
  updatedAt: Date;
}

export interface Outline {
  mainTheme: string;
  characters: Character[];
  worldSetting: WorldSetting;
  plotStructure: PlotStructure;
  conflicts: Conflict[];
}

export interface Character {
  id: string;
  name: string;
  description: string;
  personality: string[];
  background: string;
  relationships: Relationship[];
  developmentArc: string;
}

export interface Relationship {
  characterId: string;
  type: RelationshipType;
  description: string;
}

export enum RelationshipType {
  FAMILY = 'family',
  FRIEND = 'friend',
  ENEMY = 'enemy',
  ROMANTIC = 'romantic',
  MENTOR = 'mentor',
  COLLEAGUE = 'colleague'
}

export interface WorldSetting {
  timeperiod: string;
  location: string;
  socialContext: string;
  rules: string[];
  atmosphere: string;
}

export interface PlotStructure {
  exposition: string;
  risingAction: PlotPoint[];
  climax: string;
  fallingAction: PlotPoint[];
  resolution: string;
}

export interface PlotPoint {
  id: string;
  description: string;
  chapterHint?: string;
  importance: number;
}

export interface Conflict {
  type: ConflictType;
  description: string;
  participants: string[];
  resolution: string;
}

export enum ConflictType {
  INTERNAL = 'internal',
  INTERPERSONAL = 'interpersonal',
  SOCIETAL = 'societal',
  ENVIRONMENTAL = 'environmental'
}

export interface Chapter {
  id: string;
  title: string;
  summary: string;
  keyPlotPoints: PlotPoint[];
  requiredElements: string[];
  estimatedWordCount: number;
  actualWordCount: number;
  content: string;
  status: ChapterStatus;
}

export enum ChapterStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REVIEWED = 'reviewed'
}

export interface WritingStyle {
  id: string;
  name: string;
  description: string;
  characteristics: StyleCharacteristics;
  examples: string[];
}

export interface StyleCharacteristics {
  tone: string;
  pacing: string;
  vocabulary: string;
  sentenceStructure: string;
  narrativeVoice: string;
}

export interface OutlineSection {
  id: string;
  title: string;
  content: string;
  subsections?: OutlineSection[];
}

export enum Language {
  CHINESE = 'zh-CN',
  ENGLISH = 'en-US',
  JAPANESE = 'ja-JP',
  KOREAN = 'ko-KR'
}

export interface LocalizationConfig {
  language: Language;
  culturalContext: string[];
  writingConventions: string[];
  characterNamingRules: string[];
}