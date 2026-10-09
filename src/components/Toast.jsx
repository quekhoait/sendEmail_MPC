import React from 'react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className={`toast ${toast.type || 'info'}`} role="status">
      <span>{toast.text}</span>
      {onClose && <button type="button" onClick={onClose} aria-label="Đóng">&times;</button>}
    </div>
  );
}
