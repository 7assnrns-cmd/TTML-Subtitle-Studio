import { CircuitBreaker } from './circuitBreaker';
import { GeminiProvider } from './providers/gemini';
import { OpenAIProvider } from './providers/openai';
import { calculateBackoff, classifyError } from './retryManager';
import { AIAlignmentRequest, AIProvider, RequestContext } from './types';
import { sleep } from '../utils';

export class AIRouter {
  private providers: Map<string, AIProvider> = new Map();
  private breakers: Map<string, CircuitBreaker> = new Map();

  constructor() {
    const gemini = new GeminiProvider();
    const openai = new OpenAIProvider();

    this.providers.set(gemini.name, gemini);
    this.providers.set(openai.name, openai);

    this.breakers.set(gemini.name, new CircuitBreaker(gemini.name));
    this.breakers.set(openai.name, new CircuitBreaker(openai.name));
  }

  public async executeAlignment(request: AIAlignmentRequest): Promise<string | null> {
    const primaryProviderName = (process.env.AI_PRIMARY_PROVIDER || 'gemini').toLowerCase();
    const fallbackProviderName = primaryProviderName === 'gemini' ? 'openai' : 'gemini';
    const providerOrder = [primaryProviderName, fallbackProviderName];

    const maxRetries = parseInt(process.env.AI_MAX_RETRIES || '2', 10);
    const timeoutMs = parseInt(process.env.AI_REQUEST_TIMEOUT_MS || '60000', 10);

    const context: RequestContext = {
      id: Math.random().toString(36).substring(2, 9),
      attemptedProviders: [],
      startTime: Date.now(),
    };

    for (const providerName of providerOrder) {
      // Prevent cyclic loops: ensure each provider is attempted at most once per request context
      if (context.attemptedProviders.includes(providerName)) {
        continue;
      }
      context.attemptedProviders.push(providerName);

      const provider = this.providers.get(providerName);
      const breaker = this.breakers.get(providerName);

      if (!provider || !breaker) {
        continue;
      }

      // Check Circuit Breaker availability
      if (!breaker.isAvailable()) {
        const nextProvider = providerOrder.find((p) => !context.attemptedProviders.includes(p)) || 'none';
        console.warn(
          `[AI] req_id=${context.id} provider=${providerName} model=${provider.defaultModel} status=503 error_type=circuit_open retry=false circuit=OPEN fallback=${nextProvider}`
        );
        continue;
      }

      let attempt = 0;
      let totalAttemptsAllowed = 1 + maxRetries;
      let providerSucceeded = false;
      let resultText = '';

      while (attempt < totalAttemptsAllowed && !providerSucceeded) {
        attempt++;

        const result = await provider.generate(request, timeoutMs);

        if (result.success && result.text) {
          breaker.recordSuccess();
          console.log(
            `[AI] req_id=${context.id} provider=${providerName} model=${result.model} status=200 error_type=none retry=false circuit=CLOSED fallback=none durationMs=${Date.now() - context.startTime}`
          );
          return result.text;
        }

        // Handle failure
        const classification = classifyError(result.error || result.errorCode);
        const errorType = result.errorType || classification.errorType;
        const statusCode = result.statusCode || classification.statusCode || 500;
        const shouldTrip = classification.shouldTripCircuit || errorType === 'QUOTA_EXCEEDED';
        const isRetryable = result.retryable && !shouldTrip && attempt < totalAttemptsAllowed;

        const nextFallback = !isRetryable
          ? providerOrder.find((p) => !context.attemptedProviders.includes(p)) || 'local_fallback'
          : providerName;

        console.warn(
          `[AI] req_id=${context.id} provider=${providerName} model=${result.model || provider.defaultModel} status=${statusCode} error_type=${errorType} attempt=${attempt}/${totalAttemptsAllowed} retry=${isRetryable} circuit=${breaker.getStats().state} fallback=${nextFallback}`
        );

        if (shouldTrip) {
          breaker.recordFailure(true); // Trip circuit breaker immediately on quota/billing error
          break; // Stop retrying this provider
        }

        if (!classification.retryable || errorType === 'INVALID_MODEL_OR_404' || errorType === 'AUTH_ERROR' || errorType === 'INVALID_REQUEST') {
          // Non-retryable error: record single failure but do not trip circuit unless threshold reached
          breaker.recordFailure(false);
          break; // Stop retrying this provider
        }

        if (isRetryable) {
          const backoff = calculateBackoff(attempt);
          await sleep(backoff);
        } else {
          breaker.recordFailure(false);
        }
      }
    }

    console.warn(`[AI] req_id=${context.id} message="All configured AI providers (Gemini & OpenAI) failed or were skipped by circuit breaker."`);
    return null;
  }
}

export const aiRouter = new AIRouter();
