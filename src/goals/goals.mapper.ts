import { GoalDto, GoalStatusDto } from "../common/dto/goal.dto";
import { SkillDto, SkillSourceDto } from "../common/dto/skill.dto";

type GoalStatusValue = `${GoalStatusDto}`;
type SkillSourceValue = `${SkillSourceDto}`;

/** Mirrors Prisma Skill rows — avoids importing generated @prisma/client types. */
export interface SkillRecord {
  id: string;
  goalId: string;
  title: string;
  order: number;
  source: SkillSourceValue;
  whyItMatters: string;
  videoTitle: string;
  videoUrl: string;
  readingTitle: string;
  readingUrl: string;
  practiceTitle: string;
  practiceDescription: string;
  videoCompleted: boolean;
  readingCompleted: boolean;
  practiceCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalRecord {
  id: string;
  hobby: string;
  goal: string;
  status: GoalStatusValue;
  createdAt: Date;
  updatedAt: Date;
}

export type GoalWithSkills = GoalRecord & { skills: SkillRecord[] };

const EMPTY_COMPLETION = {
  videoCompleted: false,
  readingCompleted: false,
  practiceCompleted: false,
};

export function toSkillDto(skill: SkillRecord): SkillDto {
  return {
    id: skill.id,
    title: skill.title,
    order: skill.order,
    source: skill.source as SkillSourceDto,
    whyItMatters: skill.whyItMatters,
    videoResource: {
      title: skill.videoTitle,
      url: skill.videoUrl,
    },
    readingResource: {
      title: skill.readingTitle,
      url: skill.readingUrl,
    },
    practiceTask: {
      title: skill.practiceTitle,
      description: skill.practiceDescription,
    },
    completion: {
      videoCompleted: skill.videoCompleted,
      readingCompleted: skill.readingCompleted,
      practiceCompleted: skill.practiceCompleted,
    },
  };
}

export function toGoalDto(goal: GoalWithSkills): GoalDto {
  return {
    id: goal.id,
    hobby: goal.hobby,
    goal: goal.goal,
    status: goal.status as GoalStatusDto,
    skills: goal.skills
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(toSkillDto),
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  };
}

function toSkillFields(skill: SkillDto) {
  return {
    id: skill.id,
    title: skill.title,
    order: skill.order,
    source: skill.source,
    whyItMatters: skill.whyItMatters,
    videoTitle: skill.videoResource.title,
    videoUrl: skill.videoResource.url,
    readingTitle: skill.readingResource.title,
    readingUrl: skill.readingResource.url,
    practiceTitle: skill.practiceTask.title,
    practiceDescription: skill.practiceTask.description,
    ...EMPTY_COMPLETION,
  };
}

export function toSkillCreateData(skill: SkillDto, goalId: string) {
  return {
    ...toSkillFields(skill),
    goalId,
  };
}

export function toNestedSkillCreateData(skill: SkillDto) {
  return toSkillFields(skill);
}
