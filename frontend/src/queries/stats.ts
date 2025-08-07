import { apiGet } from "@/lib/api";

export const statsQueryKey = ["stats"] as const;

export async function fetchStats() {
  const d = await apiGet("/predictions/stats");
  return d.statistics as {
    total_predictions: number;
    file_predictions: number;
    youtube_predictions: number;
    total_notes_detected: number;
  };
}
