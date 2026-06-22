import type { CalendarEvent } from '../types';

export const DEFAULT_LEAD_MINUTES = 5;

export const startOf = (e: CalendarEvent): Date =>
  new Date(e.start.dateTime ?? e.start.date ?? Date.now());

export const endOf = (e: CalendarEvent): Date =>
  new Date(e.end?.dateTime ?? e.end?.date ?? startOf(e).getTime() + 30 * 60_000);

/** The moment we ring the phone: leadMinutes before the meeting starts. */
export const callTime = (start: Date, leadMinutes = DEFAULT_LEAD_MINUTES): Date =>
  new Date(start.getTime() - leadMinutes * 60_000);

export const fmtTime = (d: Date): string =>
  d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export const fmtDate = (d: Date): string =>
  d.toLocaleDateString([], { month: 'short', day: 'numeric' });

export const fmtDateTime = (d: Date): string =>
  `${fmtDate(d)} · ${fmtTime(d)}`;

export function dayLabel(d: Date, now: number = Date.now()): string {
  const day = (x: number) => {
    const t = new Date(x);
    return new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
  };
  const diff = Math.round((day(d.getTime()) - day(now)) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Human "in 2h 15m" until a target moment. Empty once passed. */
export function untilLabel(target: Date, now: number = Date.now()): string {
  const ms = target.getTime() - now;
  if (ms <= 0) return '';
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hrs < 24) return rem ? `in ${hrs}h ${rem}m` : `in ${hrs}h`;
  return `in ${Math.round(hrs / 24)}d`;
}

/** "5m ago", "2h ago", "3d ago" for past timestamps. */
export function agoLabel(target: Date, now: number = Date.now()): string {
  const ms = now - target.getTime();
  if (ms < 60_000) return 'just now';
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

/** Monday 00:00 of the week containing `d`. */
export function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (x.getDay() + 6) % 7; // Mon=0 … Sun=6
  x.setDate(x.getDate() - dow);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
