// "At a glance": one mango band, four fat numbers that count up as they come into view (CandyMotion counts).
const FACTS = [
  { n: 130, label: 'levels, two machines' },
  { n: 6, label: 'flavours on tap' },
  { n: 4, label: 'toppings upstairs' },
  { n: 0, label: 'ads, anywhere' },
];

export function AtGlance() {
  return (
    <section className="stats" aria-label="The shack at a glance">
      <div className="wrap stats__row">
        {FACTS.map(f => (
          <div className="stat io" key={f.label}>
            <b data-count={f.n}>{String(f.n)}</b>
            <span>{f.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
