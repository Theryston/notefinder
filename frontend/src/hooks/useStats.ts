"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

export const statsQueryKey = ["stats"] as const;

export function fetchStats() {
  return apiGet("/predictions/stats").then(
    (d) =>
      d.statistics as {
        total_predictions: number;
        file_predictions: number;
        youtube_predictions: number;
        total_notes_detected: number;
      }
  );
}

export function useStats() {
  return useQuery({
    queryKey: statsQueryKey,
    queryFn: fetchStats,
    staleTime: 30_000,
  });
}
