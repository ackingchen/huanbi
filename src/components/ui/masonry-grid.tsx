import { useRef, type ReactNode, type Key, type PointerEvent } from 'react';
import { motion, useMotionValue, useTransform, useSpring, useReducedMotion } from 'framer-motion';

interface MasonryGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  getKey: (item: T) => Key;
  className?: string;
  gap?: string;
  staggerDelay?: number;
}

function GridItem({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const x = useMotionValue(0), y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });
  const rotateX = useTransform(springY, [-.5, .5], [10, -10]);
  const rotateY = useTransform(springX, [-.5, .5], [-10, 10]);
  const reset = () => { x.set(0); y.set(0); };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (reduced || event.pointerType !== 'mouse' || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((event.clientX - rect.left) / rect.width - .5);
    y.set((event.clientY - rect.top) / rect.height - .5);
  };
  return <div ref={ref} onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset} style={{perspective: 1000}}>
    <motion.div style={reduced ? undefined : {rotateX, rotateY, transformStyle: 'preserve-3d'}} whileTap={reduced ? undefined : {scale: .97}}>{children}</motion.div>
  </div>;
}

export default function MasonryGrid<T>({items, renderItem, getKey, className = '', gap = '1rem', staggerDelay = .05}: MasonryGridProps<T>) {
  const reduced = useReducedMotion();
  return <div className={className} style={{columnGap: gap}} role="list">
    {items.map((item, index) => <motion.div key={getKey(item)} role="listitem"
      style={{breakInside: 'avoid', marginBottom: gap}}
      initial={reduced ? false : {opacity: 0, y: 30, scale: .95}}
      whileInView={{opacity: 1, y: 0, scale: 1}}
      viewport={{once: true, amount: .05}}
      transition={{duration: reduced ? 0 : .5, delay: reduced ? 0 : (index % 4) * staggerDelay, ease: 'easeOut'}}>
      <GridItem>{renderItem(item, index)}</GridItem>
    </motion.div>)}
  </div>;
}
