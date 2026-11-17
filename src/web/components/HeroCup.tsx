// The hero mascot: one dispenser pouring berry into a layered cup. Hyper-gloss SVG —
// layered gradients, ice grain, condensation, a sheen that sweeps the glass, and a face.
// GSAP (CandyMotion) pours the cup full, then tops it up every few seconds.
export function HeroCup() {
  return (
    <div className="hero__art" id="heroArt" aria-hidden="true">
      <i className="blob blob--razz" />
      <i className="blob blob--lime" />
      <i className="blob blob--mango" />
      <i className="blob blob--grape" />

      <svg className="hero__cup" id="cup3d" viewBox="0 0 260 560">
        <defs>
          <linearGradient id="dispBody" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fdfeff" />
            <stop offset=".4" stopColor="#eef4f8" />
            <stop offset=".8" stopColor="#ccdce6" />
            <stop offset="1" stopColor="#e6eef3" />
          </linearGradient>
          <linearGradient id="streamG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ff8ab5" />
            <stop offset=".6" stopColor="#ff4d8d" />
            <stop offset="1" stopColor="#d92865" />
          </linearGradient>
          <linearGradient id="cupSide" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fdfeff" />
            <stop offset=".35" stopColor="#eef4f8" />
            <stop offset=".78" stopColor="#c9d9e2" />
            <stop offset="1" stopColor="#e6eef3" />
          </linearGradient>
          <radialGradient id="slushB" cx=".32" cy=".25" r="1">
            <stop offset="0" stopColor="#ff8ab5" />
            <stop offset=".45" stopColor="#ff4d8d" />
            <stop offset="1" stopColor="#d92865" />
          </radialGradient>
          <radialGradient id="slushR" cx=".32" cy=".25" r="1">
            <stop offset="0" stopColor="#7cd7ff" />
            <stop offset=".5" stopColor="#35b6f5" />
            <stop offset="1" stopColor="#1488bd" />
          </radialGradient>
          <radialGradient id="slushM" cx=".32" cy=".25" r="1">
            <stop offset="0" stopColor="#ffe08a" />
            <stop offset=".5" stopColor="#ffc226" />
            <stop offset="1" stopColor="#dd9600" />
          </radialGradient>
          <linearGradient id="rimGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset=".6" stopColor="#f2f7fa" />
            <stop offset="1" stopColor="#d3e0e8" />
          </linearGradient>
          <linearGradient id="strawGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#c39afc" />
            <stop offset=".5" stopColor="#9a5ce8" />
            <stop offset="1" stopColor="#7a3fd6" />
          </linearGradient>
          <radialGradient id="shadowGrad" cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="#4a0e33" stopOpacity=".32" />
            <stop offset="1" stopColor="#4a0e33" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="dropGrad" cx=".35" cy=".3" r=".9">
            <stop offset="0" stopColor="#ffffff" stopOpacity=".95" />
            <stop offset=".7" stopColor="#e8f2f8" stopOpacity=".5" />
            <stop offset="1" stopColor="#cfe0ea" stopOpacity=".2" />
          </radialGradient>
          <filter id="grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .5 0" />
            <feComposite operator="in" in2="SourceGraphic" />
          </filter>
          <filter id="soft"><feGaussianBlur stdDeviation="1.1" /></filter>
          <clipPath id="cupclip"><path d="M52 70h156l-22 210a22 22 0 0 1-22 20H96a22 22 0 0 1-22-20z" /></clipPath>
        </defs>

        {/* the dispenser */}
        <g id="disp">
          <rect x="58" y="26" width="144" height="96" rx="16" fill="url(#dispBody)" stroke="#4a0e33" strokeWidth="5" />
          <rect x="74" y="42" width="112" height="64" rx="10" fill="#eef5f9" stroke="#4a0e33" strokeWidth="4" />
          <rect id="tankLvl" x="76" y="44" width="108" height="60" rx="8" fill="url(#slushB)" />
          <path d="M76 52q14 -6 27 0t27 0 27 0 27 0" fill="none" stroke="#ff8ab5" strokeWidth="3" opacity=".8" />
          <rect x="76" y="44" width="108" height="20" rx="8" fill="#fff" opacity=".28" />
          <rect x="94" y="10" width="72" height="18" rx="9" fill="#ff4d8d" stroke="#4a0e33" strokeWidth="4" />
          <rect id="lever" x="188" y="66" width="13" height="34" rx="6" fill="#ffc226" stroke="#4a0e33" strokeWidth="4" />
          <rect x="116" y="120" width="28" height="14" rx="5" fill="#c9d9e2" stroke="#4a0e33" strokeWidth="4" />
          <path d="M124 134h12l-3 10h-6z" fill="#c9d9e2" stroke="#4a0e33" strokeWidth="4" strokeLinejoin="round" />
          {/* drip tray */}
          <rect x="102" y="148" width="56" height="7" rx="3.5" fill="#b7c7d2" stroke="#4a0e33" strokeWidth="3" />
          <rect x="64" y="32" width="15" height="84" rx="7" fill="#fff" opacity=".5" />
        </g>

        {/* the pour */}
        <g id="pourGroup">
          <rect x="124" y="156" width="13" height="106" rx="6" fill="url(#streamG)" />
          <rect x="129" y="156" width="3.6" height="106" rx="2" fill="#fff" opacity=".45" />
        </g>

        <ellipse id="cupShadow" cx="130" cy="504" rx="88" ry="13" fill="url(#shadowGrad)" />

        <g transform="translate(0 190)">
          <g id="cupBob">
            {/* cup wall */}
            <path d="M52 70h156l-22 210a22 22 0 0 1-22 20H96a22 22 0 0 1-22-20z" fill="url(#cupSide)" />
            {/* the slush, three flavours */}
            <g clipPath="url(#cupclip)">
              <g id="topLayer">
                <rect id="layM" x="52" y="108" width="156" height="200" fill="url(#slushM)" />
                <ellipse cx="130" cy="108" rx="78" ry="9" fill="#ffe08a" opacity=".9" />
              </g>
              <rect id="layR" x="52" y="152" width="156" height="160" fill="url(#slushR)" />
              <ellipse cx="130" cy="152" rx="78" ry="8" fill="#8fdcff" opacity=".85" />
              <rect id="layB" x="52" y="196" width="156" height="120" fill="url(#slushB)" />
              <ellipse cx="130" cy="196" rx="78" ry="8" fill="#ff8ab5" opacity=".85" />
              {/* ice grain over the slush */}
              <rect x="52" y="100" width="156" height="200" filter="url(#grain)" opacity=".28" />
              {/* ice chips */}
              <rect x="92" y="206" width="13" height="9" rx="3" fill="#fff" opacity=".65" transform="rotate(-14 98 210)" />
              <rect x="150" y="164" width="11" height="8" rx="3" fill="#fff" opacity=".6" transform="rotate(12 156 168)" />
              <rect x="116" y="118" width="10" height="7" rx="3" fill="#fff" opacity=".6" transform="rotate(-8 121 121)" />
              {/* sparkles */}
              <g className="sparkle" fill="#fff" opacity=".85">
                <path d="M96 128l2.2 5 5 2.2-5 2.2-2.2 5-2.2-5-5-2.2 5-2.2z" />
                <path d="M168 176l1.8 4 4 1.8-4 1.8-1.8 4-1.8-4-4-1.8 4-1.8z" />
                <path d="M138 230l1.6 3.6 3.6 1.6-3.6 1.6-1.6 3.6-1.6-3.6-3.6-1.6 3.6-1.6z" />
              </g>
              {/* bubbles */}
              <g fill="#fff" opacity=".55">
                <circle id="bub1" cx="86" cy="270" r="3.4" />
                <circle id="bub2" cx="150" cy="284" r="2.6" />
                <circle id="bub3" cx="176" cy="252" r="3" />
                <circle id="bub4" cx="112" cy="248" r="2.2" />
              </g>
            </g>
            {/* left specular highlight */}
            <rect x="64" y="86" width="24" height="196" rx="12" fill="#fff" opacity=".5" filter="url(#soft)" />
            <rect x="176" y="92" width="10" height="180" rx="5" fill="#7c93a3" opacity=".28" filter="url(#soft)" />
            {/* the sheen that sweeps the glass */}
            <g clipPath="url(#cupclip)">
              <rect id="sheen" x="-120" y="60" width="34" height="280" fill="#fff" opacity=".32" transform="rotate(16 0 0)" />
            </g>
            {/* face on the front of the cup */}
            <g id="face">
              <circle cx="102" cy="230" r="9" fill="#4a0e33" />
              <circle cx="152" cy="230" r="9" fill="#4a0e33" />
              <circle cx="105" cy="227" r="3" fill="#fff" />
              <circle cx="155" cy="227" r="3" fill="#fff" />
              <path d="M108 254q22 18 44 0" fill="none" stroke="#4a0e33" strokeWidth="7" strokeLinecap="round" />
              <circle cx="80" cy="248" r="7" fill="#fff" opacity=".4" />
              <circle cx="176" cy="248" r="7" fill="#fff" opacity=".4" />
            </g>
            {/* condensation, sliding down slowly */}
            <g id="drips">
              <circle cx="196" cy="150" r="4.4" fill="url(#dropGrad)" />
              <circle cx="188" cy="220" r="3.4" fill="url(#dropGrad)" />
              <circle cx="202" cy="188" r="2.8" fill="url(#dropGrad)" />
              <circle cx="66" cy="176" r="3.6" fill="url(#dropGrad)" />
              <circle cx="60" cy="236" r="2.6" fill="url(#dropGrad)" />
            </g>
            {/* rim */}
            <ellipse cx="130" cy="70" rx="78" ry="12" fill="url(#rimGrad)" stroke="#4a0e33" strokeWidth="6" />
            {/* straw, dropped in last */}
            <g id="straw">
              <rect x="152" y="4" width="15" height="86" rx="7" fill="url(#strawGrad)" stroke="#4a0e33" strokeWidth="4" transform="rotate(16 160 47)" />
              <rect x="156" y="10" width="4" height="72" rx="2" fill="#fff" opacity=".5" transform="rotate(16 160 47)" />
            </g>
            {/* outline: sides and bottom only, so no line crosses the rim */}
            <path d="M52 70L74 280A22 22 0 0 0 96 300L164 300A22 22 0 0 0 186 280L208 70" fill="none" stroke="#4a0e33" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      </svg>
    </div>
  );
}
