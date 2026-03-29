"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, type PieLabelRenderProps } from "recharts";

interface CustomerPieChartProps {
  member: { amount: number; percentage: number };
  nonMember: { amount: number; percentage: number };
  passerby: { amount: number; percentage: number };
}

const COLORS = ["#2563eb", "#10b981", "#f59e0b"];

export default function CustomerPieChart({
  member, nonMember, passerby,
}: CustomerPieChartProps) {
  const data = [
    { name: "会员", value: member.amount },
    { name: "非会员", value: nonMember.amount },
    { name: "流水客", value: passerby.amount },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 h-64 flex items-center justify-center text-gray-400">
        暂无数据
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">客户构成</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            dataKey="value"
            label={(props: PieLabelRenderProps) => `${props.name ?? ""} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `¥${Number(value).toFixed(2)}`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
