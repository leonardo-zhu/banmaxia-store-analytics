import { YouzanClient } from "../client";
import { buildTimeParam } from "@/lib/date-utils";

export class PersonaAPI {
  constructor(private client: YouzanClient) {}

  private async postPersona(endpoint: string, date: string) {
    return this.client.post<unknown>(
      `/crm/statcenter/holistic-persona/api/basic/${endpoint}?`,
      buildTimeParam(date)
    );
  }

  async getCustomerStatistic(date: string) {
    return this.postPersona("customer-statistic", date);
  }

  async getGenderDistribute(date: string) {
    return this.postPersona("gender-distribute", date);
  }

  async getAgeDistribute(date: string) {
    return this.postPersona("age-distribute", date);
  }

  async getRegionDistribute(date: string) {
    return this.postPersona("region-distribute", date);
  }

  async getVisitDepthDistribute(date: string) {
    return this.postPersona("visit-depth-distribute", date);
  }

  async getStayTimeDistribute(date: string) {
    return this.postPersona("stay-time-distribute", date);
  }

  async getActiveDistribute(date: string) {
    return this.postPersona("active-distribute", date);
  }
}
