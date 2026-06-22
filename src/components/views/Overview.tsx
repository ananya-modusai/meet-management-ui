import { useNow } from '../../lib/useNow';
import { startOf, callTime, fmtTime, untilLabel, agoLabel, dayLabel } from '../../lib/time';
import { AvatarStack } from '../ui/Avatar';
import { colorFor } from '../../lib/eventColors';
import { PhoneIcon, BellIcon, ClockIcon, CheckIcon } from '../icons';
import type { CalendarEvent, CallLog, LineSettings, ViewKey } from '../../types';
import { cn } from '../../lib/cn';

interface Props {
  events: CalendarEvent[];
  armed: Set<string>;
  settings: LineSettings | null;
  logs: CallLog[];
  onNavigate: (v: ViewKey) => void;
}

export function Overview({ events, armed, settings, logs, onNavigate }: Props) {
  const now = useNow();
  const lead = settings?.leadMinutes ?? 5;

  const armedUpcoming = events
    .filter((e) => armed.has(e.id) && startOf(e).getTime() > now)
    .sort((a, b) => startOf(a).getTime() - startOf(b).getTime());
  const next = armedUpcoming[0];
  const weekAgo = now - 7 * 86_400_000;
  const callsThisWeek = logs.filter((l) => new Date(l.at).getTime() > weekAgo);
  const completed = logs.filter((l) => l.status === 'completed').length;
  const rate = logs.length ? Math.round((completed / logs.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="Armed meetings" value={armedUpcoming.length} Icon={BellIcon} tone="orange" />
        <Stat label="Calls this week" value={callsThisWeek.length} Icon={PhoneIcon} tone="indigo" />
        <Stat label="Success rate" value={`${rate}%`} Icon={CheckIcon} tone="success" />
        <Stat label="Concurrent lines" value="2" Icon={ClockIcon} tone="cornflower" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Next call */}
        <section className="lg:col-span-3">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-3.5">
              <h2 className="font-display text-base font-bold">Next call</h2>
            </div>
            {next ? (
              <div className="flex items-center gap-5 p-5">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-orange-soft text-orange">
                  <PhoneIcon width={24} height={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg font-bold">
                    {next.summary || 'Untitled meeting'}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-2">
                    {dayLabel(startOf(next), now)} · meeting at {fmtTime(startOf(next))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg font-semibold text-orange">
                    {fmtTime(callTime(startOf(next), lead))}
                  </p>
                  <p className="text-xs text-ink-3">rings {untilLabel(callTime(startOf(next), lead), now)}</p>
                </div>
              </div>
            ) : (
              <div className="p-5 text-sm text-ink-2">
                No calls queued.{' '}
                <button onClick={() => onNavigate('calendar')} className="font-semibold text-cornflower hover:underline">
                  Arm a meeting →
                </button>
              </div>
            )}
          </div>

          {/* Upcoming armed */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h2 className="font-display text-base font-bold">Upcoming armed</h2>
              <button onClick={() => onNavigate('calendar')} className="text-xs font-semibold text-cornflower hover:underline">
                Open calendar
              </button>
            </div>
            {armedUpcoming.length ? (
              <ul>
                {armedUpcoming.slice(0, 5).map((e) => {
                  const c = colorFor(e.id);
                  return (
                    <li key={e.id} className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-0">
                      <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: c.bar }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{e.summary || 'Untitled'}</p>
                        <p className="text-xs text-ink-3">
                          {dayLabel(startOf(e), now)} · {fmtTime(startOf(e))}
                        </p>
                      </div>
                      <AvatarStack attendees={e.attendees ?? []} size="xs" />
                      <span className="font-mono text-xs text-orange">
                        {fmtTime(callTime(startOf(e), lead))}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-5 py-6 text-sm text-ink-3">Nothing armed yet.</p>
            )}
          </div>
        </section>

        {/* Recent activity */}
        <section className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h2 className="font-display text-base font-bold">Recent calls</h2>
              <button onClick={() => onNavigate('logs')} className="text-xs font-semibold text-cornflower hover:underline">
                View all
              </button>
            </div>
            <ul>
              {logs.slice(0, 6).map((l) => (
                <li key={l.id} className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-0">
                  <StatusDot status={l.status} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{l.meeting}</p>
                    <p className="text-xs text-ink-3">{agoLabel(new Date(l.at), now)}</p>
                  </div>
                  <span className="text-xs capitalize text-ink-2">{l.status.replace('-', ' ')}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

const TONES = {
  orange: 'bg-orange-soft text-orange',
  indigo: 'bg-periwinkle-soft text-indigo',
  success: 'bg-success-soft text-success',
  cornflower: 'bg-periwinkle-soft text-cornflower',
};

function Stat({
  label,
  value,
  Icon,
  tone,
}: {
  label: string;
  value: number | string;
  Icon: typeof PhoneIcon;
  tone: keyof typeof TONES;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className={cn('mb-3 grid h-9 w-9 place-items-center rounded-lg', TONES[tone])}>
        <Icon width={18} height={18} />
      </div>
      <p className="font-display text-2xl font-extrabold leading-none">{value}</p>
      <p className="mt-1 text-xs font-medium text-ink-3">{label}</p>
    </div>
  );
}

function StatusDot({ status }: { status: CallLog['status'] }) {
  const map = {
    completed: 'bg-success',
    'no-answer': 'bg-orange',
    failed: 'bg-danger',
    queued: 'bg-cornflower',
  };
  return <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', map[status])} />;
}
