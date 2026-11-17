import { game } from '@/lib/site';

const SPARK = 'M12 3c1.6 4.6 4.4 7.4 9 9-4.6 1.6-7.4 4.4-9 9-1.6-4.6-4.4-7.4-9-9 4.6-1.6 7.4-4.4 9-9z';

function Run({ hidden }: { hidden?: boolean }) {
  return (
    <div className="ticker__run" aria-hidden={hidden || undefined}>
      {game.flavours.map(f => (
        <span key={f} style={{ display: 'contents' }}>
          <i>{f}</i>
          <svg viewBox="0 0 24 24"><path d={SPARK} /></svg>
        </span>
      ))}
    </div>
  );
}

/** The flavour ticker: one berry band the shack's flavours run across, forever. */
export function Ticker() {
  return (
    <div className="ticker" role="presentation">
      <div className="ticker__track">
        <Run />
        <Run hidden />
      </div>
    </div>
  );
}
