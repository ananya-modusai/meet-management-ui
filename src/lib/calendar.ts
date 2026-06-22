import type { CalendarEvent } from '../types';
import { startOf, endOf, addDays, isSameDay } from './time';

export interface PositionedEvent {
  event: CalendarEvent;
  start: Date;
  end: Date;
  /** Column within an overlapping cluster, and how many columns that cluster has. */
  lane: number;
  lanes: number;
}

export interface DayColumn {
  date: Date;
  events: PositionedEvent[];
}

export interface WeekLayout {
  days: DayColumn[];
  startHour: number;
  endHour: number;
}

/**
 * Lays out a week of timed events into day columns, packing overlapping events
 * into side-by-side lanes (greedy interval colouring), and computes the visible
 * hour window from the events present.
 */
export function buildDays(events: CalendarEvent[], start: Date, count = 7): WeekLayout {
  const days: DayColumn[] = [];
  let minHour = 23;
  let maxHour = 1;

  for (let i = 0; i < count; i++) {
    const date = addDays(start, i);
    const dayItems = events
      .filter((e) => isSameDay(startOf(e), date))
      .map((event) => ({ event, start: startOf(event), end: endOf(event) }))
      .sort(
        (a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime(),
      );

    for (const it of dayItems) {
      minHour = Math.min(minHour, it.start.getHours());
      maxHour = Math.max(maxHour, it.end.getHours() + (it.end.getMinutes() > 0 ? 1 : 0));
    }

    days.push({ date, events: packLanes(dayItems) });
  }

  // Sensible default window when the week is empty, clamped to working hours.
  const startHour = Math.max(6, Math.min(minHour, 9));
  const endHour = Math.min(22, Math.max(maxHour, 18));

  return { days, startHour, endHour: Math.max(endHour, startHour + 1) };
}

function packLanes(
  items: { event: CalendarEvent; start: Date; end: Date }[],
): PositionedEvent[] {
  const out: PositionedEvent[] = [];
  let cluster: PositionedEvent[] = [];
  let clusterEnd = 0;

  const flush = () => {
    if (!cluster.length) return;
    const colEnds: number[] = []; // last end-time per lane
    for (const it of cluster) {
      let lane = colEnds.findIndex((end) => end <= it.start.getTime());
      if (lane === -1) lane = colEnds.length;
      colEnds[lane] = it.end.getTime();
      it.lane = lane;
    }
    const lanes = colEnds.length;
    for (const it of cluster) {
      it.lanes = lanes;
      out.push(it);
    }
    cluster = [];
  };

  for (const it of items) {
    const pe: PositionedEvent = { ...it, lane: 0, lanes: 1 };
    if (cluster.length === 0) {
      clusterEnd = pe.end.getTime();
    } else if (pe.start.getTime() >= clusterEnd) {
      flush();
      clusterEnd = pe.end.getTime();
    }
    cluster.push(pe);
    clusterEnd = Math.max(clusterEnd, pe.end.getTime());
  }
  flush();
  return out;
}
