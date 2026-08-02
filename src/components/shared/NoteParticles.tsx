'use client';

import { useEffect, useRef } from 'react';
import { NOTES } from '@/lib/notes';

interface Particle {
  el: HTMLSpanElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  born: number;
  lifetime: number;
}

export function NoteParticles() {
  const containerRef = useRef<HTMLDivElement>(null);
  const particles = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(hover: none)').matches) return;

    const container = containerRef.current;
    if (!container) return;

    const spawnParticle = (x: number, y: number) => {
      const el = document.createElement('span');
      el.textContent = NOTES[Math.floor(Math.random() * NOTES.length)];
      el.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
        user-select: none;
        font-size: ${12 + Math.random() * 10}px;
        color: hsl(${38 + Math.random() * 20}, 90%, 60%);
        opacity: 1;
        z-index: 9999;
        transform: translate(-50%, -50%);
        will-change: transform, opacity;
      `;
      container.appendChild(el);

      particles.current.push({
        el,
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: -1.5 - Math.random() * 2,
        opacity: 1,
        born: performance.now(),
        lifetime: 700 + Math.random() * 400,
      });
    };

    const animate = (now: number) => {
      particles.current = particles.current.filter((p) => {
        const age = now - p.born;
        if (age >= p.lifetime) {
          p.el.remove();
          return false;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.opacity = 1 - age / p.lifetime;
        p.el.style.left = `${p.x}px`;
        p.el.style.top = `${p.y}px`;
        p.el.style.opacity = String(p.opacity);
        return true;
      });
      rafRef.current = particles.current.length > 0 ? requestAnimationFrame(animate) : 0;
    };

    let lastSpawn = 0;
    const onMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastSpawn < 80) return;

      const target = e.target as Element | null;
      if (target?.closest('[data-no-particles]')) return;

      const last = lastPos.current;
      if (last) {
        const dx = e.clientX - last.x;
        const dy = e.clientY - last.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 10) return;
      }

      lastPos.current = { x: e.clientX, y: e.clientY };
      lastSpawn = now;
      spawnParticle(e.clientX, e.clientY);
      if (!rafRef.current) rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafRef.current);
      particles.current.forEach((p) => p.el.remove());
      particles.current = [];
    };
  }, []);

  return <div ref={containerRef} aria-hidden />;
}
