'use client';
import { useEffect, useRef } from 'react';

/*
 * Canvas-rendered cinematic backdrop for the hero: drifting fog masses in
 * the Urban Slate palette, floating signal particles, and a slow light
 * sweep. Runs at display refresh via requestAnimationFrame (browsers pause
 * it in background tabs). Reduced-motion renders a single static frame.
 */
type Blob = { rgb: string; a: number; r: number; cx: number; cy: number; ox: number; oy: number; sx: number; sy: number; p: number };
type Particle = { x: number; y: number; vx: number; vy: number; r: number; tw: number; tws: number; mist: boolean };

const BLOBS: Blob[] = [
  { rgb: '107,124,152', a: 0.17, r: 0.78, cx: 0.2, cy: 0.26, ox: 0.16, oy: 0.11, sx: 0.021, sy: 0.017, p: 0 },
  { rgb: '107,124,152', a: 0.13, r: 0.68, cx: 0.84, cy: 0.74, ox: 0.14, oy: 0.12, sx: 0.016, sy: 0.023, p: 2.1 },
  { rgb: '171,151,140', a: 0.09, r: 0.56, cx: 0.76, cy: 0.18, ox: 0.12, oy: 0.09, sx: 0.019, sy: 0.014, p: 4.2 },
  { rgb: '183,196,214', a: 0.08, r: 0.5, cx: 0.34, cy: 0.86, ox: 0.11, oy: 0.12, sx: 0.014, sy: 0.02, p: 1.2 },
  { rgb: '94,86,83', a: 0.11, r: 0.62, cx: 0.52, cy: 0.5, ox: 0.08, oy: 0.08, sx: 0.011, sy: 0.013, p: 3.3 },
];

export function CinematicBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = Array.from({ length: 44 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: 0.006 + Math.random() * 0.013,
      vy: -(0.004 + Math.random() * 0.011),
      r: 0.7 + Math.random() * 1.7,
      tw: Math.random() * Math.PI * 2,
      tws: 0.4 + Math.random() * 1.1,
      mist: Math.random() < 0.3,
    }));

    let raf = 0;
    let last = performance.now();
    const TAU = Math.PI * 2;

    const frame = (nowMs: number) => {
      const dt = Math.min((nowMs - last) / 1000, 0.05);
      last = nowMs;
      const t = nowMs / 1000;
      ctx.clearRect(0, 0, width, height);

      for (const blob of BLOBS) {
        const x = (blob.cx + blob.ox * Math.sin(t * blob.sx * TAU + blob.p)) * width;
        const y = (blob.cy + blob.oy * Math.cos(t * blob.sy * TAU + blob.p)) * height;
        const radius = blob.r * Math.max(width, height);
        const fog = ctx.createRadialGradient(x, y, 0, x, y, radius);
        fog.addColorStop(0, `rgba(${blob.rgb},${blob.a})`);
        fog.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = fog;
        ctx.fillRect(0, 0, width, height);
      }

      // Light sweep: a soft diagonal band gliding across the frame.
      const angle = -0.32 + 0.1 * Math.sin(t * 0.05 * TAU);
      const span = Math.max(width, height) * 1.7;
      const shift = 0.5 + 0.24 * Math.sin(t * 0.04 * TAU);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(angle);
      const beam = ctx.createLinearGradient(-span / 2, 0, span / 2, 0);
      beam.addColorStop(Math.max(0, shift - 0.16), 'rgba(233,230,231,0)');
      beam.addColorStop(shift, 'rgba(233,230,231,0.055)');
      beam.addColorStop(Math.min(1, shift + 0.16), 'rgba(233,230,231,0)');
      ctx.fillStyle = beam;
      ctx.fillRect(-span / 2, -span / 2, span, span);
      ctx.restore();

      ctx.globalCompositeOperation = 'lighter';
      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.tw += p.tws * dt;
        if (p.x > 1.05) p.x = -0.05;
        if (p.y < -0.05) p.y = 1.05;
        const alpha = 0.22 + 0.3 * (0.5 + 0.5 * Math.sin(p.tw));
        const px = p.x * width;
        const py = p.y * height;
        const halo = p.r * 6;
        const rgb = p.mist ? '183,196,214' : '157,176,204';
        const glow = ctx.createRadialGradient(px, py, 0, px, py, halo);
        glow.addColorStop(0, `rgba(${rgb},${alpha})`);
        glow.addColorStop(0.35, `rgba(${rgb},${alpha * 0.35})`);
        glow.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, halo, 0, TAU);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      if (!reduced) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} className="cine-canvas" aria-hidden="true" />;
}
