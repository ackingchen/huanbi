(() => {
  if (location.pathname.startsWith('/admin')) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const scenes = {
    home: ['壁上重生', '一壁千年，一眼新生。', '壁'],
    archive: ['丹青长廊', '循色入画，细赏千年。', '画'],
    treasures: ['千壁藏珍', '循飞天衣带，拾壁上繁花。', '藏'],
    workbench: ['焕新之意', '让岁月留痕，让丹青新生。', '新'],
    cave: ['沉浸洞窟', '循一束微光，入丹青深处。', '窟'],
    'damage-atlas': ['病害图鉴', '知其美，也知其脆弱。', '鉴']
  };
  const sceneOf = href => {
    const url = new URL(href, location.href);
    const route = url.pathname.replace(/\/$/, '') || '/';
    return route === '/' ? (!url.hash || url.hash === '#top' ? 'home' : url.hash === '#treasures' ? 'treasures' : 'archive') : route.slice(1);
  };
  const curtain = document.createElement('div');
  curtain.className = 'huanbi-page-turn';
  curtain.hidden = true;
  curtain.setAttribute('role', 'status');
  curtain.setAttribute('aria-live', 'polite');
  curtain.setAttribute('aria-atomic', 'true');
  curtain.innerHTML = '<div class="huanbi-turn-shade" aria-hidden="true"></div>' +
    '<div class="huanbi-turn-panel huanbi-turn-left" aria-hidden="true"><i class="huanbi-turn-art"></i><i class="huanbi-turn-roll"></i><i class="huanbi-turn-cloud huanbi-turn-cloud-one"></i></div>' +
    '<div class="huanbi-turn-panel huanbi-turn-right" aria-hidden="true"><i class="huanbi-turn-art"></i><i class="huanbi-turn-roll"></i><i class="huanbi-turn-cloud huanbi-turn-cloud-two"></i></div>' +
    '<div class="huanbi-turn-caption"><span class="huanbi-turn-kicker">千年丹青 · 再启一卷</span>' +
    '<span class="huanbi-turn-title"></span><i class="huanbi-turn-rule" aria-hidden="true"></i>' +
    '<div class="huanbi-turn-colophon"><span class="huanbi-turn-poem"></span>' +
    '<span class="huanbi-turn-seal" aria-hidden="true"></span></div></div>';
  document.body.append(curtain);
  const left = curtain.querySelector('.huanbi-turn-left');
  const right = curtain.querySelector('.huanbi-turn-right');
  const shade = curtain.querySelector('.huanbi-turn-shade');
  const caption = curtain.querySelector('.huanbi-turn-caption');
  let active = null;

  for (const file of ['/images/scroll/background.webp', '/images/huanbi-atlas-scroll.svg?v=20261012-deep-wear-5', '/images/scroll/cloud.webp', '/images/scroll/apsara.webp', '/images/scroll/lotusLeft.webp']) {
    const image = new Image(); image.src = file;
  }
  const animate = (job, element, frames, options) => {
    const animation = element.animate(frames, { fill: 'forwards', ...options });
    job.animations.push(animation);
    return animation.finished.catch(() => {});
  };
  const clear = job => {
    if (active !== job) return;
    active = null;
    clearTimeout(job.watchdog); clearTimeout(job.hold); cancelAnimationFrame(job.frame);
    job.animations.forEach(animation => animation.cancel());
    curtain.hidden = true;
    delete curtain.dataset.phase;
    delete document.documentElement.dataset.huanbiTurn;
    job.root.inert = job.inert;
    if (job.busy === null) job.root.removeAttribute('aria-busy');
    else job.root.setAttribute('aria-busy', job.busy);
  };
  const reveal = job => {
    if (active !== job || job.phase === 'opening') return;
    clearTimeout(job.watchdog); cancelAnimationFrame(job.frame);
    const delay = Math.max(0, 1300 - (performance.now() - job.coveredAt));
    job.hold = setTimeout(async () => {
      if (active !== job) return;
      job.phase = curtain.dataset.phase = document.documentElement.dataset.huanbiTurn = 'opening';
      const duration = innerWidth <= 767 ? 300 : 360;
      await Promise.all([
        animate(job, left, [{ transform: 'translateX(0)' }, { transform: 'translateX(-105%)' }], { duration, easing: 'cubic-bezier(.45,0,.2,1)' }),
        animate(job, right, [{ transform: 'translateX(0)' }, { transform: 'translateX(105%)' }], { duration, easing: 'cubic-bezier(.45,0,.2,1)' }),
        animate(job, shade, [{ opacity: 1 }, { opacity: 0 }], { duration }),
        animate(job, caption, [{ opacity: 1 }, { opacity: 0 }], { duration: 120 })
      ]);
      if (active !== job) return;
      clear(job);
      const focus = document.querySelector('.exhibit-nav nav a[aria-current], .scroll-brand');
      focus?.focus({ preventScroll: true });
    }, delay);
  };
  const settled = href => {
    const job = active;
    if (!job || job.href !== href || job.phase !== 'covered' || job.checking) return;
    job.checking = true;
    const ready = () => {
      if (active !== job) return;
      const loading = [...document.querySelectorAll('.site-loading, .exhibit-panel-loading, .cave-loading')]
        .some(element => element.getClientRects().length);
      if (!loading || performance.now() - job.coveredAt > 2000) reveal(job);
      else job.frame = requestAnimationFrame(ready);
    };
    job.frame = requestAnimationFrame(ready);
  };
  const run = (from, href, commit, preload) => {
    if (active?.href === href) return;
    if (active) clear(active);
    const scene = sceneOf(href);
    if (!scenes[scene] || sceneOf(from) === scene || motion.matches || document.hidden || !curtain.animate) {
      commit(); return;
    }
    const root = document.getElementById('root');
    const job = { href, commit, root, inert: root.inert, busy: root.getAttribute('aria-busy'), animations: [], phase: 'closing', committed: false };
    active = job;
    const [title, poem, seal] = scenes[scene];
    const heading = curtain.querySelector('.huanbi-turn-title');
    heading.setAttribute('aria-label', title);
    heading.replaceChildren(...Array.from(title, character => {
      const glyph = document.createElement('span');
      glyph.className = 'huanbi-turn-glyph';
      glyph.setAttribute('aria-hidden', 'true');
      glyph.textContent = character;
      return glyph;
    }));
    curtain.querySelector('.huanbi-turn-poem').textContent = poem;
    curtain.querySelector('.huanbi-turn-seal').textContent = seal;
    curtain.setAttribute('aria-label', '正在展开' + title);
    curtain.hidden = false;
    job.phase = curtain.dataset.phase = document.documentElement.dataset.huanbiTurn = 'closing';
    root.inert = true; root.setAttribute('aria-busy', 'true');
    Promise.resolve().then(() => preload?.()).catch(() => {});
    (async () => {
      const duration = innerWidth <= 767 ? 220 : 260;
      heading.querySelectorAll('.huanbi-turn-glyph').forEach((glyph, index) => {
        animate(job, glyph, [
          { opacity: 0, transform: 'translateY(18px) rotate(-5deg) scale(1.08)' },
          { opacity: 1, transform: 'translateY(0) rotate(0) scale(1)' }
        ], { duration: 280, delay: duration - 40 + index * 65, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' });
      });
      animate(job, curtain.querySelector('.huanbi-turn-rule'), [
        { opacity: 0, transform: 'scaleX(.25)' }, { opacity: 1, transform: 'scaleX(1)' }
      ], { duration: 360, delay: duration + 180, easing: 'ease-out', fill: 'both' });
      animate(job, curtain.querySelector('.huanbi-turn-seal'), [
        { opacity: 0, transform: 'scale(1.65) rotate(8deg)' },
        { opacity: 1, transform: 'scale(1) rotate(0)' }
      ], { duration: 220, delay: duration + 380, easing: 'cubic-bezier(.3,.8,.2,1)', fill: 'both' });
      await Promise.all([
        animate(job, left, [{ transform: 'translateX(-105%)' }, { transform: 'translateX(0)' }], { duration, easing: 'cubic-bezier(.3,0,.25,1)' }),
        animate(job, right, [{ transform: 'translateX(105%)' }, { transform: 'translateX(0)' }], { duration, easing: 'cubic-bezier(.3,0,.25,1)' }),
        animate(job, shade, [{ opacity: 0 }, { opacity: 1 }], { duration }),
        animate(job, caption, [{ opacity: 0 }, { opacity: 1 }], { duration: 140, delay: duration - 80 })
      ]);
      if (active !== job) return;
      job.coveredAt = performance.now();
      job.phase = curtain.dataset.phase = document.documentElement.dataset.huanbiTurn = 'covered';
      job.committed = true;
      commit();
      job.watchdog = setTimeout(() => reveal(job), 2200);
    })().catch(() => {
      if (active !== job) return;
      clear(job);
      if (!job.committed) commit();
    });
  };
  curtain.addEventListener('wheel', event => event.preventDefault(), { passive: false });
  document.addEventListener('keydown', event => {
    if (active && !event.ctrlKey && !event.metaKey && !event.altKey && ['Tab', ' ', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) event.preventDefault();
  });
  const skip = () => {
    if (!active) return;
    const job = active; clear(job);
    if (!job.committed) job.commit();
  };
  motion.addEventListener('change', event => { if (event.matches) skip(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) skip(); });
  addEventListener('pagehide', skip);
  window.HuanbiTurn = { run, settled };
})();
