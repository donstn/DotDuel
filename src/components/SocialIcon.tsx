import type { SocialLink } from '../social';

export function SocialIcon({ link, size = 16 }: { link: SocialLink; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      <path fill="currentColor" d={link.icon} />
    </svg>
  );
}
