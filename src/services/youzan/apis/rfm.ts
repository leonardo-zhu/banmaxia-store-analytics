import { YouzanClient } from "../client";

export class RFMAPI {
  constructor(private client: YouzanClient) {}

  async queryRFM(date: string, queryType: "RF" | "RM" | "FM" = "RF") {
    const query = JSON.stringify({
      dateType: 1,
      queryType,
      selectCustomerType: "member",
      timeRangeType: "ALL",
      timeParam: { currentDay: date },
      kdtIds: null,
    });

    return this.client.get<unknown>(
      "/crm/statcenter/rfm-model/api/query-rfm",
      { query }
    );
  }
}
