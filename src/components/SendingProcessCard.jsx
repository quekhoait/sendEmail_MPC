import React, { useEffect, useState } from 'react';
import Tip from './Tip';
import { compileTemplate } from '../utils/templateCompiler';
import { getRecipientName } from '../utils/recipients';

const pad = (n) => String(n).padStart(2, '0');
const toLocalInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

function PreviewModal({ list, index, setIndex, onClose, subject, body, cc, senderName, fontFamily, headers }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const rec = list[index] || {};
  const n = list.length;
  const ccText = compileTemplate(cc, rec);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 680, maxHeight: 'calc(100vh - 32px)' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <b className="ellipsis" style={{ flex: 1, fontSize: 15, minWidth: 0 }}>{getRecipientName(rec, headers)}</b>
          <button type="button" className="icon-btn icon-btn-bordered" style={{ width: 38, height: 38 }} onClick={() => setIndex((index - 1 + n) % n)}>‹</button>
          <span className="muted" style={{ fontSize: 13, minWidth: 40, textAlign: 'center' }}>{index + 1}/{n}</span>
          <button type="button" className="icon-btn icon-btn-bordered" style={{ width: 38, height: 38 }} onClick={() => setIndex((index + 1) % n)}>›</button>
          <button type="button" className="icon-btn" style={{ width: 38, height: 38, fontSize: 22 }} onClick={onClose} aria-label="Đóng">×</button>
        </div>
        <div style={{ overflowY: 'auto', background: '#fbfaf7', color: '#1d1f24' }}>
          <div className="paper-head">
            <div><span className="k">Từ</span><b>{senderName || '—'}</b></div>
            <div><span className="k">Đến</span>{rec.__email || '—'}</div>
            {ccText && <div><span className="k">CC</span>{ccText}</div>}
            <div className="paper-subject">{compileTemplate(subject, rec)}</div>
          </div>
          <div
            className="email-preview-content"
            style={{ padding: 20, fontSize: 15, lineHeight: 1.6, fontFamily }}
            dangerouslySetInnerHTML={{ __html: compileTemplate(body, rec, true) }}
          />
        </div>
      </div>
    </div>
  );
}

function NumberField({ value, onChange, min, max, step, disabled, width = 70 }) {
  return (
    <input
      type="number"
      className="field field-sm"
      style={{ width, minHeight: 36 }}
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={onChange}
    />
  );
}

export default function SendingProcessCard({
  isSending, isPaused, sendLogs,
  validIndexes, records, headers, previewRecords,
  subject, body, cc, fontFamily,
  senderDisplayName, setSenderDisplayName,
  scheduleEnabled, setScheduleEnabled,
  scheduledDateTime, setScheduledDateTime,
  isScheduleWaiting, countdownText, onCancelSchedule, onSendNowFromSchedule,
  delaySec, setDelaySec,
  useRandomDelay, setUseRandomDelay,
  randomDelayRange, setRandomDelayRange,
  batchPauseEnabled, setBatchPauseEnabled,
  batchSize, setBatchSize,
  batchPauseSec, setBatchPauseSec,
  onExportExcel,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [viewIdx, setViewIdx] = useState(null);

  const logById = new Map(sendLogs.map((l) => [l.id, l]));
  const total = validIndexes.length;
  const doneCount = sendLogs.filter((l) => l.status === 'success').length;
  const failCount = sendLogs.filter((l) => l.status === 'failed').length;
  const processed = doneCount + failCount;
  const pct = total ? Math.min(100, (processed / total) * 100) : 0;
  const finished = !isSending && sendLogs.length > 0;
  const locked = isSending || isScheduleWaiting;

  const setQuick = (minutes) => {
    setScheduledDateTime(toLocalInput(new Date(Date.now() + minutes * 60000)));
  };
  const setTomorrow8 = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(8, 0, 0, 0);
    setScheduledDateTime(toLocalInput(d));
  };

  const listTitle = isSending
    ? (isPaused ? 'Đang tạm dừng' : 'Đang gửi…')
    : isScheduleWaiting ? 'Đã lên lịch gửi' : finished ? 'Kết quả gửi' : 'Danh sách gửi';

  const statusOf = (rowIdx) => {
    const log = logById.get(rowIdx + 1);
    if (log?.status === 'success') return { text: 'Đã gửi', cls: 'pill-ok' };
    if (log?.status === 'failed') return { text: 'Lỗi', cls: 'pill-err' };
    if (log?.status === 'sending') return { text: 'Đang gửi', cls: 'pill-acc' };
    if (isScheduleWaiting) return { text: 'Đã lên lịch', cls: 'pill-acc' };
    return { text: 'Chờ gửi', cls: '' };
  };

  return (
    <>
      <h2 className="h2">Kiểm tra và gửi</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))', gap: 16, alignItems: 'start' }}>
        <section className="card" style={{ padding: '6px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderBottom: '1px solid #1a2132', fontSize: 14 }}>
            <span className="muted" style={{ flex: 'none' }}>Tiêu đề</span>
            <span style={{ textAlign: 'right', minWidth: 0, wordBreak: 'break-word' }}>{subject || '—'}</span>
          </div>
          <label style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px 12px', padding: '10px 0', fontSize: 14 }}>
            <span className="muted">Tên người gửi</span>
            <input
              className="field"
              style={{ flex: '1 1 180px', maxWidth: 280, minHeight: 42, textAlign: 'right' }}
              value={senderDisplayName}
              disabled={isSending}
              onChange={(e) => setSenderDisplayName(e.target.value)}
            />
          </label>
        </section>

        <section className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
            {[['Gửi ngay', false], ['Hẹn giờ', true]].map(([label, val]) => {
              const on = scheduleEnabled === val;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={locked}
                  onClick={() => setScheduleEnabled(val)}
                  style={{
                    minHeight: 48, padding: '8px 12px', borderRadius: 12, cursor: locked ? 'not-allowed' : 'pointer',
                    font: "600 14px 'Be Vietnam Pro', sans-serif", color: 'var(--text)',
                    background: on ? 'rgba(245,130,42,.08)' : 'var(--surface-2)',
                    border: `1.5px solid ${on ? 'var(--acc)' : 'var(--line-2)'}`,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {scheduleEnabled && !isScheduleWaiting && (
            <>
              <input type="datetime-local" className="field" value={scheduledDateTime} onChange={(e) => setScheduledDateTime(e.target.value)} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[['+15 phút', () => setQuick(15)], ['+30 phút', () => setQuick(30)], ['+1 giờ', () => setQuick(60)], ['08:00 sáng mai', setTomorrow8]].map(([l, fn]) => (
                  <button key={l} type="button" className="btn btn-sm" onClick={fn}>{l}</button>
                ))}
              </div>
              <span className="faint" style={{ fontSize: 12 }}>Hãy giữ tab trình duyệt mở — thư sẽ tự gửi khi đến giờ hẹn.</span>
            </>
          )}

          {isScheduleWaiting && (
            <div style={{ background: 'var(--acc-soft)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, color: '#ffb37a' }}>
                Sẽ tự động gửi lúc {new Date(scheduledDateTime).toLocaleString('vi-VN')}
              </div>
              <div className="countdown">{countdownText || '--:--:--'}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-sm" onClick={onSendNowFromSchedule}>Gửi ngay</button>
                <button type="button" className="btn btn-sm btn-ghost" onClick={onCancelSchedule}>Huỷ lịch</button>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="card" style={{ padding: '12px 16px' }}>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: 'none', border: 0, color: 'var(--text)', cursor: 'pointer', font: "600 14px 'Be Vietnam Pro', sans-serif", padding: 0, minHeight: 32 }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Tốc độ gửi
            <Tip side="left">Giãn cách giữa các email giúp tránh bị Gmail đánh dấu spam. Nên bật tạm nghỉ theo đợt khi gửi trên 50 email.</Tip>
          </span>
          <span className="faint" style={{ fontSize: 13, fontWeight: 400 }}>
            {useRandomDelay ? `ngẫu nhiên ${randomDelayRange.min}–${randomDelayRange.max}s` : `${delaySec}s / email`}{batchPauseEnabled ? ` · nghỉ ${batchPauseSec}s mỗi ${batchSize} thư` : ''} {showAdvanced ? '▴' : '▾'}
          </span>
        </button>

        {showAdvanced && (
          <div className="animate-fade-in" style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
              <span className="label">Giãn cách giữa các thư</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <input type="radio" name="delayType" checked={!useRandomDelay} disabled={isSending} onChange={() => setUseRandomDelay(false)} />
                Cố định
                <NumberField min="0.5" max="10" step="0.5" value={delaySec} disabled={useRandomDelay || isSending} onChange={(e) => setDelaySec(parseFloat(e.target.value) || 1.5)} />
                giây
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <input type="radio" name="delayType" checked={useRandomDelay} disabled={isSending} onChange={() => setUseRandomDelay(true)} />
                Ngẫu nhiên
                <NumberField min="1" max="10" step="0.5" width={64} value={randomDelayRange.min} disabled={!useRandomDelay || isSending} onChange={(e) => setRandomDelayRange((p) => ({ ...p, min: parseFloat(e.target.value) || 1.5 }))} />
                –
                <NumberField min="1" max="20" step="0.5" width={64} value={randomDelayRange.max} disabled={!useRandomDelay || isSending} onChange={(e) => setRandomDelayRange((p) => ({ ...p, max: parseFloat(e.target.value) || 3.5 }))} />
                giây
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={batchPauseEnabled} disabled={isSending} onChange={(e) => setBatchPauseEnabled(e.target.checked)} />
                <span className="label" style={{ color: 'var(--text)' }}>Tạm nghỉ theo đợt</span>
              </label>
              {batchPauseEnabled && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  Sau mỗi
                  <NumberField min="5" max="200" step="5" width={64} value={batchSize} disabled={isSending} onChange={(e) => setBatchSize(parseInt(e.target.value) || 20)} />
                  thư, nghỉ
                  <NumberField min="10" max="600" step="10" width={64} value={batchPauseSec} disabled={isSending} onChange={(e) => setBatchPauseSec(parseInt(e.target.value) || 30)} />
                  giây
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <b style={{ fontSize: 15 }}>{listTitle}</b>
            <div style={{ display: 'flex', gap: 14, fontSize: 13, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="muted">{doneCount}/{total} đã gửi</span>
              {failCount > 0 && <span style={{ color: 'var(--err)' }}>{failCount} lỗi</span>}
              {sendLogs.length > 0 && <button type="button" className="btn btn-sm" onClick={onExportExcel}>Xuất Excel</button>}
            </div>
          </div>
          <div className="progress"><div style={{ width: `${pct}%` }} /></div>
        </div>

        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          {validIndexes.map((rowIdx, pos) => {
            const row = records[rowIdx];
            const st = statusOf(rowIdx);
            const log = logById.get(rowIdx + 1);
            return (
              <div className="rcpt" key={rowIdx}>
                <span className="faint" style={{ flex: 'none', width: 22 }}>{pos + 1}</span>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <span className="ellipsis" style={{ fontWeight: 500 }}>{getRecipientName(row, headers)}</span>
                  <span className="faint ellipsis">{previewRecords[pos]?.__email}</span>
                  {log?.status === 'failed' && log.error && (
                    <span className="ellipsis" style={{ color: 'var(--err)', fontSize: 12 }} title={log.error}>{log.error}</span>
                  )}
                </div>
                <span className={`pill ${st.cls}`} style={{ flex: 'none' }}>{st.text}</span>
                <button type="button" className="icon-btn" title="Xem trước thư" onClick={() => setViewIdx(pos)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {viewIdx !== null && previewRecords.length > 0 && (
        <PreviewModal
          list={previewRecords}
          index={Math.min(viewIdx, previewRecords.length - 1)}
          setIndex={setViewIdx}
          onClose={() => setViewIdx(null)}
          subject={subject}
          body={body}
          cc={cc}
          senderName={senderDisplayName}
          fontFamily={fontFamily}
          headers={headers}
        />
      )}
    </>
  );
}
