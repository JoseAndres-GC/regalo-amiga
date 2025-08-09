"use client";

import { useEffect, useRef, useState } from "react";

type Particle = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  alpha: number;
  radius: number;
  color: string;
  vx?: number;
  vy?: number;
  isRain?: boolean;
  isFirework?: boolean;
  // vela
  isFlame?: boolean;
  life?: number; // para chispas/llama y progreso de humo
  // humo
  isSmoke?: boolean;
};

export default function Home() {
  const [opened, setOpened] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [effectsOn, setEffectsOn] = useState(false);

  const effectsOnRef = useRef(false);
  useEffect(() => {
    effectsOnRef.current = effectsOn;
  }, [effectsOn]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const fireworkInterval = useRef<NodeJS.Timeout | null>(null);
  const rainInterval = useRef<NodeJS.Timeout | null>(null);
  const flameInterval = useRef<NodeJS.Timeout | null>(null);
  const reigniteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // AUDIO
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioFadeTimer = useRef<NodeJS.Timeout | null>(null);

  // vela: posición y estado
  const candleBoundsRef = useRef<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }>({
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
  });
  const candlePosRef = useRef<{
    cx: number;
    topY: number;
    w: number;
    h: number;
    wickH: number;
  }>({
    cx: 0,
    topY: 0,
    w: 16,
    h: 46,
    wickH: 10,
  });
  const candleLitRef = useRef<boolean>(true);

  useEffect(() => {
    audioRef.current?.load();
  }, []);

  const handleGiftClick = () => {
    setOpened(true);
    setTimeout(() => setShowMessage(true), 1500);
  };

  // ---- helpers de audio (fade) ----
  const fadeAudio = (
    el: HTMLAudioElement,
    to: number,
    duration = 600,
    onDone?: () => void
  ) => {
    if (audioFadeTimer.current) clearInterval(audioFadeTimer.current);
    const from = el.volume;
    const start = performance.now();
    audioFadeTimer.current = setInterval(() => {
      const t = Math.min(1, (performance.now() - start) / duration);
      const v = from + (to - from) * t;
      el.volume = Math.max(0, Math.min(1, v));
      if (t >= 1) {
        clearInterval(audioFadeTimer.current!);
        audioFadeTimer.current = null;
        onDone?.();
      }
    }, 16);
  };

  const toggleEffects = () => {
    const el = audioRef.current;

    if (!effectsOn) {
      setEffectsOn(true);
      if (el) {
        if (audioFadeTimer.current) clearInterval(audioFadeTimer.current);
        el.volume = 0;
        el.play().catch(() => {});
        fadeAudio(el, 1, 350);
      }
      return;
    }

    // OFF
    setEffectsOn(false);
    candleLitRef.current = false;
    if (flameInterval.current) clearInterval(flameInterval.current);
    if (reigniteTimeoutRef.current) {
      clearTimeout(reigniteTimeoutRef.current);
      reigniteTimeoutRef.current = null;
    }
    if (fireworkInterval.current) clearInterval(fireworkInterval.current);
    if (rainInterval.current) clearInterval(rainInterval.current);
    particlesRef.current = [];

    if (el) {
      fadeAudio(el, 0, 700, () => {
        el.pause();
        el.currentTime = 0;
      });
    }
  };

  // --------- LOOP DE DIBUJO ----------
  useEffect(() => {
    if (!opened) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        if (p.isRain) {
          p.y += p.vy ?? 1;
        } else if (p.isSmoke) {
          p.x += (p.vx ?? 0) + (Math.random() - 0.5) * 0.1;
          p.y += p.vy ?? -0.4;
          p.alpha -= 0.003;
          p.radius *= 1.0025;
          p.life = (p.life ?? 0) + 0.006;
        } else if (p.isFlame) {
          p.x += (p.tx - p.x) * 0.15 + (Math.random() - 0.5) * 0.35;
          p.y += (p.ty - p.y) * 0.15 - Math.random() * 0.12;
          p.life = (p.life ?? 1) - 0.02;
          p.alpha = Math.max(0, Math.min(1, p.life ?? 0));
        } else if (p.vx !== undefined && p.vy !== undefined) {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.01;
        } else {
          p.x += (p.tx - p.x) * 0.07;
          p.y += (p.ty - p.y) * 0.07;
          p.alpha = Math.min(p.alpha + 0.02, 1);
        }

        if (p.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = p.alpha;

          if (p.isFlame) {
            ctx.shadowBlur = 12;
            ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;
          } else if (p.isSmoke) {
            const t = Math.min(1, Math.max(0, p.life ?? 0));
            const hue = 330 * (1 - t);
            const sat = 60 * (1 - t);
            const light = 78 - 6 * t;
            ctx.shadowBlur = 6;
            ctx.shadowColor = "rgba(120,120,120,0.6)";
            ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
          } else {
            ctx.fillStyle = p.color;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0);
      requestAnimationFrame(animate);
    };

    animate();
    return () => window.removeEventListener("resize", resize);
  }, [opened]);

  // --------- Helpers de la torta “real” ----------
  const inRoundedRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    px: number,
    py: number
  ) => {
    const rx = Math.max(x + r, Math.min(px, x + w - r));
    const ry = Math.max(y + r, Math.min(py, y + h - r));
    const dx = px - rx,
      dy = py - ry;
    const corner = dx * dx + dy * dy <= r * r;
    const body = px >= x + r && px <= x + w - r && py >= y && py <= y + h;
    return corner || body;
  };

  const addPlate = (cx: number, y: number, w: number) => {
    const a = w / 2;
    const b = w / 8;
    for (let t = 0; t < Math.PI * 2; t += 0.08) {
      const tx = cx + Math.cos(t) * a;
      const ty = y + Math.sin(t) * b;
      particlesRef.current.push({
        x: cx + (Math.random() - 0.5) * 500,
        y: window.innerHeight + Math.random() * 200,
        tx,
        ty,
        alpha: 0,
        radius: 1.5,
        color: "rgba(255,255,255,0.25)",
      });
    }
    for (let t = 0; t < Math.PI * 2; t += 0.1) {
      const tx = cx + Math.cos(t) * (a - 10);
      const ty = y + 2 + Math.sin(t) * (b - 6);
      particlesRef.current.push({
        x: cx + (Math.random() - 0.5) * 400,
        y: window.innerHeight + Math.random() * 200,
        tx,
        ty,
        alpha: 0,
        radius: 1.2,
        color: "rgba(0,0,0,0.22)",
      });
    }
  };

  const addTier = (
    cx: number,
    baseY: number,
    level: number,
    w: number,
    h: number,
    r: number,
    baseTop: string,
    baseBottom: string,
    icing: string
  ) => {
    const x0 = cx - w / 2;
    const y0 = baseY - level * (h + 12) - h;

    for (let i = 2; i < w - 2; i += 4) {
      for (let j = 2; j < h - 2; j += 4) {
        const px = x0 + i;
        const py = y0 + j;
        if (!inRoundedRect(x0, y0, w, h, r, px, py)) continue;
        const t = j / h;
        const color = t < 0.5 ? baseTop : baseBottom;
        particlesRef.current.push({
          x: cx + (Math.random() - 0.5) * 600,
          y: window.innerHeight + Math.random() * 200,
          tx: px,
          ty: py,
          alpha: 0,
          radius: 1.6,
          color,
        });
      }
    }

    const icingH = Math.max(8, Math.floor(h * 0.22));
    for (let i = 2; i < w - 2; i += 3) {
      for (let j = 0; j < icingH; j += 3) {
        const px = x0 + i;
        const py = y0 + j + 2;
        if (!inRoundedRect(x0, y0, w, h, r, px, py)) continue;
        particlesRef.current.push({
          x: cx + (Math.random() - 0.5) * 500,
          y: window.innerHeight + Math.random() * 160,
          tx: px,
          ty: py,
          alpha: 0,
          radius: 1.7,
          color: icing,
        });
      }
    }

    const scallopR = 6;
    const left = x0 + r + scallopR;
    const right = x0 + w - r - scallopR;
    const yScallop = y0 + icingH + 6;

    for (let cxS = left; cxS <= right; cxS += scallopR * 2.2) {
      for (let ang = Math.PI; ang >= 0; ang -= 0.35) {
        const px = cxS + Math.cos(ang) * scallopR;
        const py = yScallop + Math.sin(ang) * scallopR;
        particlesRef.current.push({
          x: cx + (Math.random() - 0.5) * 400,
          y: window.innerHeight + Math.random() * 120,
          tx: px,
          ty: py,
          alpha: 0,
          radius: 1.6,
          color: icing,
        });
      }
    }
  };

  // ---- Vela recta ----
  const igniteCandle = (cx: number, topY: number) => {
    candleLitRef.current = true;

    const spawnFlame = () => {
      for (let n = 0; n < 8; n++) {
        particlesRef.current.push({
          x: cx + (Math.random() - 0.5) * 3,
          y: topY - candlePosRef.current.h - 10 + (Math.random() - 0.5) * 2,
          tx: cx + (Math.random() - 0.5) * 3,
          ty: topY - candlePosRef.current.h - 20 - Math.random() * 6,
          alpha: 1,
          radius: 1.8,
          color: "hsl(48,100%,66%)",
          isFlame: true,
          life: 1,
        });
      }
      for (let n = 0; n < 6; n++) {
        particlesRef.current.push({
          x: cx + (Math.random() - 0.5) * 4,
          y: topY - candlePosRef.current.h - 9 + (Math.random() - 0.5) * 3,
          tx: cx + (Math.random() - 0.5) * 6,
          ty: topY - candlePosRef.current.h - 16 - Math.random() * 10,
          alpha: 0.9,
          radius: 2.2,
          color: "hsl(28,100%,60%)",
          isFlame: true,
          life: 0.9,
        });
      }
      for (let s = 0; s < 3; s++) {
        particlesRef.current.push({
          x: cx + (Math.random() - 0.5) * 6,
          y: topY - candlePosRef.current.h - 12,
          tx: cx + (Math.random() - 0.5) * 22,
          ty: topY - candlePosRef.current.h - 42 - Math.random() * 20,
          alpha: 0.9,
          radius: 1.4,
          color: "hsl(50,100%,80%)",
          isFlame: true,
          life: 0.8,
        });
      }
    };

    if (flameInterval.current) clearInterval(flameInterval.current);
    flameInterval.current = setInterval(spawnFlame, 110);
    spawnFlame();
  };

  const extinguishCandle = () => {
    if (!candleLitRef.current) return;
    candleLitRef.current = false;

    if (flameInterval.current) clearInterval(flameInterval.current);
    if (reigniteTimeoutRef.current) {
      clearTimeout(reigniteTimeoutRef.current);
      reigniteTimeoutRef.current = null;
    }

    particlesRef.current.forEach((p) => {
      if (p.isFlame) p.life = Math.min(p.life ?? 1, 0.3);
    });

    const { cx, topY, h, wickH } = candlePosRef.current;
    const smokeY = topY - h - wickH - 6;

    for (let i = 0; i < 55; i++) {
      particlesRef.current.push({
        x: cx + (Math.random() - 0.5) * 8,
        y: smokeY + (Math.random() - 0.5) * 3,
        tx: 0,
        ty: 0,
        alpha: 0.85,
        radius: 1.8 + Math.random() * 1.4,
        color: "hsl(330,60%,78%)",
        vx: (Math.random() - 0.5) * 0.6,
        vy: -0.4 - Math.random() * 0.3,
        isSmoke: true,
        life: 0,
      });
    }

    reigniteTimeoutRef.current = setTimeout(() => {
      reigniteTimeoutRef.current = null;
      if (!effectsOnRef.current) return;
      igniteCandle(cx, topY);
    }, 7000);
  };

  const addCandle = (cx: number, topY: number) => {
    const w = 16,
      h = 46,
      wickH = 10;
    candlePosRef.current = { cx, topY, w, h, wickH };

    for (let i = -w / 2; i <= w / 2; i += 3) {
      for (let j = 0; j <= h; j += 3) {
        const tx = cx + i;
        const ty = topY - j;
        const band = (((i + j) % 12) + 12) % 12;
        const light = band < 6;
        const baseL = 82 - (j / h) * 24;
        const color = `hsl(320,70%,${light ? baseL : baseL - 8}%)`;
        particlesRef.current.push({
          x: cx + (Math.random() - 0.5) * 120,
          y: window.innerHeight + Math.random() * 80,
          tx,
          ty,
          alpha: 0,
          radius: 1.5,
          color,
        });
      }
    }

    for (let j = 0; j < wickH; j += 2) {
      particlesRef.current.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: window.innerHeight + Math.random() * 60,
        tx: cx,
        ty: topY - h - j,
        alpha: 0,
        radius: 1.2,
        color: "#3b2f2f",
      });
    }

    candleBoundsRef.current = {
      x1: cx - w / 2 - 10,
      x2: cx + w / 2 + 10,
      y1: topY - h - 40,
      y2: topY + 6,
    };

    igniteCandle(cx, topY);
  };

  // --------- EFECTOS (torta, vela, lluvia, fuegos) ----------
  useEffect(() => {
    if (!effectsOn) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const baseY = canvas.height / 2 + 190;

    if (flameInterval.current) clearInterval(flameInterval.current);
    if (reigniteTimeoutRef.current) {
      clearTimeout(reigniteTimeoutRef.current);
      reigniteTimeoutRef.current = null;
    }

    addPlate(centerX, baseY + 12, 300);
    addTier(centerX, baseY, 0, 260, 48, 16, "#f9d8ea", "#f4b9e2", "#fff0fb");
    addTier(centerX, baseY, 1, 185, 42, 14, "#f7b1ef", "#eaa3ea", "#ffe6fb");
    addTier(centerX, baseY, 2, 120, 36, 12, "#d2bce9", "#c8b0e2", "#fff2ff");

    addCandle(centerX, baseY - 2 * (36 + 12) - 36);

    const spawnRain = () => {
      for (let i = 0; i < 28; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: -10,
          tx: 0,
          ty: 0,
          alpha: 1,
          radius: 1.2,
          color: `hsl(${Math.random() * 360}, 80%, 70%)`,
          vx: 0,
          vy: Math.random() * 2 + 2,
          isRain: true,
        });
      }
    };

    const launchFirework = () => {
      const fwX = Math.random() * canvas.width;
      const fwY = Math.random() * canvas.height * 0.5;
      for (let i = 0; i < 60; i++) {
        const ang = Math.random() * 2 * Math.PI;
        const sp = Math.random() * 4 + 1;
        particlesRef.current.push({
          x: fwX,
          y: fwY,
          tx: 0,
          ty: 0,
          alpha: 1,
          radius: 2,
          color: `hsl(${Math.random() * 360}, 100%, 70%)`,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          isFirework: true,
        });
      }
    };

    rainInterval.current = setInterval(spawnRain, 1000);
    fireworkInterval.current = setInterval(launchFirework, 1800);

    return () => {
      clearInterval(rainInterval.current!);
      clearInterval(fireworkInterval.current!);
      clearInterval(flameInterval.current!);
      if (reigniteTimeoutRef.current) {
        clearTimeout(reigniteTimeoutRef.current);
        reigniteTimeoutRef.current = null;
      }
    };
  }, [effectsOn]);

  // --- Click para apagar/encender vela (soplar) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onClick = (e: MouseEvent) => {
      if (!effectsOn) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
      const { x1, y1, x2, y2 } = candleBoundsRef.current;
      if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
        extinguishCandle();
      }
    };

    canvas.addEventListener("click", onClick);
    return () => canvas.removeEventListener("click", onClick);
  }, [effectsOn]);

  return (
    <main className="relative w-full min-h-[100svh] bg-[#0a0e2a] text-white overflow-hidden font-mono flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(white_1px,transparent_1px)] bg-[length:20px_20px] opacity-10 z-0" />

      {/* AUDIO (no visible) */}
      <audio ref={audioRef} src="/audio/dawn-new.mp3" loop preload="auto" />

      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full z-10"
      />

      {!opened && (
        <div className="flex flex-col items-center z-30 px-4 text-center">
          <p className="text-pink-300 text-[4vw] sm:text-xl md:text-2xl leading-snug animate-fadein break-words max-w-xs sm:max-w-md">
            To: Valeria Cristina.
          </p>
          <button
            onClick={handleGiftClick}
            className="transition-transform hover:scale-110 mt-4"
          >
            <svg
              width="100"
              height="100"
              viewBox="0 0 100 100"
              className="animate-bounce"
            >
              <rect
                x="20"
                y="40"
                width="60"
                height="40"
                rx="5"
                fill="#ff69b4"
              />
              <rect x="45" y="40" width="10" height="40" fill="#ffffff" />
              <rect
                x="20"
                y="35"
                width="60"
                height="10"
                rx="2"
                fill="#ff1493"
              />
              <path
                d="M40 35 Q35 25 45 25 Q50 25 50 30 Q50 25 55 25 Q65 25 60 35"
                fill="#ff69b4"
              />
            </svg>
          </button>
        </div>
      )}

      {showMessage && (
        <>
          <div className="flex justify-center items-center mb-20 z-30">
            <h1 className="text-[4vw] md:text-3xl text-center text-pink-300 animate-typewriter overflow-hidden whitespace-nowrap max-w-fit">
              {`Happy birthday! Have an amazing year, Valeria. ✨`}
            </h1>
            <span className="ml-1 w-[2px] h-[2.5rem] md:h-[1.5rem] bg-pink-300 animate-blink" />
          </div>

          {/* Barra fija inferior con safe-area */}
          <div className="fixed inset-x-0 bottom-0 z-30 pointer-events-none">
            <div className="pointer-events-auto mx-auto w-full max-w-sm flex flex-col items-center pb-[max(env(safe-area-inset-bottom),16px)] pt-2">
              <span className="text-white text-xs mb-1 select-none">
                OFF / ON
              </span>
              <button
                onClick={toggleEffects}
                className={`w-16 h-8 rounded-full px-1 transition-colors duration-300 relative ${
                  effectsOn ? "bg-cyan-400" : "bg-gray-500"
                }`}
              >
                <span
                  className={`w-6 h-6 bg-white rounded-full block transition-transform duration-300 ${
                    effectsOn ? "translate-x-8" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes typewriter {
          from {
            width: 0;
          }
          to {
            width: 42ch;
          }
        }
        @keyframes fadein {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes blink {
          0%,
          50%,
          100% {
            opacity: 1;
          }
          25%,
          75% {
            opacity: 0;
          }
        }
        .animate-typewriter {
          animation: typewriter 4s steps(42, end) forwards;
        }
        .animate-fadein {
          animation: fadein 1s ease-in-out forwards;
        }
        .animate-blink {
          animation: blink 1.8s step-start infinite;
        }
      `}</style>
    </main>
  );
}
