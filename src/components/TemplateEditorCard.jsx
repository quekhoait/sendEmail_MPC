import React, { useRef, useState } from 'react';
import Tip from './Tip';
import RichTextEditor from './RichTextEditor';
import VariableMenu from './VariableMenu';
import { compileTemplate, cleanTemplateText } from '../utils/templateCompiler';
import { getRecipientName } from '../utils/recipients';

export default function TemplateEditorCard({
  subject, setSubject,
  body, setBody,
  cc, setCc,
  bcc, setBcc,
  showCc, setShowCc,
  showBcc, setShowBcc,
  fontFamily = "'Times New Roman', Times, serif",
  setFontFamily,
  headers,
  previewRecords,
  headersForName,
  senderDisplayName,
  templateName,
  onOpenTemplates,
  onSaveTemplate,
  lastFocusedInputRef,
  subjectRef,
  editorTab,
  setEditorTab,
}) {
  const [previewIdx, setPreviewIdx] = useState(0);
  const [lineSpacing, setLineSpacing] = useState('1.6');
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [ctx, setCtx] = useState(null); // { x, y, field } — chuột phải trên ô tiêu đề / CC / BCC

  const bodyEditorRef = useRef(null);
  const ccRef = useRef(null);
  const bccRef = useRef(null);

  const chipNames = headers.length ? headers : ['Họ và tên', 'email'];

  // Tự động làm sạch phần nội dung bị dán trùng lặp
  React.useEffect(() => {
    if (body) {
      const cleaned = cleanTemplateText(body);
      if (cleaned !== body) setBody(cleaned);
    }
  }, [body, setBody]);

  const fields = {
    subject: { ref: subjectRef, value: subject, set: setSubject },
    cc: { ref: ccRef, value: cc, set: setCc },
    bcc: { ref: bccRef, value: bcc, set: setBcc },
  };

  const insertIntoField = (name, tag) => {
    const f = fields[name];
    const el = f.ref.current;
    const start = el?.selectionStart ?? f.value.length;
    const end = el?.selectionEnd ?? start;
    f.set(f.value.slice(0, start) + tag + f.value.slice(end));
    setTimeout(() => { el?.focus(); if (el) el.selectionStart = el.selectionEnd = start + tag.length; }, 0);
  };

  // Chèn biến vào ô đang được focus gần nhất (tiêu đề, CC, BCC hoặc nội dung)
  const insertVar = (name) => {
    const tag = `{${name}}`;
    const target = lastFocusedInputRef?.current;
    if (fields[target]) insertIntoField(target, tag);
    else bodyEditorRef.current?.insertText(tag);
  };

  const fieldActions = (name) => {
    const el = fields[name].ref.current;
    return [
      { label: 'Cắt', hint: 'Ctrl+X', run: () => { el?.focus(); document.execCommand('cut'); } },
      { label: 'Sao chép', hint: 'Ctrl+C', run: () => { el?.focus(); document.execCommand('copy'); } },
      {
        label: 'Dán',
        hint: 'Ctrl+V',
        run: async () => {
          try {
            const text = await navigator.clipboard.readText();
            el?.focus();
            if (text) document.execCommand('insertText', false, text);
          } catch (_) { el?.focus(); }
        },
      },
    ];
  };

  const openFieldMenu = (name) => (e) => {
    e.preventDefault();
    if (lastFocusedInputRef) lastFocusedInputRef.current = name;
    fields[name].ref.current?.focus();
    setCtx({ x: e.clientX, y: e.clientY, field: name });
  };

  const submitSave = () => {
    const name = saveName.trim();
    if (!name) return;
    onSaveTemplate(name);
    setSaveOpen(false);
  };

  // Xem trước theo từng người nhận hợp lệ
  const total = previewRecords.length;
  const idx = total ? Math.min(previewIdx, total - 1) : 0;
  const rec = total ? previewRecords[idx] : {};
  const pvName = total ? getRecipientName(rec, headersForName) : '—';
  const pvEmail = rec.__email || '—';

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 className="h2">Nội dung thư</h2>
        <div className="seg seg-card" style={{ flex: 'none' }}>
          <button type="button" className={editorTab === 'edit' ? 'on' : ''} style={{ minHeight: 36 }} onClick={() => setEditorTab('edit')}>Soạn thảo</button>
          <button type="button" className={editorTab === 'preview' ? 'on' : ''} style={{ minHeight: 36 }} onClick={() => setEditorTab('preview')}>Xem trước</button>
        </div>
      </div>

      {editorTab === 'edit' ? (
        <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={onOpenTemplates}
              className="btn"
              style={{ flex: '1 1 220px', justifyContent: 'flex-start', background: 'var(--surface-2)', borderColor: 'var(--line-2)', fontWeight: 400, minWidth: 0 }}
            >
              <span className="faint" style={{ flex: 'none' }}>Mẫu thư</span>
              <span className="ellipsis" style={{ flex: 1, minWidth: 0, fontWeight: 600, textAlign: 'left' }}>{templateName}</span>
              <span style={{ color: 'var(--acc)', flex: 'none', fontWeight: 500 }}>Đổi mẫu</span>
            </button>
            <button type="button" className="btn" onClick={() => { setSaveName(templateName.startsWith('Mẫu ') ? '' : templateName); setSaveOpen(true); }}>
              Lưu thành mẫu
            </button>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="label">Tiêu đề</span>
            <input
              ref={subjectRef}
              className="field"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onFocus={() => { if (lastFocusedInputRef) lastFocusedInputRef.current = 'subject'; }}
              onContextMenu={openFieldMenu('subject')}
              placeholder="Ví dụ: Thông báo hồ sơ – {Họ và tên}"
            />
          </label>

          {(showCc || showBcc) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="label">CC</span>
                <input ref={ccRef} className="field" value={cc} onChange={(e) => setCc(e.target.value)} onFocus={() => { if (lastFocusedInputRef) lastFocusedInputRef.current = 'cc'; }} onContextMenu={openFieldMenu('cc')} placeholder="Ngăn cách bằng dấu phẩy, có thể chèn biến" />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="label">BCC</span>
                <input ref={bccRef} className="field" value={bcc} onChange={(e) => setBcc(e.target.value)} onFocus={() => { if (lastFocusedInputRef) lastFocusedInputRef.current = 'bcc'; }} onContextMenu={openFieldMenu('bcc')} placeholder="Ngăn cách bằng dấu phẩy, có thể chèn biến" />
              </label>
            </div>
          )}
          {!(showCc || showBcc) && (
            <button type="button" className="btn-link" style={{ alignSelf: 'flex-start' }} onClick={() => { setShowCc(true); setShowBcc(true); }}>
              + CC / BCC
            </button>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="label">Biến</span>
              <Tip side="left">Bấm để chèn vào vị trí con trỏ (tiêu đề, CC, BCC hoặc nội dung). Cũng có thể bấm chuột phải trong ô để chọn biến. Khi gửi, biến được thay bằng dữ liệu của từng người.</Tip>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {chipNames.map((h) => (
                <button key={h} type="button" className="var-chip" onMouseDown={(e) => { e.preventDefault(); insertVar(h); }}>
                  {`{${h}}`}
                </button>
              ))}
            </div>
          </div>

          <RichTextEditor
            ref={bodyEditorRef}
            value={body}
            onChange={setBody}
            fontFamily={fontFamily}
            onFontFamilyChange={setFontFamily}
            lineSpacing={lineSpacing}
            onLineSpacingChange={setLineSpacing}
            variables={chipNames}
            knownVars={headers}
            onFocusBody={() => { if (lastFocusedInputRef) lastFocusedInputRef.current = 'body'; }}
          />
        </section>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <span className="muted" style={{ fontSize: 13 }}>
              {total ? <>Thư gửi cho <b style={{ color: 'var(--text)' }}>{pvName}</b></> : 'Chưa có người nhận hợp lệ — hiển thị biến chưa thay.'}
            </span>
            {total > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button type="button" className="icon-btn icon-btn-bordered" onClick={() => setPreviewIdx((idx - 1 + total) % total)} aria-label="Người trước">‹</button>
                <span className="muted" style={{ fontSize: 13, minWidth: 48, textAlign: 'center' }}>{idx + 1}/{total}</span>
                <button type="button" className="icon-btn icon-btn-bordered" onClick={() => setPreviewIdx((idx + 1) % total)} aria-label="Người sau">›</button>
              </div>
            )}
          </div>

          <section className="paper">
            <div className="paper-head">
              <div><span className="k">Từ</span><b>{senderDisplayName || '—'}</b></div>
              <div><span className="k">Đến</span>{pvEmail}</div>
              {compileTemplate(cc, rec) && <div><span className="k">CC</span>{compileTemplate(cc, rec)}</div>}
              {compileTemplate(bcc, rec) && <div><span className="k">BCC</span>{compileTemplate(bcc, rec)}</div>}
              <div className="paper-subject">{compileTemplate(subject, rec) || '(Chưa có tiêu đề)'}</div>
            </div>
            <div
              className="email-preview-content"
              style={{ padding: 20, fontSize: 15, lineHeight: lineSpacing, fontFamily }}
              dangerouslySetInnerHTML={{ __html: compileTemplate(body, rec, true) }}
            />
          </section>
        </>
      )}

      {ctx && (
        <VariableMenu
          x={ctx.x}
          y={ctx.y}
          variables={chipNames}
          actions={fieldActions(ctx.field)}
          onPick={(v) => insertIntoField(ctx.field, `{${v}}`)}
          onClose={() => setCtx(null)}
        />
      )}

      {saveOpen && (
        <div className="overlay" onClick={() => setSaveOpen(false)}>
          <div className="modal" style={{ maxWidth: 420, padding: 20, gap: 14 }} onClick={(e) => e.stopPropagation()}>
            <b style={{ fontSize: 16 }}>Lưu thành mẫu</b>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="label">Tên mẫu</span>
              <input
                className="field"
                autoFocus
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitSave()}
                placeholder="vd. Thông báo học phí"
              />
            </label>
            <span className="faint" style={{ fontSize: 13 }}>Lưu tiêu đề và nội dung hiện tại. Nếu trùng tên, mẫu cũ sẽ được cập nhật.</span>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setSaveOpen(false)}>Huỷ</button>
              <button type="button" className="btn btn-primary" disabled={!saveName.trim()} onClick={submitSave}>Lưu mẫu</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
