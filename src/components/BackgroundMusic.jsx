import { useEffect, useRef, useState } from 'react';
import { Music2 } from 'lucide-react';
import './BackgroundMusic.css';

export default function BackgroundMusic() {
  const audio = useRef(null);
  const disabled = useRef(false);
  const requested = useRef(false);
  const pending = useRef(false);
  const [status, setStatus] = useState('idle');

  function play() {
    const player = audio.current;
    if (!player || disabled.current || pending.current || !player.paused) return;
    pending.current = true;
    setStatus('loading');
    player.play().catch(error => {
      if (!disabled.current) setStatus(error.name === 'NotAllowedError' ? 'blocked' : 'error');
    }).finally(() => { pending.current = false; });
  }

  useEffect(() => {
    const player = audio.current;
    player.volume = 0.35;
    let lastY = window.scrollY;
    let touchY = null;
    const request = () => {
      if (disabled.current || requested.current) return;
      requested.current = true;
      play();
    };
    const scroll = () => {
      const nextY = window.scrollY;
      if (nextY > lastY) request();
      lastY = nextY;
    };
    const wheel = event => { if (event.deltaY > 0) request(); };
    const touchStart = event => { touchY = event.touches[0]?.clientY ?? null; };
    const touchMove = event => {
      if (touchY !== null && event.touches[0]?.clientY < touchY - 8) request();
    };
    // A scroll alone is not an activation gesture in every browser. Retry on
    // the next real interaction without resetting the user's music choice.
    const activate = event => {
      if (event.target.closest?.('[data-bgm-control]')) return;
      if (requested.current && !disabled.current) play();
    };
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('wheel', wheel, { passive: true });
    window.addEventListener('touchstart', touchStart, { passive: true });
    window.addEventListener('touchmove', touchMove, { passive: true });
    window.addEventListener('pointerup', activate);
    window.addEventListener('touchend', activate, { passive: true });
    window.addEventListener('click', activate);
    window.addEventListener('keydown', activate);
    return () => {
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('wheel', wheel);
      window.removeEventListener('touchstart', touchStart);
      window.removeEventListener('touchmove', touchMove);
      window.removeEventListener('pointerup', activate);
      window.removeEventListener('touchend', activate);
      window.removeEventListener('click', activate);
      window.removeEventListener('keydown', activate);
      player.pause();
    };
  }, []);

  const enabled = status === 'playing' || status === 'loading';
  const label = status === 'blocked' ? '点击开启音乐' : status === 'error' ? '音乐加载失败 · 重试' : enabled ? '背景音乐 · 开' : '背景音乐 · 关';
  const toggle = () => {
    if (enabled) {
      disabled.current = true;
      audio.current.pause();
      setStatus('off');
    } else {
      disabled.current = false;
      requested.current = true;
      play();
    }
  };

  return <>
    <audio ref={audio} data-site-bgm src="/audio/huanbi-bgm.mp3" loop preload="none"
      onPlaying={() => { if (disabled.current) audio.current.pause(); else setStatus('playing'); }}
      onPause={() => setStatus(previous => previous === 'playing' ? 'off' : previous)}
      onError={() => setStatus('error')} />
    <button type="button" className="site-bgm" data-bgm-control aria-label={enabled ? '关闭背景音乐' : '开启背景音乐'}
      data-playing={status === 'playing'} aria-pressed={enabled} onClick={toggle} title={status === 'idle' ? '向下滚动开启背景音乐，也可点击播放' : label}>
      <Music2 size={22} />
      <span className="site-bgm-status" aria-live="polite">{label}</span>
    </button>
    {status === 'blocked' && <button type="button" className="site-bgm-hint" data-bgm-control onClick={toggle}>
      浏览器限制自动播放，轻点页面开启音乐
    </button>}
  </>;
}
