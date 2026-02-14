import { Card } from "@/components/ui/Card";
import { formatBytes } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#06b6d4", "#84cc16", "#6b7280",
];

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: { percentage: number; fill: string };
  }>;
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-surface-700 dark:bg-surface-800">
      <p className="font-medium text-surface-900 dark:text-surface-50">
        {item.name}
      </p>
      <p className="text-surface-500 dark:text-surface-400">
        {formatBytes(item.value)} ({item.payload.percentage}%)
      </p>
    </div>
  );
}

export function StorageChart() {
  const { storageBreakdown } = useAppStore();

  if (!storageBreakdown || storageBreakdown.categories.length === 0) {
    return (
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-50">
          Storage Breakdown
        </h3>
        <div className="flex h-48 items-center justify-center text-sm text-surface-400">
          Loading storage data...
        </div>
      </Card>
    );
  }

  const totalSize = storageBreakdown.categories.reduce((s, c) => s + c.size, 0) || 1;

  const data = storageBreakdown.categories
    .filter((cat) => cat.size > 0)
    .map((cat, i) => ({
      name: cat.name,
      value: cat.size,
      percentage: Math.round((cat.size / totalSize) * 100),
      fill: COLORS[i % COLORS.length],
    }));

  return (
    <Card>
      <h3 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-50">
        Storage Breakdown
      </h3>
      <div className="flex items-center gap-6">
        <div className="h-48 w-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: item.fill }}
              />
              <span className="flex-1 text-surface-600 dark:text-surface-400">
                {item.name}
              </span>
              <span className="font-medium text-surface-900 dark:text-surface-100">
                {formatBytes(item.value)}
              </span>
              <span className="w-10 text-right text-surface-400 dark:text-surface-500">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
