import { YouzanClient } from "../client";
import { buildTimeParam } from "@/lib/date-utils";

export class RepurchaseAPI {
  constructor(private client: YouzanClient) {}

  async getGeneralView(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/repurchase-retention/api/repurchase-general-view?",
      buildTimeParam(date)
    );
  }

  async getFrequencyAnalysis(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/repurchase-retention/api/repurchase-frequency-analysis?",
      buildTimeParam(date)
    );
  }

  async getCycleAnalysis(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/repurchase-retention/api/repurchase-cycle-analysis?",
      buildTimeParam(date)
    );
  }
}
