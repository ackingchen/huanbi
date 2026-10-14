import Exhibition from "./Exhibition";
import Admin from "./Admin";
import ExhibitNav from "./components/ExhibitNav";
import { Comparison } from "./components/Comparison";
import React, { useState, useMemo, useRef, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import {
  Upload,
  ArrowUpRight,
  Landmark,
  Palette,
  ShieldCheck,
  X,
  Sparkles,
  Loader2,
  Download,
} from "lucide-react";
import "./styles.css";
import "./brush-font.css";
import "./Workbench.css";
import "./huanbi-exhibition.css";
import "./huanbi-art-buttons.css";
import "./huanbi-admin.css";
import "./huanbi-three-modules.css";
import "./huanbi-page-turn.css";
import "./huanbi-page-turn.js";
import SeriesExplore from './components/SeriesExplore';
import ParticleReveal from "./components/ParticleReveal";
import RestorationProgress from "./components/RestorationProgress";
import RestorationHistory from "./components/RestorationHistory";
import { saveHistory } from "./restorationHistory";
import SiteRouter, { useSiteNavigation } from './components/SiteRouter';
import { loadTreasureFile } from './treasureFile';
const presets = [
  ["敦煌 · 莫高窟", "dunhuang"],
  ["永乐宫 · 三清殿", "yongle"],
  ["法海寺 · 大雄宝殿", "fahai"],
];
const loadCave = () => import('./Cave');
const loadDamageAtlas = () => import('./DamageAtlas.jsx');
const Cave = lazy(loadCave);
const TreasurePicker = lazy(() => import('./components/TreasurePicker'));
const DamageAtlas = lazy(loadDamageAtlas);
const preloaders = { '/cave': loadCave, '/damage-atlas': loadDamageAtlas };
function App() {
  const navigation = useSiteNavigation();
  const treasureId = new URL(navigation?.href || location.href).searchParams.get('treasure');
  const importRequest = useRef(null);
  const [importing, setImporting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerEntry = useRef(null);
  const [historyRevision, setHistoryRevision] = useState(0);
  const [cacheMessage, setCacheMessage] = useState('');
  const [file, setFile] = useState(),
    [src, setSrc] = useState(""),
    [mode, setMode] = useState("考据修复"),
    [strength, setStrength] = useState(72),
    [ctx, setCtx] = useState("dunhuang"),
    [error, setError] = useState(""),
    [state, setState] = useState("idle"),
    [result, setResult] = useState(""),
    [dragging, setDragging] = useState(false),
    [compare, setCompare] = useState(false);
  const busy = state === "loading" || state === "assembling";
  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);
  const preset = useMemo(
    () => presets.find((p) => p[1] === ctx) || presets[0],
    [ctx],
  );
  const choose = (f) => {
    if (!f || busy) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(f.type) ||
      f.size > 20 * 1024 * 1024
    ) {
      setError("请选择 20MB 以内的 JPG、PNG 或 WEBP 图片");
      return;
    }
    setError("");
    if (f?.type?.startsWith("image/")) {
      importRequest.current?.abort();
      setImporting(false);
      if (src) URL.revokeObjectURL(src);
      setFile(f);
      setSrc(URL.createObjectURL(f));
      setResult("");
      setCompare(false);
      setCacheMessage('');
      setState("idle");
    }
  };
  useEffect(() => {
    if (!treasureId) { setImporting(false); return; }
    const controller = new AbortController();
    importRequest.current = controller;
    setImporting(true);
    setError('');
    const importMural = async () => {
      try {
        const { default: collection } = await import('./treasures.json');
        if (controller.signal.aborted) return;
        const item = collection.find(item => String(item.id) === treasureId);
        if (!item) throw new Error('未找到这幅珍藏壁画，请从千壁藏珍重新选用。');
        const selectedFile = await loadTreasureFile(item, controller.signal);
        if (controller.signal.aborted) return;
        choose(selectedFile);
        setCtx('dunhuang');
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message || '壁画加载失败，请重新选用。');
      } finally {
        if (!controller.signal.aborted) setImporting(false);
        if (importRequest.current === controller) importRequest.current = null;
      }
    };
    importMural();
    return () => controller.abort();
  }, [treasureId]);
  const generate = async () => {
    if (!file || busy || importing) return;
    setError("");
    setResult("");
    setCompare(false);
    setState("loading");
    const fd = new FormData();
    fd.append("image", file);
    fd.append("mode", mode);
    fd.append("strength", strength);
    fd.append("context", preset[0]);
    try {
      const r = await fetch("/api/restore", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "生成失败，请稍后重试");
      if (!data.imageUrl) throw new Error("服务未返回图片");
      setResult(data.imageUrl);
      setState("assembling");
      setCacheMessage('');
      try {
        await saveHistory(data.imageUrl, file.name);
        setHistoryRevision(value => value + 1);
      } catch {
        setCacheMessage('本次成果未能保存到本地，请先下载图片，避免关闭后丢失。');
      }
    } catch (err) {
      setError(err.message || "连接失败，请确认后端服务已启动");
      setState("error");
    }
  };
  return (
    <div id="top" className="exhibition-page exhibit-main workbench-page">
      <ExhibitNav active="workbench" />
      <main className="exhibit-width workbench-content">
        <section id="workbench" className="workbench">
          <div className="workbench-heading">
            <p className="lab-kicker"><span /> HUANBI · DIGITAL RESTORATION</p>
            <h1><span>让千年丹青，</span><span>再现光彩。</span></h1>
            <p>上传一幅壁画，从残缺之处，重拾岁月的颜色。</p>
          </div>
          <div className="restoration-composer">
            <div className={"upload-composer" + (dragging ? " is-dragging" : "")}
              onDragOver={(event) => { event.preventDefault(); if (!busy) setDragging(true); }}
              onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
              onDrop={(event) => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files[0]); }}>
              <div className="mural-scroll-mount restoration-scroll">
              {src ? (
                <div className={"source-preview" + (state === "loading" ? " is-particle-active" : "")}>
                  {compare && state === "done" ? <div className="stage-comparison"><Comparison original={src} restored={result} /></div> :
                  <ParticleReveal source={src} target={result} phase={state} onComplete={() => { setState("done"); setCompare(true); }} onFailure={message => { setError(message); setResult(""); setState("error"); }} />}
                  <div className="source-caption"><span>{state === "loading" ? "丹青化砂 · 正在修复" : state === "assembling" ? "聚砂成画 · 即将完成" : result ? "修复后的壁画" : "原始壁画"}</span><b>{file?.name}</b></div>
                  <button className="remove-source" aria-label="移除图片" disabled={busy}
                    onClick={() => { URL.revokeObjectURL(src); setSrc(""); setFile(null); setResult(""); setError(""); setState("idle"); }}><X size={18} /></button>
                </div>
              ) : (
                <div className="upload-empty">
                <label className="upload-target">
                  <input aria-label="上传壁画" type="file" disabled={busy}
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => choose(event.target.files[0])} />
                  <span className="upload-emblem"><Upload size={27} strokeWidth={1.4} /></span>
                  <b>{dragging ? "松开，即可上传壁画" : "将壁画拖到这里，或点击上传"}</b>
                  <small>JPG / PNG / WEBP · 最大 20MB</small>
                </label>
                <span className="upload-choice-divider">或选一幅珍藏</span>
                <button ref={pickerEntry} className="stage-action treasure-upload-entry" disabled={busy} onClick={() => setPickerOpen(true)}><Landmark size={18} />从千壁藏珍选用</button>
                </div>
              )}
              </div>
              {busy && <RestorationProgress phase={state} />}
              <div className="composer-toolbar">
                <span role="status">{importing ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />} {importing ? "正在载入千壁藏珍的壁画…" : busy ? (state === "assembling" ? "修复已返回，正在聚砂成画…" : "正在修复，请稍候…") : result ? "修复完成 · 可在画轴中对比原图" : src ? "壁画已就绪，选择下方选项开始修复" : "每一处残缺，都有重焕新生的可能"}</span>
                <div className="stage-actions">
                  {src && <button ref={pickerEntry} className="stage-action" disabled={busy} onClick={() => setPickerOpen(true)}><Landmark size={17} />从千壁藏珍选用</button>}
                  {result && state === "done" && <>
                    <button className="stage-action" aria-pressed={compare} onClick={() => setCompare(!compare)}>{compare ? "查看修复图" : "对比原图"}</button>
                    <a className="stage-action" href={result} download="huanbi-restored.png"><Download size={17} />下载成果</a>
                  </>}
                <button className="restore-submit" disabled={!file || busy || importing} onClick={generate}>
                  {busy ? <Loader2 className="spin" size={18} /> : <ArrowUpRight size={19} />}
                  {busy ? (state === "assembling" ? "正在成画…" : "正在修复…") : result ? "重新修复" : "开始智能修复"}
                </button>
                </div>
              </div>
            </div>
            {pickerOpen && <Suspense fallback={<p role="status" className="picker-opening">正在打开千壁藏珍…</p>}>
              <TreasurePicker returnFocusRef={pickerEntry} onClose={() => setPickerOpen(false)} onSelect={selected => { choose(selected); setCtx('dunhuang'); }} />
            </Suspense>}
            <div className="repair-options" aria-label="修复选项">
              <div className="option-row" role="group" aria-label="修复方式">
                <span className="option-label">修复方式</span>
                {[["考据修复", ShieldCheck, "遵循历史色彩"], ["艺术焕新", Palette, "保留风格重构"]].map(([value, Icon, description]) => (
                  <button key={value} className="option-chip" aria-pressed={mode === value} disabled={busy} onClick={() => setMode(value)}>
                    <Icon size={17} /><span>{value}</span><small>{description}</small>
                  </button>
                ))}
              </div>
              <div className="option-row" role="group" aria-label="文化语境">
                <span className="option-label">文化语境</span>
                {presets.map(([label, value]) => (
                  <button key={value} className="option-chip" aria-pressed={ctx === value} disabled={busy} onClick={() => setCtx(value)}>
                    <Landmark size={16} />{label}
                  </button>
                ))}
              </div>
              <div className="strength-control">
                <label htmlFor="repair-strength">修复强度</label>
                <span>轻度</span>
                <input id="repair-strength" disabled={busy} aria-label="修复强度" type="range" min="20" max="100" value={strength} onChange={(event) => setStrength(event.target.value)} />
                <span>深度</span><output htmlFor="repair-strength">{strength}%</output>
              </div>
            </div>
            <p role="alert" className="error">{error}</p>
            <p className="workbench-note"><ShieldCheck size={14} />本应用不落盘保存原图 · 生成时图片将发送至配置的 AI 服务</p>
            <RestorationHistory revision={historyRevision} cacheMessage={cacheMessage} />
          </div>
        </section>
      </main>
      <SeriesExplore active="workbench" />
      <footer className="exhibit-footer exhibit-width"><a className="exhibit-brand" href="/">焕 壁</a><p>一 壁 千 年 · 一 眼 新 生</p><span>© 2026 HUANBI <a href="/admin">管理后台 ↗</a></span></footer>
    </div>
  );
}
createRoot(document.getElementById("root")).render(
  window.location.pathname.startsWith("/admin") ? (
    <Admin />
  ) : (
    <SiteRouter Exhibition={Exhibition} Workbench={App} Cave={Cave} DamageAtlas={DamageAtlas} preloaders={preloaders} />
  ),
);
