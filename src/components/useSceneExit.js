import { useEffect } from 'react';

// The sticky scene consumes the first scroll range. Its final viewport then
// leaves as one short transition instead of requiring another screen of input.
export default function useSceneExit(section) {
  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let transitioning = false;
    let exited = false;
    let previousY = scrollY;
    let touchY = null;

    const bounds = () => {
      const scene = section.current;
      const next = document.getElementById('exhibition');
      if (!scene || !next) return null;
      return {
        end: scene.getBoundingClientRect().top + scrollY + scene.offsetHeight - innerHeight,
        next: next.getBoundingClientRect().top + scrollY,
      };
    };

    const cancel = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      transitioning = false;
      previousY = scrollY;
    };

    const advance = () => {
      const range = bounds();
      if (!range || reduced.matches || exited || transitioning ||
          scrollY < range.end - 2 || scrollY >= range.next - 2) return false;
      transitioning = true;
      exited = true;
      const startY = scrollY;
      const startTime = performance.now();
      const tick = now => {
        const destination = bounds()?.next ?? range.next;
        const progress = Math.min(1, (now - startTime) / 460);
        const eased = 1 - Math.pow(1 - progress, 3);
        scrollTo({ top: startY + (destination - startY) * eased, behavior: 'instant' });
        previousY = scrollY;
        if (progress < 1) frame = requestAnimationFrame(tick);
        else cancel();
      };
      frame = requestAnimationFrame(tick);
      return true;
    };

    const onScroll = () => {
      const range = bounds();
      if (!range) return;
      const downward = scrollY > previousY;
      previousY = scrollY;
      if (scrollY < range.end - 8) exited = false;
      // Covers touch momentum, keyboard scrolling and dragging the scrollbar.
      if (!transitioning && downward && scrollY > range.end + 1) advance();
    };
    const onWheel = event => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (event.deltaY < 0) cancel();
      else if (event.deltaY > 0 && (transitioning || advance())) event.preventDefault();
    };
    const onTouchStart = event => {
      touchY = event.touches.length === 1 ? event.touches[0].clientY : null;
    };
    const onTouchMove = event => {
      if (touchY === null || event.touches.length !== 1) return;
      const currentY = event.touches[0].clientY;
      const delta = touchY - currentY;
      touchY = currentY;
      if (delta < -2) cancel();
      else if (delta > 2 && (transitioning || advance()) && event.cancelable) event.preventDefault();
    };
    const onKey = event => {
      if (event.target.closest?.('a, button, input, textarea, select, [contenteditable="true"], [role="dialog"]') ||
          event.ctrlKey || event.metaKey || event.altKey) return;
      if (['ArrowUp', 'PageUp', 'Home'].includes(event.key) || (event.key === ' ' && event.shiftKey)) cancel();
      else if (['ArrowDown', 'PageDown', ' '].includes(event.key) && (transitioning || advance())) event.preventDefault();
    };

    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('wheel', onWheel, { passive: false });
    addEventListener('touchstart', onTouchStart, { passive: true });
    addEventListener('touchmove', onTouchMove, { passive: false });
    addEventListener('keydown', onKey);
    addEventListener('resize', cancel);
    reduced.addEventListener('change', cancel);
    return () => {
      cancel();
      removeEventListener('scroll', onScroll);
      removeEventListener('wheel', onWheel);
      removeEventListener('touchstart', onTouchStart);
      removeEventListener('touchmove', onTouchMove);
      removeEventListener('keydown', onKey);
      removeEventListener('resize', cancel);
      reduced.removeEventListener('change', cancel);
    };
  }, [section]);
}
