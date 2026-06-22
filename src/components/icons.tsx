import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const I = (p: P) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...p,
});

export const GridIcon = (p: P) => (
  <svg {...I(p)}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
export const CalendarIcon = (p: P) => (
  <svg {...I(p)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 3v4M16 3v4" />
  </svg>
);
export const LogIcon = (p: P) => (
  <svg {...I(p)}>
    <path d="M8 4h9a2 2 0 0 1 2 2v14l-3-2-2 2-2-2-2 2-2-2-3 2V6a2 2 0 0 1 2-2Z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </svg>
);
export const SlidersIcon = (p: P) => (
  <svg {...I(p)}>
    <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="8" cy="12" r="2" />
    <circle cx="13" cy="18" r="2" />
  </svg>
);
export const UserIcon = (p: P) => (
  <svg {...I(p)}>
    <circle cx="12" cy="9" r="3.2" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);
export const PhoneIcon = (p: P) => (
  <svg {...I(p)}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  </svg>
);
export const PhoneCallIcon = (p: P) => (
  <svg {...I(p)}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    <path d="M15 3a6 6 0 0 1 6 6M15 7a2 2 0 0 1 2 2" />
  </svg>
);
export const PowerIcon = (p: P) => (
  <svg {...I(p)}>
    <path d="M12 4v8" />
    <path d="M7.5 7.5a7 7 0 1 0 9 0" />
  </svg>
);
export const RefreshIcon = (p: P) => (
  <svg {...I(p)}>
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 4v5h-5" />
  </svg>
);
export const ChevronLeft = (p: P) => (
  <svg {...I(p)}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);
export const ChevronRight = (p: P) => (
  <svg {...I(p)}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);
export const PlusIcon = (p: P) => (
  <svg {...I(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const XIcon = (p: P) => (
  <svg {...I(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const CheckIcon = (p: P) => (
  <svg {...I(p)}>
    <path d="M5 12l5 5L20 7" />
  </svg>
);
export const ClockIcon = (p: P) => (
  <svg {...I(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const PinIcon = (p: P) => (
  <svg {...I(p)}>
    <path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10Z" />
    <circle cx="12" cy="11" r="2.2" />
  </svg>
);
export const PencilIcon = (p: P) => (
  <svg {...I(p)}>
    <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
    <path d="M14 6l4 4" />
  </svg>
);
export const TrashIcon = (p: P) => (
  <svg {...I(p)}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  </svg>
);
export const VideoIcon = (p: P) => (
  <svg {...I(p)}>
    <rect x="3" y="6" width="13" height="12" rx="2" />
    <path d="M16 10l5-3v10l-5-3" />
  </svg>
);
export const BellIcon = (p: P) => (
  <svg {...I(p)}>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
);
export const GoogleG = (p: P) => (
  <svg width={18} height={18} viewBox="0 0 24 24" {...p}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);
