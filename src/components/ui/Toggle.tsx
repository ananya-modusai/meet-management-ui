import { cn } from '../../lib/cn';

interface Props {
  on: boolean;
  onChange: () => void;
  label: string;
  size?: 'sm' | 'md';
}

/** Arm switch — orange when on ("this meeting calls you"). */
export function Toggle({ on, onChange, label, size = 'md' }: Props) {
  const dims = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11';
  const knob = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5';
  const travel = size === 'sm' ? 'left-[calc(100%-1.125rem)]' : 'left-[calc(100%-1.375rem)]';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cn(
        'relative shrink-0 rounded-full transition-colors duration-200',
        'outline-none focus-visible:ring-2 focus-visible:ring-orange/50 focus-visible:ring-offset-2',
        dims,
        on ? 'bg-orange' : 'bg-border-strong',
      )}
    >
      <span
        className={cn(
          'absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm transition-all duration-200',
          knob,
          on ? travel : 'left-0.5',
        )}
      />
    </button>
  );
}
