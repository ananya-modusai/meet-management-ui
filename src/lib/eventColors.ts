export interface EventColor {
  bg: string;
  bar: string;
  text: string;
}

/** Soft, on-palette event hues (periwinkle, peach, mint, violet, blue, rose). */
export const EVENT_COLORS: EventColor[] = [
  { bg: '#e9ecff', bar: '#758bfd', text: '#2a2a73' },
  { bg: '#fff0df', bar: '#ff8600', text: '#8a4b00' },
  { bg: '#e2f5ee', bar: '#1f9d72', text: '#0f5a42' },
  { bg: '#efe9ff', bar: '#8b5cf6', text: '#54299e' },
  { bg: '#e4eeff', bar: '#3b82f6', text: '#1c3f86' },
  { bg: '#fde8f0', bar: '#ec4899', text: '#8f1d52' },
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const colorFor = (id: string): EventColor =>
  EVENT_COLORS[hash(id) % EVENT_COLORS.length];

/** Stable color (indigo/cornflower spectrum) for an attendee avatar. */
const AVATAR_COLORS = ['#27187e', '#758bfd', '#3b82f6', '#8b5cf6', '#1f9d72', '#ec4899', '#ff8600'];
export const avatarColor = (s: string): string => AVATAR_COLORS[hash(s) % AVATAR_COLORS.length];

export function initials(name: string): string {
  const parts = name.trim().split(/[\s@.]+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
