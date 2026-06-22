import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Avatar } from '../ui/Avatar';
import {
  GridIcon,
  CalendarIcon,
  LogIcon,
  SlidersIcon,
  UserIcon,
  PowerIcon,
  RefreshIcon,
} from '../icons';
import type { UserProfile, ViewKey } from '../../types';

const NAV: { key: ViewKey; label: string; Icon: typeof GridIcon }[] = [
  { key: 'overview', label: 'Overview', Icon: GridIcon },
  { key: 'calendar', label: 'Calendar', Icon: CalendarIcon },
  { key: 'logs', label: 'Call logs', Icon: LogIcon },
  { key: 'settings', label: 'Settings', Icon: SlidersIcon },
  { key: 'account', label: 'Account', Icon: UserIcon },
];

const TITLES: Record<ViewKey, { title: string; sub: string }> = {
  overview: { title: 'Overview', sub: 'Your alerts at a glance' },
  calendar: { title: 'Calendar', sub: 'Arm the meetings you can’t miss' },
  logs: { title: 'Call logs', sub: 'Every call Meet-Alert has placed' },
  settings: { title: 'Settings', sub: 'Your number, message, and timing' },
  account: { title: 'Account', sub: 'Your connected Google account' },
};

interface Props {
  user: UserProfile | null;
  active: ViewKey;
  onNavigate: (v: ViewKey) => void;
  onSignOut: () => void;
  onRefresh: () => void;
  loading: boolean;
  children: ReactNode;
}

export function Shell({ user, active, onNavigate, onSignOut, onRefresh, loading, children }: Props) {
  const meta = TITLES[active];
  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-indigo p-5 lg:flex">
        <div className="flex items-center gap-2.5 px-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange">
            <span className="h-2.5 w-2.5 rounded-full bg-white" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-white">
            Meet-Alert
          </span>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => onNavigate(key)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                active === key
                  ? 'bg-white/12 text-white'
                  : 'text-periwinkle/80 hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon width={19} height={19} />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <Avatar name={ user?.name || user?.email || 'You'} size="md" className="ring-indigo" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user?.name || 'none'}</p>
            <p className="truncate text-xs text-periwinkle/70">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign out"
            className="grid h-8 w-8 place-items-center rounded-lg text-periwinkle/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <PowerIcon width={17} height={17} />
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-canvas/85 px-5 backdrop-blur-md lg:px-8">
          <div>
            <h1 className="font-display text-xl font-extrabold leading-none tracking-tight">
              {meta.title}
            </h1>
            <p className="mt-0.5 hidden text-xs text-ink-3 sm:block">{meta.sub}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              aria-label="Refresh"
              className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-ink-2 transition-colors hover:border-border-strong hover:text-ink"
            >
              <RefreshIcon width={17} height={17} className={loading ? 'motion-safe:animate-spin' : ''} />
            </button>
            <Avatar name={user?.name || user?.email || 'You'} size="md" />
          </div>
        </header>

        <main className="px-5 py-6 pb-24 lg:px-8 lg:pb-10">{children}</main>
      </div>

      {/* Bottom tab bar — mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface lg:hidden">
        {NAV.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onNavigate(key)}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[0.6rem] font-semibold transition-colors',
              active === key ? 'text-orange' : 'text-ink-3',
            )}
          >
            <Icon width={20} height={20} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
