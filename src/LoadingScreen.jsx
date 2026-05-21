import { useEffect, useRef, useState } from "react";

const logoUrl = "/logo.png";

export default function LoadingScreen({ onComplete }) {
  const canvasRef = useRef(null);
  const [pct, setPct] = useState(0);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  const TARGET = 417;
  const DURATION = 3800;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    let W = parent.offsetWidth;
    let H = parent.offsetHeight;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const COUNT = 90;
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.4 + 0.3,
      a: Math.random() * 0.45 + 0.1,
    }));

    let raf;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(26,77,204,${0.2 * (1 - d / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(80,140,255,${p.a})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    let raf;
    let start = null;
    const delay = setTimeout(() => {
      function anim(ts) {
        if (!start) start = ts;
        const raw = Math.min((ts - start) / DURATION, 1);
        const ease =
          raw < 0.5
            ? 2 * raw * raw
            : 1 - Math.pow(-2 * raw + 2, 2) / 2;
        setPct(Math.round(ease * 100));
        setCount(Math.round(ease * TARGET));
        if (raw < 1) {
          raf = requestAnimationFrame(anim);
        } else {
          setDone(true);
          setTimeout(onComplete, 600);
        }
      }
      raf = requestAnimationFrame(anim);
    }, 1200);
    return () => {
      clearTimeout(delay);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div style={styles.wrap}>
      <canvas ref={canvasRef} style={styles.canvas} />
      <div style={styles.vignette} />
      <div style={{ ...styles.corner, top: 24, left: 24, borderWidth: "1px 0 0 1px" }} />
      <div style={{ ...styles.corner, top: 24, right: 24, borderWidth: "1px 1px 0 0" }} />
      <div style={{ ...styles.corner, bottom: 24, left: 24, borderWidth: "0 0 1px 1px" }} />
      <div style={{ ...styles.corner, bottom: 24, right: 24, borderWidth: "0 1px 1px 0" }} />

      <div style={styles.content}>
        <img src={logoUrl} alt="Binário Tecnologia" style={styles.logo} />
        <p style={styles.frase}>
          OFERTAS IMPERDÍVEIS &nbsp;·&nbsp;{" "}
          <span style={{ color: "#e53935", fontWeight: 700 }}>APROVEITE</span>
        </p>
        <div style={styles.barWrap}>
          <div style={{ ...styles.barFill, width: `${pct}%` }}>
            <div style={styles.barDot} />
          </div>
        </div>
        <div style={styles.barRow}>
          <span>PROMOÇÕES</span>
          <span style={{ color: "rgba(80,150,255,0.85)" }}>{pct}%</span>
        </div>
        <div style={styles.bigWrap}>
          <span style={styles.bigNum}>{String(count).padStart(3, "0")}</span>
          <span style={styles.bigLabel}>itens em promoção</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    position: "fixed",
    inset: 0,
    background: "#04080f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    zIndex: 9999,
    fontFamily: "'Segoe UI', sans-serif",
  },
  canvas: { position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 },
  vignette: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(ellipse at center, transparent 25%, rgba(4,8,15,0.88) 100%)",
    zIndex: 1,
    pointerEvents: "none",
  },
  corner: {
    position: "absolute",
    width: 22,
    height: 22,
    borderColor: "rgba(26,77,204,0.45)",
    borderStyle: "solid",
    zIndex: 4,
  },
  content: {
    position: "relative",
    zIndex: 5,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 0,
  },
  logo: { width: 260, opacity: 1, filter: "brightness(1.05)", marginBottom: 28 },
  frase: {
    fontSize: 10,
    letterSpacing: "0.5em",
    color: "rgba(255,255,255,0.32)",
    textTransform: "uppercase",
    marginBottom: 28,
    whiteSpace: "nowrap",
  },
  barWrap: { width: 280, height: 1, background: "rgba(255,255,255,0.07)", position: "relative", overflow: "visible" },
  barFill: { height: 1, background: "linear-gradient(90deg, #0d2580, #1a6aff)", position: "relative", transition: "width 80ms linear" },
  barDot: {
    position: "absolute",
    right: -1,
    top: -3,
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#1a6aff",
    boxShadow: "0 0 10px #1a6aff, 0 0 24px rgba(26,106,255,0.5)",
  },
  barRow: {
    display: "flex",
    justifyContent: "space-between",
    width: 280,
    marginTop: 10,
    fontSize: 9,
    letterSpacing: "0.25em",
    color: "rgba(255,255,255,0.18)",
  },
  bigWrap: { marginTop: 44, position: "relative", textAlign: "center", width: 280 },
  bigNum: { fontSize: 96, fontWeight: 900, color: "rgba(255,255,255,0.04)", letterSpacing: "-6px", lineHeight: 1, display: "block" },
  bigLabel: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: 9,
    letterSpacing: "0.45em",
    color: "rgba(255,255,255,0.2)",
    whiteSpace: "nowrap",
    textTransform: "uppercase",
  },
  btn: {
    marginTop: 32,
    padding: "12px 40px",
    background: "transparent",
    border: "1px solid rgba(26,77,204,0.35)",
    color: "rgba(255,255,255,0.5)",
    fontFamily: "'Segoe UI', sans-serif",
    fontSize: 9,
    letterSpacing: "0.5em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "all 0.3s",
  },
};
