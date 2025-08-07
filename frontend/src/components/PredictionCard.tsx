import Link from "next/link";

type Prediction = {
  id: string;
  timestamp: string;
  content_path: string;
  content_type: "file" | "youtube";
  notes_count: number;
  metadata?: { display_title?: string };
};

export default function PredictionCard({ p }: { p: Prediction }) {
  const display = p.metadata?.display_title || p.content_path;
  const badge =
    p.content_type === "youtube" ? (
      <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
        YouTube
      </span>
    ) : (
      <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
        Arquivo
      </span>
    );

  return (
    <div className="rounded-2xl border border-gray-200 p-5 bg-white dark:border-none dark:bg-gray-700 hover:shadow-lg hover:-translate-y-0.5 transition">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {badge}
            <span className="text-xs text-gray-500">
              {new Date(p.timestamp).toLocaleString("pt-BR")}
            </span>
          </div>
          <h3 className="font-semibold truncate" title={display}>
            {display}
          </h3>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {p.notes_count} nota{p.notes_count !== 1 ? "s" : ""}
          </span>
          <Link
            href={`/timeline/${p.id}`}
            className="px-3 py-1.5 rounded-full bg-brand-600 text-white text-sm hover:bg-brand-700 shadow-sm"
          >
            Ver
          </Link>
        </div>
      </div>
    </div>
  );
}
