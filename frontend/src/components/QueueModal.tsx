"use client";

import { useJobs } from "@/hooks/useJobs";

export default function QueueModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: jobs = [] } = useJobs(50, 2000);
  if (!open) return null;

  const activeJobs = jobs.filter(
    (j) => j.status === "pending" || j.status === "processing"
  );

  return (
    <div className="fixed top-0 bottom-0 left-0 right-0 z-50 animate-[fadeIn_120ms_ease-out]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute left-1/2 top-12 -translate-x-1/2 w-[92vw] max-w-2xl rounded-2xl border bg-white dark:bg-zinc-900 shadow-xl animate-[slideDown_150ms_ease-out]">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Fila de Processamento</h3>
          <button
            onClick={onClose}
            className="px-2 py-1 text-sm rounded-full border hover:bg-black/5 dark:hover:bg-white/5"
          >
            Fechar
          </button>
        </div>
        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-3">
          {activeJobs.length === 0 ? (
            <div className="text-sm text-gray-500">
              Nenhum job em processamento no momento
            </div>
          ) : (
            activeJobs.map((job) => (
              <div
                key={job.id}
                className="border rounded-xl p-3 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <div className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                      {job.content_type === "youtube" ? "YouTube" : "Arquivo"}
                    </div>
                    <div className="text-xs text-gray-500 break-all">
                      {job.content_path}
                    </div>
                  </div>
                  <div
                    className={`text-xs capitalize ${
                      job.status === "processing"
                        ? "text-brand-700"
                        : "text-gray-500"
                    }`}
                  >
                    {job.status}
                  </div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-brand-600 rounded-full"
                    style={{ width: `${job.progress ?? 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{job.progress ?? 0}%</span>
                  <span>{job.progress_message || ""}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
