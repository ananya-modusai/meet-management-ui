import type { CalendarEvent, UserProfile } from '../types';

const CAL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const USERINFO = 'https://www.googleapis.com/oauth2/v3/userinfo';

const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Thrown when the access token is rejected so the app can sign the user out. */
export class UnauthorizedError extends Error {
  constructor() {
    super('unauthorized');
    this.name = 'UnauthorizedError';
  }
}

async function authed(token: string, url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 401) throw new UnauthorizedError();
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? 'Google Calendar request failed.');
  }
  return res;
}

export async function fetchUserInfo(token: string): Promise<UserProfile> {
  const res = await authed(token, USERINFO);
  const d = await res.json();
  return { email: d.email, name: d.name, picture: d.picture };
}

/** Timed events from now through the next 4 weeks (all-day events excluded). */
export async function fetchUpcomingEvents(token: string): Promise<CalendarEvent[]> {
  const now = new Date();
  const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const timeMax = new Date(now.getTime() + 28 * 86_400_000).toISOString();
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    maxResults: '100',
    orderBy: 'startTime',
    singleEvents: 'true',
  });
  const res = await authed(token, `${CAL}?${params.toString()}`);
  const data = await res.json();
  const items: CalendarEvent[] = data.items ?? [];
  return items.filter((e) => Boolean(e.start?.dateTime));
}

export interface EventInput {
  summary: string;
  start: Date;
  end: Date;
  location?: string;
}

export async function createEvent(token: string, input: EventInput): Promise<CalendarEvent> {
  const res = await authed(token, CAL, {
    method: 'POST',
    body: JSON.stringify(toResource(input)),
  });
  return res.json();
}

export async function updateEvent(
  token: string,
  id: string,
  input: EventInput,
): Promise<CalendarEvent> {
  const res = await authed(token, `${CAL}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(toResource(input)),
  });
  return res.json();
}

export async function deleteEvent(token: string, id: string): Promise<void> {
  await authed(token, `${CAL}/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

function toResource(input: EventInput) {
  return {
    summary: input.summary,
    location: input.location || undefined,
    start: { dateTime: input.start.toISOString(), timeZone: TZ },
    end: { dateTime: input.end.toISOString(), timeZone: TZ },
  };
}
