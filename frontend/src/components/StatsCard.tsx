type Props = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accent?: string;
};

export default function StatsCard({
  label,
  value,
  icon,
  accent = "bg-brand-100 text-brand-700",
}: Props) {
  return (
    <div className="rounded-xl border p-5 shadow-sm bg-white dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${accent}`}>{icon}</div>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {label}
          </div>
          <div className="text-2xl font-bold mt-1">{value}</div>
        </div>
      </div>
    </div>
  );
}
