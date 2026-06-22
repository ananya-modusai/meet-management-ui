import { useNow } from '../../lib/useNow';
import { agoLabel, fmtDateTime } from '../../lib/time';
import { cn } from '../../lib/cn';
import type { CallLog, CallStatus } from '../../types';

const STATUS: Record<CallStatus, { label: string; dot: string; chip: string }> = {
  completed: { label: 'Completed', dot: 'bg-success', chip: 'bg-success-soft text-success' },
  'no-answer': { label: 'No answer', dot: 'bg-orange', chip: 'bg-orange-soft text-orange' },
  failed: { label: 'Failed', dot: 'bg-danger', chip: 'bg-danger-soft text-danger' },
  queued: { label: 'Queued', dot: 'bg-cornflower', chip: 'bg-periwinkle-soft text-cornflower' },
};

const dur = (s?: number) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '—');

export function CallLogs({ logs }: { logs: CallLog[] }) {
  const now = useNow();
  const completed = logs.filter((l) => l.status === 'completed').length;
  const missed = logs.filter((l) => l.status === 'no-answer' || l.status === 'failed').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Mini label="Total calls" value={logs.length} />
        <Mini label="Answered" value={completed} tone="text-success" />
        <Mini label="Missed / failed" value={missed} tone="text-danger" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-3 sm:grid">
          <span>Meeting</span>
          <span className="w-28">Status</span>
          <span className="w-20 text-right">Duration</span>
          <span className="w-32 text-right">When</span>
        </div>
        {logs.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-3">No calls placed yet.</p>
        ) : (
          <ul>
            {logs.map((l) => {
              const s = STATUS[l.status];
              return (
                <li
                  key={l.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-border px-5 py-3.5 last:border-0 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{l.meeting}</p>
                    <p className="truncate font-mono text-xs text-ink-3">{l.phone}</p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex w-28 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                      s.chip,
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
                    {s.label}
                  </span>
                  <span className="hidden w-20 text-right font-mono text-sm text-ink-2 sm:block">
                    {dur(l.durationSec)}
                  </span>
                  <span
                    className="w-32 text-right text-xs text-ink-3"
                    title={fmtDateTime(new Date(l.at))}
                  >
                    {agoLabel(new Date(l.at), now)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className={cn('font-display text-2xl font-extrabold leading-none', tone)}>{value}</p>
      <p className="mt-1 text-xs font-medium text-ink-3">{label}</p>
    </div>
  );
}
