import { Injectable } from "@nestjs/common";

export interface HealthData {
  status: "ok";
  timestamp: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

@Injectable()
export class HealthService {
  getHealth(): ApiEnvelope<HealthData> {
    return {
      success: true,
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
      },
    };
  }
}
