import { useEffect, useRef, useState } from "react";

const logoUrl = "/logo.png";

export default function LoadingScreen({ onComplete }) {
  const canvasRef = useRef(null);
  const [started, setStarted] = useState(false);

  // Canvas particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    const COUNT = 90;
    const pts = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.4 + 0.3,
      a: Math.random() * 0.45 + 0.1,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(26,77,204,${0.2 * (1 - d / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      pts.forEach((p) => {
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
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  // Inicia a barra e entra no catálogo ao fim
  useEffect(() => {
    const t1 = setTimeout(() => setStarted(true), 100);
    const t2 = setTimeout(onComplete, 4600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  return (
    <div style={s.wrap}>
      <canvas ref={canvasRef} style={s.canvas} />
      <div style={s.vignette} />

      <div style={{ ...s.corner, top: 24, left: 24, borderWidth: "1px 0 0 1px" }} />
      <div style={{ ...s.corner, top: 24, right: 24, borderWidth: "1px 1px 0 0" }} />
      <div style={{ ...s.corner, bottom: 24, left: 24, borderWidth: "0 0 1px 1px" }} />
      <div style={{ ...s.corner, bottom: 24, right: 24, borderWidth: "0 1px 1px 0" }} />

      <div style={s.content}>
        <img src={logoUrl} alt="Binário Tecnologia" style={s.logo} />

        <p style={s.frase}>
          OFERTAS IMPERDÍVEIS &nbsp;·&nbsp;{" "}
          <span style={{ color: "#e53935", fontWeight: 700 }}>APROVEITE</span>
        </p>

        {/* Barra de carregamento — animada via CSS transition */}
        <div style={s.barWrap}>
          <div style={{
            ...s.barFill,
            width: started ? "100%" : "0%",
          }}>
            <div style={s.barDot} />
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  wrap: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "#04080f",
    overflow: "hidden",
    zIndex: 9999,
    fontFamily: "'Segoe UI', sans-serif",
  },
  canvas: {
    position: "absolute",
    top: 0, left: 0,
    width: "100%",
    height: "100%",
    zIndex: 0,
  },
  vignette: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
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
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 5,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  logo: {
    width: 260,
    filter: "brightness(1.05)",
    marginBottom: 28,
  },
  frase: {
    fontSize: 10,
    letterSpacing: "0.5em",
    color: "rgba(255,255,255,0.32)",
    textTransform: "uppercase",
    marginBottom: 24,
    whiteSpace: "nowrap",
  },
  barWrap: {
    width: 280,
    height: 3,
    background: "rgba(255,255,255,0.07)",
    borderRadius: 4,
    position: "relative",
    overflow: "visible",
  },
  barFill: {
    height: 3,
    borderRadius: 4,
    background: "linear-gradient(90deg, #0d2580, #1a6aff)",
    position: "relative",
    transition: "width 4500ms linear",
  },
  barDot: {
    position: "absolute",
    right: -1,
    top: -2,
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#1a6aff",
    boxShadow: "0 0 10px #1a6aff, 0 0 24px rgba(26,106,255,0.5)",
  },
};
