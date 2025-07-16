// Models for text generation and context management

export interface GenerationContext {
  previousChapters: Chapter[];
  characterStates: CharacterState[];
  worldState: WorldState;
  style: WritingStyle;
  constraints: GenerationConstraints;
  localization: LocalizationConfig;
}

export interface CharacterState {
  characterId: string;
  currentLocation: string;
  emotionalState: string;
  relationships: Record<string, string>;
  developmentStage: string;
}

export interface WorldState {
  currentTime: string;
  activeLocations: string[];
  ongoingEvents: string[];
  establishedRules: string[];
}

export interface GenerationConstraints {
  maxWordCount: number;
  minWordCount: number;
  requiredElements: string[];
  forbiddenElements: string[];
  styleRequirements: string[];
}

export interface KeyInformation {
  characters: string[];
  plotPoints: string[];
  worldDetails: string[];
  relationships: string[];
  conflicts: string[];
}

export interface CreationStep {
  id: string;
  name: string;
  description: string;
  dependencies: string[];
  status: StepStatus;
}

export enum StepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface StepResult {
  stepId: string;
  success: boolean;
  data?: any;
  error?: string;
}

export interface CreationState {
  currentStep: string;
  completedSteps: string[];
  project: Project;
  progress: number;
}

// Import Chapter and WritingStyle from main models
import { Chapter, WritingStyle, Project, LocalizationConfig } from './index';