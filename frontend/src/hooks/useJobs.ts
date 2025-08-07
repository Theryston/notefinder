"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

export const jobsKey = ["jobs", { scope: "recent" }] as const;
export function fetchJobs(limit = 20) {
  return apiGet(`/queue/recent?limit=${limit}`).then((d) => d.jobs as any[]);
}
export function useJobs(limit = 20, refetchMs = 2000) {
  return useQuery({
    queryKey: jobsKey,
    queryFn: () => fetchJobs(limit),
    refetchInterval: refetchMs,
  });
}
