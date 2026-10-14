import { useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';
import { deleteHistory, listHistory } from '../restorationHistory';
import './RestorationHistory.css';

function HistoryImage({ item, onDelete }) {
  const [url, setUrl] = useState('');
  const dialog = useRef(null);
  useEffect(() => {
    const objectUrl = URL.createObjectURL(item.blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [item.blob]);
  const extension = item.blob.type === 'image/jpeg' ? 'jpg' : item.blob.type === 'image/webp' ? 'webp' : 'png';
  const downloadName = `焕壁-${item.name.replace(/\.[^.]+$/, '')}-${item.id}.${extension}`;
  return <article className="history-card">
    <button className="history-preview" onClick={() => dialog.current.showModal()} aria-label={`查看修复留影：${item.name}`}>
      {url && <img src={url} alt={item.name} loading="lazy" />}<span>展开留影 ↗</span>
    </button>
    <div className="history-card-info"><b title={item.name}>{item.name}</b><time dateTime={new Date(item.createdAt).toISOString()}>{new Date(item.createdAt).toLocaleString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' })}</time></div>
    <div className="history-actions"><a href={url || undefined} download={downloadName}><Download size={15} />下载</a><button onClick={() => onDelete(item.id)} aria-label={`删除留影：${item.name}`}>删除</button></div>
    <dialog className="history-dialog" ref={dialog} onClick={event => { if (event.target === event.currentTarget) dialog.current.close(); }}>
      <div className="history-dialog-head"><span>{item.name}</span><button autoFocus onClick={() => dialog.current.close()} aria-label="关闭留影"><X size={22} /></button></div>
      {url && <img src={url} alt={`修复结果：${item.name}`} />}
      <a className="stage-action" href={url || undefined} download={downloadName}><Download size={17} />下载这幅留影</a>
    </dialog>
  </article>;
}

export default function RestorationHistory({ revision, cacheMessage }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    listHistory().then(rows => { if (active) { setItems(rows); setError(''); } }).catch(() => {
      if (active) setError('暂时无法读取本地留影，请检查浏览器存储权限。');
    });
    return () => { active = false; };
  }, [revision, refresh]);
  async function remove(id) {
    if (!confirm("删除这幅修复留影？删除后无法恢复。")) return;
    try { await deleteHistory(id); setRefresh(value => value + 1); }
    catch { setError('删除未成功，请稍后重试。'); }
  }
  return <section className="restoration-history" aria-label="修复留影">
    <div className="history-heading"><div><span>留 住 丹 青 · 再 见 新 生</span><h2>修复留影</h2></div><b>{items.length} / 5</b></div>
    <p className="history-description">自动保留最近 5 张修复成果，再次打开仍可查看。仅保存在当前浏览器，清理网站数据会移除留影。</p>
    {(error || cacheMessage) && <p className="history-error" role="status">{error || cacheMessage}</p>}
    {items.length ? <div className="history-grid">{items.map(item => <HistoryImage key={item.id} item={item} onDelete={remove} />)}</div> : <p className="history-empty">待第一幅丹青焕新，在此留下时光的回响。</p>}
  </section>;
}
