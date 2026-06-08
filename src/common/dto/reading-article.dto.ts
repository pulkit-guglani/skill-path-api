import { IsString, MinLength } from "class-validator";

export class ReadingArticleDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(50)
  content!: string;
}
