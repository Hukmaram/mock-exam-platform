import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-[#FDF2F2] text-[#B94A4A] border-[#F5D0D0] dark:bg-[#2D1616] dark:text-[#E88B8B]',
        outline: 'text-foreground border-border',
        success: 'border-transparent bg-primary/10 text-primary border-primary/25 dark:bg-primary/20 dark:text-[#E08569]',
        warning: 'border-transparent bg-[#FDF6E9] text-[#9E6400] border-[#F2DEB6] dark:bg-[#2B2313] dark:text-[#E0B55E]',
        info: 'border-transparent bg-[#FBF0EB] text-[#C15F3C] border-[#F2D0C4] dark:bg-[#2D1B14] dark:text-[#EAA68E]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
