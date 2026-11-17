import { policies, site } from '@/lib/site';

const LINKS = [
  ['machines', 'Machines'],
  ['rush', 'The rush'],
  ['shack', 'The shack'],
  ['faq', 'Questions'],
] as const;

/** The plum footer: the shack's directory and the legal row. */
export function SiteFooter({ home = '' }: { home?: '' | '/' }) {
  const to = (id: string) => `${home}#${id}`;
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__grid">
          <div>
            <a className="logo" href={home ? '/' : '#top'} style={{ color: 'var(--cream)' }}>
              <svg viewBox="0 0 64 72" style={{ width: '1.8rem' }} aria-hidden="true">
                <path d="M8 14h48l-7 46a8 8 0 0 1-8 7H23a8 8 0 0 1-8-7z" fill="none" stroke="#fff6e5" strokeWidth="4" strokeLinejoin="round" />
                <path d="M14 34h36l-3 24a8 8 0 0 1-8 6H25a8 8 0 0 1-8-6z" fill="#ff4d8d" />
                <path d="M40 14l8-10" stroke="#fff6e5" strokeWidth="4" strokeLinecap="round" />
              </svg>
              {site.name}
            </a>
            <p style={{ marginTop: '.8rem', lineHeight: 1.6, opacity: .85 }}>A slushy arcade game set in a beach shack, made for phones.</p>
          </div>
          <div>
            <h3>Game</h3>
            <ul style={{ display: 'grid', gap: '.5rem' }}>
              {LINKS.map(([id, label]) => <li key={id}><a href={to(id)}>{label}</a></li>)}
            </ul>
          </div>
          <div>
            <h3>Policies</h3>
            <ul style={{ display: 'grid', gap: '.5rem' }}>
              {policies.map(p => <li key={p.href}><a href={p.href}>{p.label}</a></li>)}
            </ul>
          </div>
        </div>
        <div className="footer__legal">
          <span>&copy; 2026 {site.name} — {site.operator}</span>
          <span><a href="/privacy/">Privacy</a> &nbsp; <a href="/terms/">Terms</a></span>
        </div>
      </div>
    </footer>
  );
}
