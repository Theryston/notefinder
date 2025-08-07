import HydrateClient from "@/providers/HydrateClient";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import { fetchStats, statsQueryKey } from "@/queries/stats";
import { fetchPredictions, predictionsKey } from "@/queries/predictions";
import HomeClient from "@/components/HomeClient";

export const revalidate = 10;

export default async function HomePage() {
  const qc = new QueryClient();
  await qc.prefetchQuery({ queryKey: statsQueryKey, queryFn: fetchStats });
  await qc.prefetchQuery({
    queryKey: predictionsKey(25),
    queryFn: () => fetchPredictions(25),
  });
  const state = dehydrate(qc);

  return (
    <HydrateClient state={state}>
      <HomeClient />
    </HydrateClient>
  );
}
