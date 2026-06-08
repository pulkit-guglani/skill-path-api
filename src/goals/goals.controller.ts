import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { successEnvelope } from "../common/api-envelope";
import {
  GeneratedRoadmapDto,
  GeneratedSkillsOutlineDto,
  GenerateRoadmapInputDto,
  GoalDto,
} from "../common/dto/goal.dto";
import { SkillDto } from "../common/dto/skill.dto";
import { CreateGoalDto } from "./dto/create-goal.dto";
import { GenerateSkillContentInputDto } from "./dto/generate-skill-content.dto";
import { UpdateCompletionDto } from "./dto/update-completion.dto";
import { UpdateSkillsDto } from "./dto/update-skills.dto";
import { GoalsService } from "./goals.service";
import { RoadmapGenerationService } from "./roadmap-generation.service";

@Controller("v1/goals")
export class GoalsController {
  constructor(
    private readonly goalsService: GoalsService,
    private readonly roadmapGenerationService: RoadmapGenerationService
  ) {}

  @Post("generate-skills")
  async generateSkills(@Body() dto: GenerateRoadmapInputDto) {
    const data: GeneratedSkillsOutlineDto =
      await this.roadmapGenerationService.generateSkillsOutline(dto);
    return successEnvelope(data);
  }

  @Post("generate-skill-content")
  async generateSkillContent(@Body() dto: GenerateSkillContentInputDto) {
    const data: GeneratedRoadmapDto =
      await this.roadmapGenerationService.generateSkillContent(dto);
    return successEnvelope(data);
  }

  @Post()
  async create(@Body() dto: CreateGoalDto) {
    const data: GoalDto = await this.goalsService.createGoal(dto);
    return successEnvelope(data);
  }

  @Delete()
  async deleteAll() {
    const data = await this.goalsService.deleteAllGoals();
    return successEnvelope(data);
  }

  @Get("active")
  async getActive() {
    const data: GoalDto | null = await this.goalsService.getActiveGoal();
    return successEnvelope(data);
  }

  @Get(":id")
  async getById(@Param("id", ParseUUIDPipe) id: string) {
    const data: GoalDto = await this.goalsService.getGoalById(id);
    return successEnvelope(data);
  }

  @Patch(":id/confirm")
  async confirm(@Param("id", ParseUUIDPipe) id: string) {
    const data: GoalDto = await this.goalsService.confirmGoal(id);
    return successEnvelope(data);
  }

  @Patch(":id/skills")
  async updateSkills(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateSkillsDto
  ) {
    const data: GoalDto = await this.goalsService.updateSkills(id, dto);
    return successEnvelope(data);
  }

  @Patch(":goalId/skills/:skillId/completion")
  async updateCompletion(
    @Param("goalId", ParseUUIDPipe) goalId: string,
    @Param("skillId", ParseUUIDPipe) skillId: string,
    @Body() dto: UpdateCompletionDto
  ) {
    const data: SkillDto = await this.goalsService.updateCompletion(
      goalId,
      skillId,
      dto
    );
    return successEnvelope(data);
  }
}
