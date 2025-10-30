import Link from 'next/link';
import { Container } from '@/components/container';
import { onSignupGoogle } from './actions';
import { CredentialsForm } from './components/credentials-form';
import { Suspense } from 'react';
import GoogleButton from '@/components/google-button';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Criar conta',
  description:
    'Crie sua conta no NoteFinder para acessar todas as funcionalidades',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL}/sign-up`,
  },
};

export default async function SignUp({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo: string }>;
}) {
  return (
    <Container pathname="/sign-up">
      <Suspense fallback={null}>
        <Content searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function Content({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo: string }>;
}) {
  const params = await searchParams;
  const { redirectTo } = params;

  return (
    <div className="max-w-sm mx-auto py-12">
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Criar conta</h1>
          <p className="text-sm text-muted-foreground">
            Preencha os campos para criar sua conta.
          </p>
        </div>

        <CredentialsForm redirectTo={redirectTo} />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        <form action={onSignupGoogle}>
          <GoogleButton
            id="sign-up-google-button"
            variant="outline"
            type="submit"
            className="w-full"
          >
            Criar conta com Google
          </GoogleButton>
        </form>

        <p className="text-center text-sm">
          Já tem uma conta?{' '}
          <Link
            href={`/sign-in${redirectTo ? `?redirectTo=${redirectTo}` : ''}`}
            className="underline underline-offset-4 hover:text-primary"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
