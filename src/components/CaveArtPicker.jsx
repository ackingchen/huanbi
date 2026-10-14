import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import collection from '../treasureCollection.js';
import './CaveArtPicker.css';

const categories=['全部',...new Set(collection.map(item=>item.category))];
export default function CaveArtPicker({ slot, current, busy, error, onChoose, onClose }) {
  const dialog=useRef(null);
  const [query,setQuery]=useState(''),[category,setCategory]=useState('全部');
  useEffect(()=>{dialog.current.showModal();},[]);
  const filtered=useMemo(()=>collection.filter(item=>(category==='全部'||item.category===category)&&`${item.title} ${item.source} ${item.id}`.toLowerCase().includes(query.trim().toLowerCase())),[query,category]);
  return <dialog ref={dialog} className="cave-picker" aria-labelledby="cave-picker-title" onClose={onClose} onCancel={event=>{if(busy)event.preventDefault();}}>
    <header><div><small>为第 {slot+1} 处岩壁挑选丹青</small><h2 id="cave-picker-title">从千壁藏珍选画</h2></div><button aria-label="关闭选画" disabled={busy} onClick={()=>dialog.current.close()}><X/></button></header>
    <div className="cave-picker-tools">
      <label><Search size={18}/><input autoFocus type="search" aria-label="搜索洞窟候选壁画" placeholder="搜索题名、洞窟或编号" value={query} onChange={e=>setQuery(e.target.value)}/></label>
      <div className="cave-picker-filters" aria-label="选画分类">{categories.map(name=><button key={name} aria-pressed={category===name} onClick={()=>setCategory(name)}>{name}</button>)}</div>
      <p role="status">{busy?'正在将丹青铺上岩壁，请稍候…':error||`共 ${filtered.length} 幅 · 点击画作即可更换`}</p>
    </div>
    <div className="cave-picker-grid" aria-busy={busy}>{filtered.map(item=><button key={item.id} disabled={busy} aria-pressed={current===`treasure-${item.id}`} aria-label={`选用 ${item.title}`} onClick={()=>onChoose(item)}>
      <img src={item.thumbnail} alt="" loading="lazy" width={item.width} height={item.height}/><span>{item.category} · {item.id}</span><b>{item.title}</b>{current===`treasure-${item.id}`&&<small>当前壁画</small>}
    </button>)}</div>
    {!filtered.length&&<p className="cave-picker-empty">没有找到相关壁画，试试其他关键词或分类。</p>}
  </dialog>;
}
