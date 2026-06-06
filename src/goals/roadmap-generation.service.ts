import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import {
  GeneratedRoadmapDto,
  GenerateRoadmapInputDto,
} from "../common/dto/goal.dto";
import { GeminiService } from "../gemini/gemini.service";
import { MOCK_GENERATED_ROADMAP } from "./fixtures/mock-roadmap";

@Injectable()
export class RoadmapGenerationService {
  constructor(private readonly geminiService: GeminiService) {}

  async generateRoadmap(
    input: GenerateRoadmapInputDto
  ): Promise<GeneratedRoadmapDto> {
    if (this.isMockEnabled()) {
      return MOCK_GENERATED_ROADMAP;
    }

    if (!this.geminiService.isConfigured()) {
      throw new ServiceUnavailableException(
        "Gemini API is not configured. Set GEMINI_API_KEY or enable GEMINI_MOCK=true."
      );
    }

    const prompt = this.buildPrompt(input.hobby, input.goal);
    const raw = await this.geminiService.generateJson(prompt);
    return this.validateRoadmap(raw);
  }

  private isMockEnabled(): boolean {
    return process.env.GEMINI_MOCK?.toLowerCase() === "true";
  }

  private buildPrompt(hobby: string, goal: string): string {
    return `You are an expert learning coach for the Skill Path app. The app helps users learn hobbies without information overload.

Create a MINIMAL learning roadmap: only the essential skills needed to achieve the user's goal. Omit nice-to-haves, advanced topics, and tangents.

User hobby: ${hobby}
User goal: ${goal}

Rules:
- Return 3 to 8 skills (never more than 12).
- Order skills from foundational to more advanced.
- Each skill must be actionable and directly relevant to the goal.
- Use Google Search to find currently available, high-quality learning resources.
- videoResource.url MUST be a YouTube URL you found via search and verified is relevant.
- readingResource.url MUST be a real https article/guide URL you found via search.
- Do NOT invent or guess URLs. Only include URLs from your search results.
- practiceTask has title and description only (no URL).
- Keep whyItMatters to 1-2 concise sentences.

Respond with JSON only, matching this exact shape:
{
  "skills": [
    {
      "title": "string",
      "whyItMatters": "string",
      "videoResource": { "title": "string", "url": "https://..." },
      "readingResource": { "title": "string", "url": "https://..." },
      "practiceTask": { "title": "string", "description": "string" }
    }
  ]
}`;
  }

  private async validateRoadmap(raw: unknown): Promise<GeneratedRoadmapDto> {
    const roadmap = plainToInstance(GeneratedRoadmapDto, raw);
    const errors = await validate(roadmap, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new BadGatewayException(
        "AI returned a roadmap that failed validation"
      );
    }

    return roadmap;
  }
}
