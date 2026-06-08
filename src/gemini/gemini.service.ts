import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";

const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Strict roadmap model priority — fixed order, no env overrides.
 * 1. Gemini 3 Flash
 * 2. Gemini 2.5 Flash
 * 3. Gemini 3.5 Flash
 * 4. Gemini 3.1 Flash Lite
 * 5. Gemma 4 31B
 */
export const ROADMAP_MODEL_CHAIN = [
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemma-4-31b-it",
] as const;

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

interface GeminiModelAttemptError {
  model: string;
  status: number;
  message: string;
  retryable: boolean;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string | null;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY?.trim() || null;
  }

  isConfigured(): boolean {
    return this.apiKey !== null;
  }

  async generateJson(prompt: string): Promise<unknown> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException(
        "Gemini API is not configured. Set GEMINI_API_KEY or enable GEMINI_MOCK=true."
      );
    }

    const errors: GeminiModelAttemptError[] = [];

    for (const model of ROADMAP_MODEL_CHAIN) {
      this.logger.log(`Trying Gemini model "${model}"...`);
      const result = await this.requestGenerateJson(model, prompt);

      if (result.ok) {
        if (errors.length > 0) {
          this.logger.warn(
            `Gemini succeeded with "${model}" after ${errors.length} failed attempt(s)`
          );
        }
        return result.data;
      }

      errors.push(result.error);
      this.logger.warn(
        `Gemini model "${model}" failed (${result.error.status}): ${result.error.message}`
      );

      if (!result.error.retryable) {
        break;
      }
    }

    const summary = errors
      .map((entry) => `${entry.model}: ${entry.message}`)
      .join(" | ");

    throw new BadGatewayException(
      summary ? `All Gemini models failed. ${summary}` : "Gemini request failed"
    );
  }

  private async requestGenerateJson(
    model: string,
    prompt: string
  ): Promise<
    | { ok: true; data: unknown }
    | { ok: false; error: GeminiModelAttemptError }
  > {
    const url = `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(this.apiKey!)}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      });
    } catch {
      return {
        ok: false,
        error: {
          model,
          status: 0,
          message: "Network request failed",
          retryable: true,
        },
      };
    }

    let responseBody: GeminiGenerateContentResponse;
    try {
      responseBody = (await response.json()) as GeminiGenerateContentResponse;
    } catch {
      return {
        ok: false,
        error: {
          model,
          status: response.status,
          message: "Invalid response body",
          retryable: true,
        },
      };
    }

    if (!response.ok) {
      const message =
        responseBody.error?.message?.trim() || `HTTP ${response.status}`;
      return {
        ok: false,
        error: {
          model,
          status: response.status,
          message,
          retryable: this.isRetryableError(response.status, message),
        },
      };
    }

    const text = responseBody.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text?.trim()) {
      return {
        ok: false,
        error: {
          model,
          status: response.status,
          message: "Empty response",
          retryable: true,
        },
      };
    }

    try {
      return { ok: true, data: JSON.parse(text) as unknown };
    } catch {
      return {
        ok: false,
        error: {
          model,
          status: response.status,
          message: "Invalid JSON in response",
          retryable: true,
        },
      };
    }
  }

  private isRetryableError(status: number, message: string): boolean {
    if (status === 429 || status === 503) {
      return true;
    }

    const lower = message.toLowerCase();
    return (
      lower.includes("quota") ||
      lower.includes("rate limit") ||
      lower.includes("rate-limit") ||
      lower.includes("resource_exhausted") ||
      lower.includes("high demand") ||
      lower.includes("overloaded") ||
      lower.includes("try again later")
    );
  }
}
