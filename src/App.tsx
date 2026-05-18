import { useState, useEffect, useCallback } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { Calendar, BellOff, BellRing, LogOut, Loader2, RefreshCw } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import clsx from 'clsx';

// Types
interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  extendedProperties?: {
    private?: {
      n8n_ignore?: string;
    };
  };
}

const SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setToken(tokenResponse.access_token);
      localStorage.setItem('meet_alert_token', tokenResponse.access_token);
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      setError('Authentication failed. Please try again.');
    },
    scope: SCOPES,
    prompt: 'select_account',
  });

  const handleLogout = () => {
    googleLogout();
    setToken(null);
    setEvents([]);
    localStorage.removeItem('meet_alert_token');
  };

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const timeMin = new Date().toISOString();
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=20&orderBy=startTime&singleEvents=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data.items || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching events');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const savedToken = localStorage.getItem('meet_alert_token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchEvents();
    }
  }, [token, fetchEvents]);

  const toggleMeetingAlert = async (eventId: string, shouldIgnore: boolean) => {
    if (!token) return;

    // Optimistic update
    setEvents(prev => prev.map(evt => {
      if (evt.id === eventId) {
        return {
          ...evt,
          extendedProperties: {
            ...evt.extendedProperties,
            private: {
              ...(evt.extendedProperties?.private || {}),
              n8n_ignore: shouldIgnore ? 'true' : 'false'
            }
          }
        };
      }
      return evt;
    }));

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            extendedProperties: {
              private: {
                n8n_ignore: shouldIgnore ? "true" : "false"
              }
            }
          })
        }
      );

      if (!response.ok) throw new Error('Failed to update event metadata');
    } catch (err) {
      console.error(err);
      // Revert on error by refetching
      fetchEvents();
      alert('Failed to update alert settings. Please try again.');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-card-border rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-6">
            <BellRing className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Meet-Alert</h1>
          <p className="text-muted mb-8">
            Manage your meeting phone alerts intelligently. Mute alerts for syncs and lunches seamlessly.
          </p>
          <button
            onClick={() => login()}
            className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 px-6 rounded-xl font-medium hover:bg-gray-100 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <header className="border-b border-card-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-accent text-white p-2 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-semibold">Meet-Alert Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors px-3 py-2 rounded-md hover:bg-white/5"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Upcoming Meetings</h2>
            <p className="text-muted mt-1 text-sm">Manage Zenduty phone alerts for your events</p>
          </div>
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="p-2 text-muted hover:text-white bg-card border border-card-border rounded-lg hover:bg-card-border transition-colors disabled:opacity-50"
          >
            <RefreshCw className={clsx("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-start gap-3">
            <div className="mt-0.5">⚠️</div>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {loading && events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-accent" />
            <p>Loading your calendar...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-card border border-card-border rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted" />
            </div>
            <h3 className="text-lg font-medium mb-1">No upcoming meetings</h3>
            <p className="text-muted">You're all clear! Enjoy your free time.</p>
          </div>
        ) : (
          <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm">
            {events.map((event) => {
              const isAlerting = event.extendedProperties?.private?.n8n_ignore !== "true";
              const startDateTime = event.start.dateTime || event.start.date;
              const dateObj = startDateTime ? new Date(startDateTime) : new Date();
              
              let dateLabel = format(dateObj, 'MMM d, yyyy');
              if (isToday(dateObj)) dateLabel = 'Today';
              else if (isTomorrow(dateObj)) dateLabel = 'Tomorrow';

              return (
                <div key={event.id} className="group flex items-center justify-between p-5 border-b border-card-border last:border-0 hover:bg-white/[0.02] transition-colors">
                  <div className="pr-4">
                    <h3 className="font-medium text-lg text-white mb-1 group-hover:text-accent transition-colors">
                      {event.summary || '(No title)'}
                    </h3>
                    <p className="text-sm text-muted flex items-center gap-2">
                      <span className="font-medium">{dateLabel}</span>
                      <span className="w-1 h-1 rounded-full bg-card-border"></span>
                      <span>{event.start.dateTime ? format(dateObj, 'h:mm a') : 'All day'}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    <div className={clsx(
                      "flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full transition-colors",
                      isAlerting ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                    )}>
                      {isAlerting ? <BellRing className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                      {isAlerting ? "Alert Active" : "Muted"}
                    </div>
                    
                    <button 
                      onClick={() => toggleMeetingAlert(event.id, isAlerting)}
                      className={clsx(
                        "relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        isAlerting ? 'bg-accent' : 'bg-card-border hover:bg-card-border/80'
                      )}
                      aria-label="Toggle alert"
                    >
                      <span 
                        className={clsx(
                          "inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm",
                          isAlerting ? 'translate-x-6' : 'translate-x-1'
                        )} 
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
