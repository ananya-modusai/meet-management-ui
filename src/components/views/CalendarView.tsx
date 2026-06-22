import { useState } from 'react';
import { cn } from '../../lib/cn';
import { useNow } from '../../lib/useNow';
import { buildDays, type WeekLayout, type PositionedEvent } from '../../lib/calendar';
import { startOfWeek, addDays, isSameDay, startOf, endOf, fmtTime } from '../../lib/time';
import { colorFor } from '../../lib/eventColors';
import { AvatarStack } from '../ui/Avatar';
import { EventComposer, type ComposerInitial } from './EventComposer';
import { ChevronLeft, ChevronRight, PlusIcon, PhoneIcon } from '../icons';
import type { CalendarEvent, CalendarMode, LineSettings } from '../../types';
import type { EventInput } from '../../lib/google';

const PX_PER_HOUR = 52;
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hourFloat = (d: Date) => d.getHours() + d.getMinutes() / 60;

interface Props {
  events: CalendarEvent[];
  armed: Set<string>;
  settings: LineSettings | null;
  onCreate: (input: EventInput) => Promise<CalendarEvent>;
  onUpdate: (id: string, input: EventInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSetArm: (eventId: string, armed: boolean) => Promise<void>;
}

type Composer = { mode: 'create' | 'edit'; initial: ComposerInitial } | null;

export function CalendarView({ events, armed, settings, onCreate, onUpdate, onDelete, onSetArm }: Props) {
  const now = useNow(60_000);
  const today = new Date(now);
  const lead = settings?.leadMinutes ?? 5;
  const [mode, setMode] = useState<CalendarMode>('week');
  const [anchor, setAnchor] = useState<Date>(today);
  const [composer, setComposer] = useState<Composer>(null);

  const step = (dir: number) => {
    if (mode === 'month') setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1));
    else setAnchor(addDays(anchor, dir * (mode === 'week' ? 7 : 1)));
  };

  const title =
    mode === 'day'
      ? anchor.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      : mode === 'week'
        ? addDays(startOfWeek(anchor), 3).toLocaleDateString([], { month: 'long', year: 'numeric' })
        : anchor.toLocaleDateString([], { month: 'long', year: 'numeric' });

  const openCreate = (start: Date) =>
    setComposer({
      mode: 'create',
      initial: { summary: '', start, end: new Date(start.getTime() + 30 * 60_000) },
    });

  const openEdit = (e: CalendarEvent) =>
    setComposer({
      mode: 'edit',
      initial: {
        id: e.id,
        summary: e.summary ?? '',
        start: startOf(e),
        end: endOf(e),
        location: e.location,
        hangoutLink: e.hangoutLink,
      },
    });

  const submit = async (input: EventInput, arm: boolean) => {
    if (composer?.mode === 'create') {
      const created = await onCreate(input);
      await onSetArm(created.id, arm);
    } else if (composer?.initial.id) {
      await onUpdate(composer.initial.id, input);
      await onSetArm(composer.initial.id, arm);
    }
    setComposer(null);
  };

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-extrabold tracking-tight">{title}</h2>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-border bg-surface p-0.5">
            {(['month', 'week', 'day'] as CalendarMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-semibold capitalize transition-colors',
                  mode === m ? 'bg-indigo text-white' : 'text-ink-2 hover:text-ink',
                )}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex items-center rounded-xl border border-border bg-surface">
            <button onClick={() => step(-1)} aria-label="Previous" className="grid h-9 w-9 place-items-center text-ink-2 hover:text-ink">
              <ChevronLeft width={18} height={18} />
            </button>
            <button onClick={() => setAnchor(today)} className="border-x border-border px-3 py-1.5 text-sm font-semibold text-ink-2 hover:text-ink">
              Today
            </button>
            <button onClick={() => step(1)} aria-label="Next" className="grid h-9 w-9 place-items-center text-ink-2 hover:text-ink">
              <ChevronRight width={18} height={18} />
            </button>
          </div>

          <button
            onClick={() => openCreate(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate(), 9, 0))}
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
          >
            <PlusIcon width={17} height={17} /> New
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {mode === 'month' ? (
          <MonthGrid
            anchor={anchor}
            events={events}
            armed={armed}
            today={today}
            onEvent={openEdit}
            onDay={(d) => {
              setAnchor(d);
              setMode('day');
            }}
            onCreate={(d) => openCreate(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0))}
          />
        ) : (
          <TimeGrid
            layout={buildDays(events, mode === 'week' ? startOfWeek(anchor) : anchor, mode === 'week' ? 7 : 1)}
            armed={armed}
            now={now}
            today={today}
            onEvent={openEdit}
            onSlot={openCreate}
            onArm={(id) => onSetArm(id, !armed.has(id))}
          />
        )}
      </div>

      {composer && (
        <EventComposer
          mode={composer.mode}
          initial={composer.initial}
          armed={composer.initial.id ? armed.has(composer.initial.id) : false}
          leadMinutes={lead}
          onClose={() => setComposer(null)}
          onSubmit={submit}
          onDelete={
            composer.mode === 'edit' && composer.initial.id
              ? async () => {
                  await onDelete(composer.initial.id!);
                  setComposer(null);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}

/* ── Week / Day time grid ─────────────────────────────────────────────── */

function TimeGrid({
  layout,
  armed,
  now,
  today,
  onEvent,
  onSlot,
  onArm,
}: {
  layout: WeekLayout;
  armed: Set<string>;
  now: number;
  today: Date;
  onEvent: (e: CalendarEvent) => void;
  onSlot: (start: Date) => void;
  onArm: (id: string) => void;
}) {
  const { days, startHour, endHour } = layout;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const gridHeight = hours.length * PX_PER_HOUR;
  const nowHour = hourFloat(new Date(now));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Day headers */}
        <div className="flex border-b border-border" style={{ paddingLeft: 56 }}>
          {days.map(({ date }) => {
            const isToday = isSameDay(date, today);
            return (
              <div key={date.toISOString()} className="flex-1 px-2 py-2.5 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">{DOW[(date.getDay() + 6) % 7]}</p>
                <p
                  className={cn(
                    'mx-auto mt-1 grid h-8 w-8 place-items-center rounded-full font-display text-sm font-bold',
                    isToday ? 'bg-indigo text-white' : 'text-ink',
                  )}
                >
                  {date.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex">
          {/* Time gutter */}
          <div className="w-14 shrink-0" style={{ height: gridHeight }}>
            {hours.map((h) => (
              <div key={h} className="relative" style={{ height: PX_PER_HOUR }}>
                <span className="absolute -top-2 right-2 font-mono text-[0.65rem] text-ink-3">
                  {h % 12 === 0 ? 12 : h % 12}
                  {h < 12 ? 'a' : 'p'}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map(({ date, events }) => {
            const isToday = isSameDay(date, today);
            return (
              <div key={date.toISOString()} className="relative flex-1 border-l border-border" style={{ height: gridHeight }}>
                {hours.map((h) => (
                  <button
                    key={h}
                    onClick={() => onSlot(new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, 0))}
                    className="block w-full border-t border-border transition-colors hover:bg-surface-2"
                    style={{ height: PX_PER_HOUR }}
                    aria-label="Add event"
                  />
                ))}

                {events.map((pe) => (
                  <EventBlock key={pe.event.id} pe={pe} startHour={startHour} armed={armed.has(pe.event.id)} onEvent={onEvent} onArm={onArm} />
                ))}

                {isToday && nowHour >= startHour && nowHour <= endHour && (
                  <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: (nowHour - startHour) * PX_PER_HOUR }}>
                    <div className="relative h-px bg-orange">
                      <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-orange" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EventBlock({
  pe,
  startHour,
  armed,
  onEvent,
  onArm,
}: {
  pe: PositionedEvent;
  startHour: number;
  armed: boolean;
  onEvent: (e: CalendarEvent) => void;
  onArm: (id: string) => void;
}) {
  const c = colorFor(pe.event.id);
  const top = (hourFloat(pe.start) - startHour) * PX_PER_HOUR;
  const height = Math.max((pe.end.getTime() - pe.start.getTime()) / 3_600_000 * PX_PER_HOUR - 3, 22);
  const widthPct = 100 / pe.lanes;
  const tall = height >= 56;

  return (
    <button
      onClick={() => onEvent(pe.event)}
      className={cn(
        'absolute z-10 overflow-hidden rounded-lg px-2 py-1 text-left transition-shadow hover:shadow-md',
        armed && 'ring-2 ring-orange ring-offset-1',
      )}
      style={{
        top,
        height,
        left: `calc(${pe.lane * widthPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        background: c.bg,
        color: c.text,
        borderLeft: `3px solid ${c.bar}`,
      }}
    >
      <span
        onClick={(e) => {
          e.stopPropagation();
          onArm(pe.event.id);
        }}
        role="button"
        aria-label={armed ? 'Disarm call' : 'Arm a call'}
        className={cn(
          'absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full',
          armed ? 'bg-orange text-white' : 'bg-white/70 text-ink-3 hover:text-orange',
        )}
      >
        <PhoneIcon width={9} height={9} />
      </span>
      <p className="truncate pr-4 text-[0.7rem] font-mono opacity-80">{fmtTime(pe.start)}</p>
      <p className="truncate pr-4 text-xs font-bold leading-tight">{pe.event.summary || 'Untitled'}</p>
      {tall && pe.event.attendees?.length ? (
        <div className="mt-1">
          <AvatarStack attendees={pe.event.attendees} size="xs" max={4} />
        </div>
      ) : null}
    </button>
  );
}

/* ── Month grid ───────────────────────────────────────────────────────── */

function MonthGrid({
  anchor,
  events,
  armed,
  today,
  onEvent,
  onDay,
  onCreate,
}: {
  anchor: Date;
  events: CalendarEvent[];
  armed: Set<string>;
  today: Date;
  onEvent: (e: CalendarEvent) => void;
  onDay: (d: Date) => void;
  onCreate: (d: Date) => void;
}) {
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeek(monthStart);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-border">
        {DOW.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-3">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date) => {
          const inMonth = date.getMonth() === anchor.getMonth();
          const isToday = isSameDay(date, today);
          const dayEvents = events
            .filter((e) => isSameDay(startOf(e), date))
            .sort((a, b) => startOf(a).getTime() - startOf(b).getTime());
          return (
            <div
              key={date.toISOString()}
              className={cn('group min-h-[104px] border-b border-l border-border p-1.5 first:border-l-0 [&:nth-child(7n+1)]:border-l-0', !inMonth && 'bg-surface-2/50')}
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onDay(date)}
                  className={cn(
                    'grid h-6 w-6 place-items-center rounded-full text-xs font-bold transition-colors',
                    isToday ? 'bg-indigo text-white' : inMonth ? 'text-ink hover:bg-surface-2' : 'text-ink-3',
                  )}
                >
                  {date.getDate()}
                </button>
                <button
                  onClick={() => onCreate(date)}
                  aria-label="Add event"
                  className="hidden h-5 w-5 place-items-center rounded text-ink-3 hover:bg-surface-2 hover:text-orange group-hover:grid"
                >
                  <PlusIcon width={13} height={13} />
                </button>
              </div>
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 3).map((e) => {
                  const c = colorFor(e.id);
                  return (
                    <button
                      key={e.id}
                      onClick={() => onEvent(e)}
                      className="flex w-full items-center gap-1 rounded px-1.5 py-0.5 text-left"
                      style={{ background: c.bg, color: c.text }}
                    >
                      {armed.has(e.id) && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange" />}
                      <span className="truncate text-[0.65rem] font-semibold">{e.summary || 'Untitled'}</span>
                    </button>
                  );
                })}
                {dayEvents.length > 3 && (
                  <button onClick={() => onDay(date)} className="px-1.5 text-[0.65rem] font-semibold text-ink-3 hover:text-ink">
                    +{dayEvents.length - 3} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
