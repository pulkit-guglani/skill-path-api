import { Injectable } from "@nestjs/common";
import { successEnvelope } from "../common/api-envelope";

export interface HealthData {
  status: "ok";
  timestamp: string;
}

@Injectable()
export class HealthService {
  getHealth() {
    return successEnvelope({
      status: "ok" as const,
      timestamp: new Date().toISOString(),
    });
  }
}
