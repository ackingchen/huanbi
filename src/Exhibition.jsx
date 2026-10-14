import { lazy, memo, Suspense, useEffect, useLayoutEffect, useState, useTransition, ViewTransition } from 'react';
import { useSiteNavigation } from './components/SiteRouter';
import ScrollScene from './components/ScrollScene';
import ExhibitNav from './components/ExhibitNav';
import MuralArtwork, { SourceLink } from './components/MuralArtwork';
import './Exhibition.css';
import SeriesExplore from './components/SeriesExplore';

import { exhibits } from './exhibits';

const Treasures = memo(lazy(() => import('./Treasures')));

export default function Exhibition() {
  const navigation = useSiteNavigation();
  const [localTab, setTab] = useState(() => location.hash === '#treasures' ? 'treasures' : 'archive');
  const tab = navigation && ['#archive', '#treasures'].includes(navigation.hash) ? (navigation.hash === '#treasures' ? 'treasures' : 'archive') : localTab;
  const [treasuresVisited, setTreasuresVisited] = useState(tab === 'treasures');
  const [scrollRequest, setScrollRequest] = useState(0);
  const [isPending, startTransition] = useTransition();
  const opening = !(navigation?.hash ?? location.hash) || (navigation?.hash ?? location.hash) === '#top';
  useEffect(() => { if (tab === 'treasures') setTreasuresVisited(true); }, [tab]);
  // Commit the new panel and its scroll position together, before paint.
  useLayoutEffect(() => {
    if (['#treasures', '#archive'].includes(location.hash)) {
      document.getElementById('exhibition')?.scrollIntoView({ behavior: 'instant' });
    }
  }, [tab, scrollRequest]);
  useEffect(() => {
    if (navigation) return;
    const syncTab = () => {
      if (!['#treasures', '#archive'].includes(location.hash)) return;
      const next = location.hash === '#treasures' ? 'treasures' : 'archive';
      startTransition(() => {
        setTab(next);
        setScrollRequest(value => value + 1);
        if (next === 'treasures') setTreasuresVisited(true);
      });
    };
    addEventListener('hashchange', syncTab);
    return () => removeEventListener('hashchange', syncTab);
  }, [Boolean(navigation)]);
  const selectTab = (event, next) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (navigation) { navigation.navigate('#' + next); return; }
    if (location.hash !== '#' + next) history.pushState(null, '', '#' + next);
    startTransition(() => {
      setTab(next);
      setScrollRequest(value => value + 1);
      if (next === 'treasures') setTreasuresVisited(true);
    });
  };
  return <div id="top" className="exhibition-page">
    {opening && <ScrollScene />}
    <main id="exhibition" className="exhibit-main" hidden={opening}>
      <ExhibitNav active={tab} onSelect={selectTab} />
      <Suspense fallback={<div className="exhibit-panel-loading exhibit-width" role="status">正在展开珍藏…</div>}>
      <ViewTransition name="exhibition-panel" default="none" update="auto">
      <div aria-busy={isPending || navigation?.pending}>
      <div hidden={tab !== 'archive'}>
      <section className="exhibit-intro exhibit-width"><p className="exhibit-kicker">循 色 入 画 / THE EXHIBITION</p><h2>一壁之间，万象生。</h2><p>从飞天乐舞到丝路故事，走近五幅敦煌经典壁画。<br />一幅一停留，一眼一千年。</p><span className="intro-line" aria-hidden="true" /></section>
      <section id="archive" className="exhibit-rows exhibit-width" aria-label="五幅敦煌经典壁画">
        {exhibits.map((item, index) => <article className={`exhibit-row ${index % 2 ? 'exhibit-row-reverse' : ''}`} key={item.id}>
          <MuralArtwork item={item} index={index} />
          <div className="exhibit-copy"><p className="exhibit-kicker"><span className="copy-index">0{index + 1}</span> {item.era} · 莫高窟第{Number(item.id)}窟</p><h2>{item.name}</h2><span className="copy-rule" aria-hidden="true" /><p>{item.description}</p><p>{item.extra}</p><div className="copy-detail"><span>观 赏 线 索</span><p>{item.detail}</p><SourceLink item={item} /></div><span className="copy-seal" aria-hidden="true">{item.word}</span></div>
        </article>)}
      </section>
      </div>
      <div id="treasures" hidden={tab !== 'treasures'}>
        {(treasuresVisited || tab === 'treasures') && <Treasures />}
      </div>
      </div>
      </ViewTransition>
      </Suspense>
      <SeriesExplore active={tab} />
      <footer className="exhibit-footer exhibit-width"><a className="exhibit-brand" href="#top">焕 壁</a><p>一 壁 千 年 · 一 眼 新 生</p><span>© 2026 HUANBI <a href="/admin">管理后台 ↗</a></span></footer>
    </main>
  </div>;
}
