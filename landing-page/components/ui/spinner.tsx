import { cn } from '@/lib/utils';
import { Loader2Icon } from 'lucide-react';

function Spinner({ className, ...props }: React.ComponentProps<'output'>) {
  return (
    <output
      data-slot="spinner"
      aria-label="Loading"
      className="inline-flex"
      {...props}
    >
      <Loader2Icon
        aria-hidden="true"
        className={cn('size-4 animate-spin', className)}
      />
    </output>
  );
}

export { Spinner };
