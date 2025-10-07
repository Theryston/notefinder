import { Container } from '@/components/container';
import { ResetForm } from '../components/reset-form';

export default async function ResetPassword({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const email = params?.email || '';

  return (
    <Container pathname="/forgot-password/reset">
      <div className="max-w-sm mx-auto py-12">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Redefinir senha</h1>
            <p className="text-sm text-muted-foreground">
              Digite o código enviado e sua nova senha.
            </p>
          </div>

          <ResetForm email={email} />
        </div>
      </div>
    </Container>
  );
}
