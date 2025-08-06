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
};

export default function Home() {
  const [opened, setOpened] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [effectsOn, setEffectsOn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const fireworkInterval = useRef<NodeJS.Timeout | null>(null);
  const rainInterval = useRef<NodeJS.Timeout | null>(null);

  const handleGiftClick = () => {
    setOpened(true);
    setTimeout(() => {
      setShowMessage(true);
    }, 1500);
  };

  const toggleEffects = () => {
    if (effectsOn) {
      setEffectsOn(false);
      particlesRef.current = [];
      if (fireworkInterval.current) clearInterval(fireworkInterval.current);
      if (rainInterval.current) clearInterval(rainInterval.current);
    } else {
      setEffectsOn(true);
    }
  };

  useEffect(() => {
    if (!opened) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
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

      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0);
      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    };

    animate();
  }, [opened]);

  useEffect(() => {
    if (!effectsOn) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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

    addTier(0, 140, 35, "#f8cdda");
    addTier(1, 90, 30, "#f7aef8");
    addTier(2, 50, 25, "#cdb4db");

    for (let j = 0; j < 30; j += 3) {
      particles.push({
        x: centerX + (Math.random() - 0.5) * 20,
        y: canvas.height + Math.random() * 100,
        tx: centerX,
        ty: baseY - 3 * (30 + 4) - j,
        alpha: 0,
        radius: 1.5,
        color: "#fff59d",
      });
    }

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: centerX + (Math.random() - 0.5) * 30,
        y: canvas.height + Math.random() * 100,
        tx: centerX + (Math.random() - 0.5) * 10,
        ty: baseY - 3 * (30 + 4) - 40 + Math.random() * 5,
        alpha: 0,
        radius: Math.random() * 2 + 1,
        color: `hsl(${Math.random() * 30 + 20}, 100%, ${
          60 + Math.random() * 20
        }%)`,
      });
    }

    const spawnRain = () => {
      for (let i = 0; i < 40; i++) {
        particlesRef.current.push({
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

    const launchFirework = () => {
      const fwX = Math.random() * canvas.width;
      const fwY = Math.random() * canvas.height * 0.5;
      for (let i = 0; i < 60; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = Math.random() * 4 + 1;
        particlesRef.current.push({
          x: fwX,
          y: fwY,
          tx: 0,
          ty: 0,
          alpha: 1,
          radius: 2,
          color: `hsl(${Math.random() * 360}, 100%, 70%)`,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          isFirework: true,
        });
      }
    };

    particlesRef.current.push(...particles);
    rainInterval.current = setInterval(spawnRain, 1000);
    fireworkInterval.current = setInterval(launchFirework, 1800);

    return () => {
      clearInterval(rainInterval.current!);
      clearInterval(fireworkInterval.current!);
    };
  }, [effectsOn]);

  return (
    <main className="relative w-full h-screen bg-[#0a0e2a] text-white overflow-hidden font-mono flex items-center justify-center">
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

      {showMessage && (
        <>
          <div className="flex justify-center items-center mb-20 z-30">
            <h1 className="text-[4vw] md:text-3xl text-center text-pink-300 animate-typewriter overflow-hidden whitespace-nowrap max-w-fit">
              {`Happy birthday! Have an amazing year. 🌟`}
            </h1>
            <span className="ml-1 w-[2px] h-[2.5rem] md:h-[1.5rem] bg-pink-300 animate-blink" />
          </div>

          <div className="z-30 absolute bottom-10 flex flex-col items-center">
            <span className="text-white text-sm mb-1">OFF / ON</span>
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
