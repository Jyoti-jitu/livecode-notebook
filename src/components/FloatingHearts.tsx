'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Heart {
  id: number; x: number; y: number; size: number;
  speedY: number; speedX: number; opacity: number; color: string; rotation: number;
}

export default function FloatingHearts() {
  const [hearts, setHearts] = useState<Heart[]>([]);

  useEffect(() => {
    const initialHearts: Heart[] = Array.from({ length: 15 }).map((_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 80 + 10,
      size: Math.random() * 15 + 8, speedY: Math.random() * 0.5 + 0.2, speedX: Math.random() * 0.4 - 0.2,
      opacity: Math.random() * 0.6 + 0.2,
      color: ['#FF5C93', '#FF8FB1', '#FFD6E5', '#A78BFA'][Math.floor(Math.random() * 4)],
      rotation: Math.random() * 360
    }));
    setHearts(initialHearts);
    const interval = setInterval(() => {
      setHearts((prevHearts) => prevHearts.map((heart) => {
        let newY = heart.y - heart.speedY;
        let newX = heart.x + heart.speedX;
        if (newY < -10) { newY = 110; newX = Math.random() * 100; }
        return { ...heart, x: newX, y: newY, rotation: heart.rotation + 0.2 };
      }));
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {hearts.map((heart) => (
        <svg key={heart.id} style={{ position: 'absolute', left: `${heart.x}%`, top: `${heart.y}%`, width: `${heart.size}px`, height: `${heart.size}px`, opacity: heart.opacity, transform: `rotate(${heart.rotation}deg)`, fill: heart.color }} viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ))}
    </div>
  );
}

interface ExplodingHeart { id: number; x: number; y: number; size: number; tx: number; ty: number; color: string; }

export function HeartExplosion({ x, y, onComplete }: { x: number; y: number; onComplete: () => void }) {
  const [particles, setParticles] = useState<ExplodingHeart[]>([]);
  useEffect(() => {
    const arr: ExplodingHeart[] = Array.from({ length: 12 }).map((_, i) => {
      const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.4;
      const velocity = Math.random() * 80 + 40;
      return { id: i, x, y, tx: Math.cos(angle) * velocity, ty: Math.sin(angle) * velocity - 20, size: Math.random() * 12 + 6, color: ['#FF5C93', '#FF8FB1', '#FFD6E5', '#A78BFA'][Math.floor(Math.random() * 4)] };
    });
    setParticles(arr);
    const timeout = setTimeout(onComplete, 1000);
    return () => clearTimeout(timeout);
  }, [x, y, onComplete]);
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((p) => (
        <svg key={p.id} className="absolute transition-all duration-1000 ease-out fill-current"
          style={{ left: `${p.x}px`, top: `${p.y}px`, width: `${p.size}px`, height: `${p.size}px`, color: p.color, transform: `translate(${p.tx}px, ${p.ty}px) scale(0)`, opacity: 0 }}
          viewBox="0 0 24 24" ref={(el) => { if (el) requestAnimationFrame(() => { el.style.transform = `translate(${p.tx}px, ${p.ty}px) scale(1.2)`; el.style.opacity = '1'; setTimeout(() => { el.style.transform = `translate(${p.tx * 1.5}px, ${p.ty * 1.5}px) scale(0)`; el.style.opacity = '0'; }, 100); }); }}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ))}
    </div>
  );
}
