import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsISO8601,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { GeneratedSkillDto, SkillDto } from "./skill.dto";

export enum GoalStatusDto {
  draft = "draft",
  confirmed = "confirmed",
  completed = "completed",
}

export class GoalDto {
  @IsUUID()
  id!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  hobby!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(200)
  goal!: string;

  @IsEnum(GoalStatusDto)
  status!: GoalStatusDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  skills!: SkillDto[];

  @IsISO8601()
  createdAt!: string;

  @IsISO8601()
  updatedAt!: string;
}

export class CreateGoalInputDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  hobby!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(200)
  goal!: string;
}

export class GeneratedRoadmapDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => GeneratedSkillDto)
  skills!: GeneratedSkillDto[];
}

export class GenerateRoadmapInputDto extends CreateGoalInputDto {}
