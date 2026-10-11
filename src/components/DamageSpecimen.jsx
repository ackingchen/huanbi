import { useId } from 'react';
import { diseases } from '../muralDiseases';

export default function DamageSpecimen({ selected, onSelect, single, markers }) {
  const id = useId().replace(/:/g, '');
  const visible = disease => !single || selected === disease;
  return <div className="damage-specimen">
    <svg viewBox="0 0 900 640" role="img" aria-label="壁画病害教学示意图">
      <title>六类壁画病害的绘制示意</title>
      <desc>在装饰纹样上分别绘制颜色浅淡、裂隙、薄片翘起、材料缺失、暗色附着与盐分结晶。它们是教学示意，不是对真实壁画的检测结果。</desc>
      <defs>
        <pattern id={`${id}-weave`} width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 1H6M1 0V6" stroke="#705339" strokeOpacity=".14" strokeWidth=".6" /></pattern>
        <pattern id={`${id}-motif`} width="150" height="150" patternUnits="userSpaceOnUse"><path d="M75 16L91 59L134 75L91 91L75 134L59 91L16 75L59 59Z" fill="none" stroke="#315c50" strokeOpacity=".35" strokeWidth="3" /><circle cx="75" cy="75" r="24" fill="none" stroke="#9d4f36" strokeOpacity=".5" strokeWidth="3" /><path d="M75 49Q107 75 75 101Q43 75 75 49Z" fill="#41654f" fillOpacity=".3" /></pattern>
        <linearGradient id={`${id}-plaster`} x2="1" y2="1"><stop stopColor="#d2b383" /><stop offset=".5" stopColor="#ba956a" /><stop offset="1" stopColor="#91704e" /></linearGradient>
        <radialGradient id={`${id}-smoke`}><stop stopColor="#151815" stopOpacity=".86" /><stop offset=".6" stopColor="#20211b" stopOpacity=".55" /><stop offset="1" stopColor="#20211b" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}-fade`}><stop stopColor="#d1ba8d" stopOpacity=".86" /><stop offset="1" stopColor="#d1ba8d" stopOpacity=".1" /></linearGradient>
      </defs>
      <rect width="900" height="640" fill={`url(#${id}-plaster)`} />
      <rect x="24" y="24" width="852" height="592" fill={`url(#${id}-motif)`} />
      <path d="M28 96Q225 -12 450 94T872 92M28 112Q225 4 450 110T872 108" fill="none" stroke="#466252" strokeWidth="8" opacity=".72" />
      <path d="M27 535Q235 625 449 532T871 533M27 553Q235 643 449 550T871 551" fill="none" stroke="#965139" strokeWidth="8" opacity=".65" />
      <g transform="translate(450 320)">
        <circle r="160" fill="#315a4d" fillOpacity=".72" stroke="#dfc592" strokeWidth="7" />
        <circle r="145" fill="none" stroke="#a9553c" strokeWidth="12" />
        {Array.from({ length: 12 }, (_, index) => <g key={index} transform={`rotate(${index * 30})`}><path d="M0 -25Q-47 -75 0 -133Q47 -75 0 -25Z" fill={index % 2 ? '#ac623e' : '#d7b473'} stroke="#ecd3a0" strokeWidth="2" /><path d="M0 -35V-120" stroke="#6b633e" strokeWidth="2" /></g>)}
        <circle r="40" fill="#d9bd83" stroke="#8f4a36" strokeWidth="6" />
        <circle r="21" fill="#466351" />
      </g>
      <rect x="18" y="18" width="864" height="604" fill="none" stroke="#debe86" strokeWidth="5" />
      <rect x="33" y="33" width="834" height="574" fill="none" stroke="#705338" strokeWidth="2" />
      <g data-damage-layer="fading" style={{ display: visible('fading') ? undefined : 'none' }}>
        <path d="M65 64Q181 23 305 85L357 204Q190 271 60 217Z" fill={`url(#${id}-fade)`} />
        <path d="M85 116Q165 62 276 112" fill="none" stroke="#e2c99d" strokeWidth="15" opacity=".35" />
      </g>
      <g data-damage-layer="cracks" style={{ display: visible('cracks') ? undefined : 'none' }}>
        <path d="M694 30L671 97L694 130L657 182L669 215L626 275L645 335M681 117L753 148L776 193M663 181L601 166L581 184M635 261L710 292L727 330" fill="none" stroke="#ecd0a0" strokeWidth="8" />
        <path d="M694 30L671 97L694 130L657 182L669 215L626 275L645 335M681 117L753 148L776 193M663 181L601 166L581 184M635 261L710 292L727 330" fill="none" stroke="#3e3327" strokeWidth="4" />
      </g>
      <g data-damage-layer="flaking" style={{ display: visible('flaking') ? undefined : 'none' }}>
        {[[130, 311, 8], [205, 351, -13], [158, 401, 18]].map(([x, y, rotation], index) => <g key={index} transform={`translate(${x} ${y}) rotate(${rotation})`}><path d="M-14 -22L46 -29L67 10L31 45L-20 15Z" fill="#362c23" opacity=".55" transform="translate(7 10)" /><path d="M-14 -22L46 -29L67 10L31 45L-20 15Z" fill={index % 2 ? '#54745b' : '#b56945'} stroke="#e6c997" strokeWidth="2" /><path d="M-14 -22L46 -29L32 -10L-20 15Z" fill="#e3c99d" /><path d="M32 -10L67 10" stroke="#705139" strokeWidth="2" /></g>)}
      </g>
      <g data-damage-layer="loss" style={{ display: visible('loss') ? undefined : 'none' }}>
        <path d="M602 321L640 299L675 324L716 307L756 348L735 385L761 419L704 436L667 418L623 443L586 397L603 367Z" fill="#765c3d" stroke="#e5c593" strokeWidth="5" />
        <path d="M612 328L645 313L678 339L714 321L742 350L722 388L745 410L704 420L668 404L628 427L602 395L618 367Z" fill="#bea67f" />
        <path d="M623 375L699 354M659 409L718 389M636 344L665 352" stroke="#947854" strokeWidth="3" opacity=".6" />
      </g>
      <g data-damage-layer="soot" style={{ display: visible('soot') ? undefined : 'none' }}>
        <ellipse cx="184" cy="540" rx="191" ry="112" fill={`url(#${id}-smoke)`} />
        <ellipse cx="267" cy="566" rx="150" ry="69" fill={`url(#${id}-smoke)`} opacity=".65" />
      </g>
      <g data-damage-layer="salts" style={{ display: visible('salts') ? undefined : 'none' }}>
        <path d="M591 510Q664 474 754 514Q820 540 793 592Q703 612 608 575Z" fill="#e8e2c5" opacity=".45" />
        {Array.from({ length: 55 }, (_, index) => { const x = 604 + ((index * 47) % 180), y = 510 + ((index * 29) % 74); return <path key={index} d={`M${x} ${y - 4}l5 5 -5 5 -5 -5Z`} fill={index % 3 ? '#efe5c8' : '#fcf6df'} opacity={.5 + (index % 4) * .12} />; })}
      </g>
      <rect width="900" height="640" fill={`url(#${id}-weave)`} pointerEvents="none" />
    </svg>
    {markers && diseases.filter(item => !single || item.id === selected).map(item => <button key={item.id} className="damage-hotspot" style={{ left: `${item.position[0]}%`, top: `${item.position[1]}%` }} aria-label={`观察${item.name}`} aria-pressed={selected === item.id} onClick={() => onSelect(item.id)}>
      <span>{String(diseases.indexOf(item) + 1).padStart(2, '0')}</span><span className="damage-hotspot-label">{item.name}</span>
    </button>)}
  </div>;
}
