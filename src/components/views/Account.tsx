import { Avatar } from '../ui/Avatar';
import { GoogleG, CalendarIcon, UserIcon, PowerIcon, CheckIcon } from '../icons';
import type { UserProfile } from '../../types';

interface Props {
  user: UserProfile | null;
  onSignOut: () => void;
}

const SCOPES = [
  { Icon: CalendarIcon, label: 'Google Calendar', detail: 'Read events and create, edit, or delete them' },
  { Icon: UserIcon, label: 'Basic profile', detail: 'Your name, email, and avatar' },
];

export function Account({ user, onSignOut }: Props) {
  return (
    <div className="max-w-2xl space-y-6">
      <section className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center gap-4">
          <Avatar name={user?.name || user?.email || 'You'} size="md" className="!h-16 !w-16 !text-xl ring-canvas" />
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl font-extrabold">{user?.name || 'Signed in'}</h2>
            <p className="truncate text-ink-2">{user?.email}</p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <GoogleG />
          <div className="flex-1">
            <h3 className="font-display text-base font-bold">Connected with Google</h3>
            <p className="text-sm text-ink-3">Meet-Alert has access to the following:</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
            <CheckIcon width={13} height={13} /> Active
          </span>
        </div>
        <ul>
          {SCOPES.map(({ Icon, label, detail }) => (
            <li key={label} className="flex items-center gap-3 border-b border-border px-5 py-3.5 last:border-0">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-periwinkle-soft text-indigo">
                <Icon width={18} height={18} />
              </span>
              <div>
                <p className="font-semibold">{label}</p>
                <p className="text-sm text-ink-3">{detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-bold">Sign out</h3>
            <p className="text-sm text-ink-3">You’ll need to sign in with Google again.</p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:border-danger hover:bg-danger-soft hover:text-danger"
          >
            <PowerIcon width={16} height={16} /> Sign out
          </button>
        </div>
      </section>
    </div>
  );
}
