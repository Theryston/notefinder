import { signIn } from '@/auth';
import { Container } from '@/components/container';

export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <Container>
      <form
        action={async () => {
          'use server';
          await signIn('google', {
            redirectTo: redirectTo || '/',
          });
        }}
      >
        <button type="submit">Signin with Google</button>
      </form>
    </Container>
  );
}
