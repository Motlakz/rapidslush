import { site } from '@/lib/site';
import { PlayButton } from './PlayButton';

const LINKS = [
  ['machines', 'Machines'],
  ['rush', 'The rush'],
  ['shack', 'The shack'],
  ['faq', 'Questions'],
] as const;

/** The candy pill nav; on phones the links fold into a plain <details> menu (no JS). */
export function SiteNav({ home = '' }: { home?: '' | '/' }) {
  const to = (id: string) => `${home}#${id}`;
  const links = LINKS.map(([id, label]) => (
    <div key={id}>
      <a href={to(id)}>{label}</a>
    </div>
  ));
  return (
    <header className="nav">
      <a className="logo" href={home ? '/' : '#top'} aria-label={`${site.name} home`}>
        <svg viewBox="0 0 64 72" aria-hidden="true">
          <path d="M8 14h48l-7 46a8 8 0 0 1-8 7H23a8 8 0 0 1-8-7z" fill="#fff" stroke="#4a0e33" strokeWidth="4" strokeLinejoin="round" />
          <path d="M14 34h36l-3 24a8 8 0 0 1-8 6H25a8 8 0 0 1-8-6z" fill="#ff4d8d" />
          <path d="M40 14l8-10" stroke="#4a0e33" strokeWidth="4" strokeLinecap="round" />
        </svg>
        {site.name}
      </a>
      <nav className="nav__links" aria-label="Main">{links}</nav>
      <details className="nav__m">
        <summary aria-label="Menu">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M2 5h14M2 13h14" stroke="#4a0e33" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </summary>
        <nav className="nav__m-list" aria-label="Main">{links}</nav>
      </details>
      <PlayButton compact />
    </header>
  );
}
