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
};

export default function Home() {
  const [opened, setOpened] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleGiftClick = () => {
    setOpened(true);
    setTimeout(() => {
      setShowText(true);
      setShowEffects(true);
    }, 1500);
  };

  useEffect(() => {
    if (!showEffects) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const centerX = canvas.width / 2;
    const baseY = canvas.height / 2 + 150;
    const particles: Particle[] = [];

    const addTier = (
      tier: number,
      width: number,
      height: number,
      color: string
    ) => {
      for (let i = -width / 2; i < width / 2; i += 4) {
        for (let j = 0; j < height; j += 4) {
          particles.push({
            x: centerX + (Math.random() - 0.5) * canvas.width,
            y: canvas.height + Math.random() * 200,
            tx: centerX + i,
            ty: baseY - tier * (height + 4) - j,
            alpha: 0,
            radius: 2,
            color,
          });
        }
      }
    };

    // Torta pastel tonos pastel suaves
    addTier(0, 140, 35, "#f8cdda"); // rosado claro
    addTier(1, 90, 30, "#f7aef8"); // lavanda claro
    addTier(2, 50, 25, "#cdb4db"); // violeta pastel

    // Vela
    for (let j = 0; j < 30; j += 3) {
      particles.push({
        x: centerX + (Math.random() - 0.5) * 100,
        y: canvas.height + Math.random() * 100,
        tx: centerX,
        ty: baseY - 3 * (30 + 4) - j,
        alpha: 0,
        radius: 1.5,
        color: "#fff59d",
      });
    }

    // Llama
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: centerX + (Math.random() - 0.5) * 100,
        y: canvas.height + Math.random() * 100,
        tx: centerX + Math.random() * 6 - 3,
        ty: baseY - 3 * (30 + 4) - 35 + Math.random() * 6 - 3,
        alpha: 0,
        radius: 2,
        color: "#ff7043",
      });
    }

    // Lluvia decorativa
    const spawnRain = () => {
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: -10,
          tx: 0,
          ty: 0,
          alpha: 1,
          radius: 1.5,
          color: `hsl(${Math.random() * 360}, 80%, 70%)`,
          vx: 0,
          vy: Math.random() * 2 + 2,
          isRain: true,
        });
      }
    };

    // Fuegos artificiales
    const launchFirework = () => {
      const fwX = Math.random() * canvas.width;
      const fwY = Math.random() * canvas.height * 0.5;

      for (let i = 0; i < 50; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = Math.random() * 4 + 1;
        particles.push({
          x: fwX,
          y: fwY,
          tx: 0,
          ty: 0,
          alpha: 1,
          radius: 2,
          color: `hsl(${Math.random() * 360}, 100%, 70%)`,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        if (p.isRain) {
          p.y += p.vy ?? 1;
        } else if (p.vx !== undefined && p.vy !== undefined) {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.01;
        } else {
          p.x += (p.tx - p.x) * 0.05;
          p.y += (p.ty - p.y) * 0.05;
          p.alpha = Math.min(p.alpha + 0.02, 1);
        }

        if (p.alpha > 0) {
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    };

    animate();
    const fireworkInterval = setInterval(launchFirework, 1800);
    const rainInterval = setInterval(spawnRain, 1000);

    return () => {
      clearInterval(fireworkInterval);
      clearInterval(rainInterval);
    };
  }, [showEffects]);

  return (
    <main className="relative w-full h-screen bg-black text-white overflow-hidden font-mono flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(white_1px,transparent_1px)] bg-[length:20px_20px] opacity-10 z-0" />

      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none"
      />

      {!opened && (
        <div className="flex flex-col items-center z-30 px-4 text-center">
          <p className="text-pink-300 text-[4vw] sm:text-xl md:text-2xl leading-snug animate-fadein break-words max-w-xs sm:max-w-md">
            To: Valeria Cristina Suarez Gorayeb.
          </p>
          <button
            onClick={handleGiftClick}
            className="transition-transform hover:scale-110 mt-4"
          >
            <svg
              width="100"
              height="100"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
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

      {showText && (
        <h1 className="text-[4vw] md:text-3xl text-center text-pink-300 animate-typewriter border-r-2 border-pink-300 pr-2 z-30 whitespace-nowrap max-w-full overflow-hidden mb-40">
          {`Happy birthday! Have an amazing year. 🌟`}
        </h1>
      )}

      <style jsx>{`
        @keyframes typewriter {
          from {
            width: 0;
          }
          to {
            width: 100%;
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

        .animate-typewriter {
          overflow: hidden;
          white-space: nowrap;
          width: 0;
          animation: typewriter 4s steps(40, end) forwards;
        }

        .animate-fadein {
          animation: fadein 1s ease-in-out forwards;
        }
      `}</style>
    </main>
  );
}
