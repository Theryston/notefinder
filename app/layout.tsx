import { Manrope } from 'next/font/google';
import type { Metadata } from 'next';
import { cn } from '@/lib/utils';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { GoogleTagManager } from '@next/third-parties/google';

const font = Manrope({ subsets: ['latin'], variable: '--font-manrope' });

export const metadata: Metadata = {
  title:
    'NoteFinder - Descubra as notas vocais para cantar a sua música favorita',
  description:
    'NoteFinder descubra as notas vocais para cantar a sua música favorita sem desafinar e fazer feio na frente dos amigos!',
  keywords: ['notas musicais', 'detector de notas', 'voz', 'música', 'YouTube'],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      {process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID && (
        <GoogleTagManager
          gtmId={process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID}
        />
      )}
      <body className={cn(font.className, 'antialiased')}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
