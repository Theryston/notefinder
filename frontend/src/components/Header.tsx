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

  const isDark = theme === "dark";

  return (
    <header className="bg-white/60 dark:bg-black/30 backdrop-blur-md sticky top-0 z-40 shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-extrabold text-lg tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-400">
            NoteFinder
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setOpenQueue(true)}
            className="px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            Fila
          </button>
          <Link
            href="/new"
            className="px-4 py-1.5 rounded-full bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition"
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
              aria-label="Alternar tema"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="ml-1 p-2 rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              {isDark ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              )}
            </button>
          )}
        </nav>
      </div>
      <QueueModal open={openQueue} onClose={() => setOpenQueue(false)} />
    </header>
  );
}
