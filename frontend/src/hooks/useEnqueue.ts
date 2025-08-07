"use client";

import { useMutation } from "@tanstack/react-query";
import { BACKEND_URL } from "@/lib/config";

export function useUpload() {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${BACKEND_URL}/upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("Falha no upload");
      return res.json() as Promise<{ path: string }>;
    },
  });
}

export function useImportYT() {
  return useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch(`${BACKEND_URL}/import_yt_vocals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_path: url }),
      });
      if (!res.ok) throw new Error("Erro ao extrair áudio do YouTube");
      return res.json() as Promise<{ path: string }>;
    },
  });
}

export function useEnqueue() {
  return useMutation({
    mutationFn: async (args: {
      content_path: string;
      content_type: "file" | "youtube";
      metadata?: Record<string, any>;
    }) => {
      const res = await fetch(`${BACKEND_URL}/queue/enqueue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      if (!res.ok) throw new Error("Falha ao enfileirar");
      return res.json() as Promise<{ job_id: string }>;
    },
  });
}
