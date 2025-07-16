// Main entry point for the Novel Writing Assistant

// Export all models
export * from './models';
export * from './models/multimodal';
export * from './models/generation';
export * from './models/errors';

// Export all service interfaces
export * from './services';

// Export all repository interfaces
export * from './repositories';

// Export all API interfaces
export * from './api';

// Main application class
export class NovelWritingAssistant {
  private initialized: boolean = false;

  constructor() {
    console.log('Novel Writing Assistant initialized');
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Initialize core components
    console.log('Initializing Novel Writing Assistant...');
    
    // TODO: Initialize services, repositories, and other components
    // This will be implemented in subsequent tasks
    
    this.initialized = true;
    console.log('Novel Writing Assistant ready');
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

// Default export
export default NovelWritingAssistant;