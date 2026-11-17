// The opening curtain: the cup fills, the wordmark rises, then the panel lifts away
// (CandyMotion plays it; noscript and gsap-off hide it entirely).
export function Loader() {
  return (
    <div className="loader" aria-hidden="true">
      <div className="loader__inner">
        <svg className="loader__cup" viewBox="0 0 64 72">
          <defs><clipPath id="ldclip"><path d="M8 14h48l-7 46a8 8 0 0 1-8 7H23a8 8 0 0 1-8-7z" /></clipPath></defs>
          <g clipPath="url(#ldclip)"><rect id="ldfill" x="8" y="10" width="48" height="60" fill="#ff4d8d" /></g>
          <path d="M8 14h48l-7 46a8 8 0 0 1-8 7H23a8 8 0 0 1-8-7z" fill="none" stroke="#4a0e33" strokeWidth="4" strokeLinejoin="round" />
          <path d="M40 14l8-10" stroke="#4a0e33" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <p className="loader__word" id="ldword">
          {'Rapid Slush'.split('').map((ch, i) => <span key={i}>{ch === ' ' ? ' ' : ch}</span>)}
        </p>
      </div>
    </div>
  );
}
