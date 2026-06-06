import { IsBoolean, IsOptional } from "class-validator";

export class UpdateCompletionDto {
  @IsOptional()
  @IsBoolean()
  videoCompleted?: boolean;

  @IsOptional()
  @IsBoolean()
  readingCompleted?: boolean;

  @IsOptional()
  @IsBoolean()
  practiceCompleted?: boolean;
}
