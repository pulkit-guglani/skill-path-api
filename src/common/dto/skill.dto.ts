import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { LinkResourceDto } from "./link-resource.dto";
import { PracticeTaskDto } from "./practice-task.dto";
import { ReadingArticleDto } from "./reading-article.dto";
import { SkillCompletionDto } from "./skill-completion.dto";

export enum SkillSourceDto {
  ai = "ai",
  custom = "custom",
}

export class SkillDto {
  @IsUUID()
  id!: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsInt()
  @Min(0)
  order!: number;

  @IsEnum(SkillSourceDto)
  source!: SkillSourceDto;

  @IsString()
  @MinLength(1)
  whyItMatters!: string;

  @ValidateNested()
  @Type(() => LinkResourceDto)
  videoResource!: LinkResourceDto;

  @ValidateNested()
  @Type(() => ReadingArticleDto)
  readingResource!: ReadingArticleDto;

  @ValidateNested()
  @Type(() => PracticeTaskDto)
  practiceTask!: PracticeTaskDto;

  @ValidateNested()
  @Type(() => SkillCompletionDto)
  completion!: SkillCompletionDto;
}

export class GeneratedSkillDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  whyItMatters!: string;

  @ValidateNested()
  @Type(() => LinkResourceDto)
  videoResource!: LinkResourceDto;

  @ValidateNested()
  @Type(() => ReadingArticleDto)
  readingResource!: ReadingArticleDto;

  @ValidateNested()
  @Type(() => PracticeTaskDto)
  practiceTask!: PracticeTaskDto;
}
