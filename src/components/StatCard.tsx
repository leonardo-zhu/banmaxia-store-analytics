interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  prefix?: string;
}

export default function StatCard({ label, value, change, prefix = "" }: StatCardProps) {
  const changeText =
    change !== undefined && change !== 0
      ? `${change > 0 ? "\u2191" : "\u2193"}${Math.abs(change * 100).toFixed(1)}%`
      : null;

  const changeColor =
    change !== undefined
      ? change > 0
        ? "text-green-600"
        : change < 0
        ? "text-red-600"
        : "text-gray-400"
      : "";

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">
        {prefix}{typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {changeText && (
        <div className={`text-sm mt-1 ${changeColor}`}>
          同比 {changeText}
        </div>
      )}
    </div>
  );
}
