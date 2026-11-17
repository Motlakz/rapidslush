// The flavour ticker: one berry band the shack's six flavours run across, forever. Decorative — the
// second track is a screen-reader-hidden copy that keeps the loop seamless.
const FLAVOURS = ['Berry', 'Blue Razz', 'Lime', 'Mango', 'Grape', 'Cola'];

function Track({ hidden }: { hidden?: boolean }) {
  return (
    <div className="marquee__track" aria-hidden={hidden || undefined}>
      {[0, 1].map(copy => (
        <span className="marquee__run" key={copy}>
          {FLAVOURS.map((f, i) => (
            <span className="marquee__item" key={f}>
              {f}
              <svg className="marquee__dot" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3c1.6 4.6 4.4 7.4 9 9-4.6 1.6-7.4 4.4-9 9-1.6-4.6-4.4-7.4-9-9 4.6-1.6 7.4-4.4 9-9z" />
              </svg>
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}

export function FlavourMarquee() {
  return (
    <div className="marquee" role="presentation">
      <div className="marquee__band">
        <Track />
        <Track hidden />
      </div>
    </div>
  );
}
