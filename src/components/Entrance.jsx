import { useEffect, useRef, useState } from "react";
import "./Entrance.css";
function Landscape() {
  return (
    <svg
      className="entrance-landscape"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="jade" x2=".7" y2="1">
          <stop stopColor="#396e66" />
          <stop offset="1" stopColor="#092f33" />
        </linearGradient>
        <linearGradient id="ochre">
          <stop stopColor="#d2a34d" />
          <stop offset="1" stopColor="#796031" />
        </linearGradient>
        <radialGradient id="sun">
          <stop stopColor="#f7d38a" />
          <stop offset=".65" stopColor="#d99f47" />
          <stop offset="1" stopColor="#d99f47" stopOpacity="0" />
        </radialGradient>
        <g id="leaf">
          <path
            d="M0 0C-180-60-170-220-75-240C40-290 125-105 0 0Z"
            fill="url(#jade)"
            stroke="#bbad67"
            strokeWidth="2"
          />
          <path
            d="M0 0L-65-225M-20-70L-105-125M-35-120L35-175M-50-170L-115-200"
            fill="none"
            stroke="#b7ae72"
            strokeWidth="2"
          />
        </g>
      </defs>
      <g className="scene-sun">
        <circle cx="1270" cy="285" r="175" fill="url(#sun)" />
        <g fill="none" stroke="#d8b96c" opacity=".6">
          {[145, 160, 180, 193].map((r) => (
            <ellipse
              key={r}
              cx="1270"
              cy="285"
              rx={r}
              ry={r * 0.91}
              strokeWidth="1.5"
            />
          ))}
        </g>
      </g>
      <g
        className="scene-clouds"
        fill="none"
        stroke="#dcb554"
        strokeWidth="2"
        opacity=".7"
      >
        <path d="M-70 240H230Q330 222 190 218H125Q80 204 225 196H480Q550 184 410 175H320M1000 355H1300Q1390 340 1260 327H1170Q1080 308 1240 303H1610" />
        <path d="M-30 310H145Q215 295 120 283H40M1050 115H1380Q1460 97 1330 89H1240" />
      </g>
      <g className="scene-mountains">
        <path
          d="M-100 920L110 525 180 500 290 755 430 600 530 920M450 920L650 650 720 720 810 590 990 920M1030 920L1230 560 1280 570 1460 800 1520 620 1700 920"
          fill="url(#jade)"
          stroke="#bc9d56"
          strokeWidth="3"
        />
        <g fill="none" stroke="url(#ochre)" strokeWidth="12">
          <path d="M40 890L163 530 202 720 259 880M345 840L427 623 480 830M575 880L655 680M715 900L807 625 874 841M1110 894L1247 590 1280 770M1430 891L1520 650 1570 817" />
        </g>
        <g stroke="#c2b575" strokeWidth="2" fill="none">
          <path d="M105 750L138 629 160 690M222 865L270 800M621 806L641 755 663 801M785 813L813 701 844 775M1205 802L1234 718 1261 816" />
        </g>
      </g>
      <g className="scene-leaves">
        <use
          href="#leaf"
          transform="translate(50 920) rotate(-35) scale(1.8)"
        />
        <use
          href="#leaf"
          transform="translate(180 950) rotate(35) scale(1.1)"
        />
        <use
          href="#leaf"
          transform="translate(320 995) rotate(-20) scale(.9)"
        />
        <use
          href="#leaf"
          transform="translate(1560 940) rotate(40) scale(2.2)"
        />
        <use
          href="#leaf"
          transform="translate(1430 940) rotate(-35) scale(1.25)"
        />
        <use
          href="#leaf"
          transform="translate(1280 990) rotate(20) scale(1.15)"
        />
      </g>
    </svg>
  );
}
export default function Entrance() {
  const [open, setOpen] = useState(() => {
      try {
        return !sessionStorage.getItem("huanbi-entered");
      } catch {
        return true;
      }
    }),
    [leaving, setLeaving] = useState(false);
  const button = useRef(null);
  const timer = useRef();
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const root = document.querySelector(".app");
    if (root) root.inert = true;
    button.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      if (root) root.inert = false;
      previous?.focus?.();
      clearTimeout(timer.current);
    };
  }, [open]);
  function enter() {
    if (leaving) return;
    setLeaving(true);
    try {
      sessionStorage.setItem("huanbi-entered", "1");
    } catch {}
    timer.current = setTimeout(
      () => {
        setOpen(false);
        setLeaving(false);
      },
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 850,
    );
  }
  return (
    <>
      {!open && (
        <button className="entrance-replay" onClick={() => setOpen(true)}>
          重览画卷 ↗
        </button>
      )}
      {open && (
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="entrance-title"
          className={"entrance " + (leaving ? "entrance-leaving" : "")}
          onKeyDown={(e) => {
            if (e.key === "Escape") enter();
            if (e.key === "Tab") {
              const all = e.currentTarget.querySelectorAll("button");
              const first = all[0],
                last = all[all.length - 1];
              if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
              }
            }
          }}
        >
          <div className="entrance-grain" />
          <Landscape />
          <div className="entrance-dust" aria-hidden="true">
            {Array.from({ length: 40 }, (_, i) => (
              <i
                key={i}
                style={{
                  left: ((i * 37) % 100) + "%",
                  top: ((i * 23) % 100) + "%",
                  animationDelay: -(i % 9) + "s",
                  animationDuration: 7 + (i % 5) + "s",
                }}
              />
            ))}
          </div>
          <div className="entrance-top">
            <a aria-hidden="true" tabIndex={-1}>
              焕 壁 <small>数字文保 · 千年再现</small>
            </a>
            <button onClick={enter}>跳过序章 ↗</button>
          </div>
          <div className="entrance-copy">
            <p>一 壁 千 年 · 一 眼 新 生</p>
            <h1 id="entrance-title">
              <span>壁</span>
              <span>上</span>
              <span>重</span>
              <span>生</span>
            </h1>
            <div className="entrance-english">
              A NEW CHAPTER FOR ANCIENT ART
            </div>
            <p className="entrance-description">拂去岁月的尘，重见丹青的光。</p>
            <button ref={button} className="entrance-enter" onClick={enter}>
              入 卷 <span>→</span>
            </button>
          </div>
          <div className="entrance-bottom">
            <span>以数字之笔，续千年丹青</span>
            <span>HUANBI / PROLOGUE 01</span>
          </div>
        </section>
      )}
    </>
  );
}
