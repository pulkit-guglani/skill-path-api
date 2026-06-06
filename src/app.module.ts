import { Module } from "@nestjs/common";
import { GoalsModule } from "./goals/goals.module";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [PrismaModule, HealthModule, GoalsModule],
})
export class AppModule {}
