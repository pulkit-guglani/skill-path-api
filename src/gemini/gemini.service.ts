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
      const useGoogleSearch = this.supportsGoogleSearch(model);
      this.logger.log(
        `Trying Gemini model "${model}"${useGoogleSearch ? " with Google Search" : ""}...`
      );

      const result = await this.tryGenerateJson(model, prompt, useGoogleSearch);

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

  private supportsGoogleSearch(model: string): boolean {
    return model.startsWith("gemini-");
  }

  private async tryGenerateJson(
    model: string,
    prompt: string,
    useGoogleSearch: boolean
  ): Promise<
    | { ok: true; data: unknown }
    | { ok: false; error: GeminiModelAttemptError }
  > {
    let result = await this.requestGenerateJson(model, prompt, useGoogleSearch);

    if (
      !result.ok &&
      useGoogleSearch &&
      this.isGoogleSearchUnsupported(result.error.message)
    ) {
      this.logger.warn(
        `Google Search unsupported on "${model}", retrying without search`
      );
      result = await this.requestGenerateJson(model, prompt, false);
    }

    return result;
  }

  private async requestGenerateJson(
    model: string,
    prompt: string,
    useGoogleSearch: boolean
  ): Promise<
    | { ok: true; data: unknown }
    | { ok: false; error: GeminiModelAttemptError }
  > {
    const url = `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(this.apiKey!)}`;

    const body: Record<string, unknown> = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    if (useGoogleSearch) {
      // Google Search cannot be combined with responseMimeType: application/json.
      body.tools = [{ google_search: {} }];
    } else {
      body.generationConfig = {
        responseMimeType: "application/json",
      };
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      return { ok: true, data: this.parseJsonFromText(text) };
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

  private parseJsonFromText(text: string): unknown {
    const trimmed = text.trim();

    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (fenced) {
        return JSON.parse(fenced[1].trim()) as unknown;
      }

      const objectMatch = trimmed.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        return JSON.parse(objectMatch[0]) as unknown;
      }

      throw new Error("Invalid JSON");
    }
  }

  private isGoogleSearchUnsupported(message: string): boolean {
    const lower = message.toLowerCase();
    return (
      lower.includes("google_search") ||
      lower.includes("google search") ||
      (lower.includes("tool") && lower.includes("not supported")) ||
      lower.includes("unknown tool") ||
      (lower.includes("tool use") && lower.includes("response mime type"))
    );
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
