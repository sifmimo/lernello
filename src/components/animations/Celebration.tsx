'use client';

import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
}

export function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (active) {
      const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
      const newPieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
      }));
      setPieces(newPieces);

      const timer = setTimeout(() => setPieces([]), 4000);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map(piece => (
        <div
          key={piece.id}
          className="absolute top-0 h-3 w-3 rounded-sm"
          style={{
            left: `${piece.x}%`,
            backgroundColor: piece.color,
            animation: `confetti-fall ${piece.duration}s ease-out ${piece.delay}s forwards`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export function StarBurst({ active }: { active: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (active) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <div className="relative">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute h-2 w-2 rounded-full bg-yellow-400"
            style={{
              animation: `star-burst 0.6s ease-out forwards`,
              transform: `rotate(${i * 45}deg) translateY(-20px)`,
            }}
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes star-burst {
          0% {
            transform: rotate(var(--rotation)) translateY(-20px) scale(0);
            opacity: 1;
          }
          100% {
            transform: rotate(var(--rotation)) translateY(-80px) scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export function SuccessCheckmark({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="flex items-center justify-center">
      <div className="relative h-16 w-16">
        <svg className="h-full w-full" viewBox="0 0 52 52">
          <circle
            className="animate-[circle_0.6s_ease-in-out_forwards]"
            cx="26"
            cy="26"
            r="25"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            strokeDasharray="166"
            strokeDashoffset="166"
          />
          <path
            className="animate-[check_0.3s_0.6s_ease-in-out_forwards]"
            fill="none"
            stroke="#22c55e"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="48"
            strokeDashoffset="48"
            d="M14 27l7 7 16-16"
          />
        </svg>
      </div>
      <style jsx>{`
        @keyframes circle {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes check {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}

export function PulseRing({ active, color = '#6366f1' }: { active: boolean; color?: string }) {
  if (!active) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="h-full w-full rounded-full animate-ping"
        style={{ backgroundColor: color, opacity: 0.3 }}
      />
    </div>
  );
}
