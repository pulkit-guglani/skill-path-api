import { Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";
import { SkillDto } from "../../common/dto/skill.dto";

export class UpdateSkillsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  skills!: SkillDto[];
}
