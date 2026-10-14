import { siteUrl } from '../siteUrl';
import { diseases } from '../muralDiseases';

export default function DamageSpecimen({ selected, onSelect, single, markers }) {
  const current = diseases.find(item => item.id === selected);
  return <div className="damage-specimen">
    <img src={single ? siteUrl(`/images/damage-atlas/detail-${selected}.webp`) : siteUrl('/images/damage-atlas/observation.webp')}
      alt={single ? `${current.name}病害局部教学示意` : '敦煌莲纹壁画六类病害教学示意图'}
      width={2048} height={1536} decoding="async" />
    {markers && diseases.filter(item => !single || item.id === selected).map(item => <button key={item.id} className="damage-hotspot"
      style={{ left: single ? '12%' : `${item.position[0]}%`, top: single ? '16%' : `${item.position[1]}%` }}
      aria-label={`观察${item.name}`} aria-pressed={selected === item.id} onClick={() => onSelect(item.id)}>
      <span>{String(diseases.indexOf(item) + 1).padStart(2, '0')}</span><span className="damage-hotspot-label">{item.name}</span>
    </button>)}
  </div>;
}
