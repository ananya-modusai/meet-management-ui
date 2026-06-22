import { useEffect, useState } from 'react';

/**
 * Current time as a millisecond timestamp, refreshed on an interval so that
 * relative labels ("rings in 12m", "next call …") stay live without each
 * component reading the clock impurely during render.
 */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
