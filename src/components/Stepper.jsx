import React from 'react';

const LABELS = ['Danh sách nhận', 'Nội dung thư', 'Kiểm tra & gửi'];

export default function Stepper({ step, onGo, locked = false }) {
  return (
    <div className="stepper">
      {LABELS.map((label, i) => {
        const n = i + 1;
        const state = n < step ? 'done' : n === step ? 'active' : '';
        return (
          <button
            key={label}
            type="button"
            className={`step ${state}`}
            disabled={locked}
            onClick={() => onGo(n)}
          >
            <span className="step-bar" />
            <span className="step-row">
              <span className="step-dot">{n < step ? '✓' : n}</span>
              <span className="step-label">{label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
