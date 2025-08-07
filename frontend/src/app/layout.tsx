import "@/app/globals.css";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import Header from "@/components/Header";
import { ThemeProvider } from "next-themes";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NoteFinder - Detecte notas vocais em qualquer áudio",
  description:
    "NoteFinder identifica as notas e oitavas cantadas em qualquer áudio, ideal para estudar voz e analisar músicas.",
  keywords: [
    "notas musicais",
    "detector de notas",
    "voz",
    "análise de áudio",
    "música",
    "YouTube",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ReactQueryProvider>
            <Header />
            <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
