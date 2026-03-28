import { YouzanClient } from "../client";
import { buildTimeParam } from "@/lib/date-utils";

export class MemberAPI {
  constructor(private client: YouzanClient) {}

  async getTrends(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/new-old-member/api/trends?",
      buildTimeParam(date)
    );
  }

  async getDetail(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/new-old-member/api/detail?",
      buildTimeParam(date)
    );
  }
}
