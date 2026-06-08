import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

export class SkillOutlineInputDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  whyItMatters!: string;
}

export class GenerateSkillContentInputDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  hobby!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(200)
  goal!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => SkillOutlineInputDto)
  skills!: SkillOutlineInputDto[];
}
