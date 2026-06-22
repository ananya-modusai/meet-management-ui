import { useState } from 'react';
import { cn } from '../../lib/cn';
import { PhoneIcon, BellIcon, ClockIcon } from '../icons';
import type { LineSettings } from '../../types';

const MESSAGE_LIMIT = 220;
const LEADS = [3, 5, 10, 15];

interface Props {
  settings: LineSettings;
  onSave: (s: LineSettings) => Promise<void> | void;
}

export function Settings({ settings, onSave }: Props) {
  // Seeded from props via the `key` in <App> (remounts when settings load / user changes).
  const [phone, setPhone] = useState(settings.phone);
  const [message, setMessage] = useState(settings.message);
  const [lead, setLead] = useState(settings.leadMinutes);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const dirty =
    phone !== settings.phone || message !== settings.message || lead !== settings.leadMinutes;

  const save = async () => {
    setStatus('saving');
    await onSave({ phone: phone.trim(), message: message.trim(), leadMinutes: lead });
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 1600);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Card icon={<PhoneIcon width={18} height={18} />} title="Your number" desc="Where Meet-Alert calls you.">
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
          className={field}
        />
      </Card>

      <Card
        icon={<BellIcon width={18} height={18} />}
        title="What the call says"
        desc="A voice agent reads this aloud when you pick up. Plain text only."
      >
        <textarea
          value={message}
          rows={3}
          onChange={(e) => setMessage(e.target.value.replace(/[<>]/g, '').slice(0, MESSAGE_LIMIT))}
          placeholder="Heads up — your meeting starts soon."
          className={cn(field, 'resize-none')}
        />
        <p className="mt-2 text-right font-mono text-xs text-ink-3">
          {message.length}/{MESSAGE_LIMIT}
        </p>
      </Card>

      <Card
        icon={<ClockIcon width={18} height={18} />}
        title="Lead time"
        desc="How long before a meeting we call."
      >
        <div className="flex gap-2">
          {LEADS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setLead(m)}
              className={cn(
                'flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors',
                lead === m
                  ? 'border-orange bg-orange-soft text-orange'
                  : 'border-border bg-surface text-ink-2 hover:border-border-strong',
              )}
            >
              {m} min
            </button>
          ))}
        </div>
        <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink-3">
          Meet-Alert places up to <span className="font-semibold text-ink-2">2 calls at once</span>.
          If many armed meetings start together, calls go out in order of start time.
        </p>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {status === 'saved' && <span className="text-sm font-semibold text-success">Saved</span>}
        <button
          type="button"
          onClick={save}
          disabled={!dirty || status === 'saving'}
          className={cn(
            'rounded-xl px-6 py-2.5 text-sm font-semibold transition-colors',
            dirty
              ? 'bg-indigo text-white hover:bg-indigo-600'
              : 'cursor-not-allowed bg-border-strong text-ink-3',
          )}
        >
          {status === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

const field =
  'w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-ink placeholder:text-ink-3 outline-none transition-colors focus:border-cornflower focus:ring-2 focus:ring-cornflower/20';

function Card({
  icon,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-periwinkle-soft text-indigo">
          {icon}
        </span>
        <div>
          <h2 className="font-display text-base font-bold leading-tight">{title}</h2>
          <p className="mt-0.5 text-sm text-ink-3">{desc}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
