import { YouzanClient } from "../client";
import type { YouzanResponse } from "../types";
import { buildTimeParam, buildTimeRangeParam } from "@/lib/date-utils";

export class IncomeAPI {
  constructor(private client: YouzanClient) {}

  async getIncomeOverview(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/income-analyse/api/getIncomeOverview?",
      buildTimeParam(date)
    );
  }

  async fetchCustomerPie(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/income-analyse/api/fetchCustomerPie?",
      buildTimeParam(date)
    );
  }

  async fetchMemberPie(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/income-analyse/api/fetchMemberPie?",
      buildTimeParam(date)
    );
  }

  async getIncomeTrend(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/income-analyse/api/getIncomeTrend?",
      buildTimeParam(date)
    );
  }

  async getIncomeTrendRange(startDate: string, endDate: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/income-analyse/api/getIncomeTrend?",
      buildTimeRangeParam(startDate, endDate)
    );
  }

  async getAllChannelIncomeDetail(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/income-analyse/api/getAllChannelIncomeDetail?",
      buildTimeParam(date)
    );
  }

  async getMemberChannelIncomeDetail(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/income-analyse/api/getMemberChannelIncomeDetail?",
      { ...buildTimeParam(date), pageNumber: 1, pageSize: 10, statisticMethod: 1 }
    );
  }

  async getMemberIncomeTree(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/income-analyse/api/getMemberIncomeTree?",
      buildTimeParam(date)
    );
  }
}
