import type { CallLog, LineSettings } from '../types';
import { DEFAULT_LEAD_MINUTES } from './time';

/**
 * Meet-Alert backend contract.
 *
 * Each call maps 1:1 to an endpoint the serverless backend will expose
 * (AWS Lambda behind a Function URL, state in Upstash Redis):
 *
 *   GET  /me              -> LineSettings
 *   PUT  /me              <- LineSettings
 *   GET  /alerts          -> string[]            (armed Google event ids)
 *   PUT  /alerts/:eventId <- { armed: boolean }
 *   GET  /logs            -> CallLog[]            (placed-call history)
 *
 * Until the backend is live, everything is persisted in localStorage (logs are
 * seeded with sample data) so the dashboard is fully usable. Set VITE_API_BASE
 * to switch to the real API with no component changes.
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? '';
const key = (email: string, name: string) => `ma:${email}:${name}`;

const DEFAULT_SETTINGS: LineSettings = {
  phone: '',
  message:
    "Heads up — your meeting starts in five minutes. Time to wrap up and head over.",
  leadMinutes: DEFAULT_LEAD_MINUTES,
};

/** Token is threaded from App state — never stored separately in this module. */
let _token: string | null = null;
export function setApiToken(token: string | null) { _token = token; }

function authHeaders(): Record<string, string> {
  return _token ? { Authorization: `Bearer ${_token}` } : {};
}

export async function getSettings(email: string): Promise<LineSettings> {
  if (API_BASE) {
    const res = await fetch(`${API_BASE}/me`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Could not load your settings.');
    return res.json();
  }
  const raw = localStorage.getItem(key(email, 'settings'));
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
}

export async function saveSettings(email: string, settings: LineSettings): Promise<void> {
  if (API_BASE) {
    const res = await fetch(`${API_BASE}/me`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Could not save your settings.');
    return;
  }
  localStorage.setItem(key(email, 'settings'), JSON.stringify(settings));
}

export async function getArmedIds(email: string): Promise<Set<string>> {
  if (API_BASE) {
    const res = await fetch(`${API_BASE}/alerts`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Could not load your armed meetings.');
    return new Set<string>(await res.json());
  }
  const raw = localStorage.getItem(key(email, 'armed'));
  return new Set<string>(raw ? JSON.parse(raw) : []);
}

export async function setArmed(email: string, eventId: string, armed: boolean): Promise<void> {
  if (API_BASE) {
    const res = await fetch(`${API_BASE}/alerts/${encodeURIComponent(eventId)}`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ armed }),
    });
    if (!res.ok) throw new Error('Could not save that change.');
    return;
  }
  const ids = await getArmedIds(email);
  if (armed) ids.add(eventId);
  else ids.delete(eventId);
  localStorage.setItem(key(email, 'armed'), JSON.stringify([...ids]));
}

export async function getCallLogs(email: string): Promise<CallLog[]> {
  if (API_BASE) {
    const res = await fetch(`${API_BASE}/logs`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Could not load your call history.');
    return res.json();
  }
  const raw = localStorage.getItem(key(email, 'logs'));
  if (raw) return JSON.parse(raw);
  const seeded = seedLogs();
  localStorage.setItem(key(email, 'logs'), JSON.stringify(seeded));
  return seeded;
}


/** Illustrative history so the Logs view isn't empty before the backend exists. */
function seedLogs(): CallLog[] {
  const now = Date.now();
  const h = 3_600_000;
  return [
    { id: 'l1', meeting: 'Daily Standup', phone: '+91 98765 43210', at: new Date(now - 2 * h).toISOString(), status: 'completed', durationSec: 38 },
    { id: 'l2', meeting: 'Design Review', phone: '+91 98765 43210', at: new Date(now - 26 * h).toISOString(), status: 'completed', durationSec: 41 },
    { id: 'l3', meeting: '1:1 with Priya', phone: '+91 98765 43210', at: new Date(now - 27 * h).toISOString(), status: 'no-answer' },
    { id: 'l4', meeting: 'Sprint Planning', phone: '+91 98765 43210', at: new Date(now - 50 * h).toISOString(), status: 'completed', durationSec: 33 },
    { id: 'l5', meeting: 'Client Sync — Acme', phone: '+91 98765 43210', at: new Date(now - 73 * h).toISOString(), status: 'failed' },
    { id: 'l6', meeting: 'Retro', phone: '+91 98765 43210', at: new Date(now - 96 * h).toISOString(), status: 'completed', durationSec: 29 },
  ];
}
