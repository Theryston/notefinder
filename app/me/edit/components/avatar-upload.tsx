'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { onUploadAvatar } from '../actions';
import { toast } from 'sonner';
import { CameraIcon, Loader2Icon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MAX_AVATAR_SIZE } from '@/lib/constants';
import { Skeleton } from '@/components/sheleton';

export function AvatarUploadSkeleton() {
  return (
    <div className="flex items-center justify-center flex-col gap-4">
      <div className="flex w-20 h-20 relative">
        <div className="size-full rounded-full overflow-hidden">
          <Skeleton />
        </div>
      </div>
      <div className="w-20 h-8">
        <Skeleton />
      </div>
    </div>
  );
}

export function AvatarUpload({
  defaultImage,
  userName,
}: {
  defaultImage: string;
  userName: string;
}) {
  const [state, formAction, isPending] = useActionState(onUploadAvatar, null);
  const [previewUrl, setPreviewUrl] = useState<string>(defaultImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
    if (state?.success) {
      toast.success(state.success);

      if (state.imageUrl) setPreviewUrl(state.imageUrl);
    }
  }, [state]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_AVATAR_SIZE) {
        toast.error(
          `A imagem deve ter no máximo ${MAX_AVATAR_SIZE / 1024 / 1024}MB`,
        );
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);

      const form = e.target.form;

      if (form) {
        const formData = new FormData(form);
        formAction(formData);
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex items-center justify-center flex-col gap-4">
      <div className="flex w-20 h-20 relative">
        <Avatar className="size-full">
          <AvatarImage src={previewUrl} alt={userName} />
          <AvatarFallback className="text-xl sm:text-2xl font-semibold">
            {userName?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2Icon className="size-6 text-white animate-spin" />
          </div>
        )}
      </div>

      <form>
        <input
          ref={fileInputRef}
          type="file"
          name="avatar"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleButtonClick}
          disabled={isPending}
        >
          <CameraIcon className="size-4 mr-2" />
          Alterar
        </Button>
      </form>
    </div>
  );
}
