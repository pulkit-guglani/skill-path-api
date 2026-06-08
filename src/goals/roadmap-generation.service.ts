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
import { YoutubeService } from "../youtube/youtube.service";
import { GenerateSkillContentInputDto } from "./dto/generate-skill-content.dto";
import { MOCK_GENERATED_ROADMAP } from "./fixtures/mock-roadmap";
import { MOCK_SKILLS_OUTLINE } from "./fixtures/mock-skills-outline";
import { normalizeGeneratedRoadmap } from "./roadmap-normalizer";

const FALLBACK_VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

@Injectable()
export class RoadmapGenerationService {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly youtubeService: YoutubeService
  ) {}

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
    const searchQueries = await this.generateYoutubeSearchQueries(
      input.hobby,
      input.goal,
      input.skills
    );
    const withVideos = await this.attachYoutubeVideos(
      normalizeGeneratedRoadmap(raw),
      searchQueries
    );

    return this.validateSkillContent(withVideos, input.skills.length);
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
- videoResource: a descriptive title for the tutorial video (no URL — videos are resolved separately)
- readingResource: a self-contained in-app article (title + content body)
- practiceTask: title and description only (no URL)

Rules:
- Return exactly ${skills.length} skills in the same order as the list above.
- Use the same title for each skill as provided.
- Do not include YouTube URLs.
- readingResource.content must be original educational text (300-600 words), not a URL.
- Write readingResource.content as plain text with short sections:
  - Use "## Section Title" for section headings (2-4 sections).
  - Use "- " for bullet lists where helpful.
  - Separate paragraphs with a blank line.
  - Do not include URLs or markdown links in the article body.
- Keep whyItMatters to 1-2 concise sentences (you may refine the provided text).

Respond with JSON only, matching this exact shape:
{
  "skills": [
    {
      "title": "string",
      "whyItMatters": "string",
      "videoResource": { "title": "string" },
      "readingResource": { "title": "string", "content": "string" },
      "practiceTask": { "title": "string", "description": "string" }
    }
  ]
}`;
  }

  private async generateYoutubeSearchQueries(
    hobby: string,
    goal: string,
    skills: GenerateSkillContentInputDto["skills"]
  ): Promise<string[]> {
    const skillList = skills
      .map(
        (skill, index) =>
          `${index + 1}. ${skill.title} — ${skill.whyItMatters}`
      )
      .join("\n");

    const prompt = `You are helping the Skill Path learning app find the best YouTube tutorial for each skill.

User hobby: ${hobby}
User goal: ${goal}

Skills (keep this exact order):
${skillList}

For each skill, write one concise YouTube search query (3-8 words) that would find a high-quality beginner-friendly tutorial video.
- Combine the hobby, goal context, and skill topic naturally.
- Prefer queries like "chess opening principles tutorial" not full sentences.
- Do not include quotes, URLs, or channel names.

Respond with JSON only:
{
  "queries": ["query for skill 1", "query for skill 2"]
}`;

    const raw = await this.geminiService.generateJson(prompt);
    const queries = this.extractSearchQueries(raw, skills.length);

    return skills.map(
      (skill, index) =>
        queries[index]?.trim() ||
        `${hobby} ${skill.title} tutorial`.trim()
    );
  }

  private extractSearchQueries(raw: unknown, expectedCount: number): string[] {
    const root =
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : null;
    const queries = root?.queries;

    if (!Array.isArray(queries)) {
      throw new BadGatewayException(
        "AI returned invalid YouTube search queries"
      );
    }

    const normalized = queries
      .map((query) => (typeof query === "string" ? query.trim() : ""))
      .filter(Boolean);

    if (normalized.length !== expectedCount) {
      throw new BadGatewayException(
        `AI returned ${normalized.length} YouTube queries but ${expectedCount} were requested`
      );
    }

    return normalized;
  }

  private async attachYoutubeVideos(
    raw: unknown,
    searchQueries: string[]
  ): Promise<unknown> {
    const root =
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : null;

    if (!root || !Array.isArray(root.skills)) {
      return raw;
    }

    if (!this.youtubeService.isConfigured()) {
      throw new ServiceUnavailableException(
        "YouTube API is not configured. Set YOUTUBE_API_KEY."
      );
    }

    const videoResults = await Promise.all(
      searchQueries.map((query) => this.youtubeService.searchFirstVideo(query))
    );

    return {
      ...root,
      skills: root.skills.map((skill, index) => {
        const record =
          skill && typeof skill === "object" && !Array.isArray(skill)
            ? (skill as Record<string, unknown>)
            : null;
        if (!record) {
          return skill;
        }

        const title =
          typeof record.title === "string" ? record.title.trim() : "Skill";
        const videoRecord =
          record.videoResource &&
          typeof record.videoResource === "object" &&
          !Array.isArray(record.videoResource)
            ? (record.videoResource as Record<string, unknown>)
            : null;
        const aiVideoTitle =
          typeof videoRecord?.title === "string"
            ? videoRecord.title.trim()
            : `${title} tutorial`;
        const youtubeResult = videoResults[index];

        return {
          ...record,
          videoResource: {
            title: youtubeResult?.title ?? aiVideoTitle,
            url: youtubeResult?.url ?? FALLBACK_VIDEO_URL,
          },
        };
      }),
    };
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
            content: `## ${skill.title}\n\n${skill.whyItMatters}\n\n## Key ideas\n\n- Focus on one concept at a time.\n- Practice slowly before increasing speed.\n- Review mistakes and adjust your approach.\n\n## Next steps\n\nApply what you learned in a short practice session and note what still feels difficult.`,
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
