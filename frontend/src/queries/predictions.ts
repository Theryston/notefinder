import { apiGet } from "@/lib/api";

export const predictionsKey = (limit: number) =>
  ["predictions", { limit }] as const;
export async function fetchPredictions(limit: number) {
  const d = await apiGet(`/predictions?limit=${limit}`);
  return d.predictions as any[];
}

export const predictionKey = (id: string) => ["prediction", { id }] as const;
export async function fetchPrediction(id: string) {
  const d = await apiGet(`/predictions/${id}`);
  return d.prediction as any;
}
