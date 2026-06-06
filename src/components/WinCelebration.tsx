import { useEffect, useRef } from 'react';

/**
 * One-shot win celebration: a zero-dependency canvas particle burst (fireworks
 * + confetti) rendered as a transparent, click-through full-screen overlay on
 * the GameOver screen. 'standard' = green (any win); 'impossible' = the full
 * gold show for beating the Impossible AI. Plays once, drains, then stops the
 * RAF loop. Skipped entirely under prefers-reduced-motion. Never runs on the
 * board, so it doesn't touch the "no infinite board animation" rule.
 */

const GREEN = ['#62cf90', '#7bdb95', '#b8f5d3', '#ffffff', '#1c7a3d', '#d3ecaa'];
const GOLD = ['#f5d76a', '#ffd700', '#fff3b0', '#ffffff', '#e0a050', '#ff8c5a'];

interface Spark {
  x: number; y: number; px: number; py: number;
  vx: number; vy: number; color: string; size: number;
  life: number; decay: number; grav: number; drag: number; flash: boolean;
}
interface Shell {
  x: number; y: number; px: number; py: number;
  vy: number; targetY: number; color: string; colorSet: string[];
}
interface Confetto {
  x: number; y: number; z: number; w: number; h: number; color: string;
  vy: number; sway: number; phase: number; rot: number; vrot: number;
}

export function WinCelebration({ level }: { level: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let W = 0;
    let H = 0;
    let DPR = 1;
    let raf = 0;
    let running = true;
    const timers: number[] = [];
    const startedAt = performance.now();
    const lvl = Math.max(1, Math.min(5, Math.round(level)));
    const SHOW_MS = [2200, 2700, 3300, 4100, 5200][lvl - 1];

    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.width = window.innerWidth * DPR;
      H = canvas.height = window.innerHeight * DPR;
    };
    resize();
    window.addEventListener('resize', resize);

    const sparks: Spark[] = [];
    const shells: Shell[] = [];
    const confetti: Confetto[] = [];
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const pick = (arr: string[]) => arr[(Math.random() * arr.length) | 0];

    const launchShell = (set: string[]) => {
      shells.push({
        x: rnd(W * 0.2, W * 0.8), y: H + 10, px: 0, py: 0,
        vy: -rnd(11, 14) * DPR, targetY: rnd(H * 0.16, H * 0.42),
        color: pick(set), colorSet: set,
      });
    };
    const burst = (x: number, y: number, set: string[], count: number, power: number) => {
      sparks.push({ x, y, px: x, py: y, vx: 0, vy: 0, color: '#ffffff', size: 22 * DPR, life: 1, decay: 0.09, grav: 0, drag: 1, flash: true });
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const z = rnd(0.45, 1.2);
        const sp = rnd(2, power) * z * DPR;
        sparks.push({
          x, y, px: x, py: y,
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          color: pick(set), size: rnd(1.3, 2.8) * z * DPR,
          life: 1, decay: rnd(0.008, 0.02), grav: 0.05 * DPR, drag: 0.965, flash: false,
        });
      }
    };
    const rain = (set: string[], count: number) => {
      for (let i = 0; i < count; i++) {
        const z = rnd(0.5, 1.2);
        confetti.push({
          x: rnd(0, W), y: rnd(-H * 0.4, -10), z,
          w: rnd(5, 10) * z * DPR, h: rnd(8, 16) * z * DPR, color: pick(set),
          vy: rnd(1.5, 3.2) * z * DPR, sway: rnd(0.6, 1.6),
          phase: rnd(0, Math.PI * 2), rot: rnd(0, Math.PI * 2), vrot: rnd(-0.12, 0.12),
        });
      }
    };

    let t = 0;
    const frame = () => {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);

      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      for (let i = shells.length - 1; i >= 0; i--) {
        const s = shells[i];
        s.px = s.x; s.py = s.y;
        s.y += s.vy; s.vy += 0.12 * DPR; s.x += rnd(-0.3, 0.3) * DPR;
        ctx.globalAlpha = 0.9; ctx.strokeStyle = s.color; ctx.lineWidth = 2.4 * DPR;
        ctx.beginPath(); ctx.moveTo(s.px, s.py); ctx.lineTo(s.x, s.y); ctx.stroke();
        if (s.y <= s.targetY || s.vy >= 0) {
          burst(s.x, s.y, s.colorSet, ((Math.random() * 40) | 0) + 70, 9);
          shells.splice(i, 1);
        }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        if (p.flash) {
          ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, 7); ctx.fill();
          p.life -= p.decay;
          if (p.life <= 0) sparks.splice(i, 1);
          continue;
        }
        p.px = p.x; p.py = p.y;
        p.vx *= p.drag; p.vy *= p.drag; p.vy += p.grav;
        p.x += p.vx; p.y += p.vy; p.life -= p.decay;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.strokeStyle = p.color; ctx.lineWidth = p.size;
        ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();
        if (p.life <= 0) sparks.splice(i, 1);
      }
      ctx.globalAlpha = 1;

      ctx.globalCompositeOperation = 'source-over';
      for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i];
        c.y += c.vy; c.x += Math.sin(t * c.sway + c.phase) * 1.3 * c.z * DPR; c.rot += c.vrot;
        ctx.save();
        ctx.translate(c.x, c.y); ctx.rotate(c.rot);
        ctx.globalAlpha = 0.92; ctx.fillStyle = c.color;
        const sq = 0.35 + Math.abs(Math.sin(t * c.sway + c.phase)) * 0.65;
        ctx.fillRect((-c.w / 2) * sq, -c.h / 2, c.w * sq, c.h);
        ctx.restore();
        if (c.y > H + 30) confetti.splice(i, 1);
      }
      ctx.globalAlpha = 1;

      const elapsed = performance.now() - startedAt;
      const drained = sparks.length === 0 && shells.length === 0 && confetti.length === 0;
      if (!running || (elapsed > SHOW_MS && drained)) {
        ctx.clearRect(0, 0, W, H);
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    // Celebration scales with the difficulty you beat: L1 small -> L5 biggest.
    // L5 (Impossible) also switches to GOLD + an extra central burst.
    const isGold = lvl === 5;
    const set = isGold ? GOLD : GREEN;
    const confettiN = [45, 80, 120, 165, 210][lvl - 1];
    const shellN = [2, 3, 5, 7, 12][lvl - 1];
    rain(set, confettiN);
    for (let i = 0; i < shellN; i++) {
      timers.push(window.setTimeout(() => launchShell(set), i * 300));
    }
    if (isGold) {
      timers.push(window.setTimeout(() => burst(W * 0.5, H * 0.3, GOLD, 150, 13), 400));
      timers.push(window.setTimeout(() => rain(GREEN, 120), 1400));
    }
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      timers.forEach((id) => clearTimeout(id));
      window.removeEventListener('resize', resize);
    };
  }, [level]);

  return <canvas ref={ref} className="win-celebration" aria-hidden="true" />;
}
