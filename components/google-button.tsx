import { VariantProps } from 'class-variance-authority';
import { Button, buttonVariants } from './ui/button';
import { Google } from './icons';

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
      <Google className="size-4" />
      {children}
    </Button>
  );
}
