'use client';
import { useState, useEffect, useRef } from 'react';
import { initNeuralNetwork } from '@/lib/neural-network';

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
function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
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
function Modal({ item, onClose }) {
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
        <div className="modal-body">
          <div className="modal-header">
            <span className="modal-n">{item.n}</span>
            {item.status && <span className="modal-status">{item.status}</span>}
          </div>
          <h2 className="modal-title">{item.title}</h2>
          <p className="modal-year">{item.year}</p>
          <p className="modal-detail">{item.detail}</p>
          <div className="modal-tags">
            {item.tags.map(t => <span key={t} className="tag">{t}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav className="nav is-visible">
      <a href="/" className="nav__brand brand-visible">SS</a>
      <ul className="nav__list">
        {[
          { label: 'about',      href: '/#about' },
          { label: 'experience', href: '/#experience' },
          { label: 'projects',   href: '/projects', active: true },
          { label: 'skills',     href: '/#skills' },
          { label: 'contact',    href: '/#contact' },
        ].map(({ label, href, active }) => (
          <li key={label}>
            <a href={href} className={active ? 'is-active' : ''}>{label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ─── All Projects data ────────────────────────────────────────────────────────
const ALL_PROJECTS = [
  {
    n: '01', title: 'Sixers Fantasy', year: 'Oct 2025 – Present', status: 'Active',
    image: '/images/sixers-fantasy.png',
    blurb: 'Fantasy cricket platform. Engineered the ball-by-ball live scoring engine and trade/waiver wire system.',
    detail: 'Engineered the live scoring and trade infrastructure for a fantasy cricket startup. The scoring engine tracks ball-by-ball events (runs, wickets, extras, and per-player stats: batting, bowling, fielding) with undo support and automatic innings switching. The trade and waiver wire system uses pessimistic locking across AWS Lambda to handle concurrent writes without race conditions, backed by PostgreSQL RDS and scoped per-user via Amazon Cognito.',
    tags: ['Next.js', 'TypeScript', 'AWS Lambda', 'PostgreSQL', 'Amazon Cognito'],
  },
  {
    n: '02', title: 'Kural', year: 'May 2026', status: '1st Place',
    image: '/images/kural.png',
    blurb: 'AI-powered AAC device for ALS patients that speaks in their own cloned voice.',
    detail: 'AWS Hacks 2026, 1st Place (Cloud for Good Track). Generates contextually personalized sentences via Amazon Bedrock (Claude Haiku 4.5) and speaks them in the patient\'s preserved voice. Fine-tuned Coqui XTTS v2 on SageMaker (ml.g4dn.xlarge) on 30 personal recordings, achieving 20-25 second end-to-end latency. Shipped a Next.js PWA with iOS Eye Tracking auto-click selection, Amazon Cognito auth, offline fallback, and a real-time caregiver context panel.',
    tags: ['AWS Bedrock', 'SageMaker', 'Lambda', 'Next.js'],
  },
  {
    n: '03', title: 'Husky Robotics', year: '2025', status: 'Active',
    image: '/images/husky-robotics.png',
    blurb: 'Zero-shot object detection pipeline for the University Rover Challenge.',
    detail: 'Selected OwlViT for zero-shot object detection to avoid custom dataset collection for competition-specific targets. Reached 94% detection accuracy across 70+ simulated rover-field tests covering variable lighting, angles, and occlusion. Preprocessed live camera frames with OpenCV, resizing to 768x768 before real-time confidence-scored detection.',
    tags: ['PyTorch', 'OwlViT', 'OpenCV', 'LibTorch'],
  },
  {
    n: '04', title: 'Nudge', year: 'Jan 2026', status: '1st Place',
    image: '/images/nudge.png', portrait: true,
    blurb: 'iOS app that surfaces task breakdowns in your Dynamic Island.',
    detail: 'WINFO 2026, 1st Place (Best Implementation Track). Native iOS productivity app using MVVM to convert large tasks into ordered subtasks surfaced through Dynamic Island and WidgetKit. Backed by a Node.js/Express API proxying OpenAI requests, with JSON schema validation and fallback parsing for malformed GPT output.',
    tags: ['Swift', 'SwiftUI', 'Node.js', 'OpenAI'],
  },
  {
    n: '05', title: 'Taskflow', year: 'Oct 2025', status: '1st Place',
    image: '/images/taskflow.png', portrait: true,
    blurb: 'Chrome extension that converts assignment screenshots into Jira tasks instantly.',
    detail: 'DubHacks 2025, 1st Place (Atlassian Track). Uses OpenAI OCR to parse assignment screenshots into structured Kanban tasks across Canvas, Gradescope, and course websites. Integrated the Atlassian Rovo Agent API to automate Jira issue creation and board synchronization, cutting task entry to a single screenshot.',
    tags: ['Chrome Extension', 'Atlassian Forge', 'OpenAI', 'Jira'],
  },
  {
    n: '06', title: 'Foliage', year: '2024 to 2025', status: 'Shipped',
    image: '/images/foliage.png',
    blurb: 'Career discovery platform helping students find the right internship path.',
    detail: 'Led a 3-person team to ship a student internship discovery platform. Integrated Gemini 1.5 Flash to recommend internship categories after survey feedback from 50 users showed 38% were unsure which paths to pursue. Built a Django backend with GraphQL, PostgreSQL, and AWS RDS, with role-based access for admins, employers, and students.',
    tags: ['Next.js', 'Django', 'GraphQL', 'PostgreSQL', 'Gemini'],
  },
  {
    n: '07', title: 'LeetRepeat', year: 'May 2025', status: 'Active',
    image: '/images/leetrepeat.png',
    blurb: 'Chrome extension that brings Anki-style spaced repetition to LeetCode practice.',
    detail: 'Built a Manifest V3 Chrome extension that schedules LeetCode problems using the SM-2 spaced repetition algorithm, the same system behind Anki. On first install, a content script imports the user\'s full solve history via LeetCode\'s internal GraphQL API (same-origin, no credentials needed) and assigns staggered initial due dates based on how long ago each problem was solved. Submission detection runs via MutationObserver. When an "Accepted" verdict appears, a rating modal surfaces (Easy / Medium / Hard) and SM-2 updates the next interval. Missed days shift all due dates forward by the number of skipped days, preserving relative spacing without creating a review avalanche. The popup dashboard includes today\'s queue, a calendar heatmap, weak-area breakdown by tag, and a settings panel for daily target and new/review blend ratio.',
    tags: ['Chrome Extension', 'JavaScript', 'SM-2', 'GraphQL'],
  },
  {
    n: '08', title: 'Gladiator Games', year: 'Dec 2023 – Jun 2024', status: 'TSA Nationals',
    image: '/images/gladiator-games.png',
    blurb: 'VR fitness game tackling childhood obesity through gamified full-body exercise.',
    detail: 'Built for the TSA VR Simulation event at Tesla STEM High School. Addressed childhood obesity by turning physical exercise into a competitive VR experience. Integrated Meta Quest (Oculus) with the Unity Game Engine, using custom C# scripts for full-body tracking, motion detection, and haptic feedback. Created all 3D models and environments in Blender, and produced animations and a video trailer directly in Unity. Also developed the project documentation portfolio and companion website. Placed 10th at TSA Nationals.',
    tags: ['Unity', 'C#', 'Meta Quest', 'Blender', 'VR'],
  },
  {
    n: '09', title: 'Verdantia', year: 'Dec 2023 – Jun 2024', status: '2nd Place State',
    image: '/images/verdantia.png',
    blurb: 'Full-stack careers website for a fictional environmental non-profit, built for FBLA.',
    detail: 'Developed Verdantia for the FBLA Website Coding & Development event at Tesla STEM High School. Built a careers platform for a fictional non-profit focused on environmental sustainability, with an admin panel for managing job postings (create, edit, delete) and an applicant submission flow. Designed the layout and visual system in Figma, then implemented the front end with Next.js, React, and Tailwind CSS. Used Framer Motion for interactive animations and Google Firebase for backend storage and real-time data management. Achieved 2nd place at the FBLA State competition.',
    tags: ['Next.js', 'React', 'Tailwind CSS', 'Firebase', 'Figma', 'Framer Motion'],
  },
  {
    n: '10', title: 'ShapeShift: Learn!', year: 'Mar 2022 – Oct 2023', status: 'Shipped',
    image: '/images/shapeshift.png',
    blurb: 'iOS educational game covering K–5 LWSD geometry standards, published to the App Store.',
    detail: 'Developed an interactive educational game aligned to K–5 LWSD geometry standards using Unity and C#. Designed all UI and sprites in Adobe Photoshop and Illustrator. To publish on the iOS App Store, founded Saper Solutions LLC, registered a domain via IONOS, and built a compliance website (privacy policy) with Next.js, Tailwind CSS, and React deployed on Vercel. Published the app under Saper Solutions LLC on both the iOS App Store and itch.io.',
    tags: ['Unity', 'C#', 'iOS', 'Next.js', 'Adobe Illustrator'],
  },
  {
    n: '11', title: 'The Last Iceberg', year: 'Apr 2023 – Jun 2023', status: 'Shipped',
    image: '/images/last-iceberg.png',
    blurb: 'Web-based game teaching students how ocean shipping contributes to climate change.',
    detail: 'Developed an educational game using Unity and C# focused on ocean travel and its impact on climate change, letting players modify ships to reduce their environmental footprint. Presented the game live at Margaret Mead Elementary School\'s science fair, where students engaged directly with the interactive content. Designed all UI and sprites in Adobe Photoshop and Illustrator. Published the web build demo to itch.io.',
    tags: ['Unity', 'C#', 'Adobe Photoshop', 'Game Design', 'itch.io'],
  },
  // ── Add more projects below this line ──────────────────────────────────────
];

// ─── Project Grid ─────────────────────────────────────────────────────────────
function ProjectGrid({ openModal }) {
  const [ref, inView] = useInView(0.05);
  return (
    <section className="proj-section">
      <div ref={ref} className={`proj-inner ${inView ? 'in-view' : ''}`}>
        <div className="proj-grid">
          {ALL_PROJECTS.map((p, i) => (
            <div key={i} className="proj-card" style={{ '--pi': i }}
              onClick={() => openModal(p)} role="button" tabIndex={0}
              onKeyDown={ev => { if (ev.key === 'Enter') openModal(p); }}>
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
        </div>
      </div>
    </section>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const [modal, setModal] = useState(null);
  const openModal  = item => setModal(item);
  const closeModal = () => setModal(null);

  return (
    <>
      <NeuralBackground />
      <div className="vignette" />
      <div className="projects-page">
        <Nav />
        <main>
          <header className="projects-hero">
            <div className="projects-hero__inner">
              <p className="projects-hero__eyebrow">All work</p>
              <h1 className="projects-hero__title">Projects</h1>
            </div>
          </header>
          <ProjectGrid openModal={openModal} />
        </main>
      </div>
      {modal && <Modal item={modal} onClose={closeModal} />}
    </>
  );
}

export default App;
