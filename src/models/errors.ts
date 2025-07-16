// Error handling models and types

export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  GENERATION_ERROR = 'GENERATION_ERROR',
  CONTEXT_OVERFLOW = 'CONTEXT_OVERFLOW',
  STYLE_INCONSISTENCY = 'STYLE_INCONSISTENCY',
  STORAGE_ERROR = 'STORAGE_ERROR',
  MULTIMODAL_ERROR = 'MULTIMODAL_ERROR'
}

export interface CreationError {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
  context?: string;
}

export interface ErrorResponse {
  handled: boolean;
  message: string;
  suggestedAction?: string;
  retryable: boolean;
}

export interface RecoveryResult {
  success: boolean;
  recoveredData?: any;
  fallbackUsed: boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface StyleValidationResult extends ValidationResult {
  consistencyScore: number;
  deviations: StyleDeviation[];
}

export interface StyleDeviation {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}