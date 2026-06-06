import { IsString, IsUrl, MinLength } from "class-validator";

export class LinkResourceDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsUrl()
  url!: string;
}
