import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { successEnvelope } from "../common/api-envelope";
import { GoalDto } from "../common/dto/goal.dto";
import { SkillDto } from "../common/dto/skill.dto";
import { CreateGoalDto } from "./dto/create-goal.dto";
import { UpdateCompletionDto } from "./dto/update-completion.dto";
import { UpdateSkillsDto } from "./dto/update-skills.dto";
import { GoalsService } from "./goals.service";

@Controller("v1/goals")
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  async create(@Body() dto: CreateGoalDto) {
    const data: GoalDto = await this.goalsService.createGoal(dto);
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
