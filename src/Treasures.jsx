import { useId, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, Search, X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import collection from './treasures.json';
import LazyMuralImage from './components/LazyMuralImage';
import MasonryGrid from './components/ui/masonry-grid';
import './Treasures.css';

const categories = ['全部', '石窟丹青', '藻井纹样', '飞天乐舞', '佛与菩萨', '综合拾珍'];
const groups = categories.slice(1).map(category => collection.filter(item => item.category === category));
const items = Array.from({length: Math.max(...groups.map(group => group.length))}, (_, index) => groups.map(group => group[index]).filter(Boolean)).flat();
export default function Treasures() {
  const [category, setCategory] = useState('全部');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const dialogId = useId();
  const opener = useRef(null);
  const filtered = useMemo(() => items.filter(item => (category === '全部' || item.category === category) && `${item.title} ${item.source} ${item.id}`.toLowerCase().includes(query.trim().toLowerCase())), [category, query]);
  const index = filtered.findIndex(item => item.id === selected?.id);
  const change = delta => setSelected(filtered[(index + delta + filtered.length) % filtered.length]);
  return <div className="treasures-page exhibit-width">
      <section className="exhibit-intro"><p className="exhibit-kicker">敦煌图像珍藏 / THE MURAL COLLECTION</p><h2>千壁藏珍</h2><p>循飞天衣带，观藻井繁花。<br/>五类主题，150 幅壁画，拾取时光里的丹青。</p><span className="intro-line" aria-hidden="true" /></section>
      <section className="treasures-collection" aria-label="壁画藏品">
        <div className="treasures-tools"><div className="treasures-filters" role="group" aria-label="壁画分类">{categories.map(name => <button key={name} aria-pressed={category === name} onClick={() => {setCategory(name);}}>{name}<small>{name === '全部' ? 150 : items.filter(item => item.category === name).length}</small></button>)}</div><label className="treasures-search"><Search size={18}/><input type="search" aria-label="搜索壁画" placeholder="搜索题名、洞窟或编号" value={query} onChange={e => {setQuery(e.target.value);}}/></label></div>
        <div className="treasures-caption" aria-live="polite"><span>{category === '全部' ? '全部珍藏' : category} / {String(filtered.length).padStart(2,'0')} 幅</span><span>点击画作 · 展开细赏</span></div>
        <Dialog.Root open={Boolean(selected)} onOpenChange={open => {if (!open) setSelected(null);}}>
          <MasonryGrid className="treasures-grid" items={filtered} getKey={item => item.id} gap="1.4rem" renderItem={item => <button className="treasures-card" onClick={event => {opener.current = event.currentTarget;setSelected(item);}} aria-label={`查看 ${item.title}`} aria-haspopup="dialog" aria-controls={dialogId} aria-expanded={selected?.id === item.id}><LazyMuralImage item={item} /><div className="treasures-card-meta"><span>{item.category}</span><span>NO. {item.id}</span></div><h2>{item.title}</h2></button>} />
          <Dialog.Portal><Dialog.Overlay className="treasures-overlay"/><Dialog.Content id={dialogId} className="treasures-dialog" onCloseAutoFocus={event => {
            // A shared Radix Trigger ref otherwise points at the last card.
            event.preventDefault();
            if (opener.current?.isConnected && opener.current.getClientRects().length) {
              opener.current.focus({ preventScroll: true });
            }
          }} onKeyDown={e => {if (e.key === 'ArrowLeft') change(-1);if(e.key === 'ArrowRight') change(1);}}>
            {selected && <><Dialog.Close className="treasures-close" aria-label="关闭大图"><X/></Dialog.Close><div className="treasures-full-image"><img src={selected.image} alt={selected.title}/></div><div className="treasures-dialog-copy"><p className="treasures-kicker">{selected.category} / NO. {selected.id}</p><Dialog.Title>{selected.title}</Dialog.Title><Dialog.Description>图像归类与题名依据本地收藏资料。{!selected.named && '原图未附题名，以分类与展品编号标识。'}</Dialog.Description><p className="treasures-source">原文件：{selected.source}</p><div className="treasures-dialog-actions"><div className="treasures-dialog-paging"><button onClick={() => change(-1)} aria-label="上一幅"><ChevronLeft/>上一幅</button><span>{index+1} / {filtered.length}</span><button onClick={() => change(1)} aria-label="下一幅">下一幅<ChevronRight/></button></div><div className="treasures-dialog-links"><a href={selected.image} target="_blank" rel="noreferrer">打开大图 <ArrowUpRight size={16}/></a><a className="treasures-restore-link" href={`/workbench?treasure=${encodeURIComponent(selected.id)}`}><Sparkles size={16}/>前往焕新之意修复</a></div></div></div></>}
          </Dialog.Content></Dialog.Portal>
        </Dialog.Root>
        {filtered.length === 0 && <div className="treasures-empty"><p>暂未找到相关壁画</p><button onClick={() => {setQuery('');setCategory('全部');}}>查看全部珍藏</button></div>}
        {filtered.length > 0 && <p className="treasures-end">已展出全部 {filtered.length} 幅 · 画卷有尽，余韵悠长</p>}
      </section>
  </div>;
}
