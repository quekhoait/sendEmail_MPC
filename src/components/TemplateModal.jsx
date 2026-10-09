import React, { useEffect, useState } from 'react';

// Thư viện mẫu thư: mẫu của bạn (lưu trong trình duyệt) + mẫu có sẵn
export default function TemplateModal({ builtin, saved, currentName, onUse, onDelete, onClose }) {
  const [query, setQuery] = useState('');
  const all = [...saved, ...builtin];
  const [pickId, setPickId] = useState(() => (all.find((t) => t.name === currentName) || all[0])?.id);
  const picked = all.find((t) => t.id === pickId) || all[0];

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const match = (t) => !q || t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q);
  const groups = [
    { title: 'Mẫu của bạn', items: saved.filter(match) },
    { title: 'Mẫu có sẵn', items: builtin.filter(match) },
  ].filter((g) => g.items.length);
  const isSaved = picked && saved.some((t) => t.id === picked.id);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 900, height: 'min(640px, calc(100vh - 32px))' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <b style={{ flex: 1, fontSize: 16 }}>Mẫu thư</b>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng" style={{ fontSize: 22 }}>×</button>
        </div>

        <div className="flex flex-col md:flex-row" style={{ flex: 1, minHeight: 0 }}>
          <div className="md:w-[300px] md:border-r" style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', minHeight: 0, maxHeight: 220, borderColor: 'var(--line)', borderBottom: '1px solid var(--line)' }}>
            <div style={{ padding: 12 }}>
              <input className="field" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm mẫu thư" />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {groups.map((g) => (
                <React.Fragment key={g.title}>
                  <div className="faint" style={{ fontSize: 12, padding: '10px 10px 4px', textTransform: 'uppercase', letterSpacing: '.6px' }}>{g.title}</div>
                  {g.items.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPickId(t.id)}
                      style={{
                        display: 'flex', flexDirection: 'column', gap: 2, width: '100%', textAlign: 'left', padding: '10px 12px',
                        border: 0, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text)',
                        background: picked?.id === t.id ? 'var(--line)' : 'transparent',
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</span>
                      <span className="faint ellipsis" style={{ fontSize: 12, maxWidth: '100%' }}>{t.subject}</span>
                    </button>
                  ))}
                </React.Fragment>
              ))}
              {groups.length === 0 && <div className="faint" style={{ padding: '16px 12px', fontSize: 13 }}>Không tìm thấy mẫu phù hợp.</div>}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: 'var(--surface-2)' }}>
              {picked && (
                <div style={{ background: '#fbfaf7', color: '#1d1f24', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #e7e4dc', fontSize: 16, fontWeight: 700, lineHeight: 1.4 }}>{picked.subject}</div>
                  <div className="email-preview-content" style={{ padding: 18, font: "14px/1.65 'Be Vietnam Pro', sans-serif" }} dangerouslySetInnerHTML={{ __html: picked.body }} />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--line)' }}>
              {isSaved && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => { if (window.confirm(`Xoá mẫu “${picked.name}”?`)) onDelete(picked.id); }}
                >
                  Xoá mẫu
                </button>
              )}
              <span style={{ flex: 1 }} />
              <button type="button" className="btn btn-primary" disabled={!picked} onClick={() => onUse(picked)}>Dùng mẫu này</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
