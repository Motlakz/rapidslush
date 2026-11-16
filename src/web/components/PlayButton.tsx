import { site } from '@/lib/site';

/** The Google Play mark, in its four colours. */
function PlayMark() {
  return (
    <svg className="play-btn__mark" viewBox="0 0 24 26" width="20" height="22" aria-hidden="true">
      <path d="M1.2 0.6 13.5 12.9 1.2 25.3C0.8 25 0.5 24.5 0.5 23.8V2C0.5 1.4 0.8 0.9 1.2 0.6Z" fill="#00A0FF" />
      <path d="M17.6 17 13.5 12.9 17.6 8.8 22.5 11.6C23.9 12.4 23.9 13.5 22.5 14.3Z" fill="#FFBC00" />
      <path d="M17.6 17 13.5 12.9 1.2 25.3C1.7 25.8 2.4 25.8 3.3 25.3Z" fill="#FF3A44" />
      <path d="M17.6 8.8 3.3 0.6C2.4 0.1 1.7 0.1 1.2 0.6L13.5 12.9Z" fill="#32A071" />
    </svg>
  );
}

/** The one main action everywhere on the site: the game's Google Play page. */
export function PlayButton({ compact = false }: { compact?: boolean }) {
  return (
    <a className="btn btn--primary play-btn" href={site.playUrl} rel="noopener">
      <PlayMark />
      {compact ? 'Get it on Google Play' : <span className="play-btn__text"><small>Get it on</small>Google Play</span>}
    </a>
  );
}
