import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Leaf,
  CircleDollarSign,
  CalendarDays,
  HeartHandshake,
} from "lucide-react";
export function Landing({
  onCreate,
  onExample,
  firebase,
}: {
  onCreate: () => void;
  onExample: () => void;
  firebase: boolean;
}) {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="line" /> A LITTLE INTENTION. A BEAUTIFUL OCCASION.
          </div>
          <h1>
            More moments.
            <br />
            Less <em>overwhelm.</em>
          </h1>
          <p className="hero-description">
            From the first idea to the final toast, bring your celebration
            together with a thoughtful plan, a clear budget, and a little help
            from AI.
          </p>
          <div className="hero-actions">
            <button className="button primary" onClick={onCreate}>
              Plan your occasion
              <ArrowUpRight size={19} />
            </button>
            <button className="text-button" onClick={onExample}>
              Explore a sample <ArrowRight size={17} />
            </button>
          </div>
          <p className="hero-note">
            <span className="tiny-flower">✳</span> For weddings, birthdays,
            anniversaries & gathering together.
          </p>
        </div>
        <div
          className="hero-art"
          aria-label="Illustrated garden celebration with a sample planning card"
        >
          <div className="arch-art">
            <svg
              viewBox="0 0 400 480"
              role="img"
              aria-label="A botanical illustration of an intimate table setting"
            >
              <defs>
                <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
                  <stop stopColor="#e8dfcd" />
                  <stop offset="1" stopColor="#c5c5ae" />
                </linearGradient>
              </defs>
              <path
                d="M0 200A200 200 0 0 1 400 200V480H0Z"
                fill="url(#paper)"
              />
              <path
                d="M50 480V210a150 150 0 0 1 300 0v270"
                fill="none"
                stroke="#f7f3e8"
                strokeWidth="2"
              />
              <path
                d="M29 475q45-240 102-345M360 475q-51-215-109-323"
                stroke="#667c59"
                fill="none"
                strokeWidth="3"
              />
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <g key={n} fill={n % 2 ? "#80936a" : "#536e51"} opacity=".8">
                  <ellipse
                    cx={43 + n * 11}
                    cy={423 - n * 43}
                    rx="10"
                    ry="27"
                    transform={`rotate(${-32 + n * 4} ${43 + n * 11} ${423 - n * 43})`}
                  />
                  <ellipse
                    cx={74 + n * 11}
                    cy={400 - n * 39}
                    rx="10"
                    ry="25"
                    transform={`rotate(38 ${74 + n * 11} ${400 - n * 39})`}
                  />
                  <ellipse
                    cx={350 - n * 13}
                    cy={426 - n * 40}
                    rx="10"
                    ry="25"
                    transform={`rotate(30 ${350 - n * 13} ${426 - n * 40})`}
                  />
                </g>
              ))}
              <ellipse cx="205" cy="394" rx="139" ry="43" fill="#f4eedf" />
              <path
                d="M67 394l-18 86h313l-18-86q-135 67-277 0"
                fill="#faf6eb"
              />
              <ellipse cx="205" cy="393" rx="139" ry="40" fill="#e8deca" />
              <ellipse cx="205" cy="394" rx="129" ry="34" fill="#f7f1e5" />
              {[118, 288].map((x) => (
                <g key={x}>
                  <ellipse cx={x} cy="397" rx="27" ry="12" fill="#d4c39b" />
                  <ellipse cx={x} cy="397" rx="23" ry="9" fill="#fffaf1" />
                  <path d={`M${x - 9} 390l20 5-16 9Z`} fill="#657a61" />
                </g>
              ))}
              <path d="M183 342h42l-7 49h-28Z" fill="#c8aa7d" />
              <g stroke="#687d53" strokeWidth="2">
                <path d="M200 350v-78m8 79l26-66m-36 66l-32-57" />
              </g>
              {[
                [200, 275],
                [234, 286],
                [168, 295],
              ].map(([x, y], i) => (
                <g key={i} fill="#fbf0d5">
                  <circle cx={x} cy={y} r="13" />
                  <circle cx={(x ?? 0) - 8} cy={(y ?? 0) - 8} r="8" />
                  <circle cx={(x ?? 0) + 8} cy={(y ?? 0) - 8} r="8" />
                  <circle cx={x} cy={y} r="4" fill="#c9a66b" />
                </g>
              ))}
              <path
                d="M155 360v32m-6 0h12m90-32v32m-6 0h12"
                stroke="#b69a64"
                strokeWidth="3"
              />
              <path d="M152 333h6v29h-6m90-29h6v29h-6" fill="#fffaf0" />
              <path
                d="M155 329q-6-8 0-13q6 5 0 13m90 0q-6-8 0-13q6 5 0 13"
                fill="#a56f36"
              />
            </svg>
            <span className="art-caption">THE ART OF COMING TOGETHER</span>
          </div>
          <div className="floating-note">
            <span className="note-icon">
              <Check size={16} />
            </span>
            <div>
              <strong>A place for every detail.</strong>
              <small>And a little more room to enjoy it.</small>
            </div>
          </div>
          <div className="hero-stamp">
            <Leaf size={22} />
            <span>
              Thoughtfully
              <br />
              brought together
            </span>
          </div>
        </div>
      </section>
      <div className="promise-strip">
        <span>
          BIG DAYS. SMALL GATHERINGS. <em>All yours.</em>
        </span>
        <span>
          YOUR VISION <i /> YOUR BUDGET <i /> YOUR KIND OF CELEBRATION
        </span>
      </div>
      <section id="how-it-works" className="how-section">
        <div className="section-heading">
          <span className="eyebrow">A CALMER WAY TO PLAN</span>
          <h2>
            From “what if” to <em>“it’s happening.”</em>
          </h2>
          <p>
            One considered workspace for the creative ideas and the practical
            details.
          </p>
        </div>
        <div className="feature-grid">
          {[
            {
              icon: CircleDollarSign,
              title: "A budget with breathing room",
              copy: "See every allocation, protect a contingency reserve, and know where you stand.",
              n: "01",
            },
            {
              icon: CalendarDays,
              title: "The right thing, at the right time",
              copy: "A connected checklist keeps prerequisites, deadlines and next steps in view.",
              n: "02",
            },
            {
              icon: HeartHandshake,
              title: "Ideas that feel like you",
              copy: "Explore possibilities, compare changes, and decide what deserves a place in your day.",
              n: "03",
            },
          ].map((f) => (
            <article key={f.n} className="feature">
              <div className="feature-top">
                <f.icon size={25} strokeWidth={1.25} />
                <span>{f.n}</span>
              </div>
              <h3>{f.title}</h3>
              <p>{f.copy}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="invitation">
        <span className="eyebrow">BEGIN WITH WHAT MATTERS</span>
        <h2>A celebration that feels like you.</h2>
        <p>
          {firebase
            ? "Your ideas, organized with Gemini and saved to your private account."
            : "Try the complete workspace with a deterministic example. No account needed."}
        </p>
        <button className="button cream" onClick={onCreate}>
          Let’s bring it together <ArrowUpRight size={18} />
        </button>
      </section>
    </>
  );
}
