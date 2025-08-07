"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import QueueModal from "@/components/QueueModal";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [openQueue, setOpenQueue] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="border-b bg-white/70 dark:bg-black/30 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl">
          NoteFinder
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setOpenQueue(true)}
            className="px-3 py-1.5 rounded border hover:bg-gray-50 dark:hover:bg-zinc-800"
          >
            Fila
          </button>
          <Link
            href="/new"
            className="px-3 py-1.5 rounded bg-brand-600 text-white hover:bg-brand-700"
          >
            Nova Análise
          </Link>
          <a
            href="https://github.com/Theryston/notefinder-worker"
            target="_blank"
            rel="noreferrer"
            className="opacity-80 hover:opacity-100 px-2"
          >
            GitHub
          </a>
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="px-3 py-1.5 rounded border hover:bg-gray-50 dark:hover:bg-zinc-800"
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>
          )}
        </nav>
      </div>
      <QueueModal open={openQueue} onClose={() => setOpenQueue(false)} />
    </header>
  );
}
