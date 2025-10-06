import { Header } from './header';

type Props = {
  children: React.ReactNode;
  showHeader?: boolean;
};

export function Container({ children, showHeader = true }: Props) {
  return (
    <div className="flex flex-col min-h-screen gap-4">
      {showHeader && <Header />}

      <main>{children}</main>
    </div>
  );
}
