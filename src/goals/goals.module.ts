import { Module } from "@nestjs/common";
import { GeminiModule } from "../gemini/gemini.module";
import { GoalsController } from "./goals.controller";
import { GoalsService } from "./goals.service";
import { RoadmapGenerationService } from "./roadmap-generation.service";

@Module({
  imports: [GeminiModule],
  controllers: [GoalsController],
  providers: [GoalsService, RoadmapGenerationService],
})
export class GoalsModule {}
