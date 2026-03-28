import Link from "next/link";

interface ReportCardProps {
  id: string;
  date: string;
  source: string;
  title: string;
  contentPreview: string;
  createdAt: string;
}

const sourceLabels: Record<string, string> = {
  claude: "Claude",
  openclaw: "OpenClaw",
  manual: "手动",
};

const sourceColors: Record<string, string> = {
  claude: "bg-purple-100 text-purple-700",
  openclaw: "bg-blue-100 text-blue-700",
  manual: "bg-gray-100 text-gray-700",
};

export default function ReportCard({
  id, date, source, title, contentPreview, createdAt,
}: ReportCardProps) {
  return (
    <Link href={`/reports/${id}`} className="block">
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-orange-300 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">{date}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${sourceColors[source] || sourceColors.manual}`}>
            {sourceLabels[source] || source}
          </span>
        </div>
        <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2">{contentPreview}</p>
        <div className="text-xs text-gray-400 mt-2">
          {new Date(createdAt).toLocaleString("zh-CN")}
        </div>
      </div>
    </Link>
  );
}
