import React, { useState } from 'react';

// Dấu "?" hiện chú thích khi rê chuột hoặc chạm (mobile)
export default function Tip({ children, side = 'right', accent = false }) {
  const [open, setOpen] = useState(false);
  const pos = side === 'top-right'
    ? { bottom: 'calc(100% + 6px)', right: 0 }
    : side === 'left'
      ? { top: 'calc(100% + 6px)', left: -40 }
      : { top: 'calc(100% + 6px)', right: 0 };

  return (
    <span
      className="tip-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
    >
      <span className={`tip-q ${accent ? 'acc' : ''}`}>?</span>
      {open && <span className="tip-box" style={pos}>{children}</span>}
    </span>
  );
}
