import { useEffect, useState } from 'react';
import './RestorationProgress.css';

const verses = [
  ['拾取岁月的纹理', '循着斑驳的肌理，寻找丹青曾经落笔的方向。'],
  ['轻拂千年的尘埃', '让沉睡在风沙里的细节，一点一点浮现。'],
  ['续上断开的线条', '沿着衣袂与云纹的回环，想象笔锋未尽的余韵。'],
  ['唤醒矿彩的微光', '石青、石绿与朱砂，在时光深处重新相逢。'],
  ['弥合斑驳的留白', '让散落的色与形，慢慢回到画面的呼吸里。'],
  ['细织丹青的肌理', '在深浅交叠之间，留住壁画温润而古朴的质感。'],
  ['听见千年的回响', '一缕衣带，一片流云，旧日的故事渐渐清晰。'],
  ['静候满壁生辉', '给细节多一点时间，让这一眼新生值得等待。'],
];

export default function RestorationProgress({ phase }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (phase !== 'loading') return;
    const timer = setInterval(() => setIndex(value => (value + 1) % verses.length), 5200);
    return () => clearInterval(timer);
  }, [phase]);
  const assembling = phase === 'assembling';
  const [title, description] = assembling
    ? ['聚砂成画，丹青归来', '散落的微光正在归位，即将为你展开焕新的壁画。']
    : verses[index];
  return <section className={`restoration-progress${assembling ? ' is-assembling' : ''}`} aria-label="修复等待状态">
    <div className="restoration-progress-heading">
      <span className="restoration-seal" aria-hidden="true">{assembling ? '成' : '焕'}</span>
      <div className="restoration-verse" key={assembling ? 'assemble' : index} role="status" aria-atomic="true">
        <h2>{title}<span className="restoration-ellipsis" aria-hidden="true"> ···</span></h2>
        <p>{description}</p>
      </div>
      <span className="restoration-state">{assembling ? '正在呈现' : '修复进行中'}</span>
    </div>
    <div className="restoration-track" role="progressbar" aria-label={assembling ? '正在呈现修复图' : '正在等待修复结果'} aria-valuetext={assembling ? '修复结果已返回，正在成画' : '修复进行中'}><span /><i /></div>
    <div className="restoration-progress-foot"><span>一 壁 千 年 · 一 眼 新 生</span><span>{assembling ? '微光归位，即见新生' : '丹青新生，值得片刻静候'}</span></div>
  </section>;
}
