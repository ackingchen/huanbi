import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Eye, EyeOff, Layers, ShieldCheck } from 'lucide-react';
import ExhibitNav from './components/ExhibitNav';
import DamageSpecimen from './components/DamageSpecimen';
import { atlasSources, diseases } from './muralDiseases';
import './DamageAtlas.css';
import SeriesExplore from './components/SeriesExplore';

const sections = [['appearance', '如何辨认'], ['causes', '常见成因'], ['care', '保护思路']];
const readSelection = () => diseases.find(item => `#${item.id}` === location.hash)?.id || diseases[0].id;

export default function DamageAtlas() {
  const [selected, setSelected] = useState(readSelection);
  const [section, setSection] = useState('appearance');
  const [single, setSingle] = useState(false);
  const [markers, setMarkers] = useState(true);
  const tabRefs = useRef([]);
  const current = diseases.find(item => item.id === selected);
  useEffect(() => {
    const sync = () => { setSelected(readSelection()); setSection('appearance'); };
    addEventListener('hashchange', sync);
    addEventListener('popstate', sync);
    return () => { removeEventListener('hashchange', sync); removeEventListener('popstate', sync); };
  }, []);
  useEffect(() => {
    const title = document.title;
    document.title = '壁画病害图鉴 · 焕壁';
    return () => { document.title = title; };
  }, []);
  const select = id => {
    setSelected(id);
    setSection('appearance');
    if (location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
  };
  const moveTab = (event, index) => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % sections.length;
    if (event.key === 'ArrowLeft') next = (index + sections.length - 1) % sections.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = sections.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    setSection(sections[next][0]);
    tabRefs.current[next]?.focus();
  };

  return <div id="top" className="exhibition-page exhibit-main damage-atlas-page">
    <ExhibitNav active="damage-atlas" />
    <main className="damage-atlas-main exhibit-width">
      <section className="damage-hero">
        <div><p className="damage-kicker">壁 上 留 痕 / TRACES OF TIME</p><h1>壁画病害图鉴</h1><p className="damage-hero-line">读懂一处壁伤，才更懂一壁千年。</p><p className="damage-hero-copy">颜色为何渐淡，薄片为何翘起？<br />循着六种常见痕迹，认识壁画材料与岁月的相遇。</p></div>
        <div className="damage-hero-note"><span>观 · 察 · 理 · 解</span><p>从看见痕迹，<br />到理解保护。</p><small>六类病害 · 互动示意 · 保护知识</small></div>
      </section>
      <section className="damage-directory" aria-label="六类壁画病害">
        {diseases.map((item, index) => <button key={item.id} aria-label={`了解${item.name}`} aria-pressed={selected === item.id} onClick={() => select(item.id)}>
          <span className="damage-directory-number">0{index + 1}</span><span className="damage-directory-name">{item.name}</span><small>{item.english}</small>
        </button>)}
      </section>
      <section className="damage-observatory" aria-labelledby="damage-observatory-title">
        <div className="damage-section-heading"><div><p className="damage-kicker">循 痕 识 病</p><h2 id="damage-observatory-title">一幅画，六种岁月痕迹。</h2></div><p>点选画面标记或上方病害，展开观察。</p></div>
        <div className="damage-observation-grid">
          <figure className="damage-figure">
            <div className="damage-figure-toolbar"><span>病害观察台</span><div><button aria-pressed={single} onClick={() => setSingle(!single)}><Layers size={16} />{single ? '查看完整画面' : '放大当前病害'}</button><button aria-pressed={markers} onClick={() => setMarkers(!markers)}>{markers ? <EyeOff size={16} /> : <Eye size={16} />}{markers ? '隐藏观察标记' : '显示观察标记'}</button></div></div>
            <DamageSpecimen selected={selected} onSelect={select} single={single} markers={markers} />
            <figcaption><span>AI 绘制教学示意 · 非实物病害标注</span><span>示意图用于理解外观特征，不能据此判断真实病因。</span></figcaption>
          </figure>
          <div className="damage-detail" aria-live="polite">
            <p className="damage-kicker">0{diseases.indexOf(current) + 1} / {current.english}</p><h2 className="damage-detail-title">{current.name}</h2><p className="damage-detail-summary">{current.summary}</p>
            <div className="damage-detail-tabs" role="tablist" aria-label="病害知识">
              {sections.map(([id, label], index) => <button key={id} ref={element => { tabRefs.current[index] = element; }} id={`damage-tab-${id}`} role="tab" aria-selected={section === id} aria-controls={`damage-panel-${id}`} tabIndex={section === id ? 0 : -1} onClick={() => setSection(id)} onKeyDown={event => moveTab(event, index)}>{label}</button>)}
            </div>
            {sections.map(([id]) => <div key={id} role="tabpanel" id={`damage-panel-${id}`} aria-labelledby={`damage-tab-${id}`} hidden={section !== id} tabIndex={0} className="damage-detail-panel"><ol>{current[id].map((text, index) => <li key={text}><span>0{index + 1}</span><p>{text}</p></li>)}</ol></div>)}
            <div className="damage-distinction"><span>辨认小记</span><p>{current.distinction}</p></div>
          </div>
        </div>
      </section>
      <section className="damage-materials" aria-labelledby="damage-materials-title">
        <div className="damage-materials-copy"><p className="damage-kicker">由 表 及 里</p><h2 id="damage-materials-title">壁画，也有层次。</h2><p>病害可能停留在表面，也可能深入地仗与壁体。<br />当前选择的「{current.name}」可能涉及图中高亮层次。</p><small>层次图为概念示意；各处壁画的材料、工艺与病害情况可能不同。</small></div>
        <div className="damage-layer-stack" aria-label="壁画材料层次">
          {[
            ['surface', '表面附着', '烟尘、结晶等可覆盖画面'],
            ['paint', '彩绘层', '颜料与结合材料组成画面'],
            ['plaster', '地仗层', '承载彩绘的泥层或灰泥等'],
            ['wall', '壁体', '支撑壁画的岩体或墙体'],
          ].map(([id, title, text]) => <div key={id} className={`damage-layer-row layer-${id}`} data-affected={current.layers.includes(id)}><span>{title}</span><p>{text}</p>{current.layers.includes(id) && <small>可能涉及</small>}</div>)}
        </div>
      </section>
      <section className="damage-conservation">
        <p className="damage-kicker">知 病，更 知 保 护</p><h2>先记录，再判断。</h2>
        <div className="damage-principles">{[
          ['01', '留下可比较的记录', '记录位置、形态与变化，让不同时期的观察有据可循。'],
          ['02', '理解材料与环境', '结合材料、温湿度和壁体情况，寻找损伤背后的因素。'],
          ['03', '以长期稳定为目标', '重视预防与监测；保护方案由专业人员评估，避免只追求画面焕新。'],
        ].map(([number, title, text]) => <div key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></div>)}</div>
        <div className="damage-digital-note"><ShieldCheck size={22} /><p><b>数字修复，是对视觉可能性的探索。</b><span>补色与补图不等于真实文物修复，也不能消除起甲、裂隙或盐分活动。具体病害应结合现场调查与专业检测判断。</span></p><a href="/workbench">进入数字修复工作台 <ArrowUpRight size={17} /></a></div>
      </section>
      <section className="damage-sources" aria-labelledby="damage-sources-title"><div><p className="damage-kicker">延 伸 阅 读</p><h2 id="damage-sources-title">让保护有据可循。</h2><p>本页为常见病害的概括性科普。以下资料可帮助理解壁画保护的研究方法与基本原则。</p></div><div>{atlasSources.map(source => <a key={source.href} href={source.href} target="_blank" rel="noreferrer"><span>{source.title}<small>{source.description}</small></span><ArrowUpRight size={20} /></a>)}</div></section>
    </main>
    <SeriesExplore active="damage-atlas" />
    <footer className="exhibit-footer exhibit-width"><a className="exhibit-brand" href="/">焕 壁</a><p>知其美，也知其脆弱。</p><a href="/#archive">返回丹青长廊 <ArrowUpRight size={16} /></a></footer>
  </div>;
}
