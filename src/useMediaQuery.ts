import { useEffect, useState } from 'react';

/** Live `matchMedia` result; re-renders when the query starts/stops matching. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && (window.matchMedia?.(query).matches ?? false),
  );
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Same breakpoint as the phone game layout in styles.css (score strip). */
export const PHONE_GAME_LAYOUT = '(max-width: 720px), (orientation: landscape) and (max-height: 500px)';
