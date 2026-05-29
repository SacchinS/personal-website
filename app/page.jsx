'use client';
import { useState, useEffect, useRef } from 'react';
import { initNeuralNetwork, triggerNeuralReveal } from '@/lib/neural-network';

// ─── IntersectionObserver hook ────────────────────────────────────────────────
function useInView(threshold = 0.1) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function PowerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2v10"/>
      <path d="M18.4 6.6a9 9 0 1 1-12.77.04"/>
    </svg>
  );
}
function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}

// ─── Cursor label ────────────────────────────────────────────────────────────
const SCROLL_CHARS = 'SCROLL • SCROLL • '.split('');

function CursorLabel() {
  const wrapRef     = useRef(null);
  const charsRef    = useRef([]);
  const hoverElRef  = useRef(null);

  useEffect(() => {
    const wrap    = wrapRef.current;
    const chars   = charsRef.current;
    const hoverEl = hoverElRef.current;
    if (!wrap || !hoverEl) return;

    const N      = SCROLL_CHARS.length;
    const RADIUS = 30;
    const SPEED  = 0.011;

    let baseAngle = 0;
    let hovering  = false;
    let hoverCx   = 30;
    let hoverCy   = 0;
    let raf;

    const showRing = () => {
      chars.forEach(c => { if (c) c.style.opacity = '1'; });
      hoverEl.style.opacity = '0';
    };

    const showHover = text => {
      chars.forEach(c => { if (c) c.style.opacity = '0'; });
      hoverEl.textContent = text;
      hoverEl.style.opacity = '1';
    };

    const tick = () => {
      baseAngle += SPEED;

      for (let i = 0; i < N; i++) {
        if (!chars[i]) continue;
        const a   = baseAngle + (i / N) * Math.PI * 2;
        const x   = Math.cos(a) * RADIUS;
        const y   = Math.sin(a) * RADIUS;
        const deg = a * 180 / Math.PI + 90;
        chars[i].style.transform =
          `translate(calc(${x.toFixed(1)}px - 50%), calc(${y.toFixed(1)}px - 50%)) rotate(${deg.toFixed(1)}deg)`;
      }

      if (hovering) {
        hoverCx += (16 - hoverCx) * 0.15;
        hoverCy += (0  - hoverCy) * 0.15;
        hoverEl.style.transform =
          `translate(${hoverCx.toFixed(1)}px, calc(${hoverCy.toFixed(1)}px - 50%))`;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // macOS arrow cursor: ~12px wide, ~18px tall, hotspot at tip.
    const CX = 3;
    const CY = 6;

    const onMove = e => {
      wrap.style.left    = `${e.clientX + CX}px`;
      wrap.style.top     = `${e.clientY + CY}px`;
      wrap.style.opacity = '1';
    };

    const onOver = e => {
      const el      = e.target.closest('[data-cursor]');
      const wasHover = hovering;
      hovering = !!el;

      if (el && !wasHover) {
        hoverCx = 30; hoverCy = 0;
        showHover(el.dataset.cursor);
      } else if (!el && wasHover) {
        showRing();
      } else if (el && wasHover && hoverEl.textContent !== el.dataset.cursor) {
        hoverEl.style.opacity = '0';
        setTimeout(() => {
          hoverEl.textContent = el.dataset.cursor;
          hoverEl.style.opacity = '1';
        }, 100);
      }
    };

    const onLeave = () => { wrap.style.opacity = '0'; };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div ref={wrapRef} className="cursor-label-wrap" style={{ opacity: 0 }}>
      {SCROLL_CHARS.map((ch, i) => (
        <span key={i} ref={el => charsRef.current[i] = el}
          className="cursor-scroll-char">{ch}</span>
      ))}
      <span ref={hoverElRef} className="cursor-label-text" style={{ opacity: 0 }}>
        See project
      </span>
    </div>
  );
}

// ─── Intro ────────────────────────────────────────────────────────────────────
const INTRO_BEATS = [
  { text: "Hi, I'm Sacchin.", hold: 1400 },
  { text: "Welcome to my mind.", hold: 1400 },
  { text: "Hit the lights to get started.", persist: true },
];

function WordSplit({ text }) {
  return (
    <>
      {text.split(' ').map((word, i) => (
        <span key={i} className="intro__word" style={{ '--wi': i }}>
          {word}{i < text.split(' ').length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  );
}

function Intro({ onSwitch, isExiting }) {
  const [beatIndex, setBeatIndex] = useState(0);
  const [phase, setPhase] = useState('entering');
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    const beat = INTRO_BEATS[beatIndex];
    if (beat.persist) return;
    const wordCount = beat.text.split(' ').length;
    const enterMs = wordCount * 70 + 650;
    let t;
    if (phase === 'entering') t = setTimeout(() => setPhase('holding'), enterMs);
    else if (phase === 'holding') t = setTimeout(() => setPhase('exiting'), beat.hold);
    else if (phase === 'exiting') t = setTimeout(() => { setBeatIndex(i => i + 1); setPhase('entering'); }, 420);
    return () => clearTimeout(t);
  }, [beatIndex, phase]);

  const handleSwitch = () => {
    if (activated) return;
    setActivated(true);
    triggerNeuralReveal();
    setTimeout(() => onSwitch(), 120);
  };

  useEffect(() => {
    const onKey = e => { if (e.code === 'Space') { e.preventDefault(); handleSwitch(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activated]);

  const showSwitch = !!INTRO_BEATS[beatIndex]?.persist;

  return (
    <div className={`intro ${isExiting ? 'intro--exiting' : ''}`}>
      <div className={`intro__text-wrap ${activated ? 'is-done' : ''}`}>
        {INTRO_BEATS.map((beat, i) => {
          const stateClass = i === beatIndex ? `is-${phase}` : i < beatIndex ? 'is-past' : '';
          return (
            <div key={i} className={`intro__text ${stateClass}`}>
              <WordSplit text={beat.text} />
            </div>
          );
        })}
      </div>
      <div className={`switch-wrap ${showSwitch ? 'is-visible' : ''} ${activated ? 'is-done' : ''}`}>
        <button className={`switch-btn ${activated ? 'is-on' : ''}`}
          onClick={handleSwitch} aria-label="Turn on the lights">
          <PowerIcon />
        </button>
      </div>
    </div>
  );
}

// ─── Neural Background ────────────────────────────────────────────────────────
let nnInitialized = false;

function NeuralBackground() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || nnInitialized) return;
    nnInitialized = true;
    initNeuralNetwork(ref.current);
  }, []);
  return <canvas ref={ref} className="neural-bg" />;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ item, type, onClose }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close"><XIcon /></button>
        {type === 'project' ? (
          <div className="modal-body">
            <div className="modal-header">
              <span className="modal-n">{item.n}</span>
              {item.status === 'Active' && <span className="modal-status modal-status--active">{item.status}</span>}
              {item.status?.includes('Place') && <span className="modal-status modal-status--place">{item.status}</span>}
            </div>
            <h2 className="modal-title">{item.title}</h2>
            <p className="modal-year">{item.year}</p>
            <p className="modal-detail">{item.detail}</p>
            <div className="modal-tags">
              {item.tags.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
            {item.links && item.links.length > 0 && (
              <div className="modal-links">
                {item.links.map(({ label, url }) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className={`modal-link modal-link--${label.toLowerCase().replace(/[^a-z]/g, '')}`}>
                    {label} <span>↗</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="modal-body">
            <p className="modal-period">{item.period}</p>
            <h2 className="modal-title">{item.role}</h2>
            <p className="modal-org">{item.org}</p>
            <p className="modal-detail">{item.extended}</p>
            <div className="modal-tags">
              {item.tech.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ innerRef }) {
  return (
    <section className="hero" ref={innerRef}>
      <div className="hero__inner">
        <h1 className="hero__title">
          <span className="hero__label">Sacchin's</span>
          <span className="hero__word">Mindscape</span>
        </h1>
      </div>
    </section>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────
function About() {
  const [ref, inView] = useInView(0.08);
  return (
    <section className="about-section" id="about">
      <div ref={ref} className={`about-inner ${inView ? 'in-view' : ''}`}>
        <div className="eyebrow"><span className="eyebrow__n">01</span><span className="eyebrow__label">About</span></div>
        <div className="about-grid">
          <div className="about-text">
            <p className="about-lede">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <p className="about-body">
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
          </div>
          <aside className="about-aside">
            <dl className="meta-list">
              <div><dt>Based in</dt><dd>Seattle, WA</dd></div>
              <div><dt>Working on</dt><dd>Fantasy cricket + accessible tech</dd></div>
              <div><dt>Reading</dt><dd>The Overton Window</dd></div>
              <div><dt>Studying</dt><dd>BS CS, University of Washington (2028)</dd></div>
              <div><dt>Off-keyboard</dt><dd>Sports, guitar, movies</dd></div>
            </dl>
          </aside>
        </div>
      </div>
    </section>
  );
}

// ─── Experience ───────────────────────────────────────────────────────────────
const EXPERIENCE = [
  {
    role: 'Software Engineer',
    org: 'Sixers Fantasy',
    logo: '/logos/sixers-fantasy.png',
    period: 'Oct 2025 to present',
    detail: 'Built the live scoring engine and trade system for a fantasy cricket startup.',
    extended: 'Built a ball-by-ball live scoring engine in Next.js and TypeScript tracking runs, wickets, extras, and player stats (batting, bowling, fielding) with undo capability and automatic innings switching. Implemented a trade and waiver wire system across AWS Lambda with pessimistic locking to prevent race conditions. Designed a multi-tenant league dashboard scoped per user via Amazon Cognito, backed by PostgreSQL RDS with a relational schema spanning leagues, seasons, teams, players, and per-ball timeline events.',
    tech: ['Next.js', 'TypeScript', 'AWS Lambda', 'PostgreSQL', 'Amazon Cognito'],
  },
  {
    role: 'Technical Instructor',
    org: 'iCode Sammamish',
    logo: '/logos/icode.png',
    period: 'June 2024 to Nov 2024',
    detail: 'Taught summer camps in robotics, programming, and 3D printing for 10+ students.',
    extended: 'Taught summer camps covering VEX Robotics, Java, Python, web development, and 3D printing. Mentored students through weekly robotics classes, providing individualized guidance, feedback, and skill-based support across varying skill levels.',
    tech: ['VEX Robotics', 'Java', 'Python', 'HTML/CSS', '3D Printing'],
  },
  {
    role: 'Parts Manager / Member',
    org: 'Exothermic Robotics',
    logo: '/logos/exothermic.png',
    period: 'May 2023 to May 2024',
    detail: 'Managed parts logistics and programmed autonomous routines for a competitive VEX team.',
    extended: 'Filed part orders, tracked shipments, and coordinated efficient resource sharing across multiple teams. Programmed in C++ using PROS, OkapiLib, and LemLib; integrated optical shaft encoders and wrote, calibrated, and optimized PID control loops for precise autonomous motion and consistent robot performance.',
    tech: ['C++', 'PROS', 'OkapiLib', 'LemLib'],
  },
  {
    role: 'Co-Founder, VP, PR Officer',
    org: 'Tesla STEM Arduino Club',
    logo: '/logos/tesla-stem.png',
    period: 'Sep 2023 to June 2025',
    detail: 'Co-founded and led a school electronics club, securing $800 in funding.',
    extended: 'Secured $800 in funding from the STEM Associated Student Body to purchase Arduino kits and essential electronics. Taught members the basics of Arduino and C++ programming, developing a curriculum tailored to their interests and growing the club from scratch.',
    tech: ['Arduino', 'C++'],
  },
];

function Experience({ openModal }) {
  const [ref, inView] = useInView(0.05);
  return (
    <section className="exp-section" id="experience">
      <div ref={ref} className={`exp-inner ${inView ? 'in-view' : ''}`}>
        <div className="eyebrow"><span className="eyebrow__n">02</span><span className="eyebrow__label">Experience</span></div>
        <div className="timeline">
          <div className="timeline-line" />
          {EXPERIENCE.map((e, i) => (
            <div key={i} className="timeline-item" style={{ '--ti': i }}
              data-cursor="See experience"
              onClick={() => openModal(e, 'experience')} role="button" tabIndex={0}
              onKeyDown={ev => { if (ev.key === 'Enter') openModal(e, 'experience'); }}>
              <div className="timeline-dot" />
              <div className="timeline-body">
                <span className="timeline-period">{e.period}</span>
                <h3 className="timeline-role">{e.role}</h3>
                <span className="timeline-org">{e.org}</span>
                <p className="timeline-detail">{e.detail}</p>
              </div>
              <div className="timeline-right">
                {e.logo && <img className="timeline-logo" src={e.logo} alt={e.org} />}
                <span className="timeline-arrow">↗</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Projects ─────────────────────────────────────────────────────────────────
const PROJECTS = [
  {
    n: '01', title: 'Sixers Fantasy', year: 'Oct 2025 – Present', status: 'Active',
    image: '/images/sixers-fantasy.png',
    blurb: 'Fantasy cricket platform. Engineered the ball-by-ball live scoring engine and trade/waiver wire system.',
    detail: 'Engineered the live scoring and trade infrastructure for a fantasy cricket startup. The scoring engine tracks ball-by-ball events (runs, wickets, extras, and per-player stats: batting, bowling, fielding) with undo support and automatic innings switching. The trade and waiver wire system uses pessimistic locking across AWS Lambda to handle concurrent writes without race conditions, backed by PostgreSQL RDS and scoped per-user via Amazon Cognito.',
    tags: ['Next.js', 'TypeScript', 'AWS Lambda', 'PostgreSQL', 'Amazon Cognito'],
    links: [{ label: 'GitHub', url: 'https://github.com/orgs/SixersApp/repositories' }],
  },
  {
    n: '02', title: 'Kural', year: 'May 2026', status: '1st Place',
    image: '/images/kural.png',
    blurb: 'AI-powered AAC device for ALS patients that speaks in their own cloned voice.',
    detail: 'AWS Hacks 2026, 1st Place (Cloud for Good Track). Generates contextually personalized sentences via Amazon Bedrock (Claude Haiku 4.5) and speaks them in the patient\'s preserved voice. Fine-tuned Coqui XTTS v2 on SageMaker (ml.g4dn.xlarge) on 30 personal recordings, achieving 20-25 second end-to-end latency. Shipped a Next.js PWA with iOS Eye Tracking auto-click selection, Amazon Cognito auth, offline fallback, and a real-time caregiver context panel.',
    tags: ['AWS Bedrock', 'SageMaker', 'Lambda', 'Next.js'],
    links: [{ label: 'Devpost', url: 'https://devpost.com/software/kural-gxylzb' }],
  },
  {
    n: '03', title: 'Husky Robotics', year: '2025', status: 'Active',
    image: '/images/husky-robotics.png',
    blurb: 'Zero-shot object detection pipeline for the University Rover Challenge.',
    detail: 'Selected OwlViT for zero-shot object detection to avoid custom dataset collection for competition-specific targets. Reached 94% detection accuracy across 70+ simulated rover-field tests covering variable lighting, angles, and occlusion. Preprocessed live camera frames with OpenCV, resizing to 768x768 before real-time confidence-scored detection.',
    tags: ['PyTorch', 'OwlViT', 'OpenCV', 'LibTorch'],
    links: [{ label: 'GitHub', url: 'https://github.com/SacchinS/husky-robotics' }],
  },
  {
    n: '04', title: 'Nudge', year: 'Jan 2026', status: '1st Place',
    image: '/images/nudge.png', portrait: true,
    blurb: 'iOS app that surfaces task breakdowns in your Dynamic Island.',
    detail: 'WINFO 2026, 1st Place (Best Implementation Track). Native iOS productivity app using MVVM to convert large tasks into ordered subtasks surfaced through Dynamic Island and WidgetKit. Backed by a Node.js/Express API proxying OpenAI requests, with JSON schema validation and fallback parsing for malformed GPT output.',
    tags: ['Swift', 'SwiftUI', 'Node.js', 'OpenAI'],
    links: [{ label: 'Demo', url: 'https://tinyurl.com/nudge-winfo' }],
  },
  {
    n: '05', title: 'Foliage', year: 'Dec 2024 – Jun 2025', status: '3rd Place State',
    image: '/images/foliage.png',
    blurb: 'Career discovery platform helping students find the right internship path.',
    detail: 'FBLA 2025, 3rd Place State (Website Coding & Development). Led a 3-person team to ship a student internship discovery platform. Integrated Gemini 1.5 Flash to recommend internship categories after survey feedback from 50 users showed 38% were unsure which paths to pursue. Built a Django backend with GraphQL, PostgreSQL, and AWS RDS, with role-based access for admins, employers, and students.',
    tags: ['Next.js', 'Django', 'GraphQL', 'PostgreSQL', 'Gemini'],
    links: [
      { label: 'GitHub', url: 'https://github.com/SacchinS/foliage-final-build' },
      { label: 'Figma', url: 'https://www.figma.com/design/VFJnmyeaUFMeupe4SkF2Ag/Foliage-Mockup?node-id=0-1&t=9hjpk3i0HQCcL2uW-1' },
    ],
  },
];

function Projects({ openModal }) {
  const [ref, inView] = useInView(0.05);
  return (
    <section className="proj-section" id="projects">
      <div ref={ref} className={`proj-inner ${inView ? 'in-view' : ''}`}>
        <div className="eyebrow"><span className="eyebrow__n">03</span><span className="eyebrow__label">Projects</span></div>
        <div className="proj-grid">
          {PROJECTS.map((p, i) => (
            <div key={i} className="proj-card" style={{ '--pi': i }} data-cursor="See project" onClick={() => openModal(p, 'project')}>
              <div className="proj-card__top">
                <span className="proj-card__n">{p.n}</span>
                <span className="proj-card__year">{p.year}</span>
              </div>
              {p.image && (
                <div className={`proj-card__img-wrap${p.portrait ? ' proj-card__img-wrap--portrait' : ''}`}>
                  <img className="proj-card__img" src={p.image} alt={p.title} />
                </div>
              )}
              <h3 className="proj-card__title">{p.title}</h3>
              <p className="proj-card__blurb">{p.blurb}</p>
              <div className="proj-card__foot">
                <div className="proj-card__tags">
                  {p.tags.map(t => <span key={t} className="tag">{t}</span>)}
                </div>
                <span className="proj-card__arrow">↗</span>
              </div>
            </div>
          ))}
          <a href="/projects" className="proj-card" style={{ '--pi': PROJECTS.length }} data-cursor="See all projects">
            <div className="proj-card__top">
              <span className="proj-card__n">06</span>
              <span className="proj-card__year">All work</span>
            </div>
            <div className="proj-card__img-wrap proj-card__img-placeholder">
              <span>...</span>
            </div>
            <h3 className="proj-card__title">More Projects</h3>
            <p className="proj-card__blurb">See the full archive of things I've built.</p>
            <div className="proj-card__foot">
              <div className="proj-card__tags" />
              <span className="proj-card__arrow">↗</span>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Skills ───────────────────────────────────────────────────────────────────
const SKILLS = {
  Languages:    ['Java', 'Python', 'C++', 'C#', 'JavaScript', 'TypeScript', 'Swift'],
  Frontend:     ['React', 'Next.js', 'Tailwind CSS', 'HTML/CSS'],
  Backend:      ['Django', 'Node.js', 'Express', 'Flask', 'GraphQL', 'PostgreSQL', 'Firebase'],
  'Cloud (AWS)':['Bedrock', 'Lambda', 'SageMaker', 'DynamoDB', 'RDS', 'S3', 'Cognito'],
  Tools:        ['Git', 'PyTorch', 'OpenCV', 'Linux/Bash', 'Figma', 'Jira'],
};

function Skills() {
  const [ref, inView] = useInView(0.05);
  return (
    <section className="skills-section" id="skills">
      <div ref={ref} className={`skills-inner ${inView ? 'in-view' : ''}`}>
        <div className="eyebrow"><span className="eyebrow__n">04</span><span className="eyebrow__label">Skills</span></div>
        <div className="skills-rows">
          {Object.entries(SKILLS).map(([cat, items], ci) => (
            <div key={cat} className="skill-row" style={{ '--ci': ci }}>
              <h3 className="skill-cat">{cat}</h3>
              <div className="skill-tags">
                {items.map((s, si) => (
                  <span key={s} className="skill-tag" style={{ '--si': si }}>{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Contact ──────────────────────────────────────────────────────────────────
function Contact() {
  const [copied, setCopied] = useState(false);
  const [ref, inView] = useInView(0.1);
  const email = 'sacchins@uw.edu';
  const onCopy = () => {
    navigator.clipboard?.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <section className="contact-section" id="contact">
      <div ref={ref} className={`contact-inner ${inView ? 'in-view' : ''}`}>
        <div className="eyebrow"><span className="eyebrow__n">05</span><span className="eyebrow__label">Contact</span></div>
        <p className="contact-lede">I read everything. Short notes welcome.</p>
        <button className="contact-email" onClick={onCopy}>
          <span className="contact-email__addr">{email}</span>
          <span className="contact-email__hint">{copied ? 'copied' : 'click to copy'}</span>
        </button>
        <ul className="contact-links">
          {[
            ['GitHub',   'https://github.com/SacchinS'],
            ['LinkedIn', 'https://linkedin.com/in/sacchin-saravanan'],
            ['Resume',   'https://drive.google.com/file/d/124hCsXsCfSdje5JPvOK7ysw2Z1OUjrIb/view?usp=sharing'],
          ].map(([label, href]) => (
            <li key={label}><a href={href} target="_blank" rel="noreferrer">{label} <span>↗</span></a></li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav({ visible, pastHero }) {
  const scrollToTop = e => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <nav className={`nav ${visible ? 'is-visible' : ''}`}>
      <a href="#" className={`nav__brand ${pastHero ? 'brand-visible' : ''}`} onClick={scrollToTop}>
        SS
      </a>
      <ul className="nav__list">
        {['about','experience','projects','skills','contact'].map(id => (
          <li key={id}>
            <a href={id === 'projects' ? '/projects' : `#${id}`}>{id}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ─── Portfolio ────────────────────────────────────────────────────────────────
function Portfolio({ revealed, openModal }) {
  const [pastHero, setPastHero] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    if (!revealed || !heroRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(heroRef.current);
    return () => obs.disconnect();
  }, [revealed]);

  return (
    <div className={`portfolio ${revealed ? 'is-revealed' : ''}`}>
      <NeuralBackground />
      <div className="vignette" />
      <Nav visible={revealed} pastHero={pastHero} />
      <main>
        <Hero innerRef={heroRef} />
        <About />
        <Experience openModal={openModal} />
        <Projects openModal={openModal} />
        <Skills />
        <Contact />
        <footer className="foot">
          <span>2026 Sacchin S.</span>
          <span>Lights on since you arrived.</span>
        </footer>
      </main>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const seen = typeof window !== 'undefined' && !!sessionStorage.getItem('introSeen');
  const [stage, setStage] = useState(seen ? 'revealed' : 'intro');
  const [showIntro, setShowIntro] = useState(!seen);
  const [showCursorLabel, setShowCursorLabel] = useState(seen);
  const [modal, setModal] = useState(null);
  const openModal  = (item, type) => setModal({ item, type });
  const closeModal = () => setModal(null);

  useEffect(() => {
    if (stage !== 'revealed') return;
    const t = setTimeout(() => setShowCursorLabel(true), 1700);
    return () => clearTimeout(t);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'revealed') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [stage]);

  const onSwitch = () => {
    sessionStorage.setItem('introSeen', '1');
    window.scrollTo(0, 0);
    setStage('switching');
    setTimeout(() => setStage('revealed'), 1050);
    setTimeout(() => setShowIntro(false), 1200);
  };

  return (
    <>
      <Portfolio revealed={stage === 'revealed'} openModal={openModal} />
      {showIntro && <Intro onSwitch={onSwitch} isExiting={stage === 'switching'} />}
      {modal && <Modal item={modal.item} type={modal.type} onClose={closeModal} />}
      {showCursorLabel && <CursorLabel />}
    </>
  );
}

export default App;
