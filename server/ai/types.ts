export interface AIAlignmentRequest {
  audioBase64: string;
  mimeType: string;
  prompt: string;
  systemInstruction: string;
  contextHint?: string;
  languageMode?: string;
  selectedLanguage?: string;
  lyricsText?: string;
}

export interface AIProviderResult {
  success: boolean;
  provider: string;
  model: string;
  text: string;
  error?: string;
  errorCode?: string;
  errorType?: ErrorType;
  statusCode?: number;
  retryable?: boolean;
}

export type ErrorType =
  | 'INVALID_MODEL_OR_404'
  | 'INVALID_REQUEST'
  | 'AUTH_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'RATE_LIMIT'
  | 'SERVER_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN';

export interface ErrorClassification {
  errorType: ErrorType;
  statusCode?: number;
  retryable: boolean;
  shouldTripCircuit: boolean;
  message: string;
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  lastStateChange: number;
}

export interface RequestContext {
  id: string;
  attemptedProviders: string[];
  startTime: number;
}

export interface AIProvider {
  name: string;
  defaultModel: string;
  generate(request: AIAlignmentRequest, timeoutMs: number): Promise<AIProviderResult>;
}
