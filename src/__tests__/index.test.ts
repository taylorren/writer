// Basic tests for the core structure

import { describe, it, expect } from 'vitest';
import NovelWritingAssistant, { 
  Project, 
  Chapter, 
  WritingStyle,
  ErrorType,
  ChapterStatus 
} from '../index';

describe('Novel Writing Assistant Core', () => {
  it('should initialize the main class', () => {
    const assistant = new NovelWritingAssistant();
    expect(assistant).toBeDefined();
    expect(assistant.isInitialized()).toBe(false);
  });

  it('should initialize successfully', async () => {
    const assistant = new NovelWritingAssistant();
    await assistant.initialize();
    expect(assistant.isInitialized()).toBe(true);
  });

  it('should export core types correctly', () => {
    // Test that enums are properly exported
    expect(ErrorType.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ChapterStatus.NOT_STARTED).toBe('not_started');
  });

  it('should have proper type definitions', () => {
    // Test that interfaces can be used for type checking
    const mockProject: Partial<Project> = {
      id: 'test-id',
      coreIdea: 'Test core idea',
      currentWordCount: 0,
      targetWordCount: 1000000
    };

    expect(mockProject.id).toBe('test-id');
    expect(mockProject.targetWordCount).toBe(1000000);
  });
});