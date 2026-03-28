import StatCard from "./StatCard";
import type { DailyReport } from "@/services/youzan/types";

interface StatsGridProps {
  data: DailyReport;
  comparison?: Record<string, { change: number }>;
}

export default function StatsGrid({ data, comparison }: StatsGridProps) {
  const { income } = data;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <StatCard
        label="支付金额"
        value={income.payAmount}
        prefix="¥"
        change={comparison?.payAmount?.change}
      />
      <StatCard
        label="支付客户数"
        value={income.payCustomerCount}
        change={comparison?.payCustomerCount?.change}
      />
      <StatCard
        label="支付订单数"
        value={income.payOrderCount}
        change={comparison?.payOrderCount?.change}
      />
      <StatCard
        label="客单价"
        value={income.avgOrderAmount}
        prefix="¥"
        change={comparison?.avgOrderAmount?.change}
      />
      <StatCard
        label="连带率"
        value={income.jointRate}
        change={comparison?.jointRate?.change}
      />
    </div>
  );
}
