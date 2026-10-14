import { useEffect, useRef, useState } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, ChevronLeft, ChevronRight, Expand, X, Volume2, VolumeX } from 'lucide-react';
import ExhibitNav from './components/ExhibitNav';
import { exhibits } from './exhibits';
import { createCave } from './caveScene';
import { createCaveAudio } from './caveAudio';
import CaveArtPicker from './components/CaveArtPicker';
import collection from './treasures.json';
import './Cave.css';
import SeriesExplore from './components/SeriesExplore';

const selectionKey='huanbi-cave-artworks-v1';
function fromTreasure(entry) {
  return {id:`treasure-${entry.id}`,name:entry.title,image:entry.image,thumbnail:entry.thumbnail,era:entry.category,location:`千壁藏珍 · NO. ${entry.id}`,description:`图像归类与题名依据本地收藏资料。${entry.named?'':'原图未附题名，以分类与展品编号标识。'}`,originalFile:entry.source};
}
function initialArtworks() {
  try {
    const ids=JSON.parse(localStorage.getItem(selectionKey));
    if(!Array.isArray(ids)||ids.length!==5)return exhibits;
    return ids.map((id,i)=>{
      const entry=collection.find(entry=>`treasure-${entry.id}`===id);
      return entry?fromTreasure(entry):exhibits.find(entry=>entry.id===id)||exhibits[i];
    });
  }catch{return exhibits;}
}

export default function Cave({ onSceneSettled }) {
  const host=useRef(null),scene=useRef(null),stage=useRef(null),dialog=useRef(null);
  const [ready,setReady]=useState(false),[error,setError]=useState(''),[selected,setSelected]=useState(null),[auto,setAuto]=useState(false);
  const [artworks,setArtworks]=useState(initialArtworks);
  const [pickerSlot,setPickerSlot]=useState(null),[changing,setChanging]=useState(false),[pickerError,setPickerError]=useState('');
  const audio=useRef(createCaveAudio());
  const [soundOn,setSoundOn]=useState(false);
  const initialItems=useRef(artworks);
  useEffect(()=>{
    const failScene = message => {setError(message);onSceneSettled?.();};
    try{scene.current=createCave(host.current,initialItems.current,index=>setSelected(index),()=>{setReady(true);onSceneSettled?.();},failScene);scene.current.setAudio(audio.current);}
    catch{failScene('当前设备无法开启三维画面，请使用支持 WebGL 的浏览器。你仍可从下方查看壁画。');}
    return()=>{scene.current?.dispose();audio.current.dispose();};
  },[]);
  useEffect(()=>{if(selected!==null)dialog.current.showModal();},[selected]);
  const item=selected===null?null:artworks[selected];
  function action(fn){fn(scene.current);setAuto(false);host.current.focus({preventScroll:true});}
  async function toggleSound(){try{const on=await audio.current.toggle();setSoundOn(on);scene.current?.setAudio(audio.current);}catch{setSoundOn(false);setError('环境声音频加载失败，请检查网络后重新开启。');}}
  async function changeArtwork(entry) {
    if(changing||pickerSlot===null||!scene.current)return;
    const slot=pickerSlot,next=fromTreasure(entry);
    setChanging(true);setPickerError('');
    try {
      await scene.current.replaceArtwork(slot,next);
      const updated=artworks.map((item,index)=>index===slot?next:item);
      setArtworks(updated);
      try{localStorage.setItem(selectionKey,JSON.stringify(updated.map(item=>item.id)));}
      catch{setError('壁画已更换，但浏览器未能记住本次选择。');}
      setPickerSlot(null);action(s=>s.focus(slot));
    }catch(err){setPickerError(err.message||'更换失败，请稍后重试。');}
    finally{setChanging(false);}
  }
  return <div className="exhibition-page exhibit-main cave-page">
    <ExhibitNav active="cave" />
    <main className="cave-content">
      <div className="cave-heading"><div><p>HUANBI · IMMERSIVE GROTTO</p><h1>入窟，见千年。</h1></div><p>循一束微光，走进丹青深处。<br/><span>敦煌意象空间 · 艺术化构建</span></p></div>
      <section className="cave-stage" ref={stage} aria-label="沉浸洞窟">
        <div className="cave-canvas" ref={host} tabIndex={0} onPointerDown={()=>setAuto(false)} onKeyDown={()=>setAuto(false)} aria-label="三维洞窟：拖动转头，WASD或方向键前后左右行走，滚轮缩放视角，点击壁画查看详情" />
        <div className="cave-corner"><span className="cave-live" /> 数字洞窟 <span>360°</span></div>
        {!ready&&!error&&<div className="cave-loading" role="status"><span>入 窟</span><p>正在点亮洞窟，铺陈千年丹青…</p></div>}
        {error&&<div className="cave-notice" role="alert">{error}</div>}
        <div className="cave-hint">拖动转头 · 滚轮缩放 · WASD / 方向键行走</div>
        <div className="cave-controls">
          <button aria-label="向左转" onClick={()=>action(s=>s?.turn(.3))}><ChevronLeft size={19}/></button>
          <button aria-label="向左平移" title="向左平移 · A" onClick={()=>action(s=>s?.strafe(-.7))}><ArrowLeft size={19}/></button>
          <button aria-label="向前走" onClick={()=>action(s=>s?.walk(.7))}><ArrowUp size={19}/></button>
          <button aria-label="向后走" onClick={()=>action(s=>s?.walk(-.7))}><ArrowDown size={19}/></button>
          <button aria-label="向右平移" title="向右平移 · D" onClick={()=>action(s=>s?.strafe(.7))}><ArrowRight size={19}/></button>
          <button aria-label="向右转" onClick={()=>action(s=>s?.turn(-.3))}><ChevronRight size={19}/></button>
          <span />
          <button aria-label="回到入口" onClick={()=>action(s=>s?.reset())}><RotateCcw size={18}/></button>
          <button aria-label="自动环游" aria-pressed={auto} onClick={()=>setAuto(scene.current?.toggleAuto()||false)}>环游</button>
          <button aria-label={soundOn?'关闭环境声':'开启环境声'} aria-pressed={soundOn} onClick={toggleSound}>{soundOn?<Volume2 size={18}/>:<VolumeX size={18}/>}</button>
          <button aria-label="全屏洞窟" onClick={async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await stage.current.requestFullscreen();}catch{setError('当前浏览器不支持全屏，请在此窗口继续观赏。');}}}><Expand size={18}/></button>
        </div>
      </section>
      <div className="cave-gallery-heading"><h2>随壁而行</h2><p>点击画作移步观赏 · 从千壁藏珍更换岩壁上的丹青</p></div>
      <div className="cave-stops">{artworks.map((entry,i)=><article key={i}>
        <button className="cave-stop" onClick={()=>action(s=>s?.focus(i))} disabled={!ready}><img src={entry.thumbnail||entry.image} alt=""/><span><small>0{i+1} / {entry.era}</small><b>{entry.name}</b></span></button>
        <div className="cave-card-actions"><button className="cave-detail-link" onClick={()=>setSelected(i)}>壁画详情 ↗</button><button className="cave-change-art" disabled={!ready||changing} aria-label={`更换第${i+1}幅壁画`} onClick={()=>{setPickerError('');setPickerSlot(i);}}>更换壁画 ⇄</button></div>
      </article>)}</div>
      <p className="cave-footnote">本空间为敦煌风格的艺术化展厅，并非特定洞窟的实测复原。壁画选取自不同洞窟，具体出处见作品详情。<br/>水滴音效：<a href="https://opengameart.org/content/dripping-water" target="_blank" rel="noreferrer">Dripping Water — spookymodem</a>（<a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>，播放时调低音量）。</p>
    </main>
    <SeriesExplore active="cave" />
    <dialog ref={dialog} className="cave-dialog" onClose={()=>setSelected(null)} onClick={e=>{if(e.target===e.currentTarget)dialog.current.close();}}>
      {item&&<><button className="cave-close" aria-label="关闭壁画详情" autoFocus onClick={()=>dialog.current.close()}><X/></button><img src={item.image} alt={item.name}/><div><small>{item.era} / {item.location}</small><h2>{item.name}</h2><p>{item.description}</p>{item.source?<a href={item.source} target="_blank" rel="noreferrer">查看数字敦煌来源 ↗</a>:<><p>原文件：{item.originalFile}</p><a href={item.image} target="_blank" rel="noreferrer">打开壁画大图 ↗</a></>}</div></>}
    </dialog>
    {pickerSlot!==null&&<CaveArtPicker slot={pickerSlot} current={artworks[pickerSlot].id} busy={changing} error={pickerError} onChoose={changeArtwork} onClose={()=>setPickerSlot(null)} />}
  </div>;
}
