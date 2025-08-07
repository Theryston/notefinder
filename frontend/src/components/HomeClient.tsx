"use client";

import PredictionCard from "@/components/PredictionCard";
import Link from "next/link";
import { useStats } from "@/hooks/useStats";
import { usePredictions } from "@/hooks/usePredictions";

export default function HomeClient() {
  const { data: stats } = useStats();
  const { data: predictions = [] } = usePredictions(25);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl p-8 md:p-14 bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-600 text-white shadow">
        <div className="absolute -top-24 -right-32 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
          Descubra as notas da voz em qualquer áudio
        </h1>
        <p className="mt-4 text-white/90 max-w-2xl">
          Envie um arquivo de áudio ou cole um link do YouTube. O NoteFinder
          detecta as notas e oitavas cantadas ao longo do tempo e gera uma
          timeline detalhada. Com mais de {stats?.total_predictions} análises
          realizadas e {stats?.total_notes_detected} notas detectadas.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/new"
            className="px-5 py-2.5 rounded-xl bg-white text-gray-900 font-semibold hover:bg-white/90 shadow-sm"
          >
            Começar Análise
          </Link>
        </div>
      </section>

      <section id="lista" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Mais Recentes</h2>
          <Link
            href="/new"
            className="text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-full"
          >
            Nova análise
          </Link>
        </div>
        {predictions.length === 0 ? (
          <div className="text-center py-12 border rounded-2xl">
            <p className="text-gray-600">Nenhuma predição encontrada</p>
            <Link
              href="/new"
              className="mt-4 inline-block px-4 py-2 rounded-full bg-brand-600 text-white"
            >
              Criar a primeira
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {predictions.map((p: any) => (
              <PredictionCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
