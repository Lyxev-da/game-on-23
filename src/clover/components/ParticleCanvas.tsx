// @ts-nocheck
import { memo, useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { getCloverCanvas } from "../clover";
import { TIERS, fmt, type Variant } from "../game/data";

export type BurstOptions = { x: number; y: number; tier: number; variant: Variant; value: number };
export type ParticleHandle = { burst: (options: BurstOptions) => void; clear: () => void };

type Particle = {
  x: number;
  y: number;
  angle: number;
  speed: number;
  gravity: number;
  curl: number;
  wobble: number;
  frequency: number;
  phase: number;
  rotation: number;
  spin: number;
  size: number;
  born: number;
  life: number;
  mode: number;
  shiny: boolean;
  crystal: boolean;
  cursed: boolean;
  glitched: boolean;
  sprite: HTMLCanvasElement;
};
type Floater = { x: number; y: number; born: number; text: string; color: string };

class ParticleEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private floaters: Floater[] = [];
  private frame = 0;
  private width = 1;
  private height = 1;
  private dpr = 1;
  private observer: ResizeObserver;
  private limit = 48;
  enabled = true;
  paused = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true, desynchronized: true })!;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    document.addEventListener("visibilitychange", this.visibility);
    this.resize();
  }

  private visibility = () => {
    if (document.hidden) this.clear();
  };

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.35);
    this.limit = this.width < 760 ? 28 : 48;
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
  }

  burst(options: BurstOptions) {
    if (!this.enabled || this.paused || document.hidden || !this.ctx) return;
    const tier = TIERS[options.tier];
    const crystal = options.variant === "crystal";
    const cursed = options.variant === "cursed";
    const glitched = options.variant === "glitched";
    const sprite = getCloverCanvas(crystal || cursed || glitched ? `${tier.id}:${options.variant}` : tier.id, tier, 8);
    const now = performance.now();
    const count = Math.min(crystal || cursed || glitched ? this.limit : tier.particles, this.limit);
    if (this.particles.length + count > this.limit) this.particles.splice(0, this.particles.length + count - this.limit);
    const rotation = Math.random() * Math.PI * 2;

    for (let i = 0; i < count; i++) {
      const angle = rotation + (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      this.particles.push({
        x: options.x + (Math.random() - 0.5) * 28,
        y: options.y + (Math.random() - 0.5) * 28,
        angle,
        speed: 130 + Math.random() * 280,
        gravity: 110 + Math.random() * 270,
        curl: (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 1.6),
        wobble: 12 + Math.random() * 30,
        frequency: 3 + Math.random() * 6,
        phase: Math.random() * Math.PI * 2,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 8,
        size: 17 + Math.random() * 15,
        born: now + Math.random() * 85,
        life: 750 + Math.random() * 600,
        mode: Math.floor(Math.random() * 4),
        shiny: options.variant === "shiny",
        crystal,
        cursed,
        glitched,
        sprite,
      });
    }
    this.floaters.push({ x: options.x + (Math.random() - 0.5) * 35, y: options.y - 60, born: now, text: `+${fmt(options.value)}`, color: glitched ? "#80ffee" : cursed ? "#ff4d6d" : crystal ? "#dff8ff" : tier.color });
    if (this.floaters.length > 3) this.floaters.shift();
    if (!this.frame) this.frame = requestAnimationFrame(this.draw);
  }

  private draw = (now: number) => {
    this.frame = 0;
    if (!this.enabled || this.paused || document.hidden) return this.clear();
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    let alive = 0;

    for (const particle of this.particles) {
      const age = now - particle.born;
      if (age >= particle.life) continue;
      this.particles[alive++] = particle;
      if (age < 0) continue;
      const progress = age / particle.life;
      const seconds = age / 1000;
      let angle = particle.angle;
      let radius = particle.speed * seconds * (1 - progress * 0.24);
      if (particle.mode === 1) angle += particle.curl * progress;
      if (particle.mode === 3) {
        angle += Math.sin(progress * Math.PI) * particle.curl;
        radius *= 0.85;
      }
      let x = particle.x + Math.cos(angle) * radius;
      let y = particle.y + Math.sin(angle) * radius;
      if (particle.mode === 0 || particle.mode === 2) y += 0.5 * particle.gravity * seconds * seconds;
      if (particle.mode === 2) {
        const sway = (Math.sin(seconds * particle.frequency + particle.phase) - Math.sin(particle.phase)) * particle.wobble * progress;
        x -= Math.sin(angle) * sway;
        y += Math.cos(angle) * sway;
      }
      const size = particle.size * (0.65 + Math.min(1, progress * 6) * 0.4) * (1 - progress * 0.2);
      ctx.globalAlpha = Math.min(1, progress * 8) * Math.min(1, (1 - progress) * 3);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(particle.rotation + particle.spin * seconds);
      ctx.drawImage(particle.sprite, -size / 2, -size / 2, size, size);
      if (particle.shiny) {
        ctx.fillStyle = "#fffadd";
        ctx.fillRect(size * 0.22, -size * 0.45, 2, 7);
        ctx.fillRect(size * 0.22 - 2.5, -size * 0.45 + 2.5, 7, 2);
      }
      if (particle.glitched) {
        ctx.fillStyle = Math.floor(seconds * 8 + particle.phase) % 2 ? "#f482eb" : "#64fce8";
        ctx.fillRect(-size * .5, -size * .2, 8, 2);
        ctx.fillRect(size * .3, size * .2, 5, 2);
      }
      if (particle.cursed) {
        // crimson embers that flicker and drift upward off the clover
        const flick = Math.floor(seconds * 10 + particle.phase) % 2;
        ctx.fillStyle = flick ? "#ff2d55" : "#ffc2cf";
        ctx.fillRect(-size * 0.45, -size * 0.55 - seconds * 14, 2, 2);
        ctx.fillRect(size * 0.35, -size * 0.35 - seconds * 20, 2, 2);
        ctx.fillStyle = "#6a0d29";
        ctx.fillRect(size * 0.05, -size * 0.6 - seconds * 10, 2, 2);
      }
      if (particle.crystal) {
        // pixel ice glints that blink on and off
        const blink = Math.floor(seconds * 9 + particle.phase) % 3;
        ctx.fillStyle = blink === 0 ? "#ffffff" : "#bff0ff";
        ctx.fillRect(-size * 0.5, -size * 0.3, 2, 2);
        ctx.fillRect(size * 0.3, size * 0.1, 2, 2);
        if (blink === 1) {
          ctx.fillRect(size * 0.12, -size * 0.52, 2, 6);
          ctx.fillRect(size * 0.12 - 2, -size * 0.52 + 2, 6, 2);
        }
      }
      ctx.restore();
    }
    this.particles.length = alive;
    alive = 0;

    for (const floater of this.floaters) {
      const age = (now - floater.born) / 1000;
      if (age >= 1) continue;
      this.floaters[alive++] = floater;
      ctx.globalAlpha = Math.min(1, age * 8) * Math.min(1, (1 - age) * 3);
      ctx.font = "italic 900 27px Impact, Arial Black, sans-serif";
      ctx.textAlign = "center";
      ctx.lineJoin = "round";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#070b0e";
      ctx.fillStyle = floater.color;
      ctx.strokeText(floater.text, floater.x, floater.y - age * 70);
      ctx.fillText(floater.text, floater.x, floater.y - age * 70);
    }
    this.floaters.length = alive;
    ctx.globalAlpha = 1;
    if (this.particles.length || this.floaters.length) this.frame = requestAnimationFrame(this.draw);
  };

  clear() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.particles.length = 0;
    this.floaters.length = 0;
    if (this.ctx) {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  dispose() {
    this.clear();
    this.observer.disconnect();
    document.removeEventListener("visibilitychange", this.visibility);
  }
}

export const ParticleCanvas = memo(function ParticleCanvas({ ref, enabled, paused }: {
  ref?: Ref<ParticleHandle>;
  enabled: boolean;
  paused: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ParticleEngine | null>(null);
  useImperativeHandle(ref, () => ({ burst: (options) => engineRef.current?.burst(options), clear: () => engineRef.current?.clear() }), []);

  useEffect(() => {
    const engine = new ParticleEngine(canvasRef.current!);
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.enabled = enabled;
    engineRef.current.paused = paused;
    if (!enabled || paused) engineRef.current.clear();
  }, [enabled, paused]);

  return <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />;
});