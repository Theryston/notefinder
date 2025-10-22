import { VariantProps } from 'class-variance-authority';
import { Button, buttonVariants } from './ui/button';
import Image from 'next/image';

export default function GoogleButton({
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    isLoading?: boolean;
  }) {
  return (
    <Button {...props}>
      <Image
        src="/google.svg"
        alt="Google"
        width={20}
        height={20}
        className="size-4"
      />
      {children}
    </Button>
  );
}
