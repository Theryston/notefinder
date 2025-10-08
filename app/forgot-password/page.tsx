import { Container } from '@/components/container';
import { RequestForm } from './components/request-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Esqueci minha senha',
  description: 'Informe seu email para receber um código de recuperação.',
};

export default async function ForgotPassword() {
  return (
    <Container pathname="/forgot-password">
      <div className="max-w-sm mx-auto py-12">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Esqueci minha senha</h1>
            <p className="text-sm text-muted-foreground">
              Informe seu email para receber um código de recuperação.
            </p>
          </div>

          <RequestForm />
        </div>
      </div>
    </Container>
  );
}
