import { avatarColor, initials } from '../../lib/eventColors';
import type { Attendee } from '../../types';
import { cn } from '../../lib/cn';

const SIZES = { xs: 'h-5 w-5 text-[0.5rem]', sm: 'h-6 w-6 text-[0.6rem]', md: 'h-8 w-8 text-xs' };

export function Avatar({
  name,
  size = 'sm',
  className,
}: {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      title={name}
      className={cn(
        'inline-grid place-items-center rounded-full font-semibold text-white ring-2 ring-white',
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: avatarColor(name) }}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({
  attendees,
  max = 3,
  size = 'sm',
}: {
  attendees: Attendee[];
  max?: number;
  size?: keyof typeof SIZES;
}) {
  if (!attendees.length) return null;
  const shown = attendees.slice(0, max);
  const extra = attendees.length - shown.length;
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((a, i) => (
        <Avatar key={a.email + i} name={a.displayName || a.email} size={size} />
      ))}
      {extra > 0 && (
        <span
          className={cn(
            'inline-grid place-items-center rounded-full bg-canvas font-semibold text-ink-2 ring-2 ring-white',
            SIZES[size],
          )}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
