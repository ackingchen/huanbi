import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, Download, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import './MuralArtwork.css';

export function SourceLink({ item }) {
  return <a className="mural-source" href={item.source} target="_blank" rel="noreferrer">图像与资料：敦煌研究院 · 数字敦煌 <ArrowUpRight size={14} /></a>;
}

function MuralReveal({ item }) {
  const surface = useRef(null);
  const canvas = useRef(null);
  useEffect(() => {
    const element = surface.current;
    const layer = canvas.current;
    const ctx = layer.getContext('2d');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0, active = false, x = 0, y = 0, radius = 90, w = 0, h = 0, previous = 0;
    let grains = [];
    const stop = () => {
      active = false;
      element.dataset.revealing = 'false';
      cancelAnimationFrame(frame);
      frame = 0;
      grains = [];
      ctx?.clearRect(0, 0, w, h);
    };
    const draw = time => {
      if (!active || reduced.matches || !ctx) { frame = 0; return; }
      const dt = Math.min((time - previous) / 16.67 || 1, 2);
      previous = time;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < 5 && grains.length < 120; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = radius * (.78 + Math.random() * .26);
        grains.push({ x: x + Math.cos(angle) * distance, y: y + Math.sin(angle) * distance, vx: (Math.random() - .5) * 1.2, vy: .35 + Math.random(), size: .6 + Math.random() * 1.4, life: 1 });
      }
      for (const grain of grains) {
        grain.x += grain.vx * dt;
        grain.y += grain.vy * dt;
        grain.vy += .025 * dt;
        grain.life -= .025 * dt;
        ctx.fillStyle = `rgba(244, 206, 130, ${Math.max(0, grain.life) * .85})`;
        ctx.fillRect(grain.x, grain.y, grain.size, grain.size);
      }
      grains = grains.filter(grain => grain.life > 0);
      frame = requestAnimationFrame(draw);
    };
    const move = event => {
      if (event.pointerType === 'touch') return;
      const rect = element.getBoundingClientRect();
      if (!active || w !== rect.width || h !== rect.height) {
        w = rect.width; h = rect.height;
        const dpr = Math.min(devicePixelRatio || 1, 2);
        layer.width = Math.round(w * dpr); layer.height = Math.round(h * dpr);
        ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      x = event.clientX - rect.left; y = event.clientY - rect.top;
      radius = Math.max(55, Math.min(w * .19, 135));
      element.style.setProperty('--reveal-x', `${x}px`);
      element.style.setProperty('--reveal-y', `${y}px`);
      element.style.setProperty('--reveal-radius', `${radius}px`);
      element.dataset.revealing = 'true';
      active = true;
      if (!frame && !reduced.matches) { previous = performance.now(); frame = requestAnimationFrame(draw); }
    };
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerleave', stop);
    element.addEventListener('pointercancel', stop);
    element.addEventListener('click', stop);
    window.addEventListener('blur', stop);
    reduced.addEventListener('change', stop);
    return () => {
      stop();
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', stop);
      element.removeEventListener('pointercancel', stop);
      element.removeEventListener('click', stop);
      window.removeEventListener('blur', stop);
      reduced.removeEventListener('change', stop);
    };
  }, []);
  return <span className="mural-reveal" ref={surface} data-revealing="false">
    <img className="mural-restored-layer" src={item.restored} alt="" aria-hidden="true" loading="lazy" />
    <img className="mural-original-layer" src={item.image} alt={`${item.name}原版，${item.location}`} loading="lazy" />
    <canvas ref={canvas} className="mural-sand" aria-hidden="true" />
  </span>;
}

function DownloadLink({ item, restored, children = '下载图片' }) {
  const label = restored ? '修复版' : '原版';
  return <a className="mural-action" href={restored ? item.restoredDownload : item.originalDownload} download={`${item.name}-${label}.${restored ? 'png' : 'jpg'}`}><Download size={16} />{children}</a>;
}

function ImageViewer({ item, restored }) {
  const [zoom, setZoom] = useState(1);
  const label = restored ? '修复版' : '原版';
  const src = restored ? item.restoredDownload : item.image;
  return <Dialog.Root onOpenChange={() => setZoom(1)}>
    <Dialog.Trigger asChild><button className="mural-compare-image" aria-label={`放大${label}`}><img src={src} alt={`${item.name} · ${label}`} /><span><ZoomIn size={17} />查看全图</span></button></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="mural-viewer-overlay" />
      <Dialog.Content className="mural-viewer">
        <div className="mural-viewer-heading"><div><Dialog.Title>{item.name} · {label}</Dialog.Title><Dialog.Description>查看完整画面，放大后可滚动浏览细节。</Dialog.Description></div><Dialog.Close className="mural-action" aria-label="关闭全图"><X size={22} /></Dialog.Close></div>
        <div className="mural-viewer-tools">
          <button className="mural-action" aria-label="缩小" disabled={zoom === 1} onClick={() => setZoom(z => Math.max(1, z - 1))}><ZoomOut size={19} /></button>
          <output aria-live="polite">{zoom * 100}%</output>
          <button className="mural-action" aria-label="放大" disabled={zoom === 3} onClick={() => setZoom(z => Math.min(3, z + 1))}><ZoomIn size={19} /></button>
          <button className="mural-action" onClick={() => setZoom(1)}><RotateCcw size={16} />适应窗口</button>
          <DownloadLink item={item} restored={restored} />
        </div>
        <div className={`mural-viewer-scroll ${zoom > 1 ? 'is-zoomed' : ''}`} tabIndex={0} aria-label="全图浏览区域"><img className="mural-full-image" src={src} alt={`${item.name} · ${label}全图`} style={zoom > 1 ? { width: `${zoom * 100}%` } : undefined} /></div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

export default function MuralArtwork({ item, index }) {
  return <Dialog.Root>
    <Dialog.Trigger asChild><button className="exhibit-card mural-card mural-scroll" aria-label={`观赏${item.name}`}>
      <span className="mural-scroll-mount"><MuralReveal item={item} /></span>
      <span className="artwork-caption"><span>卷 {String(index + 1).padStart(2, '0')} · {item.location}</span><ArrowUpRight size={18} /></span>
      <span className="mural-reveal-hint"><span className="pointer-hint">拂沙见新 · </span>点击展开对照</span>
    </button></Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="exhibit-overlay" /><Dialog.Content className="exhibit-dialog mural-comparison-dialog">
      <Dialog.Close className="exhibit-close" aria-label="关闭展签"><X size={22} /></Dialog.Close>
      <div className="mural-comparison">
        {[false, true].map(restored => <figure key={String(restored)}><figcaption>{restored ? '修复版' : '原版'}<span>{restored ? '数字修复 · 焕新设色' : '壁画现存面貌'}</span></figcaption><ImageViewer item={item} restored={restored} /><DownloadLink item={item} restored={restored}>{restored ? '下载修复版' : '下载原版'}</DownloadLink></figure>)}
      </div>
      <div className="mural-comparison-copy"><p className="exhibit-kicker">{item.era} / {item.location}</p><Dialog.Title>{item.name}</Dialog.Title><Dialog.Description>{item.description} {item.extra}</Dialog.Description><p className="exhibit-detail">观赏线索：{item.detail}</p><SourceLink item={item} /></div>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
