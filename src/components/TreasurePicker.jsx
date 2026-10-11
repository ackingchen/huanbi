import { useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Loader2, Search, X } from 'lucide-react';
import collection from '../treasures.json';
import { loadTreasureFile } from '../treasureFile';
import './TreasurePicker.css';

const categories = ['全部', '石窟丹青', '藻井纹样', '飞天乐舞', '佛与菩萨', '综合拾珍'];

export default function TreasurePicker({ onSelect, onClose, returnFocusRef }) {
  const [category, setCategory] = useState('全部');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  const filtered = useMemo(() => collection.filter(item =>
    (category === '全部' || item.category === category) &&
    `${item.title} ${item.source} ${item.id}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [category, query]);

  const select = async item => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setLoading(item);
    setError('');
    try {
      const file = await loadTreasureFile(item, controller.signal);
      if (controller.signal.aborted) return;
      onSelect(file);
      onClose();
    } catch (err) {
      if (!controller.signal.aborted) setError(err.message || '壁画加载失败，请重试。');
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setLoading(null);
      }
    }
  };

  return <Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="treasure-picker-overlay" />
      <Dialog.Content className="treasure-picker" onCloseAutoFocus={event => {
        event.preventDefault();
        returnFocusRef.current?.focus();
      }}>
        <header className="treasure-picker-header">
          <div><p className="treasure-picker-kicker">千壁藏珍 · 选一幅丹青</p>
            <Dialog.Title>从千壁藏珍选用壁画</Dialog.Title>
            <Dialog.Description>挑选一幅珍藏原图，带入画轴，开启数字修复。</Dialog.Description>
          </div>
          <Dialog.Close className="treasure-picker-close" aria-label="关闭壁画选择"><X size={22} /></Dialog.Close>
        </header>
        <div className="treasure-picker-tools">
          <div className="treasure-picker-filters" role="group" aria-label="珍藏分类">
            {categories.map(name => <button key={name} disabled={Boolean(loading)} aria-pressed={category === name} onClick={() => setCategory(name)}>{name}</button>)}
          </div>
          <label className="treasure-picker-search"><Search size={18} />
            <input type="search" aria-label="搜索珍藏壁画" placeholder="搜索题名、洞窟或编号" disabled={Boolean(loading)} value={query} onChange={event => setQuery(event.target.value)} />
          </label>
        </div>
        <div className="treasure-picker-status" role="status">
          {loading ? <><Loader2 className="spin" size={16} /><span>正在载入：{loading.title}</span></> : <><span>{category === '全部' ? '全部珍藏' : category} · {filtered.length} 幅</span><span>点击画作即可选用</span></>}
        </div>
        {error && <p className="treasure-picker-error" role="alert">{error}</p>}
        <div className="treasure-picker-gallery" aria-busy={Boolean(loading)}>
          {filtered.length ? <div className="treasure-picker-grid">
            {filtered.map(item => <button key={item.id} className="treasure-picker-card" disabled={Boolean(loading)} aria-label={`选用 ${item.title}`} onClick={() => select(item)}>
              <span className="treasure-picker-image"><img src={item.thumbnail} alt="" width={item.width} height={item.height} loading="lazy" decoding="async" /></span>
              <span className="treasure-picker-meta"><span>{item.category}</span><span>NO. {item.id}</span></span>
              <span className="treasure-picker-title">{item.title}</span>
              <span className="treasure-picker-use">{loading?.id === item.id ? '正在载入…' : '选用此画 ↗'}</span>
            </button>)}
          </div> : <div className="treasure-picker-empty"><p>未找到相关壁画</p><button onClick={() => { setQuery(''); setCategory('全部'); }}>查看全部珍藏</button></div>}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
