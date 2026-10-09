import React, {
  forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState,
} from 'react';
import VariableMenu from './VariableMenu';

export const FONT_FAMILIES = [
  { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Roboto', value: "'Roboto', sans-serif" },
  { label: 'Calibri', value: "Calibri, Candara, 'Segoe UI', Arial, sans-serif" },
  { label: 'Open Sans', value: "'Open Sans', sans-serif" },
  { label: 'Segoe UI', value: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier New', value: "'Courier New', Courier, monospace" },
];

const FONT_SIZES = [10, 11, 12, 13, 14, 15, 16, 18, 20, 24, 28, 32];

const PALETTE = [
  '#000000', '#434343', '#666666', '#999999', '#cccccc', '#ffffff',
  '#d93025', '#e8710a', '#f9ab00', '#188038', '#1a73e8', '#9334e6',
  '#f28b82', '#fbbc04', '#fff475', '#ccff90', '#a7ffeb', '#aecbfa',
  '#fad2cf', '#fde293', '#fef7c8', '#ceead6', '#d2e3fc', '#e8d5fb',
];

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const normalizeUrl = (raw) => {
  const url = raw.trim();
  if (!url) return '';
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url)) return `mailto:${url}`;
  return `https://${url}`;
};

/* ---------- Icon set (SVG, 18px) ---------- */
const Ic = ({ d, children }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d ? <path d={d} /> : children}
  </svg>
);
const ICONS = {
  undo: <Ic><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></Ic>,
  redo: <Ic><path d="m15 14 5-5-5-5" /><path d="M20 9H10a6 6 0 0 0 0 12h3" /></Ic>,
  bold: <Ic><path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z" /></Ic>,
  italic: <Ic><path d="M19 4h-9M14 20H5M15 4 9 20" /></Ic>,
  underline: <Ic><path d="M7 4v7a5 5 0 0 0 10 0V4M5 21h14" /></Ic>,
  strike: <Ic><path d="M16 6.5C15 5.3 13.7 5 12 5c-2.4 0-4 1.1-4 3s1.6 2.5 4 3M8 17.5C9 18.7 10.3 19 12 19c2.5 0 4-1.2 4-3.2 0-1.3-.7-2.1-2-2.8M4 12h16" /></Ic>,
  left: <Ic><path d="M4 6h16M4 10h10M4 14h16M4 18h10" /></Ic>,
  center: <Ic><path d="M4 6h16M7 10h10M4 14h16M7 18h10" /></Ic>,
  right: <Ic><path d="M4 6h16M10 10h10M4 14h16M10 18h10" /></Ic>,
  justify: <Ic><path d="M4 6h16M4 10h16M4 14h16M4 18h16" /></Ic>,
  ol: <Ic><path d="M10 6h10M10 12h10M10 18h10M4 5l1.5-1v4M4 14h3l-3 3h3" /></Ic>,
  ul: <Ic><path d="M10 6h10M10 12h10M10 18h10" /><circle cx="5" cy="6" r="1" fill="currentColor" /><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="5" cy="18" r="1" fill="currentColor" /></Ic>,
  outdent: <Ic><path d="M11 6h9M11 12h9M11 18h9M7 9l-3 3 3 3" /></Ic>,
  indent: <Ic><path d="M11 6h9M11 12h9M11 18h9M4 9l3 3-3 3" /></Ic>,
  quote: <Ic><path d="M7 7h4v5a4 4 0 0 1-4 4M15 7h4v5a4 4 0 0 1-4 4" /></Ic>,
  link: <Ic><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></Ic>,
  unlink: <Ic><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1M4 4l16 16" /></Ic>,
  hr: <Ic><path d="M4 12h16M8 7h8M8 17h8" /></Ic>,
  clear: <Ic><path d="M6 5h12M12 5v5M9 19l3-9 3 9M5 19h14M4 4l16 16" /></Ic>,
  code: <Ic><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13 6l-2 12" /></Ic>,
  braces: <Ic><path d="M8 4C6 4 6 6 6 8s0 3-2 4c2 1 2 2 2 4s0 4 2 4M16 4c2 0 2 2 2 4s0 3 2 4c-2 1-2 2-2 4s0 4-2 4" /></Ic>,
};

function Btn({ icon, title, active, onClick, disabled, children, style }) {
  return (
    <button
      type="button"
      className={`tool-btn ${active ? 'on' : ''}`}
      title={title}
      aria-label={title}
      aria-pressed={active ? true : undefined}
      disabled={disabled}
      style={style}
      onMouseDown={(e) => { e.preventDefault(); if (!disabled) onClick?.(e); }}
    >
      {icon ? ICONS[icon] : null}
      {children}
    </button>
  );
}

function ColorPopover({ title, current, onPick, allowClear, clearLabel }) {
  return (
    <div className="popover color-pop" onMouseDown={(e) => e.preventDefault()}>
      <div className="color-title">{title}</div>
      <div className="color-grid">
        {PALETTE.map((c) => (
          <button key={c} type="button" className="swatch" title={c} style={{ background: c, outline: current === c ? '2px solid var(--acc)' : 'none' }} onMouseDown={(e) => { e.preventDefault(); onPick(c); }} />
        ))}
      </div>
      <div className="color-foot">
        <label className="color-custom" title="Chọn màu tuỳ ý">
          <input type="color" defaultValue="#f5822a" onChange={(e) => onPick(e.target.value)} />
          <span>Màu khác…</span>
        </label>
        {allowClear && (
          <button type="button" className="btn-link" style={{ fontSize: 13 }} onMouseDown={(e) => { e.preventDefault(); onPick(null); }}>{clearLabel}</button>
        )}
      </div>
    </div>
  );
}

const RichTextEditor = forwardRef(function RichTextEditor({
  value,
  onChange,
  fontFamily,
  onFontFamilyChange,
  lineSpacing,
  onLineSpacingChange,
  variables,
  knownVars,
  onFocusBody,
}, ref) {
  const editorRef = useRef(null);
  const textareaRef = useRef(null);
  const savedRangeRef = useRef(null);
  const [htmlMode, setHtmlMode] = useState(false);
  const [popover, setPopover] = useState(null); // 'color' | 'highlight' | null
  const [active, setActive] = useState({});
  const [block, setBlock] = useState('p');
  const [size, setSize] = useState('14');
  const [lastColor, setLastColor] = useState('#f5822a');
  const [lastHighlight, setLastHighlight] = useState('#fef08a');
  const [ctx, setCtx] = useState(null);
  const [link, setLink] = useState(null); // { url, text, hadAnchor }

  /* ----- Đồng bộ nội dung từ ngoài vào editor ----- */
  useEffect(() => {
    const el = editorRef.current;
    if (el && !htmlMode && el.innerHTML !== value) el.innerHTML = value;
  }, [value, htmlMode]);

  /* ----- Tô sáng biến {…} bằng CSS Custom Highlight API (không đổi HTML thật) ----- */
  const paintVars = useCallback(() => {
    if (typeof CSS === 'undefined' || !CSS.highlights || typeof Highlight === 'undefined') return;
    const el = editorRef.current;
    if (!el || htmlMode) {
      CSS.highlights.delete('var-ok');
      CSS.highlights.delete('var-bad');
      return;
    }
    const known = new Set((knownVars || []).map((v) => v.trim().toLowerCase()));
    const ok = [];
    const bad = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const re = /\{([^{}]+)\}/g;
      let m;
      while ((m = re.exec(node.nodeValue))) {
        const r = new Range();
        r.setStart(node, m.index);
        r.setEnd(node, m.index + m[0].length);
        (known.size === 0 || known.has(m[1].trim().toLowerCase()) ? ok : bad).push(r);
      }
    }
    CSS.highlights.set('var-ok', new Highlight(...ok));
    CSS.highlights.set('var-bad', new Highlight(...bad));
  }, [knownVars, htmlMode]);

  useEffect(() => { paintVars(); }, [paintVars, value]);
  useEffect(() => () => {
    if (typeof CSS !== 'undefined' && CSS.highlights) {
      CSS.highlights.delete('var-ok');
      CSS.highlights.delete('var-bad');
    }
  }, []);

  /* ----- Selection helpers ----- */
  const insideEditor = (node) => !!node && editorRef.current?.contains(node);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && insideEditor(sel.anchorNode)) savedRangeRef.current = sel.getRangeAt(0).cloneRange();
  };
  const restoreSelection = () => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };
  const commit = () => {
    const el = editorRef.current;
    if (el) onChange(el.innerHTML);
    saveSelection();
  };

  /* ----- Trạng thái nút theo vị trí con trỏ ----- */
  useEffect(() => {
    const update = () => {
      const sel = window.getSelection();
      if (!sel || !sel.anchorNode || !insideEditor(sel.anchorNode)) return;
      saveSelection();
      const q = (c) => { try { return document.queryCommandState(c); } catch (_) { return false; } };
      setActive({
        bold: q('bold'), italic: q('italic'), underline: q('underline'), strike: q('strikeThrough'),
        ul: q('insertUnorderedList'), ol: q('insertOrderedList'),
        left: q('justifyLeft'), center: q('justifyCenter'), right: q('justifyRight'), justify: q('justifyFull'),
      });
      try {
        const b = String(document.queryCommandValue('formatBlock') || 'p').toLowerCase().replace(/[<>]/g, '');
        setBlock(['h1', 'h2', 'h3', 'blockquote'].includes(b) ? b : 'p');
      } catch (_) { /* ignore */ }
      const elNode = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement;
      if (elNode) {
        const px = Math.round(parseFloat(getComputedStyle(elNode).fontSize));
        if (px) setSize(String(px));
      }
    };
    document.addEventListener('selectionchange', update);
    return () => document.removeEventListener('selectionchange', update);
  }, []);

  /* ----- Lệnh định dạng ----- */
  const exec = (cmd, val = null) => {
    if (htmlMode) return;
    restoreSelection();
    document.execCommand('styleWithCSS', false, true);
    document.execCommand(cmd, false, val);
    commit();
  };

  const applyFontSize = (px) => {
    setSize(String(px));
    if (htmlMode) return;
    restoreSelection();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const span = document.createElement('span');
      span.style.fontSize = `${px}px`;
      const range = sel.getRangeAt(0);
      span.appendChild(range.extractContents());
      range.insertNode(span);
      sel.removeAllRanges();
      const r = document.createRange();
      r.selectNodeContents(span);
      sel.addRange(r);
      commit();
    }
  };

  const applyFontFamily = (font) => {
    onFontFamilyChange?.(font);
    if (htmlMode) return;
    restoreSelection();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      document.execCommand('fontName', false, font);
      commit();
    }
  };

  const pickColor = (kind, color) => {
    setPopover(null);
    if (kind === 'color') {
      if (color) { setLastColor(color); exec('foreColor', color); }
    } else if (color) {
      setLastHighlight(color);
      exec('hiliteColor', color);
    } else {
      exec('hiliteColor', 'transparent');
    }
  };

  const insertText = useCallback((text) => {
    if (htmlMode && textareaRef.current) {
      const el = textareaRef.current;
      const start = el.selectionStart ?? value.length;
      const end = el.selectionEnd ?? start;
      onChange(value.slice(0, start) + text + value.slice(end));
      setTimeout(() => { el.focus(); el.selectionStart = el.selectionEnd = start + text.length; }, 0);
      return;
    }
    const el = editorRef.current;
    if (!el) return;
    restoreSelection();
    if (!document.execCommand('insertText', false, text)) {
      el.appendChild(document.createTextNode(text));
    }
    commit();
  }, [htmlMode, value]);

  useImperativeHandle(ref, () => ({ insertText, focus: () => (htmlMode ? textareaRef.current : editorRef.current)?.focus() }), [insertText, htmlMode]);

  /* ----- Liên kết ----- */
  const openLinkDialog = () => {
    if (htmlMode) return;
    restoreSelection();
    const sel = window.getSelection();
    let anchor = null;
    if (sel && sel.anchorNode) {
      let n = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement;
      while (n && n !== editorRef.current) {
        if (n.tagName === 'A') { anchor = n; break; }
        n = n.parentElement;
      }
    }
    if (anchor) {
      const r = document.createRange();
      r.selectNodeContents(anchor);
      sel.removeAllRanges();
      sel.addRange(r);
      saveSelection();
    }
    setLink({
      url: anchor ? anchor.getAttribute('href') || '' : '',
      text: anchor ? anchor.textContent : (sel?.toString() || ''),
      hadAnchor: !!anchor,
    });
  };

  const applyLink = () => {
    const url = normalizeUrl(link.url);
    if (!url) return;
    restoreSelection();
    const label = link.text.trim() || url;
    document.execCommand('insertHTML', false, `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`);
    commit();
    setLink(null);
  };

  const removeLink = () => {
    restoreSelection();
    document.execCommand('unlink');
    commit();
    setLink(null);
  };

  /* ----- Chuột phải ----- */
  const onContextMenu = (e) => {
    e.preventDefault();
    saveSelection();
    setPopover(null);
    setCtx({ x: e.clientX, y: e.clientY });
  };

  const pasteText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) { restoreSelection(); document.execCommand('insertText', false, text); commit(); }
    } catch (_) {
      restoreSelection();
    }
  };

  const ctxActions = htmlMode ? [] : [
    { label: 'Cắt', hint: 'Ctrl+X', run: () => { restoreSelection(); document.execCommand('cut'); commit(); } },
    { label: 'Sao chép', hint: 'Ctrl+C', run: () => { restoreSelection(); document.execCommand('copy'); } },
    { label: 'Dán', hint: 'Ctrl+V', run: pasteText },
    { label: 'Chèn / sửa liên kết…', hint: 'Ctrl+K', run: openLinkDialog },
  ];

  const onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openLinkDialog();
    }
  };

  /* Dán: giữ định dạng cơ bản, bỏ style rác của Word/Excel */
  const onPaste = (e) => {
    const html = e.clipboardData?.getData('text/html');
    const text = e.clipboardData?.getData('text/plain');
    if (!html && !text) return;
    e.preventDefault();
    if (e.shiftKey || !html) {
      document.execCommand('insertText', false, text || '');
    } else {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.querySelectorAll('style, script, meta, link, o\\:p').forEach((n) => n.remove());
      doc.querySelectorAll('*').forEach((n) => {
        n.removeAttribute('class');
        n.removeAttribute('id');
        const st = n.getAttribute('style');
        if (st) {
          const keep = st.split(';').filter((r) => /^\s*(color|background-color|font-weight|font-style|text-decoration|text-align)\s*:/i.test(r)).join(';');
          keep ? n.setAttribute('style', keep) : n.removeAttribute('style');
        }
      });
      document.execCommand('insertHTML', false, doc.body.innerHTML);
    }
    commit();
  };

  return (
    <div className="editor-shell">
      <div className="editor-toolbar" role="toolbar" aria-label="Định dạng thư">
        <Btn icon="undo" title="Hoàn tác (Ctrl+Z)" onClick={() => exec('undo')} disabled={htmlMode} />
        <Btn icon="redo" title="Làm lại (Ctrl+Y)" onClick={() => exec('redo')} disabled={htmlMode} />
        <span className="tool-sep" />

        <select className="tool-select" style={{ width: 138 }} value={FONT_FAMILIES.some((f) => f.value === fontFamily) ? fontFamily : ''} onChange={(e) => applyFontFamily(e.target.value)} title="Phông chữ">
          {FONT_FAMILIES.map((f) => <option key={f.label} value={f.value}>{f.label}</option>)}
        </select>
        <select className="tool-select" style={{ width: 66 }} value={FONT_SIZES.includes(Number(size)) ? size : ''} onChange={(e) => applyFontSize(Number(e.target.value))} title="Cỡ chữ">
          {!FONT_SIZES.includes(Number(size)) && <option value="">{size}</option>}
          {FONT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="tool-select" style={{ width: 112 }} value={block} onChange={(e) => exec('formatBlock', `<${e.target.value}>`)} title="Kiểu đoạn">
          <option value="p">Văn bản</option>
          <option value="h1">Tiêu đề 1</option>
          <option value="h2">Tiêu đề 2</option>
          <option value="h3">Tiêu đề 3</option>
          <option value="blockquote">Trích dẫn</option>
        </select>
        <span className="tool-sep" />

        <Btn icon="bold" title="In đậm (Ctrl+B)" active={active.bold} onClick={() => exec('bold')} disabled={htmlMode} />
        <Btn icon="italic" title="In nghiêng (Ctrl+I)" active={active.italic} onClick={() => exec('italic')} disabled={htmlMode} />
        <Btn icon="underline" title="Gạch chân (Ctrl+U)" active={active.underline} onClick={() => exec('underline')} disabled={htmlMode} />
        <Btn icon="strike" title="Gạch ngang" active={active.strike} onClick={() => exec('strikeThrough')} disabled={htmlMode} />

        <div className="tool-wrap">
          <Btn title="Màu chữ" disabled={htmlMode} onClick={() => { saveSelection(); setPopover(popover === 'color' ? null : 'color'); }}>
            <span className="tool-letter" style={{ borderBottomColor: lastColor }}>A</span>
          </Btn>
          {popover === 'color' && <ColorPopover title="Màu chữ" current={lastColor} onPick={(c) => pickColor('color', c)} />}
        </div>
        <div className="tool-wrap">
          <Btn title="Màu nền chữ (tô sáng)" disabled={htmlMode} onClick={() => { saveSelection(); setPopover(popover === 'highlight' ? null : 'highlight'); }}>
            <span className="tool-letter hl" style={{ background: lastHighlight }}>A</span>
          </Btn>
          {popover === 'highlight' && <ColorPopover title="Tô sáng" current={lastHighlight} allowClear clearLabel="Bỏ tô sáng" onPick={(c) => pickColor('highlight', c)} />}
        </div>
        <span className="tool-sep" />

        <Btn icon="left" title="Căn trái" active={active.left} onClick={() => exec('justifyLeft')} disabled={htmlMode} />
        <Btn icon="center" title="Căn giữa" active={active.center} onClick={() => exec('justifyCenter')} disabled={htmlMode} />
        <Btn icon="right" title="Căn phải" active={active.right} onClick={() => exec('justifyRight')} disabled={htmlMode} />
        <Btn icon="justify" title="Căn đều" active={active.justify} onClick={() => exec('justifyFull')} disabled={htmlMode} />
        <span className="tool-sep" />

        <Btn icon="ol" title="Danh sách đánh số" active={active.ol} onClick={() => exec('insertOrderedList')} disabled={htmlMode} />
        <Btn icon="ul" title="Danh sách chấm" active={active.ul} onClick={() => exec('insertUnorderedList')} disabled={htmlMode} />
        <Btn icon="outdent" title="Giảm thụt lề" onClick={() => exec('outdent')} disabled={htmlMode} />
        <Btn icon="indent" title="Tăng thụt lề" onClick={() => exec('indent')} disabled={htmlMode} />
        <span className="tool-sep" />

        <div className="tool-wrap">
          <Btn icon="link" title="Chèn / sửa liên kết (Ctrl+K)" onClick={openLinkDialog} disabled={htmlMode} />
          {link && (
            <div className="popover link-pop" onMouseDown={(e) => e.stopPropagation()}>
              <label className="label">Văn bản hiển thị</label>
              <input className="field field-sm" value={link.text} onChange={(e) => setLink({ ...link, text: e.target.value })} placeholder="vd. Bấm vào đây" />
              <label className="label">Địa chỉ liên kết</label>
              <input
                className="field field-sm"
                autoFocus
                value={link.url}
                onChange={(e) => setLink({ ...link, url: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyLink(); } if (e.key === 'Escape') setLink(null); }}
                placeholder="https://… hoặc email"
              />
              <div className="link-actions">
                {link.hadAnchor && <button type="button" className="btn btn-sm btn-danger" onClick={removeLink}>Gỡ liên kết</button>}
                <span style={{ flex: 1 }} />
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setLink(null)}>Huỷ</button>
                <button type="button" className="btn btn-sm btn-primary" disabled={!link.url.trim()} onClick={applyLink}>Áp dụng</button>
              </div>
            </div>
          )}
        </div>
        <Btn icon="unlink" title="Gỡ liên kết" onClick={() => exec('unlink')} disabled={htmlMode} />
        <Btn icon="hr" title="Đường kẻ ngang" onClick={() => exec('insertHorizontalRule')} disabled={htmlMode} />
        <Btn icon="clear" title="Xoá định dạng" onClick={() => exec('removeFormat')} disabled={htmlMode} />
        <span className="tool-sep" />

        <select className="tool-select" style={{ width: 92 }} value={lineSpacing} onChange={(e) => onLineSpacingChange(e.target.value)} title="Giãn dòng">
          {['1.2', '1.4', '1.6', '1.8', '2.0'].map((v) => <option key={v} value={v}>Dòng {v}×</option>)}
        </select>
        <Btn icon="code" title="Xem / sửa mã HTML" active={htmlMode} onClick={() => { setPopover(null); setLink(null); setHtmlMode((v) => !v); }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>HTML</span>
        </Btn>
      </div>

      {htmlMode ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocusBody}
          onContextMenu={onContextMenu}
          spellCheck={false}
          className="textarea html-source"
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck
          onFocus={() => { onFocusBody?.(); setPopover(null); }}
          onInput={() => { commit(); paintVars(); }}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          onBlur={saveSelection}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onContextMenu={onContextMenu}
          className="rich-editor-content"
          style={{ minHeight: 300, padding: '18px 20px', fontSize: 14, lineHeight: lineSpacing, fontFamily, color: 'var(--text)', outline: 'none' }}
        />
      )}

      <div className="editor-foot">
        <span>Gõ <code>{'{tên cột}'}</code> hoặc <b>chuột phải</b> để chèn biến</span>
        <span className="editor-legend"><i className="dot ok" /> biến hợp lệ <i className="dot bad" /> chưa có trong dữ liệu</span>
      </div>

      {ctx && (
        <VariableMenu
          x={ctx.x}
          y={ctx.y}
          variables={variables}
          actions={ctxActions}
          onPick={(v) => insertText(`{${v}}`)}
          onClose={() => setCtx(null)}
        />
      )}
    </div>
  );
});

export default RichTextEditor;
