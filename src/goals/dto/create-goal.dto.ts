import { Type } from "class-transformer";
import {
  IsArray,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { SkillDto } from "../../common/dto/skill.dto";

export class CreateGoalDto {
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  skills!: SkillDto[];
}
