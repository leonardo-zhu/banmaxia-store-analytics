import { YouzanClient } from "../client";
import { buildTimeParam } from "@/lib/date-utils";

export class AcquisitionAPI {
  constructor(private client: YouzanClient) {}

  async getOverview(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/customer-acquisition/api/overview?",
      buildTimeParam(date)
    );
  }

  async getTrendAnalysis(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/customer-acquisition/api/trend-analysis?",
      buildTimeParam(date)
    );
  }

  async getChannelAndWayAnalysis(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/customer-acquisition/api/channel-and-way-analysis?",
      buildTimeParam(date)
    );
  }

  async getChannelAndWayTrend(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/customer-acquisition/api/channel-and-way-trend?",
      buildTimeParam(date)
    );
  }
}
