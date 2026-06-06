import { IsBoolean } from "class-validator";

export class SkillCompletionDto {
  @IsBoolean()
  videoCompleted!: boolean;

  @IsBoolean()
  readingCompleted!: boolean;

  @IsBoolean()
  practiceCompleted!: boolean;
}
