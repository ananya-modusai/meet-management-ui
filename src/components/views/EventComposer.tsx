import { useState } from 'react';
import { cn } from '../../lib/cn';
import { Toggle } from '../ui/Toggle';
import { XIcon, TrashIcon, VideoIcon, PinIcon } from '../icons';
import type { EventInput } from '../../lib/google';

export interface ComposerInitial {
  id?: string;
  summary: string;
  start: Date;
  end: Date;
  location?: string;
  hangoutLink?: string;
}

interface Props {
  mode: 'create' | 'edit';
  initial: ComposerInitial;
  armed: boolean;
  leadMinutes: number;
  onClose: () => void;
  onSubmit: (input: EventInput, arm: boolean) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTimeInput = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const combine = (dateStr: string, timeStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
};

export function EventComposer({ mode, initial, armed, leadMinutes, onClose, onSubmit, onDelete }: Props) {
  const [summary, setSummary] = useState(initial.summary);
  const [date, setDate] = useState(toDateInput(initial.start));
  const [startT, setStartT] = useState(toTimeInput(initial.start));
  const [endT, setEndT] = useState(toTimeInput(initial.end));
  const [location, setLocation] = useState(initial.location ?? '');
  const [arm, setArm] = useState(armed);
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    if (!summary.trim()) return setErr('Give the meeting a title.');
    const start = combine(date, startT);
    const end = combine(date, endT);
    if (end <= start) return setErr('End time must be after the start.');
    setBusy('save');
    setErr(null);
    try {
      await onSubmit({ summary: summary.trim(), start, end, location: location.trim() }, arm);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save the event.');
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!onDelete) return;
    setBusy('delete');
    try {
      await onDelete();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not delete the event.');
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-indigo/30 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl motion-safe:animate-[rise_0.25s_ease-out]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-extrabold">
            {mode === 'create' ? 'New meeting' : 'Edit meeting'}
          </h2>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-lg text-ink-3 hover:bg-surface-2 hover:text-ink">
            <XIcon width={18} height={18} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <input
            autoFocus
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Add a title"
            className={cn(field, 'text-lg font-semibold')}
          />

          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 block text-xs font-semibold text-ink-3">
              Date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={cn(field, 'mt-1')} />
            </label>
            <label className="block text-xs font-semibold text-ink-3">
              Starts
              <input type="time" value={startT} onChange={(e) => setStartT(e.target.value)} className={cn(field, 'mt-1')} />
            </label>
            <label className="block text-xs font-semibold text-ink-3">
              Ends
              <input type="time" value={endT} onChange={(e) => setEndT(e.target.value)} className={cn(field, 'mt-1')} />
            </label>
          </div>

          <div className="relative">
            <PinIcon width={16} height={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location"
              className={cn(field, 'pl-9')}
            />
          </div>

          {initial.hangoutLink && (
            <a
              href={initial.hangoutLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl bg-periwinkle-soft px-3.5 py-2.5 text-sm font-semibold text-indigo hover:bg-periwinkle/40"
            >
              <VideoIcon width={18} height={18} /> Join Google Meet
            </a>
          )}

          <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Call me before this</p>
              <p className="text-xs text-ink-3">Rings your phone {leadMinutes} min before it starts.</p>
            </div>
            <Toggle on={arm} onChange={() => setArm((v) => !v)} label="Arm a call for this meeting" />
          </div>

          {err && <p className="text-sm text-danger">{err}</p>}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
          {mode === 'edit' && onDelete ? (
            <button
              onClick={remove}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger-soft disabled:opacity-50"
            >
              <TrashIcon width={16} height={16} /> {busy === 'delete' ? 'Deleting…' : 'Delete'}
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={save}
            disabled={busy !== null}
            className="rounded-xl bg-indigo px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-600 disabled:opacity-50"
          >
            {busy === 'save' ? 'Saving…' : mode === 'create' ? 'Add event' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

const field =
  'w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-ink placeholder:text-ink-3 outline-none transition-colors focus:border-cornflower focus:ring-2 focus:ring-cornflower/20';
