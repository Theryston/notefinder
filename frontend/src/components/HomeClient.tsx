"use client";

import StatsCard from "@/components/StatsCard";
import PredictionCard from "@/components/PredictionCard";
import Link from "next/link";
import { useStats } from "@/hooks/useStats";
import { usePredictions } from "@/hooks/usePredictions";

export default function HomeClient() {
  const { data: stats } = useStats();
  const { data: predictions = [] } = usePredictions(25);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl p-8 md:p-14 bg-gradient-to-br from-brand-600 via-fuchsia-600 to-pink-600 text-white shadow">
        <div className="absolute -top-20 -right-32 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
          Descubra as notas da voz em qualquer áudio
        </h1>
        <p className="mt-4 text-white/90 max-w-2xl">
          Envie um arquivo de áudio ou cole um link do YouTube. O NoteFinder
          detecta as notas e oitavas cantadas ao longo do tempo e gera uma
          timeline detalhada.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/new"
            className="px-5 py-2.5 rounded-xl bg-white text-gray-900 font-semibold hover:bg-white/90"
          >
            Começar Análise
          </Link>
          <a
            href="#como-funciona"
            className="px-5 py-2.5 rounded-xl border border-white/40 hover:bg-white/10"
          >
            Como funciona
          </a>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          label="Total de Análises"
          value={stats?.total_predictions ?? "-"}
        />
        <StatsCard
          label="Arquivos"
          value={stats?.file_predictions ?? "-"}
          accent="bg-green-100 text-green-700"
        />
        <StatsCard
          label="YouTube"
          value={stats?.youtube_predictions ?? "-"}
          accent="bg-red-100 text-red-700"
        />
        <StatsCard
          label="Notas Detectadas"
          value={stats?.total_notes_detected ?? "-"}
          accent="bg-purple-100 text-purple-700"
        />
      </section>

      <section id="lista" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Mais Recentes</h2>
          <Link href="/new" className="text-brand-700 hover:underline">
            Nova análise
          </Link>
        </div>
        {predictions.length === 0 ? (
          <div className="text-center py-12 border rounded-xl">
            <p className="text-gray-600">Nenhuma predição encontrada</p>
            <Link
              href="/new"
              className="mt-4 inline-block px-4 py-2 rounded bg-brand-600 text-white"
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

      <section
        id="como-funciona"
        className="rounded-2xl p-6 md:p-10 bg-white dark:bg-zinc-900 border"
      >
        <h2 className="text-2xl font-bold mb-4">O que a plataforma faz</h2>
        <p className="text-gray-700 dark:text-gray-300">
          O NoteFinder processa o áudio, detecta o pitch ao longo do tempo e
          converte as frequências em notas e oitavas. O resultado é uma linha do
          tempo visual onde você vê exatamente quando cada nota foi cantada.
        </p>
      </section>
    </div>
  );
}
