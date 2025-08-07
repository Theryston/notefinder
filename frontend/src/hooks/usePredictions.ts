"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

export const predictionsKey = (limit: number) =>
  ["predictions", { limit }] as const;
export function fetchPredictions(limit: number) {
  return apiGet(`/predictions?limit=${limit}`).then(
    (d) => d.predictions as any[]
  );
}
export function usePredictions(limit: number) {
  return useQuery({
    queryKey: predictionsKey(limit),
    queryFn: () => fetchPredictions(limit),
    staleTime: 10_000,
  });
}

export const predictionKey = (id: string) => ["prediction", { id }] as const;
export function fetchPrediction(id: string) {
  return apiGet(`/predictions/${id}`).then((d) => d.prediction as any);
}
export function usePrediction(id: string) {
  return useQuery({
    queryKey: predictionKey(id),
    queryFn: () => fetchPrediction(id),
    staleTime: 10_000,
  });
}
