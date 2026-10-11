import { useEffect, useRef } from 'react';
import './ParticleReveal.css';

const mix = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const readImage = url => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('图片加载失败，请重新上传或重试。'));
  image.src = url;
});

// Both images are sampled at identical normalized coordinates. Every particle
// carries source and destination RGB, rather than a decorative random palette.
function sample(image, cols, rows) {
  const layer = document.createElement('canvas');
  layer.width = cols; layer.height = rows;
  const ctx = layer.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, cols, rows);
  return ctx.getImageData(0, 0, cols, rows).data;
}

export default function ParticleReveal({ source, target, phase, onComplete, onFailure }) {
  const canvasRef = useRef(null);
  const positions = useRef([]);
  const callbacks = useRef({ onComplete, onFailure });
  callbacks.current = { onComplete, onFailure };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let disposed = false, frame = 0, observer;
    let original, restored, particles, cols, rows, fromPixels, toPixels;
    let started = performance.now();
    const assembling = phase === 'assembling' && Boolean(target);
    const loading = phase === 'loading';
    const active = loading || assembling;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const width = Math.round(rect.width * dpr), height = Math.round(rect.height * dpr);
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { width: rect.width, height: rect.height };
    };
    const tick = now => {
      if (disposed || !original) return;
      const { width: w, height: h } = resize();
      const image = restored || original;
      const scale = Math.min(w / image.naturalWidth, h / image.naturalHeight);
      const iw = image.naturalWidth * scale, ih = image.naturalHeight * scale;
      const left = (w - iw) / 2, top = (h - ih) / 2;
      const elapsed = (now - started) / 1000;
      const progress = reduced.matches ? 1 : Math.min(1, elapsed / (assembling ? 3.2 : 1.4));
      const blend = smooth(progress);
      ctx.clearRect(0, 0, w, h);
      if (!active || reduced.matches) {
        ctx.drawImage(image, left, top, iw, ih);
        if (assembling) callbacks.current.onComplete?.();
        return;
      }
      if (loading && progress < .45) {
        ctx.globalAlpha = 1 - progress / .45;
        ctx.drawImage(original, left, top, iw, ih);
        ctx.globalAlpha = 1;
      }
      // A soft mineral halo behind the sampled pigment, fading as the image forms.
      const atmosphere = assembling ? 1 - blend : blend;
      const halo = ctx.createRadialGradient(w * .5, h * .5, 0, w * .5, h * .5, Math.max(w, h) * .48);
      halo.addColorStop(0, `rgba(107,148,117,${.16 * atmosphere})`);
      halo.addColorStop(.55, `rgba(196,151,76,${.07 * atmosphere})`);
      halo.addColorStop(1, 'rgba(8,25,30,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);
      const tile = Math.max(iw / cols, ih / rows);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i], offset = i * 4;
        const homeX = (left + p.u * iw) / w, homeY = (top + p.v * ih) / h;
        let x, y;
        if (assembling) {
          x = mix(p.startX, homeX, blend);
          y = mix(p.startY, homeY, blend);
          // A small decaying spiral gives the final approach a soft, organic arc.
          x += Math.sin(progress * Math.PI * 3 + p.seed) * .035 * Math.sin(progress * Math.PI);
          y += Math.cos(progress * Math.PI * 3 + p.seed) * .035 * Math.sin(progress * Math.PI);
        } else {
          const angle = elapsed * .55 + p.seed;
          const flowX = .5 + Math.sin(angle + p.v * 4) * (.1 + p.u * .35);
          const flowY = .5 + Math.cos(angle * .8 + p.u * 5) * (.08 + p.v * .35);
          x = mix(homeX, flowX, blend);
          y = mix(homeY, flowY, blend);
        }
        const previous = positions.current[i];
        if (previous && i % 28 === 0) {
          ctx.strokeStyle = `rgba(232,197,133,${.25 * atmosphere})`;
          ctx.lineWidth = .65;
          ctx.beginPath();
          ctx.moveTo(previous.x * w, previous.y * h);
          ctx.lineTo(x * w, y * h);
          ctx.stroke();
        }
        positions.current[i] = { x, y };
        const colorBlend = assembling ? blend : 0;
        const r = Math.round(mix(fromPixels[offset], toPixels[offset], colorBlend));
        const g = Math.round(mix(fromPixels[offset + 1], toPixels[offset + 1], colorBlend));
        const b = Math.round(mix(fromPixels[offset + 2], toPixels[offset + 2], colorBlend));
        const alpha = mix(fromPixels[offset + 3], toPixels[offset + 3], colorBlend) / 255;
        const size = assembling ? mix(1.8, tile + .6, blend) : mix(tile + .6, 1.8, blend);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fillRect(x * w - size / 2, y * h - size / 2, size, size);
      }
      // Lightweight foreground dust adds depth without shadows on every image particle.
      ctx.globalCompositeOperation = 'lighter';
      const dustCount = w < 600 ? 90 : 190;
      for (let i = 0; i < dustCount; i++) {
        const seed = i * 2.399963;
        const angle = seed + elapsed * (.12 + (i % 5) * .035);
        const orbit = .12 + (i % 29) / 85;
        const gather = assembling ? 1 - blend : 1;
        const x = w * (.5 + Math.sin(angle) * orbit * gather);
        const y = h * (.5 + Math.cos(angle * 1.3 + seed) * orbit * gather);
        const shimmer = .25 + .75 * Math.pow((Math.sin(elapsed * 2 + seed) + 1) / 2, 3);
        const size = .6 + (i % 4) * .45;
        ctx.globalAlpha = atmosphere * shimmer;
        ctx.fillStyle = i % 3 ? '#efce8c' : '#a4d2bb';
        ctx.beginPath();ctx.arc(x, y, size, 0, Math.PI * 2);ctx.fill();
        if (i % 13 === 0) {
          ctx.globalAlpha *= .45;
          ctx.fillRect(x - size * 4, y - .35, size * 8, .7);
          ctx.fillRect(x - .35, y - size * 4, .7, size * 8);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      if (assembling && progress > .8) {
        ctx.globalAlpha = smooth((progress - .8) / .2);
        ctx.drawImage(restored, left, top, iw, ih);
        ctx.globalAlpha = 1;
      }
      if (assembling && progress >= 1) {
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(restored, left, top, iw, ih);
        callbacks.current.onComplete?.();
      } else frame = requestAnimationFrame(tick);
    };
    const onResize = () => { if (!active && original) tick(performance.now()); };
    async function init() {
      try {
        original = await readImage(source);
        if (target && phase !== 'loading') restored = await readImage(target);
        if (disposed) return;
        const ratio = original.naturalWidth / original.naturalHeight;
        const budget = canvas.clientWidth < 600 ? 16000 : 22000;
        cols = Math.max(1, Math.min(280, Math.round(Math.sqrt(budget * ratio)))) ;
        rows = Math.max(1, Math.min(280, Math.round(budget / cols)));
        fromPixels = sample(original, cols, rows);
        toPixels = restored ? sample(restored, cols, rows) : fromPixels;
        const oldPositions = positions.current;
        particles = Array.from({ length: cols * rows }, (_, i) => ({
          u: (i % cols + .5) / cols, v: (Math.floor(i / cols) + .5) / rows,
          startX: oldPositions[i]?.x ?? .5, startY: oldPositions[i]?.y ?? .5,
          seed: i * 2.399963,
        }));
        started = performance.now();
        observer = new ResizeObserver(onResize); observer.observe(canvas);
        frame = requestAnimationFrame(tick);
      } catch (error) {
        if (!disposed) callbacks.current.onFailure?.(error.message);
      }
    }
    init();
    return () => { disposed = true; cancelAnimationFrame(frame); observer?.disconnect(); };
  }, [source, target, phase]);

  return <canvas ref={canvasRef} className="particle-reveal" role="img"
    aria-label={phase === 'loading' ? '原图粒子流动中' : phase === 'assembling' ? '粒子正在聚合为修复图' : target ? '修复后的壁画' : '上传的壁画原图'} />;
}
