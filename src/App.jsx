import { useEffect, useRef, useCallback } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";

/* ─────────────────────────────────────────────────────────────
   GLOBAL STYLES (injected via <style>)
───────────────────────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800;900&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html, body, #root {
      background: #0C0C0C;
      font-family: 'Kanit', sans-serif;
      scroll-behavior: auto;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .hero-heading {
      background: linear-gradient(270deg, #646973, #BBCCD7, #B600A8, #7621B0, #646973);
      background-size: 300% 100%;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    :root { scroll-padding-top: 120px; }

    @keyframes shoot {
      0% { transform: translateX(0) translateY(0) scale(1); opacity: 0; }
      5% { opacity: 1; }
      95% { opacity: 1; }
      100% { transform: translateX(calc(100vw + 200px)) translateY(calc(100vh + 200px)) scale(0); opacity: 0; }
    }

    @keyframes twinkle {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: #0C0C0C; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }

    @supports (height: 100dvh) {
      .hero-full { height: 100dvh; }
    }
    @supports not (height: 100dvh) {
      .hero-full { height: 100vh; }
    }

  `}</style>
);

/* ─────────────────────────────────────────────────────────────
   REUSABLE: FadeIn
───────────────────────────────────────────────────────────── */
function FadeIn({ children, delay = 0, duration = 0.7, x = 0, y = 30, className = "", as = "div" }) {
  const Tag = motion[as] || motion.div;
  return (
    <Tag
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "50px", amount: 0 }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </Tag>
  );
}

/* ─────────────────────────────────────────────────────────────
   REUSABLE: Magnet
───────────────────────────────────────────────────────────── */
function Magnet({ children, padding = 150, strength = 3 }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 20 });
  const sy = useSpring(y, { stiffness: 200, damping: 20 });

  const handleMouseMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const threshold = Math.max(rect.width, rect.height) / 2 + padding;
    if (dist < threshold) {
      x.set(dx / strength);
      y.set(dy / strength);
    } else {
      x.set(0);
      y.set(0);
    }
  }, [padding, strength, x, y]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return (
    <motion.div ref={ref} style={{ x: sx, y: sy, willChange: "transform" }}>
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   REUSABLE: AnimatedText (character scroll-reveal)
───────────────────────────────────────────────────────────── */
function AnimatedText({ text, className = "" }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.8", "end 0.2"],
  });

  const words = text.split(" ");

  const flatChars = words.map((w, wi) => ({ word: wi, chars: w.split("") }));
  const totalChars = flatChars.reduce((a, w) => a + w.chars.length, 0);
  let globalIndex = 0;

  return (
    <p ref={ref} className={className} style={{ position: "relative", wordBreak: "keep-all", overflowWrap: "break-word" }}>
      {flatChars.map((word, wi) => {
        const wordChars = word.chars.map((char) => {
          const i = globalIndex++;
          return { char, start: i / totalChars, end: (i + 1) / totalChars };
        });
        return (
          <span key={wi} style={{ display: "inline", whiteSpace: "nowrap" }}>
            {wordChars.map((c) => (
              <CharUnit key={c.char + c.start} char={c.char} progress={scrollYProgress} start={c.start} end={c.end} />
            ))}
            {wi < words.length - 1 && <span style={{ display: "inline-block", width: "0.3em" }} />}
          </span>
        );
      })}
    </p>
  );
}

function CharUnit({ char, progress, start, end }) {
  const opacity = useTransform(progress, [start, end], [0.2, 1]);
  return (
    <span style={{ position: "relative", display: "inline" }}>
      <span style={{ opacity: 0 }}>{char}</span>
      <motion.span
        style={{
          opacity,
          position: "absolute",
          left: 0,
          top: 0,
          color: "#D7E2EA",
        }}
      >
        {char}
      </motion.span>
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   REUSABLE: ContactButton
───────────────────────────────────────────────────────────── */
function ContactButton() {
  const handleClick = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <button
      onClick={handleClick}
      style={{
        background: "linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)",
        boxShadow: "0px 4px 4px rgba(181, 1, 167, 0.25), inset 4px 4px 12px #7721B1",
        outline: "2px solid white",
        outlineOffset: "-3px",
        borderRadius: "9999px",
        border: "none",
        cursor: "pointer",
        color: "white",
        fontFamily: "'Kanit', sans-serif",
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.15em",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      className="px-8 py-3 sm:px-10 sm:py-3.5 md:px-12 md:py-4 text-xs sm:text-sm md:text-base"
      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      Contact Me
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTION 1: Hero
───────────────────────────────────────────────────────────── */
function ShootingStars() {
  const stars = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 8}s`,
    duration: `${4 + Math.random() * 6}s`,
    width: `${60 + Math.random() * 120}px`,
    angle: `${-30 + Math.random() * 60}deg`,
  }));

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {stars.map((s) => (
        <div
          key={s.id}
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            width: s.width,
            height: "1.5px",
            background: "linear-gradient(90deg, transparent, rgba(182,0,168,0.6), rgba(118,33,176,0.4), transparent)",
            borderRadius: "9999px",
            transform: `rotate(${s.angle})`,
            boxShadow: "0 0 6px rgba(182,0,168,0.3), 0 0 12px rgba(118,33,176,0.15)",
            animation: `shoot ${s.duration} ${s.delay} infinite`,
            opacity: 0,
          }}
        />
      ))}
      {/* Static glow dots */}
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={`dot-${i}`}
          style={{
            position: "absolute",
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: "2px",
            height: "2px",
            borderRadius: "50%",
            background: "rgba(182,0,168,0.4)",
            boxShadow: "0 0 4px rgba(182,0,168,0.3)",
            animation: `twinkle ${2 + Math.random() * 3}s ${Math.random() * 5}s infinite`,
          }}
        />
        ))}
      </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTION 1b: Hero Section
   ───────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section
      style={{ background: "#0C0C0C", overflowX: "clip", position: "relative" }}
      className="hero-full flex flex-col max-lg:!h-[50dvh]"
    >
      <ShootingStars />
      {/* Navbar */}
      <FadeIn delay={0} y={-20}>
        <nav style={{
          position: "fixed", top: "clamp(0.75rem, 1.5vw, 1.25rem)", left: "clamp(0.75rem, 2vw, 2rem)", right: "clamp(0.75rem, 2vw, 2rem)",
          zIndex: 100, borderRadius: "9999px",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          background: "rgba(12,12,12,0.75)",
          border: "1px solid rgba(182,0,168,0.15)",
          boxShadow: "0 0 30px rgba(182,0,168,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
        }} className="flex justify-between items-center px-3 sm:px-8 md:px-10 py-3 md:py-6">
          <span style={{
            fontWeight: 800, fontSize: "clamp(0.95rem, 1.6vw, 1.3rem)",
            letterSpacing: "0.08em", textTransform: "uppercase",
            background: "linear-gradient(135deg, #B600A8 0%, #7621B0 50%, #BE4C00 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginLeft: "clamp(0.25rem, 0.5vw, 0.75rem)",
          }}>
            SZK
          </span>
          <div style={{ display: "flex", gap: "clamp(0.15rem, 0.3vw, 0.5rem)" }}>
            {[["About","about"],["Services","price"],["Projects","projects"],["Contact","contact"]].map(([label,id]) => (
              <a
                key={label}
                href={`#${id}`}
                onClick={e => {
                  e.preventDefault();
                  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  color: "rgba(215,226,234,0.55)",
                  fontWeight: 400,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  textDecoration: "none",
                  transition: "all 0.25s ease",
                  cursor: "pointer",
                  fontSize: "clamp(0.45rem, 0.65vw, 0.75rem)",
                  padding: "clamp(0.35rem, 0.7vw, 0.7rem) clamp(0.5rem, 1vw, 1rem)",
                  borderRadius: "9999px",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "#D7E2EA"; e.currentTarget.style.background = "rgba(182,0,168,0.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "rgba(215,226,234,0.55)"; e.currentTarget.style.background = "transparent"; }}
              >
                {label}
              </a>
            ))}
          </div>
        </nav>
      </FadeIn>

      {/* Hero Heading — upper left */}
      <div style={{ overflow: "hidden", paddingTop: "clamp(6rem, 10vh, 8rem)" }} className="flex-1 flex flex-col">
        <div style={{ overflow: "hidden", alignSelf: "flex-start", paddingLeft: "clamp(1rem, 5vw, 6rem)" }}>
          <motion.p
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              color: "#D7E2EA",
              opacity: 0.45,
              textTransform: "uppercase",
              letterSpacing: "0.25em",
              fontSize: "clamp(0.6rem, 1.2vw, 1rem)",
              textAlign: "left",
              fontWeight: 500,
              marginBottom: "0.5rem",
            }}
          >
            UI/UX · Dev · AI
          </motion.p>
        </div>
        <div style={{ overflow: "hidden", alignSelf: "flex-start", paddingLeft: "clamp(1rem, 5vw, 6rem)" }}>
          <motion.h1
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="hero-heading font-black uppercase tracking-tight leading-none text-left"
            style={{ fontSize: "clamp(2.6rem, 9vw, 11rem)", display: "block" }}
          >
            Hi, i&apos;m
          </motion.h1>
        </div>
        <div style={{ overflow: "hidden", alignSelf: "flex-start", paddingLeft: "clamp(1rem, 5vw, 6rem)" }}>
          <motion.h1
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="hero-heading font-black uppercase tracking-tight leading-none text-left"
            style={{ fontSize: "clamp(2.6rem, 10vw, 12rem)", display: "block" }}
            whileInView={{ backgroundPosition: ["0% 50%", "100% 50%"] }}
            viewport={{ once: true }}
          >
            Shahid Zahoor Khan
          </motion.h1>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-auto flex justify-end px-6 md:px-10 pb-5 sm:pb-6 md:pb-10">
        <FadeIn delay={0.5} y={20}>
          <div style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            color: "rgba(215,226,234,0.3)", fontSize: "clamp(0.6rem, 0.9vw, 0.8rem)",
            letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 300,
          }}>
            <span style={{ width: "24px", height: "1px", background: "rgba(215,226,234,0.2)" }} />
            Scroll
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTION 2: Marquee (Scroll-driven profile cards)
   ───────────────────────────────────────────────────────────── */
const MARQUEE_CARDS_ROW1 = [
  { label: "UI/UX Design", desc: "Wireframes · Prototypes · User Flow", accent: "#B600A8", icon: "○" },
  { label: "Web Dev", desc: "React · Next.js · Tailwind · Vite", accent: "#7621B0", icon: "◇" },
  { label: "App Dev", desc: "Mobile · Cross-platform · Responsive", accent: "#4F46E5", icon: "□" },
  { label: "AI Systems", desc: "Smart integrations · LLMs · Automation", accent: "#BE4C00", icon: "△" },
  { label: "UI/UX Design", desc: "Wireframes · Prototypes · User Flow", accent: "#B600A8", icon: "○" },
  { label: "Web Dev", desc: "React · Next.js · Tailwind · Vite", accent: "#7621B0", icon: "◇" },
  { label: "App Dev", desc: "Mobile · Cross-platform · Responsive", accent: "#4F46E5", icon: "□" },
  { label: "AI Systems", desc: "Smart integrations · LLMs · Automation", accent: "#BE4C00", icon: "△" },
  { label: "UI/UX Design", desc: "Wireframes · Prototypes · User Flow", accent: "#B600A8", icon: "○" },
  { label: "Web Dev", desc: "React · Next.js · Tailwind · Vite", accent: "#7621B0", icon: "◇" },
  { label: "App Dev", desc: "Mobile · Cross-platform · Responsive", accent: "#4F46E5", icon: "□" },
  { label: "AI Systems", desc: "Smart integrations · LLMs · Automation", accent: "#BE4C00", icon: "△" },
];

const MARQUEE_CARDS_ROW2 = [
  { stat: "2+", label: "Years Exp", desc: "UI/UX & Full-Stack Dev", accent: "#B600A8" },
  { stat: "15+", label: "Projects", desc: "Shipped & Delivered", accent: "#7621B0" },
  { stat: "10+", label: "Happy Clients", desc: "Global Collaborations", accent: "#4F46E5" },
  { stat: "24/7", label: "Support", desc: "Dedicated & Reliable", accent: "#BE4C00" },
  { stat: "2+", label: "Years Exp", desc: "UI/UX & Full-Stack Dev", accent: "#B600A8" },
  { stat: "15+", label: "Projects", desc: "Shipped & Delivered", accent: "#7621B0" },
  { stat: "10+", label: "Happy Clients", desc: "Global Collaborations", accent: "#4F46E5" },
  { stat: "24/7", label: "Support", desc: "Dedicated & Reliable", accent: "#BE4C00" },
  { stat: "2+", label: "Years Exp", desc: "UI/UX & Full-Stack Dev", accent: "#B600A8" },
  { stat: "15+", label: "Projects", desc: "Shipped & Delivered", accent: "#7621B0" },
  { stat: "10+", label: "Happy Clients", desc: "Global Collaborations", accent: "#4F46E5" },
  { stat: "24/7", label: "Support", desc: "Dedicated & Reliable", accent: "#BE4C00" },
];

function MarqueeSection() {
  const sectionRef = useRef(null);

  const offsetMV = useMotionValue(200);
  const smoothOffset = useSpring(offsetMV, { stiffness: 80, damping: 25, mass: 0.5 });

  const row1Cards = [...MARQUEE_CARDS_ROW1, ...MARQUEE_CARDS_ROW1, ...MARQUEE_CARDS_ROW1];
  const row2Cards = [...MARQUEE_CARDS_ROW2, ...MARQUEE_CARDS_ROW2, ...MARQUEE_CARDS_ROW2];

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionTop = window.scrollY + rect.top;
      const rawOffset = (window.scrollY - sectionTop + window.innerHeight) * 0.3;
      offsetMV.set(rawOffset);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [offsetMV]);

  const row1X = useTransform(smoothOffset, (v) => v - 200);
  const row2X = useTransform(smoothOffset, (v) => -(v - 200));

  return (
    <section
      ref={sectionRef}
      style={{ background: "#0C0C0C", overflowX: "hidden" }}
      className="pt-0 md:pt-28 pb-16 sm:pb-20 md:pb-28"
    >
      {/* Row 1 — moves right */}
      <motion.div
        style={{
          x: row1X,
          willChange: "transform",
          display: "flex",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        {row1Cards.map((card, i) => (
          <div key={i} style={{
            width: "clamp(200px, 40vw, 280px)", height: "clamp(140px, 22vw, 180px)", borderRadius: "20px", flexShrink: 0,
            background: `linear-gradient(145deg, ${card.accent}15 0%, ${card.accent}05 100%)`,
            border: `1px solid ${card.accent}22`,
            padding: "clamp(1rem, 2.5vw, 1.5rem)",
            display: "flex", flexDirection: "column", justifyContent: "center",
            position: "relative", overflow: "hidden",
          }}>
            <span style={{ fontSize: "clamp(1.4rem, 4vw, 2rem)", color: card.accent, opacity: 0.3, position: "absolute", top: "0.75rem", right: "1rem" }}>
              {card.icon}
            </span>
            <p style={{ color: "#D7E2EA", fontWeight: 700, fontSize: "clamp(0.85rem, 2vw, 1.05rem)", letterSpacing: "0.03em", marginBottom: "0.4rem", position: "relative", zIndex: 1 }}>
              {card.label}
            </p>
            <p style={{ color: "rgba(215,226,234,0.5)", fontWeight: 300, fontSize: "clamp(0.65rem, 1.4vw, 0.8rem)", lineHeight: 1.4, position: "relative", zIndex: 1 }}>
              {card.desc}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Row 2 — moves left */}
      <motion.div
        style={{
          x: row2X,
          willChange: "transform",
          display: "flex",
          gap: "12px",
        }}
      >
        {row2Cards.map((card, i) => (
          <div key={i} style={{
            width: "clamp(180px, 36vw, 260px)", height: "clamp(120px, 20vw, 160px)", borderRadius: "20px", flexShrink: 0,
            background: `linear-gradient(145deg, ${card.accent}12 0%, rgba(255,255,255,0.02) 100%)`,
            border: `1px solid ${card.accent}18`,
            padding: "clamp(0.75rem, 2vw, 1.25rem)",
            display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
            textAlign: "center",
          }}>
            <span style={{ fontSize: "clamp(1.6rem, 5vw, 2.2rem)", fontWeight: 900, color: card.accent, lineHeight: 1, marginBottom: "0.3rem" }}>
              {card.stat}
            </span>
            <p style={{ color: "#D7E2EA", fontWeight: 600, fontSize: "clamp(0.7rem, 1.8vw, 0.85rem)", letterSpacing: "0.06em", marginBottom: "0.2rem" }}>
              {card.label}
            </p>
            <p style={{ color: "rgba(215,226,234,0.4)", fontWeight: 300, fontSize: "clamp(0.55rem, 1.3vw, 0.7rem)" }}>
              {card.desc}
            </p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTION 3: About
───────────────────────────────────────────────────────────── */
function AboutSection() {
  return (
    <section
      id="about"
      style={{ background: "#0C0C0C", position: "relative", scrollMarginTop: "100px" }}
      className="flex flex-col items-center px-8 sm:px-10 md:px-16 pt-16 sm:pt-28 md:pt-40 pb-16 sm:pb-28 md:pb-40"
    >
      {/* Decorative 3D object */}
      <FadeIn delay={0.25} x={-80} y={0} duration={0.9} className="hidden sm:block absolute bottom-[15px] sm:bottom-[20px] md:bottom-[25px] left-[25px] sm:left-[35px] md:left-[45px]">
        <img
          src="https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/p59_1.4659672e.png"
          alt=""
          className="w-[140px] sm:w-[200px] md:w-[280px]"
        />
      </FadeIn>

      {/* Content */}
      <div className="flex flex-col items-center text-center gap-10 sm:gap-14 md:gap-16 relative z-10">
        <FadeIn delay={0} y={40}>
          <h2
            className="hero-heading font-black uppercase leading-none tracking-tight"
            style={{ fontSize: "clamp(3rem, 12vw, 160px)" }}
          >
            About me
          </h2>
        </FadeIn>

        <div className="flex flex-col items-center gap-16 sm:gap-20 md:gap-24">
          <AnimatedText
            text="With over two years of experience as a UI/UX designer and full-stack developer, I specialize in crafting modern web experiences, mobile apps, and AI-driven solutions. I'm passionate about turning complex ideas into clean, intuitive interfaces that users love. Let's build something incredible together!"
            className="font-medium text-center leading-relaxed max-w-[560px]"
            style={{ fontSize: "clamp(1rem, 2vw, 1.35rem)" }}
          />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTION 4: Services
───────────────────────────────────────────────────────────── */
const SERVICES = [
  {
    num: "01",
    name: "UI/UX Design",
    desc: "Crafting intuitive, beautiful interfaces that put users first — from wireframes and prototypes to polished, pixel-perfect final designs.",
  },
  {
    num: "02",
    name: "Website Development",
    desc: "Building fast, responsive, and conversion-focused websites with clean code, modern frameworks, and attention to every detail.",
  },
  {
    num: "03",
    name: "App Development",
    desc: "Developing sleek mobile and web applications that are scalable, performant, and built around a seamless user experience.",
  },
  {
    num: "04",
    name: "AI Integrated Systems",
    desc: "Embedding intelligent AI capabilities into your products — from smart recommendations and automation to natural language interfaces.",
  },
  {
    num: "05",
    name: "AI Automations",
    desc: "Streamlining workflows and eliminating repetitive tasks with custom AI-powered automations that save time and scale your operations.",
  },
  {
    num: "06",
    name: "Java Applications Development",
    desc: "Building robust, scalable, and high-performance Java applications — from enterprise backends and APIs to desktop tools and system-level software.",
  },
];

function ServicesSection() {
  return (
    <section
      id="price"
      style={{
        background: "transparent",
        borderRadius: "40px 40px 0 0",
        scrollMarginTop: "100px",
      }}
      className="px-8 sm:px-10 md:px-16 pt-16 sm:pt-20 md:pt-32 pb-8 sm:pb-12 md:pb-20"
    >
      <FadeIn delay={0} y={40}>
        <h2
          className="hero-heading font-black uppercase text-center leading-none tracking-tight"
          style={{ fontSize: "clamp(3rem, 12vw, 160px)", marginBottom: "clamp(3rem, 6vw, 7rem)" }}
        >
          Services
        </h2>
      </FadeIn>

      <div style={{ maxWidth: "64rem", margin: "0 auto" }} className="max-sm:!mx-4">
        {SERVICES.map((svc, i) => (
          <FadeIn key={svc.num} delay={i * 0.1} y={20}>
            <div
              style={{
                borderTop: i === 0 ? "1px solid rgba(215,226,234,0.1)" : "none",
                borderBottom: "1px solid rgba(215,226,234,0.1)",
                display: "flex",
                alignItems: "center",
                gap: "clamp(1rem, 3vw, 3rem)",
              }}
              className="py-8 sm:py-10 md:py-12"
            >
              <span
                className="font-black"
                style={{
                  fontSize: "clamp(3rem, 10vw, 140px)", color: "#D7E2EA",
                  lineHeight: 1, display: "flex", alignItems: "center",
                  alignSelf: "stretch", flexShrink: 0, opacity: 0.12,
                }}
              >
                {svc.num}
              </span>
              <div>
                <p
                  className="font-medium uppercase"
                  style={{ fontSize: "clamp(1rem, 2.2vw, 2.1rem)", color: "#D7E2EA", marginBottom: "0.4em" }}
                >
                  {svc.name}
                </p>
                <p
                  className="font-light leading-relaxed max-w-2xl"
                  style={{ fontSize: "clamp(0.85rem, 1.6vw, 1.25rem)", color: "#D7E2EA", opacity: 0.5 }}
                >
                  {svc.desc}
                </p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTION 5: Projects
───────────────────────────────────────────────────────────── */
const PROJECTS = [
  {
    num: "01",
    name: "Cineverse",
    category: "Movie Ticket Booking App",
    desc: "A full-featured cinema booking experience — browse movies, pick seats, and checkout seamlessly.",
    link: "https://github.com/shelby-io1/Cineverse-Movie-Ticket-Booking",
    accent: "#E50914",
    tags: ["React", "UI/UX", "Booking System"],
  },
  {
    num: "02",
    name: "Smart Student Companion",
    category: "AI-Powered Study Tool",
    desc: "An AI-integrated study assistant that helps students organise notes, quiz themselves, and track progress.",
    link: "https://github.com/shelby-io1/Smart-Student-Companion",
    accent: "#4F46E5",
    tags: ["AI", "Education", "Productivity"],
  },
  {
    num: "03",
    name: "QuickBite",
    category: "Food Delivery App",
    desc: "A fast, intuitive food delivery app with real-time order tracking, smart restaurant discovery, and one-tap reorders.",
    link: "https://github.com/shelby-io1/QuickBite-Food-Delivery-App",
    accent: "#F97316",
    tags: ["App Dev", "Real-time", "Maps"],
  },
  {
    num: "04",
    name: "FitTrack",
    category: "Fitness & Wellness App",
    desc: "A personal fitness companion for logging workouts, visualising progress, and staying accountable to your health goals.",
    link: "https://github.com/shelby-io1/FitTrack-Fitness-App",
    accent: "#10B981",
    tags: ["Health", "Data Viz", "Mobile"],
  },
];

function ProjectCard({ project }) {
  return (
    <div style={{
      width: "100%",
      margin: "0 auto 2rem auto",
      maxWidth: "calc(100% - 1rem)",
      minHeight: "clamp(300px, 40vh, 480px)",
      background: `linear-gradient(145deg, ${project.accent}08 0%, #0C0C0C 60%, #0C0C0C 100%)`,
      border: `1px solid ${project.accent}33`,
      borderRadius: "clamp(24px, 5vw, 60px)",
      overflow: "hidden",
      boxShadow: `0 0 60px ${project.accent}0a`,
      cursor: "pointer",
    }}
      className="p-5 sm:p-7 md:p-10"
      onClick={() => window.open(project.link, "_blank", "noopener,noreferrer")}
    >
        <div style={{
          position: "absolute", top: 0, left: 0, width: "40%", height: "50%",
          background: `radial-gradient(ellipse at 0% 0%, ${project.accent}22 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.5rem 1rem", marginBottom: "clamp(1.25rem, 2.5vw, 2rem)", position: "relative", zIndex: 1 }}>
          <span
            className="font-black"
            style={{ fontSize: "clamp(2rem, 7vw, 100px)", color: project.accent, lineHeight: 0.85, minWidth: "2.5ch", paddingLeft: "0.75rem" }}
          >
            {project.num}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: "#D7E2EA", opacity: 0.45, textTransform: "uppercase", letterSpacing: "0.14em", fontSize: "clamp(0.7rem, 1vw, 0.85rem)" }}>
              {project.category}
            </p>
            <p className="font-black uppercase" style={{ color: "#D7E2EA", fontSize: "clamp(0.9rem, 2.2vw, 1.9rem)", lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {project.name}
            </p>
          </div>
          <div className="w-full sm:w-auto ml-3 sm:ml-0" style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", paddingRight: "0.75rem" }}>
            {project.tags.map(tag => (
              <span key={tag} style={{
                border: `1px solid ${project.accent}66`,
                color: project.accent,
                borderRadius: "9999px",
                padding: "0.25rem 0.8rem",
                fontSize: "clamp(0.6rem, 0.9vw, 0.75rem)",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                background: `${project.accent}11`,
              }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Body: color block + description */}
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4 md:gap-6" style={{ position: "relative", zIndex: 1, alignItems: "stretch", flex: 1, minHeight: "clamp(200px, 22vw, 300px)" }}>
          {/* Left — color identity block */}
          <div className="w-full md:w-[45%]" style={{
            borderRadius: "clamp(16px, 2.5vw, 32px)",
            background: `linear-gradient(145deg, ${project.accent} 0%, ${project.accent}cc 100%)`,
            position: "relative", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            minHeight: "clamp(160px, 20vw, 280px)",
          }}>
            <span style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "clamp(4rem, 12vw, 10rem)", fontWeight: 900,
              color: "rgba(255,255,255,0.06)", letterSpacing: "-0.02em",
              whiteSpace: "nowrap", overflow: "hidden",
              lineHeight: 1,
            }}>
              {project.name}
            </span>
            <span style={{
              fontSize: "clamp(1.2rem, 3vw, 3.5rem)", fontWeight: 900,
              color: "rgba(255,255,255,0.85)", letterSpacing: "-0.01em",
              textAlign: "center", lineHeight: 1.1, padding: "1rem",
              position: "relative", zIndex: 1,
            }}>
              {project.name}
            </span>
            {/* Decorative rings */}
            <div style={{
              position: "absolute", width: "80%", height: "80%",
              borderRadius: "50%", border: "1px solid rgba(255,255,255,0.08)",
              top: "10%", left: "10%", pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute", width: "60%", height: "60%",
              borderRadius: "50%", border: "1px solid rgba(255,255,255,0.05)",
              top: "20%", left: "20%", pointerEvents: "none",
            }} />
          </div>

          {/* Right — description card */}
          <div className="w-full md:w-[55%]" style={{
            borderRadius: "clamp(16px, 2.5vw, 32px)",
            background: `linear-gradient(145deg, ${project.accent}08 0%, rgba(255,255,255,0.015) 100%)`,
            border: `1px solid ${project.accent}15`,
            padding: "clamp(1.25rem, 2vw, 2.5rem)",
            display: "flex", flexDirection: "column",
            justifyContent: "center", gap: "clamp(0.75rem, 1.2vw, 1.5rem)",
          }}>
            <p style={{
              color: "#D7E2EA", fontWeight: 300, lineHeight: 1.7,
              fontSize: "clamp(0.75rem, 1.15vw, 1.05rem)", opacity: 0.85,
            }}>
              {project.desc}
            </p>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap",
              marginTop: "auto", paddingTop: "clamp(0.5rem, 1vw, 1rem)",
            }}>
              <div style={{
                border: `1px solid ${project.accent}66`,
                borderRadius: "9999px", padding: "0.3rem 1rem",
                background: `${project.accent}15`,
              }}>
                <span style={{
                  color: project.accent, fontSize: "clamp(0.5rem, 0.75vw, 0.7rem)",
                  fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase",
                }}>
                  Open Source
                </span>
              </div>
              <span style={{
                color: "rgba(215,226,234,0.3)", fontSize: "clamp(0.5rem, 0.7vw, 0.65rem)",
                letterSpacing: "0.08em",
              }}>
                {project.link.replace("https://github.com/", "")}
              </span>
            </div>
          </div>
        </div>
      </div>
  );
}

function ProjectsSection() {
  return (
    <section
      id="projects"
      style={{
        background: "#0C0C0C",
        zIndex: 10,
        position: "relative",
        scrollMarginTop: "100px",
      }}
      className="px-6 sm:px-10 md:px-16 pt-8 sm:pt-12 md:pt-20 pb-8 sm:pb-12 md:pb-20"
    >
      <FadeIn delay={0} y={40}>
        <h2
          className="hero-heading font-black uppercase text-center leading-none tracking-tight"
          style={{
            fontSize: "clamp(3rem, 12vw, 160px)",
            marginBottom: "clamp(1.25rem, 3vw, 3rem)",
          }}
        >
          Projects
        </h2>
      </FadeIn>

      {PROJECTS.map((project) => (
        <ProjectCard key={project.num} project={project} />
      ))}
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTION 6: Contact / Footer
───────────────────────────────────────────────────────────── */
function ContactSection() {
  return (
    <section
      id="contact"
      style={{ background: "#0C0C0C", position: "relative", overflow: "hidden" }}
      className="px-6 sm:px-10 md:px-16 pt-8 sm:pt-12 md:pt-24 pb-16 sm:pb-24 md:pb-36"
    >
      {/* Subtle glow blob */}
      <div style={{
        position: "absolute",
        top: "30%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "clamp(300px, 60vw, 800px)",
        height: "clamp(200px, 40vw, 500px)",
        background: "radial-gradient(ellipse, rgba(182,0,168,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "900px", margin: "0 auto" }}>

        {/* Big heading */}
        <FadeIn delay={0} y={40}>
          <h2
            className="hero-heading font-black uppercase leading-none tracking-tight text-center"
            style={{ fontSize: "clamp(2.8rem, 11vw, 140px)", marginBottom: "clamp(1.5rem, 4vw, 4rem)" }}
          >
            Let&apos;s Talk
          </h2>
        </FadeIn>

        {/* Tagline */}
        <FadeIn delay={0.15} y={20}>
          <p
            className="font-light text-center"
            style={{
              color: "#D7E2EA",
              opacity: 0.6,
              fontSize: "clamp(0.9rem, 1.8vw, 1.3rem)",
              letterSpacing: "0.04em",
              marginBottom: "clamp(2.5rem, 5vw, 5rem)",
            }}
          >
            Have a project in mind? I&apos;d love to hear about it.
          </p>
        </FadeIn>

        {/* Contact info cards */}
        <FadeIn delay={0.25} y={20}>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            justifyContent: "center",
            marginBottom: "clamp(2.5rem, 5vw, 5rem)",
          }}>
            {/* Email */}
            <a
              href="mailto:shahikhan2022@gmail.com"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "clamp(0.4rem, 0.75vw, 0.75rem)",
                border: "1px solid rgba(215,226,234,0.2)",
                borderRadius: "9999px",
                padding: "clamp(0.6rem, 1.2vw, 0.9rem) clamp(1rem, 2.5vw, 1.8rem)",
                color: "#D7E2EA",
                textDecoration: "none",
                fontFamily: "'Kanit', sans-serif",
                fontWeight: 300,
                fontSize: "clamp(0.7rem, 1.2vw, 1.1rem)",
                letterSpacing: "0.04em",
                background: "rgba(215,226,234,0.04)",
                transition: "border-color 0.2s, background 0.2s",
                backdropFilter: "blur(4px)",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(182,0,168,0.6)"; e.currentTarget.style.background = "rgba(182,0,168,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(215,226,234,0.2)"; e.currentTarget.style.background = "rgba(215,226,234,0.04)"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D7E2EA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              shahikhan2022@gmail.com
            </a>

            {/* Phone */}
            <a
              href="tel:+9203008307918"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "clamp(0.4rem, 0.75vw, 0.75rem)",
                border: "1px solid rgba(215,226,234,0.2)",
                borderRadius: "9999px",
                padding: "clamp(0.6rem, 1.2vw, 0.9rem) clamp(1rem, 2.5vw, 1.8rem)",
                color: "#D7E2EA",
                textDecoration: "none",
                fontFamily: "'Kanit', sans-serif",
                fontWeight: 300,
                fontSize: "clamp(0.7rem, 1.2vw, 1.1rem)",
                letterSpacing: "0.04em",
                background: "rgba(215,226,234,0.04)",
                transition: "border-color 0.2s, background 0.2s",
                backdropFilter: "blur(4px)",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(182,0,168,0.6)"; e.currentTarget.style.background = "rgba(182,0,168,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(215,226,234,0.2)"; e.currentTarget.style.background = "rgba(215,226,234,0.04)"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D7E2EA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.45 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 5.53 5.53l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"/>
              </svg>
              0300 830 7918
            </a>
          </div>
        </FadeIn>

        {/* Divider */}
        <div style={{ width: "100%", height: "1px", background: "rgba(215,226,234,0.1)", marginBottom: "clamp(2rem, 4vw, 3.5rem)" }} />

        {/* Footer bottom row */}
        <FadeIn delay={0.35} y={10}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1.5rem",
          }}>
            {/* Name + copyright */}
            <div className="w-full sm:w-auto text-center sm:text-left">
              <p
                className="font-black uppercase"
                style={{ color: "#D7E2EA", fontSize: "clamp(1rem, 2vw, 1.4rem)", letterSpacing: "0.08em" }}
              >
                Shahid Zahoor Khan
              </p>
              <p
                style={{
                  color: "#D7E2EA",
                  opacity: 0.35,
                  fontSize: "clamp(0.7rem, 1vw, 0.85rem)",
                  fontWeight: 300,
                  letterSpacing: "0.06em",
                  marginTop: "0.2rem",
                }}
              >
                © {new Date().getFullYear()} — UI/UX Designer &amp; Developer
              </p>
            </div>

            {/* Social links */}
            <div className="w-full sm:w-auto flex justify-center" style={{ display: "flex", gap: "0.75rem" }}>
              {/* Instagram */}
              <a
                href="https://www.instagram.com/shahi.khan.io1?utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "clamp(38px, 8vw, 48px)",
                  height: "clamp(38px, 8vw, 48px)",
                  borderRadius: "9999px",
                  border: "1px solid rgba(215,226,234,0.2)",
                  background: "rgba(215,226,234,0.04)",
                  color: "#D7E2EA",
                  transition: "border-color 0.2s, background 0.2s, transform 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(182,0,168,0.6)"; e.currentTarget.style.background = "rgba(182,0,168,0.12)"; e.currentTarget.style.transform = "scale(1.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(215,226,234,0.2)"; e.currentTarget.style.background = "rgba(215,226,234,0.04)"; e.currentTarget.style.transform = "scale(1)"; }}
              >
                <svg width="clamp(16, 4vw, 20)" height="clamp(16, 4vw, 20)" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/in/shahid-zahoor-khan-12502938a"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "clamp(38px, 8vw, 48px)",
                  height: "clamp(38px, 8vw, 48px)",
                  borderRadius: "9999px",
                  border: "1px solid rgba(215,226,234,0.2)",
                  background: "rgba(215,226,234,0.04)",
                  color: "#D7E2EA",
                  transition: "border-color 0.2s, background 0.2s, transform 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(182,0,168,0.6)"; e.currentTarget.style.background = "rgba(182,0,168,0.12)"; e.currentTarget.style.transform = "scale(1.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(215,226,234,0.2)"; e.currentTarget.style.background = "rgba(215,226,234,0.04)"; e.currentTarget.style.transform = "scale(1)"; }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect x="2" y="9" width="4" height="12"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <div style={{ background: "#0C0C0C", overflowX: "clip" }}>
      <GlobalStyles />
      <HeroSection />
      <MarqueeSection />
      <div className="h-24 sm:h-32 md:h-48 flex items-center justify-center" style={{ background: "#0C0C0C" }}>
        <div style={{ width: "clamp(80px, 25vw, 160px)", height: "2px", borderRadius: "2px", background: "linear-gradient(90deg, transparent, rgba(182,0,168,0.5), rgba(118,33,176,0.5), transparent)" }} />
      </div>
      <AboutSection />
      <div className="h-24 sm:h-32 md:h-48 flex items-center justify-center" style={{ background: "#0C0C0C" }}>
        <div style={{ width: "clamp(80px, 25vw, 160px)", height: "2px", borderRadius: "2px", background: "linear-gradient(90deg, transparent, rgba(182,0,168,0.5), rgba(118,33,176,0.5), transparent)" }} />
      </div>
      <ServicesSection />
      <div className="h-16 sm:h-20 md:h-32 flex items-center justify-center" style={{ background: "#0C0C0C" }}>
        <div style={{ width: "clamp(60px, 20vw, 120px)", height: "2px", borderRadius: "2px", background: "linear-gradient(90deg, transparent, rgba(182,0,168,0.4), rgba(118,33,176,0.4), transparent)" }} />
      </div>
      <ProjectsSection />
      <div className="h-16 sm:h-20 md:h-32 flex items-center justify-center" style={{ background: "#0C0C0C" }}>
        <div style={{ width: "clamp(80px, 25vw, 160px)", height: "2px", borderRadius: "2px", background: "linear-gradient(90deg, transparent, rgba(182,0,168,0.5), rgba(118,33,176,0.5), transparent)" }} />
      </div>
      <ContactSection />
    </div>
  );
}