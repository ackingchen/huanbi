import { useState } from "react";
import { MoveHorizontal } from "lucide-react";
export function Comparison({ original, restored }) {
  const [position, setPosition] = useState(50);
  const [aspectRatio, setAspectRatio] = useState(1);
  const updatePosition = event => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPosition(Math.round(Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100))));
  };
  return (
    <div className="comparison-panel" style={{ "--image-ratio": aspectRatio }}>
      <div className="comparison" style={{ aspectRatio, height: "auto" }}>
        <img src={restored} alt="AI 生成的修复图" />
        <img
          className="comparison-original"
          onLoad={(event) => setAspectRatio(event.currentTarget.naturalWidth / event.currentTarget.naturalHeight)}
          src={original}
          alt="修复前原图"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        />
        <div className="comparison-line" style={{ left: position + "%" }}>
          <span aria-hidden="true"><MoveHorizontal size={16} strokeWidth={1.6} /></span>
        </div>
        <span className="before-label">原图</span>
        <span className="after-label">修复图</span>
        <div className="comparison-drag-surface" role="slider" tabIndex={0}
          aria-label="拖动画面对比线" aria-valuemin={0} aria-valuemax={100} aria-valuenow={position}
          aria-valuetext={"原图显示 " + position + "%"}
          onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.focus(); updatePosition(event); }}
          onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) updatePosition(event); }}
          onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
          onKeyDown={event => {
            const steps = { ArrowLeft: -2, ArrowRight: 2, ArrowDown: -2, ArrowUp: 2 };
            if (event.key in steps || event.key === "Home" || event.key === "End") {
              event.preventDefault();
              setPosition(p => event.key === "Home" ? 0 : event.key === "End" ? 100 : Math.max(0, Math.min(100, p + steps[event.key])));
            }
          }} />
      </div>
    </div>
  );
}
