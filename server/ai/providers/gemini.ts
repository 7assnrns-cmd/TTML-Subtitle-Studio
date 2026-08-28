import { GoogleGenAI } from '@google/genai';
import { getGeminiClient } from '../../config';
import { extractGeminiText, responseSchema } from '../../services/ai';
import { classifyError, withTimeout } from '../retryManager';
import { AIAlignmentRequest, AIProvider, AIProviderResult } from '../types';

export class GeminiProvider implements AIProvider {
  public name = 'gemini';
  public defaultModel = process.env.GEMINI_MODEL || 'gemini-3.5-transcribe';
  private fallbackModels = ['gemini-3.5-transcribe', 'gemini-3.7-flash', 'gemini-3.1-flash-lite'];

  public async generate(request: AIAlignmentRequest, timeoutMs: number): Promise<AIProviderResult> {
    let ai: GoogleGenAI;
    try {
      ai = getGeminiClient();
    } catch (err: any) {
      const classification = classifyError(err);
      return {
        success: false,
        provider: this.name,
        model: this.defaultModel,
        text: '',
        error: err.message || 'Gemini client initialization failed',
        errorCode: classification.errorType,
        errorType: classification.errorType,
        statusCode: classification.statusCode || 401,
        retryable: false,
      };
    }

    const prohibitedModels = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-2.0-flash',
      'gemini-2.0-pro',
      'gemini-2.0-flash-thinking',
      'gemini-2.5-flash',
      'gemini-3.5-flash',
      'gemini-3.6-flash'
    ];

    let startModel = this.defaultModel;
    if (prohibitedModels.includes(startModel)) {
      startModel = 'gemini-3.5-transcribe';
    }

    const modelsToTry = [
      startModel,
      ...this.fallbackModels.filter((m) => m !== startModel)
    ].filter((m) => !prohibitedModels.includes(m));

    let lastErrorClassification = classifyError(new Error('No candidate Gemini model succeeded'));
    let lastRawError: any = null;
    let lastModelUsed = startModel;

    for (const modelName of modelsToTry) {
      lastModelUsed = modelName;
      try {
        const textResult = await withTimeout(async (signal) => {
          const configObj: any = {
            maxOutputTokens: 8192,
            temperature: 0.0,
            systemInstruction: request.systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
          };

          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                inlineData: {
                  data: request.audioBase64,
                  mimeType: request.mimeType,
                },
              },
              {
                text: request.prompt,
              },
            ],
            config: configObj,
          });

          return extractGeminiText(response);
        }, timeoutMs);

        if (textResult) {
          return {
            success: true,
            provider: this.name,
            model: modelName,
            text: textResult,
          };
        }
      } catch (err: any) {
        lastRawError = err;
        lastErrorClassification = classifyError(err);

        console.warn(`[AI] provider=gemini model=${modelName} status=${lastErrorClassification.statusCode || 500} error_type=${lastErrorClassification.errorType} msg="Model failed, trying next fallback model..."`);
        continue;
      }
    }

    return {
      success: false,
      provider: this.name,
      model: lastModelUsed,
      text: '',
      error: lastRawError?.message || lastErrorClassification.message,
      errorCode: lastErrorClassification.errorType,
      errorType: lastErrorClassification.errorType,
      statusCode: lastErrorClassification.statusCode,
      retryable: lastErrorClassification.retryable,
    };
  }
}
