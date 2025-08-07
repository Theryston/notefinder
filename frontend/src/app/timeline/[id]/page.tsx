import HydrateClient from "@/providers/HydrateClient";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import { fetchPrediction, predictionKey } from "@/queries/predictions";
import TimelineClient from "@/components/TimelineClient";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const prediction = await fetchPrediction(params.id);
    const title =
      prediction?.metadata?.display_title ||
      prediction?.content_path ||
      "Timeline de Notas";
    return {
      title: `${title} - Timeline de Notas | NoteFinder`,
      description: `Veja a linha do tempo das notas vocais detectadas para ${title}. Analise notas, oitavas e momentos exatos do canto.`,
      keywords: ["timeline de notas", "voz", "análise de áudio", title],
    };
  } catch {
    return { title: "Timeline | NoteFinder" };
  }
}

export default async function TimelinePage({
  params,
}: {
  params: { id: string };
}) {
  const qc = new QueryClient();
  await qc.prefetchQuery({
    queryKey: predictionKey(params.id),
    queryFn: () => fetchPrediction(params.id),
  });
  const state = dehydrate(qc);
  return (
    <HydrateClient state={state}>
      <TimelineClient id={params.id} />
    </HydrateClient>
  );
}
