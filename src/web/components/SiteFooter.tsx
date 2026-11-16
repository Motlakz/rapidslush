import { policies, site } from '@/lib/site';
import { PlayButton } from './PlayButton';
import { CupSpin } from './stage/CupSpin';

/** footer.closing: row 1 the dealt close (close-word), row 2 the dealt footer-dark directory and the legal row. */
export function SiteFooter({ home = '' }: { home?: '' | '/' }) {
  const to = (id: string) => `${home}#${id}`;
  return (
    <footer className="footer closing footer--dark ground-inverse" id="contact" aria-labelledby="close-h">
      <div className="wrap">
        <div className="closing__cta close--word">
          <div className="section-head--split">
            <div>
              <h2 id="close-h">Your shift starts now</h2>
              <p className="t-lead">Rapid Slush is free on Google Play, with ten free tokens every day.</p>
            </div>
            <PlayButton />
          </div>
          <div className="close__stage">
            <p className="close__word" aria-hidden="true">{site.name}</p>
            <CupSpin />
          </div>
        </div>
        <div className="closing__links">
          <div className="grid">
            <div className="span-4 stack-4">
              <a className="nav__logo" href={home ? '/' : '#top'}><span className="mark" data-mark="arc" aria-hidden="true" />{site.name}</a>
              <p className="footer__lede">A slushy arcade game set in a beach shack, made for phones.</p>
            </div>
            <div className="span-2 footer__col">
              <h3>Game</h3>
              <ul>
                <li><a href={to('play')}>How a round works</a></li>
                <li><a href={to('machines')}>Machines</a></li>
                <li><a href={to('shack')}>The shack</a></li>
                <li><a href={to('faq')}>Questions</a></li>
              </ul>
            </div>
            <div className="span-2 footer__col">
              <h3>Policies</h3>
              <ul>
                {policies.map(p => (
                  <li key={p.href}><a href={p.href}>{p.label}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="footer__legal">
            <span>&copy; 2026 {site.name} &nbsp; <a href="/privacy/">Privacy</a> &nbsp; <a href="/terms/">Terms</a></span>
            <div className="socials" />
          </div>
        </div>
      </div>
    </footer>
  );
}
