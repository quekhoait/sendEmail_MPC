import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

// Menu chuột phải: chèn biến + (tuỳ chọn) các thao tác soạn thảo cơ bản
export default function VariableMenu({ x, y, variables, actions = [], onPick, onClose }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setPos({
      left: Math.max(8, Math.min(x, window.innerWidth - width - 8)),
      top: Math.max(8, Math.min(y, window.innerHeight - height - 8)),
    });
  }, [x, y]);

  useEffect(() => {
    const close = () => onClose();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('mousedown', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const stop = (e) => { e.stopPropagation(); e.preventDefault(); };

  return (
    <div
      ref={ref}
      className="ctx-menu"
      style={{ left: pos.left, top: pos.top }}
      onMouseDown={stop}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="ctx-title">Chèn biến</div>
      <div className="ctx-vars">
        {variables.map((v) => (
          <button key={v} type="button" className="ctx-item mono" onClick={() => { onPick(v); onClose(); }}>
            {`{${v}}`}
          </button>
        ))}
      </div>
      {actions.length > 0 && <div className="ctx-sep" />}
      {actions.map((a) => (
        <button key={a.label} type="button" className="ctx-item" onClick={() => { a.run(); onClose(); }}>
          <span>{a.label}</span>
          {a.hint && <span className="ctx-hint">{a.hint}</span>}
        </button>
      ))}
    </div>
  );
}
