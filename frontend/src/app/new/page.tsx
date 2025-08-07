"use client";

import { useEffect, useRef, useState } from "react";
import { BACKEND_URL } from "@/lib/config";
import { useRouter } from "next/navigation";
import { useUpload, useImportYT, useEnqueue } from "@/hooks/useEnqueue";

export default function NewPage() {
  const [type, setType] = useState<"file" | "youtube">("file");
  const [file, setFile] = useState<File | null>(null);
  const [ytUrl, setYtUrl] = useState("");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const pollRef = useRef<any>(null);
  const router = useRouter();

  const upload = useUpload();
  const importYT = useImportYT();
  const enqueue = useEnqueue();

  useEffect(() => {
    return () => clearInterval(pollRef.current);
  }, []);

  async function start() {
    if (type === "file" && !file) return alert("Envie um arquivo");
    if (type === "youtube" && !ytUrl.trim())
      return alert("Cole um link do YouTube");

    setIsProcessing(true);
    setProgress(0);
    setMessage("Preparando...");

    try {
      let contentPath: string | null = null;
      if (type === "file") {
        const data = await upload.mutateAsync(file as File);
        contentPath = data.path;
      } else {
        const yd = await importYT.mutateAsync(ytUrl.trim());
        contentPath = yd.path;
      }

      const enq = await enqueue.mutateAsync({
        content_path: contentPath!,
        content_type: type,
        metadata: type === "youtube" ? { youtube_url: ytUrl.trim() } : {},
      });
      poll(enq.job_id);
    } catch (e: any) {
      setMessage(e.message || "Erro inesperado");
      setIsProcessing(false);
    }
  }

  function poll(id: string) {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`${BACKEND_URL}/queue/status/${id}`);
        if (!r.ok) return;
        const job = await r.json();
        setProgress(job.progress ?? 0);
        setMessage(job.progress_message || job.status);
        if (job.status === "completed") {
          clearInterval(pollRef.current);
          setTimeout(() => router.push(`/timeline/${job.prediction_id}`), 800);
        }
        if (job.status === "failed") {
          clearInterval(pollRef.current);
          setIsProcessing(false);
          setMessage(job.error || "Falhou");
        }
      } catch {}
    }, 1500);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Nova Análise</h1>

      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        Aviso: todos os arquivos e processos enviados ficarão publicamente
        expostos na página inicial para fins de demonstração e SEO.
      </p>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setType("file")}
          className={`px-4 py-2 rounded border ${
            type === "file"
              ? "bg-brand-600 text-white border-brand-600"
              : "hover:bg-gray-50 dark:hover:bg-zinc-800"
          }`}
        >
          Arquivo
        </button>
        <button
          onClick={() => setType("youtube")}
          className={`px-4 py-2 rounded border ${
            type === "youtube"
              ? "bg-brand-600 text-white border-brand-600"
              : "hover:bg-gray-50 dark:hover:bg-zinc-800"
          }`}
        >
          YouTube
        </button>
      </div>

      {type === "file" ? (
        <div className="space-y-3">
          <label className="block text-sm">Upload do arquivo</label>
          <input
            type="file"
            accept="audio/*,video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          {file && <div className="text-xs text-gray-500">{file.name}</div>}
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm">Link do YouTube</label>
          <input
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-3 py-2 rounded border bg-white dark:bg-zinc-900"
          />
        </div>
      )}

      <button
        onClick={start}
        className="mt-6 px-5 py-2.5 rounded bg-brand-600 text-white hover:bg-brand-700"
      >
        Processar
      </button>

      {isProcessing && (
        <div className="mt-8 border rounded-xl p-5">
          <div className="text-sm mb-2">{message}</div>
          <div className="h-2 bg-gray-200 rounded">
            <div
              className="h-2 bg-brand-600 rounded"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
