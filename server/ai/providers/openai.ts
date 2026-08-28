import { getOpenAIClient } from '../../config';
import { extractOpenAIText } from '../../services/ai';
import { classifyError, withTimeout } from '../retryManager';
import { AIAlignmentRequest, AIProvider, AIProviderResult } from '../types';

export class OpenAIProvider implements AIProvider {
  public name = 'openai';
  public defaultModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  private fallbackModels = ['gpt-4o-mini', 'gpt-4o'];

  public async generate(request: AIAlignmentRequest, timeoutMs: number): Promise<AIProviderResult> {
    const openai = getOpenAIClient();
    if (!openai) {
      return {
        success: false,
        provider: this.name,
        model: this.defaultModel,
        text: '',
        error: 'OPENAI_API_KEY is missing or unconfigured in environment',
        errorCode: 'AUTH_ERROR',
        errorType: 'AUTH_ERROR',
        statusCode: 401,
        retryable: false,
      };
    }

    const prohibitedOpenAIModels = [
      'gpt-5-mini'
    ];

    let startModel = this.defaultModel;
    if (prohibitedOpenAIModels.includes(startModel)) {
      startModel = 'gpt-4o-mini';
    }

    const modelsToTry = [
      startModel,
      ...this.fallbackModels.filter((m) => m !== startModel)
    ].filter((m) => !prohibitedOpenAIModels.includes(m));

    let lastErrorClassification = classifyError(new Error('No candidate OpenAI model succeeded'));
    let lastRawError: any = null;
    let lastModelUsed = startModel;

    for (const modelName of modelsToTry) {
      lastModelUsed = modelName;
      try {
        const textResult = await withTimeout(async () => {
          // If model supports input_audio (e.g., audio preview models)
          const isAudioModel = modelName.includes('audio');
          
          const userContent: any = isAudioModel
            ? [
                { type: 'text', text: request.prompt },
                {
                  type: 'input_audio',
                  input_audio: {
                    data: request.audioBase64,
                    format: request.mimeType.includes('wav') ? 'wav' : 'mp3',
                  },
                },
              ]
            : request.prompt;

          const completion = await openai.chat.completions.create({
            model: modelName,
            temperature: 0.0,
            messages: [
              { role: 'system', content: request.systemInstruction },
              { role: 'user', content: userContent },
            ],
            response_format: { type: 'json_object' },
          });

          return extractOpenAIText(completion);
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

        console.warn(`[AI] provider=openai model=${modelName} status=${lastErrorClassification.statusCode || 500} error_type=${lastErrorClassification.errorType} msg="Model failed, trying next fallback model..."`);
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
