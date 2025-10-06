import { Header } from './header';
import { Footer } from './footer';

type Props = {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
};

export function Container({
  children,
  showHeader = true,
  showFooter = true,
}: Props) {
  return (
    <div className="flex flex-col min-h-screen gap-8">
      {showHeader && <Header />}

      <main className="w-full max-w-screen-2xl px-4 mx-auto">{children}</main>

      {showFooter && <Footer />}
    </div>
  );
}
