import React, { useState } from 'react';

const LOGO = 'https://res.cloudinary.com/ds11ggie4/image/upload/v1791346257/events/speakers/61158a28d2cb4d05887f65175a7026bf.png';

function MenuItem({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn btn-ghost"
      style={{ width: '100%', justifyContent: 'flex-start', minHeight: 40, padding: '0 12px', border: 0, borderRadius: 8, fontWeight: 400 }}
    >
      {children}
    </button>
  );
}

export default function Header({ googleUser, hasSendScope, onLogin, onLogout, lastSavedTime, onClearDraft }) {
  const [menu, setMenu] = useState(false);
  const initial = (googleUser?.name || googleUser?.email || 'G').charAt(0).toUpperCase();

  return (
    <header className="topbar" onClick={() => menu && setMenu(false)}>
      <div className="app-container topbar-inner">
        <img src={LOGO} alt="" style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'contain' }} />
        <div className="ellipsis" style={{ fontWeight: 700, fontSize: 15, flex: 1, minWidth: 0 }}>Gửi Email Tự Động</div>

        {googleUser && lastSavedTime && (
          <div className="faint" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, whiteSpace: 'nowrap' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ok)' }} />
            <span>Đã lưu {lastSavedTime}</span>
          </div>
        )}

        {googleUser && !hasSendScope && (
          <button
            type="button"
            className="btn btn-sm"
            style={{ color: '#ffb37a', borderColor: '#3a2a1c' }}
            onClick={onLogin}
            title="Đăng nhập lại và tích chọn quyền gửi thư"
          >
            Cấp lại quyền
          </button>
        )}

        {googleUser && (
          <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setMenu((v) => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 4, border: '1px solid var(--line-2)', borderRadius: 999, background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', font: "13px 'Be Vietnam Pro', sans-serif" }}
            >
              {googleUser.picture ? (
                <img src={googleUser.picture} alt="" referrerPolicy="no-referrer" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--acc)', color: 'var(--acc-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{initial}</span>
              )}
              <span className="hidden md:inline ellipsis" style={{ paddingRight: 10, maxWidth: 190 }}>{googleUser.email}</span>
            </button>

            {menu && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', minWidth: 240, background: '#151b2c', border: '1px solid var(--line-3)', borderRadius: 12, padding: 6, boxShadow: '0 14px 40px rgba(0,0,0,.45)' }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--line-2)', marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }} className="ellipsis">{googleUser.name}</div>
                  <div className="muted ellipsis" style={{ fontSize: 13 }}>{googleUser.email}</div>
                </div>
                <MenuItem onClick={() => { setMenu(false); onLogin(); }}>Đổi tài khoản Google</MenuItem>
                {onClearDraft && <MenuItem onClick={() => { setMenu(false); onClearDraft(); }}>Xoá bản nháp</MenuItem>}
                <MenuItem onClick={() => { setMenu(false); onLogout(true); }}>Đăng xuất</MenuItem>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
