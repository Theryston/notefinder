import { Container } from '@/components/container';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getUserByIdWithCache } from '@/lib/services/users/get-user';
import { BasicForm } from './components/basic-form';
import { AvatarUpload, AvatarUploadSkeleton } from './components/avatar-upload';

export default async function Edit() {
  return (
    <Container pathname="/me/edit">
      <Suspense fallback={null}>
        <Content />
      </Suspense>
    </Container>
  );
}

async function Content() {
  const session = await auth();
  if (!session?.user || !session.user.id)
    redirect('/sign-in?redirectTo=/me/edit');

  const user = await getUserByIdWithCache(session.user.id);

  return (
    <div className="max-w-sm mx-auto py-12">
      <div className="flex flex-col gap-6">
        <Suspense fallback={<AvatarUploadSkeleton />}>
          <AvatarUpload
            defaultImage={user?.image || ''}
            userName={user?.name || ''}
          />
        </Suspense>

        <BasicForm
          defaultName={user?.name || ''}
          defaultEmail={user?.email || ''}
        />
      </div>
    </div>
  );
}
