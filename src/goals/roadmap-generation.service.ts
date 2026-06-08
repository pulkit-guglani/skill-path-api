import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import {
  GeneratedRoadmapDto,
  GeneratedSkillsOutlineDto,
  GenerateRoadmapInputDto,
} from "../common/dto/goal.dto";
import { GeminiService } from "../gemini/gemini.service";
import { GenerateSkillContentInputDto } from "./dto/generate-skill-content.dto";
import { MOCK_GENERATED_ROADMAP } from "./fixtures/mock-roadmap";
import { MOCK_SKILLS_OUTLINE } from "./fixtures/mock-skills-outline";

@Injectable()
export class RoadmapGenerationService {
  constructor(private readonly geminiService: GeminiService) {}

  async generateSkillsOutline(
    input: GenerateRoadmapInputDto
  ): Promise<GeneratedSkillsOutlineDto> {
    if (this.isMockEnabled()) {
      return MOCK_SKILLS_OUTLINE;
    }

    if (!this.geminiService.isConfigured()) {
      throw new ServiceUnavailableException(
        "Gemini API is not configured. Set GEMINI_API_KEY or enable GEMINI_MOCK=true."
      );
    }

    const prompt = this.buildSkillsOutlinePrompt(input.hobby, input.goal);
    const raw = await this.geminiService.generateJson(prompt);
    return this.validateSkillsOutline(raw);
  }

  async generateSkillContent(
    input: GenerateSkillContentInputDto
  ): Promise<GeneratedRoadmapDto> {
    if (this.isMockEnabled()) {
      return this.filterMockContentForSkills(input.skills);
    }

    if (!this.geminiService.isConfigured()) {
      throw new ServiceUnavailableException(
        "Gemini API is not configured. Set GEMINI_API_KEY or enable GEMINI_MOCK=true."
      );
    }

    const prompt = this.buildSkillContentPrompt(
      input.hobby,
      input.goal,
      input.skills
    );
    const raw = await this.geminiService.generateJson(prompt);
    return this.validateSkillContent(raw, input.skills.length);
  }

  private isMockEnabled(): boolean {
    return process.env.GEMINI_MOCK?.toLowerCase() === "true";
  }

  private buildSkillsOutlinePrompt(hobby: string, goal: string): string {
    return `You are an expert learning coach for the Skill Path app. The app helps users learn hobbies without information overload.

Create a MINIMAL learning roadmap: only the essential skills needed to achieve the user's goal. Omit nice-to-haves, advanced topics, and tangents.

User hobby: ${hobby}
User goal: ${goal}

Rules:
- Return 3 to 8 skills (never more than 12).
- Order skills from foundational to more advanced.
- Each skill must be actionable and directly relevant to the goal.
- Keep whyItMatters to 1-2 concise sentences.
- Return titles and whyItMatters ONLY. Do not include videos, articles, or practice tasks yet.

Respond with JSON only, matching this exact shape:
{
  "skills": [
    {
      "title": "string",
      "whyItMatters": "string"
    }
  ]
}`;
  }

  private buildSkillContentPrompt(
    hobby: string,
    goal: string,
    skills: GenerateSkillContentInputDto["skills"]
  ): string {
    const skillList = skills
      .map(
        (skill, index) =>
          `${index + 1}. ${skill.title} — ${skill.whyItMatters}`
      )
      .join("\n");

    return `You are an expert learning coach for the Skill Path app. The user has approved this skill list for their learning path.

User hobby: ${hobby}
User goal: ${goal}

Approved skills (keep this exact order and count):
${skillList}

For EACH skill above, generate a complete lesson with:
- videoResource: a real YouTube URL (https://www.youtube.com/watch?v=...)
- readingResource: a real https URL to an article or guide
- practiceTask: title and description only (no URL)

Rules:
- Return exactly ${skills.length} skills in the same order as the list above.
- Use the same title for each skill as provided.
- videoResource.url must be a real YouTube watch URL.
- readingResource.url must be a real https URL.
- Use well-known, stable educational resources where possible.
- Keep whyItMatters to 1-2 concise sentences (you may refine the provided text).

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

  private async validateSkillsOutline(
    raw: unknown
  ): Promise<GeneratedSkillsOutlineDto> {
    const outline = plainToInstance(GeneratedSkillsOutlineDto, raw);
    const errors = await validate(outline, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new BadGatewayException(
        "AI returned a skills outline that failed validation"
      );
    }

    return outline;
  }

  private async validateSkillContent(
    raw: unknown,
    expectedCount: number
  ): Promise<GeneratedRoadmapDto> {
    const roadmap = plainToInstance(GeneratedRoadmapDto, raw);
    const errors = await validate(roadmap, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new BadGatewayException(
        "AI returned skill content that failed validation"
      );
    }

    if (roadmap.skills.length !== expectedCount) {
      throw new BadGatewayException(
        `AI returned ${roadmap.skills.length} skills but ${expectedCount} were requested`
      );
    }

    return roadmap;
  }

  private filterMockContentForSkills(
    skills: GenerateSkillContentInputDto["skills"]
  ): GeneratedRoadmapDto {
    const byTitle = new Map(
      MOCK_GENERATED_ROADMAP.skills.map((skill) => [skill.title, skill])
    );

    return {
      skills: skills.map((skill) => {
        const match = byTitle.get(skill.title);
        if (match) {
          return match;
        }

        return {
          title: skill.title,
          whyItMatters: skill.whyItMatters,
          videoResource: {
            title: `${skill.title} tutorial`,
            url: "https://www.youtube.com/watch?v=example1",
          },
          readingResource: {
            title: `${skill.title} guide`,
            url: "https://example.com/guide",
          },
          practiceTask: {
            title: `Practice ${skill.title.toLowerCase()}`,
            description: `Spend 20 minutes practicing ${skill.title.toLowerCase()}.`,
          },
        };
      }),
    };
  }
}
