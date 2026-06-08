import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { GoalDto, GoalStatusDto } from "../common/dto/goal.dto";
import { SkillDto } from "../common/dto/skill.dto";
import {
  PrismaService,
  PrismaTransactionClient,
} from "../prisma/prisma.service";
import { CreateGoalDto } from "./dto/create-goal.dto";
import { UpdateCompletionDto } from "./dto/update-completion.dto";
import { UpdateSkillsDto } from "./dto/update-skills.dto";
import {
  GoalWithSkills,
  SkillRecord,
  toGoalDto,
  toNestedSkillCreateData,
  toSkillCreateData,
  toSkillDto,
} from "./goals.mapper";

const GOAL_WITH_SKILLS = {
  include: {
    skills: {
      orderBy: { order: "asc" as const },
    },
  },
};

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async createGoal(dto: CreateGoalDto): Promise<GoalDto> {
    const goal = await this.prisma.goal.create({
      data: {
        id: dto.id,
        hobby: dto.hobby,
        goal: dto.goal,
        status: GoalStatusDto.draft,
        skills: {
          create: dto.skills.map((skill) => toNestedSkillCreateData(skill)),
        },
      },
      ...GOAL_WITH_SKILLS,
    });

    return toGoalDto(goal);
  }

  async deleteAllGoals(): Promise<{ deletedGoals: number }> {
    const result = await this.prisma.goal.deleteMany();
    return { deletedGoals: result.count };
  }

  async getActiveGoal(): Promise<GoalDto | null> {
    const goal = await this.prisma.goal.findFirst({
      where: { status: GoalStatusDto.confirmed },
      ...GOAL_WITH_SKILLS,
    });

    return goal ? toGoalDto(goal) : null;
  }

  async getGoalById(id: string): Promise<GoalDto> {
    const goal = await this.findGoalWithSkillsOrThrow(id);
    return toGoalDto(goal);
  }

  async confirmGoal(id: string): Promise<GoalDto> {
    const goal = await this.findGoalWithSkillsOrThrow(id);

    if (goal.status !== GoalStatusDto.draft) {
      throw new ConflictException("Only draft goals can be confirmed");
    }

    if (goal.skills.length === 0) {
      throw new ConflictException("Goal must have at least one skill to confirm");
    }

    const existingConfirmed = await this.prisma.goal.findFirst({
      where: {
        status: GoalStatusDto.confirmed,
        id: { not: id },
      },
    });

    if (existingConfirmed) {
      throw new ConflictException(
        "Another confirmed goal is already active"
      );
    }

    const updated = await this.prisma.goal.update({
      where: { id },
      data: { status: GoalStatusDto.confirmed },
      ...GOAL_WITH_SKILLS,
    });

    return toGoalDto(updated);
  }

  async updateSkills(id: string, dto: UpdateSkillsDto): Promise<GoalDto> {
    const goal = await this.findGoalWithSkillsOrThrow(id);

    if (goal.status !== GoalStatusDto.draft) {
      throw new ConflictException(
        "Skills can only be edited while goal is in draft"
      );
    }

    const updated = await this.prisma.$transaction(
      async (tx: PrismaTransactionClient) => {
        await tx.skill.deleteMany({ where: { goalId: id } });

        if (dto.skills.length > 0) {
          await tx.skill.createMany({
            data: dto.skills.map((skill) => toSkillCreateData(skill, id)),
          });
        }

        return tx.goal.findUniqueOrThrow({
          where: { id },
          ...GOAL_WITH_SKILLS,
        });
      }
    );

    return toGoalDto(updated);
  }

  async updateCompletion(
    goalId: string,
    skillId: string,
    dto: UpdateCompletionDto
  ): Promise<SkillDto> {
    if (
      dto.videoCompleted === undefined &&
      dto.readingCompleted === undefined &&
      dto.practiceCompleted === undefined
    ) {
      throw new ConflictException(
        "At least one completion field must be provided"
      );
    }

    const goal = await this.findGoalWithSkillsOrThrow(goalId);

    if (goal.status !== GoalStatusDto.confirmed) {
      throw new ConflictException(
        "Completion can only be updated on confirmed goals"
      );
    }

    const skill = goal.skills.find((item) => item.id === skillId);
    if (!skill) {
      throw new NotFoundException(`Skill ${skillId} not found on goal ${goalId}`);
    }

    const updatedSkill = await this.prisma.skill.update({
      where: { id: skillId },
      data: {
        ...(dto.videoCompleted !== undefined && {
          videoCompleted: dto.videoCompleted,
        }),
        ...(dto.readingCompleted !== undefined && {
          readingCompleted: dto.readingCompleted,
        }),
        ...(dto.practiceCompleted !== undefined && {
          practiceCompleted: dto.practiceCompleted,
        }),
      },
    });

    const refreshedGoal = await this.findGoalWithSkillsOrThrow(goalId);
    const allSkills = refreshedGoal.skills.map((item) =>
      item.id === skillId ? updatedSkill : item
    );

    if (this.isGoalFullyComplete(allSkills)) {
      await this.prisma.goal.update({
        where: { id: goalId },
        data: { status: GoalStatusDto.completed },
      });
    }

    return toSkillDto(updatedSkill);
  }

  private async findGoalWithSkillsOrThrow(id: string): Promise<GoalWithSkills> {
    const goal = await this.prisma.goal.findUnique({
      where: { id },
      ...GOAL_WITH_SKILLS,
    });

    if (!goal) {
      throw new NotFoundException(`Goal ${id} not found`);
    }

    return goal;
  }

  private isGoalFullyComplete(skills: SkillRecord[]): boolean {
    return (
      skills.length > 0 &&
      skills.every(
        (skill) =>
          skill.videoCompleted &&
          skill.readingCompleted &&
          skill.practiceCompleted
      )
    );
  }
}
