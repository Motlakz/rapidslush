import { site } from '@/lib/site';
import { PlayButton } from './PlayButton';

const Arrow = () => (
  <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true"><path className="m-arrow__stem" d="M1 6h8" /><path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" /></svg>
);
export { Arrow };

/**
 * nav-cards (dealt): one fixed opaque bar; "Machines" opens a panel of two picture cards. `home` is "" on the home page
 * (links are #ids) and "/" on the policy pages (links go back to the home page's sections).
 */
export function SiteNav({ home = '' }: { home?: '' | '/' }) {
  const to = (id: string) => `${home}#${id}`;
  return (
    <header className="nav">
      <div className="wrap nav__bar">
        <a className="skip-link" href="#top">Skip to content</a>
        <a className="nav__logo" href={home ? '/' : '#top'}><span className="mark" data-mark="arc" aria-hidden="true" />{site.name}</a>
        <nav className="nav__links" aria-label="Main">
          <div className="nav__item"><a className="nav__link" href={to('play')}>Play</a></div>
          <div className="nav__item">
            <a className="nav__link" href={to('machines')}>Machines <svg className="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
            <div className="nav__menu">
              <div className="wrap grid">
                <a className="menu-card span-6" href={to('machines')}>
                  <div className="panel"><img className="frame__img" src="/img/machine-line.webp" alt="The Slush Line: three taps over a conveyor of cups at golden hour" loading="lazy" /></div>
                  <span className="t-card">Slush Line</span>
                  <span className="t-small muted">100 levels on a conveyor with up to three taps</span>
                </a>
                <a className="menu-card span-6" href={to('machines')}>
                  <div className="panel"><img className="frame__img" src="/img/machine-spin.webp" alt="The Spin Bar: five flavour hoppers over a turntable of milkshake glasses at night" loading="lazy" /></div>
                  <span className="t-card">Spin Bar</span>
                  <span className="t-small muted">30 levels on a turntable, opens after level 15</span>
                </a>
              </div>
            </div>
          </div>
          <div className="nav__item"><a className="nav__link" href={to('shack')}>Shack</a></div>
          <div className="nav__item"><a className="nav__link" href={to('faq')}>Questions</a></div>
        </nav>
        <div className="nav__actions">
          <PlayButton compact />
        </div>
        <button className="nav__toggle" type="button" aria-expanded="false" aria-label="Menu">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 5h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
      </div>
    </header>
  );
}
