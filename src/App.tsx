import { useCallback, useEffect, useRef, useState } from 'react';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';
import { Login } from './components/Login';
import { Shell } from './components/dashboard/Shell';
import { Overview } from './components/views/Overview';
import { CalendarView } from './components/views/CalendarView';
import { CallLogs } from './components/views/CallLogs';
import { Settings } from './components/views/Settings';
import { Account } from './components/views/Account';
import {
  fetchUpcomingEvents,
  fetchUserInfo,
  createEvent,
  updateEvent,
  deleteEvent,
  UnauthorizedError,
  type EventInput,
} from './lib/google';
import * as api from './lib/api';
import { setApiToken } from './lib/api';
import type { CalendarEvent, CallLog, LineSettings, UserProfile, ViewKey } from './types';

const TOKEN_KEY = 'ma_token';
const SCOPES = 'openid email profile https://www.googleapis.com/auth/calendar.events';

export default function App() {
  const [token, setToken] = useState<string | null>(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (t) setApiToken(t);
    return t;
  });
  const [user, setUser] = useState<UserProfile | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [armed, setArmed] = useState<Set<string>>(new Set());
  const [muted, setMuted] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<LineSettings | null>(null);
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewKey>('overview');

  // Refs for pending silent-refresh Promise callbacks
  const silentResolve = useRef<((t: string) => void) | null>(null);
  const silentReject = useRef<((e: Error) => void) | null>(null);

  const triggerSilentRefresh = useGoogleLogin({
    onSuccess: (r) => {
      const t = r.access_token;
      localStorage.setItem(TOKEN_KEY, t);
      setApiToken(t);
      setToken(t);
      silentResolve.current?.(t);
      silentResolve.current = null;
      silentReject.current = null;
    },
    onError: () => {
      silentReject.current?.(new Error('silent refresh failed'));
      silentResolve.current = null;
      silentReject.current = null;
    },
    scope: SCOPES,
    prompt: 'none',
  });

  /** Returns a fresh access token silently, or throws if Google can't. */
  const silentRefresh = useCallback(
    (): Promise<string> =>
      new Promise((resolve, reject) => {
        silentResolve.current = resolve;
        silentReject.current = reject;
        triggerSilentRefresh();
      }),
    [triggerSilentRefresh],
  );

  const signOut = useCallback(() => {
    googleLogout();
    localStorage.removeItem(TOKEN_KEY);
    setApiToken(null);
    setToken(null);
    setUser(null);
    setEvents([]);
    setArmed(new Set());
    setMuted(new Set());
    setSettings(null);
    setLogs([]);
    setView('overview');
  }, []);

  const signIn = (t: string) => {
    localStorage.setItem(TOKEN_KEY, t);
    setApiToken(t);
    setError(null);
    setToken(t);
  };

  const withRefresh = useCallback(
    async <T,>(op: (token: string) => Promise<T>): Promise<T> => {
      const currentToken = localStorage.getItem(TOKEN_KEY);
      if (!currentToken) throw new Error('Not signed in.');
      try {
        return await op(currentToken);
      } catch (e) {
        if (!(e instanceof UnauthorizedError)) throw e;
        try {
          const newToken = await silentRefresh();
          return await op(newToken);
        } catch {
          signOut();
          setError('Your session expired. Please sign in again.');
          throw new Error('Session expired.');
        }
      }
    },
    [silentRefresh, signOut],
  );

  const load = useCallback(
    async (t: string) => {
      setLoading(true);
      setError(null);
      try {
        const runLoad = async (token: string) => {
          const profile = await fetchUserInfo(token);
          setUser(profile);
          const [evs, armedIds, mutedIds, line, callLogs] = await Promise.all([
            fetchUpcomingEvents(token),
            api.getArmedIds(profile.email),
            api.getMutedIds(profile.email),
            api.getSettings(profile.email),
            api.getCallLogs(profile.email),
          ]);
          setEvents(evs);
          setArmed(armedIds);
          setMuted(mutedIds);
          setSettings(line);
          setLogs(callLogs);
        };

        try {
          await runLoad(t);
        } catch (e) {
          if (!(e instanceof UnauthorizedError)) throw e;
          // Token expired — silently refresh then retry once
          const newToken = await silentRefresh();
          await runLoad(newToken);
        }
      } catch (e) {
        if (e instanceof UnauthorizedError || (e instanceof Error && e.message === 'silent refresh failed')) {
          signOut();
          setError('Your session expired. Please sign in again.');
        } else {
          setError(e instanceof Error ? e.message : 'Something went wrong.');
        }
      } finally {
        setLoading(false);
      }
    },
    [signOut, silentRefresh],
  );

  useEffect(() => {
    // Genuine external-data sync when the access token changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (token) load(token);
  }, [token, load]);

  // Proactively refresh the Google token every 50 minutes (tokens expire at 60 min).
  useEffect(() => {
    if (!token) return;
    const id = setInterval(async () => {
      try {
        await silentRefresh();
      } catch {
        signOut();
        setError('Your session expired. Please sign in again.');
      }
    }, 50 * 60 * 1000);
    return () => clearInterval(id);
  }, [token, silentRefresh, signOut]);

  const setArm = async (eventId: string, next: boolean) => {
    if (!user) return;
    setArmed((prev) => {
      const s = new Set(prev);
      if (next) s.add(eventId);
      else s.delete(eventId);
      return s;
    });
    try {
      await api.setArmed(user.email, eventId, next);
    } catch {
      setArmed((prev) => {
        const s = new Set(prev);
        if (next) s.delete(eventId);
        else s.add(eventId);
        return s;
      });
      setError('Could not save that change.');
    }
  };

  const setMut = async (eventId: string, next: boolean) => {
    if (!user) return;
    setMuted((prev) => {
      const s = new Set(prev);
      if (next) s.add(eventId);
      else s.delete(eventId);
      return s;
    });
    try {
      await api.setMuted(user.email, eventId, next);
    } catch {
      setMuted((prev) => {
        const s = new Set(prev);
        if (next) s.delete(eventId);
        else s.add(eventId);
        return s;
      });
      setError('Could not save that change.');
    }
  };

  const create = async (input: EventInput): Promise<CalendarEvent> => {
    const created = await withRefresh((t) => createEvent(t, input));
    setEvents((prev) =>
      [...prev, created].sort(
        (a, b) =>
          new Date(a.start.dateTime ?? 0).getTime() - new Date(b.start.dateTime ?? 0).getTime(),
      ),
    );
    return created;
  };

  const update = async (id: string, input: EventInput) => {
    const updated = await withRefresh((t) => updateEvent(t, id, input));
    setEvents((prev) =>
      prev
        .map((e) => (e.id === id ? { ...e, ...updated } : e))
        .sort(
          (a, b) =>
            new Date(a.start.dateTime ?? 0).getTime() - new Date(b.start.dateTime ?? 0).getTime(),
        ),
    );
  };

  const remove = async (id: string) => {
    await withRefresh((t) => deleteEvent(t, id));
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setArmed((prev) => {
      const s = new Set(prev);
      s.delete(id);
      return s;
    });
  };

  const saveSettings = async (s: LineSettings) => {
    if (!user) return;
    setSettings(s);
    try {
      await api.saveSettings(user.email, s);
    } catch {
      setError('Could not save your settings.');
    }
  };

  if (!token) return <Login onToken={signIn} error={error} />;

  return (
    <Shell
      user={user}
      active={view}
      onNavigate={setView}
      onSignOut={signOut}
      onRefresh={() => token && load(token)}
      loading={loading}
    >
      {error && (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </div>
      )}

      {view === 'overview' && (
        <Overview events={events} armed={armed} muted={muted} settings={settings} logs={logs} onNavigate={setView} />
      )}
      {view === 'calendar' && (
        <CalendarView
          events={events}
          armed={armed}
          muted={muted}
          settings={settings}
          onCreate={create}
          onUpdate={update}
          onDelete={remove}
          onSetArm={setArm}
          onSetMuted={setMut}
        />
      )}
      {view === 'logs' && <CallLogs logs={logs} />}
      {view === 'settings' &&
        (settings ? (
          <Settings key={user?.email ?? 'me'} settings={settings} onSave={saveSettings} />
        ) : (
          <p className="text-sm text-ink-3">Loading your settings…</p>
        ))}
      {view === 'account' && <Account user={user} onSignOut={signOut} />}
    </Shell>
  );
}
