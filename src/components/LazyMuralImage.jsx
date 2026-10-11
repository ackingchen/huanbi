import { useRef } from 'react';
import { useInView } from 'framer-motion';

export default function LazyMuralImage({ item }) {
  const ref = useRef(null);
  const nearby = useInView(ref, { once: true, margin: '500px 0px' });
  return <div ref={ref} className="treasures-image" style={{ aspectRatio: `${item.width} / ${item.height}` }}>
    {nearby && <img src={item.thumbnail} alt={item.title} width={item.width} height={item.height} loading="lazy" decoding="async" />}
    <span>展开细赏 ↗</span>
  </div>;
}
