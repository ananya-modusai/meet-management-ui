export interface Attendee {
  email: string;
  displayName?: string;
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  organizer?: boolean;
  self?: boolean;
}

export interface CalendarEvent {
  id: string;
  summary?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  attendees?: Attendee[];
  hangoutLink?: string;
  htmlLink?: string;
}

export interface LineSettings {
  /** Number we call, E.164 (e.g. +919876543210). */
  phone: string;
  /** What the voice agent speaks when the call connects. Plain text only. */
  message: string;
  /** How many minutes before a meeting the call goes out. */
  leadMinutes: number;
  /** all = every meeting rings unless muted; manual = only explicitly armed meetings ring. */
  alertMode: 'all' | 'manual';
}

export interface UserProfile {
  email: string;
  name?: string;
  picture?: string;
}

export type CallStatus = 'completed' | 'no-answer' | 'failed' | 'queued';

export interface CallLog {
  id: string;
  meeting: string;
  phone: string;
  /** ISO timestamp the call was placed. */
  at: string;
  status: CallStatus;
  durationSec?: number;
}

export type ViewKey = 'overview' | 'calendar' | 'logs' | 'settings' | 'account';
export type CalendarMode = 'month' | 'week' | 'day';
