import React, { useRef, useState } from 'react';
import Tip from './Tip';
import { isValidEmail } from '../utils/recipients';

const SOURCES = [
  ['paste', 'Dán từ Excel'],
  ['upload', 'Tải tệp lên'],
  ['drive', 'Google Sheets'],
];

export default function DataInputCard({
  inputMode,
  setInputMode,
  rawPastedText,
  setRawPastedText,
  records,
  headers,
  emailCol,
  setEmailCol,
  onApplyPastedData,
  onFileUpload,
  onLoadSampleData,
  onResetData,
  onImportGoogleSheetUrl,
  driveLoading = false,
  dataSourceName,
}) {
  const fileInputRef = useRef(null);
  const [sheetUrl, setSheetUrl] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const validCount = emailCol ? records.filter((r) => isValidEmail(r[emailCol])).length : 0;
  const invalidCount = records.length - validCount;

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) onFileUpload({ target: { files: [file], value: '' } });
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h2 className="h2">Danh sách người nhận</h2>
        <Tip side="left">
          Dòng đầu tiên là tên cột — dùng làm biến khi soạn thư (vd. {'{Họ và tên}'}). Hỗ trợ dữ liệu ngăn cách bằng tab hoặc dấu phẩy, tệp .xlsx / .xls / .csv.
        </Tip>
      </div>

      <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="seg">
          {SOURCES.map(([key, label]) => (
            <button key={key} type="button" className={inputMode === key ? 'on' : ''} onClick={() => setInputMode(key)}>
              {label}
            </button>
          ))}
        </div>

        {inputMode === 'paste' && (
          <>
            <textarea
              className="textarea"
              value={rawPastedText}
              onChange={(e) => setRawPastedText(e.target.value)}
              placeholder="Sao chép các ô trong Excel (gồm cả dòng tiêu đề) rồi dán vào đây"
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <button type="button" className="btn btn-primary" onClick={onApplyPastedData} disabled={!rawPastedText.trim()}>
                Nhận diện dữ liệu
              </button>
              <button type="button" className="btn" onClick={onLoadSampleData}>Dùng dữ liệu mẫu</button>
            </div>
          </>
        )}

        {inputMode === 'upload' && (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
              minHeight: 150, border: `1.5px dashed ${dragOver ? 'var(--acc)' : 'var(--line-3)'}`, borderRadius: 12,
              cursor: 'pointer', textAlign: 'center', padding: 20,
            }}
          >
            <span style={{ fontWeight: 600 }}>{dataSourceName?.startsWith('Tệp') ? `Đã tải: ${dataSourceName.replace('Tệp: ', '')}` : 'Chọn hoặc kéo thả tệp vào đây'}</span>
            <span className="faint" style={{ fontSize: 13 }}>{dataSourceName?.startsWith('Tệp') ? 'Bấm để chọn tệp khác' : '.xlsx, .xls, .csv'}</span>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv,.tsv,.txt" onChange={onFileUpload} style={{ display: 'none' }} />
          </label>
        )}

        {inputMode === 'drive' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <input
              className="field"
              style={{ flex: '1 1 240px', width: 'auto' }}
              type="url"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sheetUrl.trim() && onImportGoogleSheetUrl?.(sheetUrl)}
              placeholder="Dán đường link Google Sheets"
            />
            <button
              type="button"
              className="btn"
              disabled={driveLoading || !sheetUrl.trim()}
              onClick={() => onImportGoogleSheetUrl?.(sheetUrl)}
            >
              {driveLoading ? 'Đang lấy…' : 'Lấy dữ liệu'}
            </button>
            <Tip>
              Trang tính cần được chia sẻ ở chế độ <b>“Bất kỳ ai có đường liên kết”</b> (hoặc bạn có quyền xem). Dữ liệu được lấy từ trang tính đầu tiên.
            </Tip>
          </div>
        )}
      </section>

      {records.length > 0 && (
        <section className="card animate-fade-in" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{records.length} người nhận</span>
              <span className="pill pill-ok">{validCount} hợp lệ</span>
              {invalidCount > 0 && <span className="pill pill-err">{invalidCount} email sai — sẽ bỏ qua</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <label className="muted" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                Cột email:
                <select
                  className="field field-sm"
                  style={{ width: 'auto', minHeight: 34, fontWeight: 600 }}
                  value={emailCol}
                  onChange={(e) => setEmailCol(e.target.value)}
                >
                  <option value="">— Chọn cột —</option>
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </label>
              <button type="button" className="btn btn-sm btn-ghost" onClick={onResetData}>Xoá</button>
            </div>
          </div>

          {!emailCol && (
            <div style={{ padding: '10px 16px', fontSize: 13, color: '#ffb37a', background: 'var(--acc-soft)' }}>
              Hãy chọn cột chứa địa chỉ email của người nhận.
            </div>
          )}
          {emailCol && validCount === 0 && (
            <div style={{ padding: '10px 16px', fontSize: 13, color: 'var(--err)', background: 'var(--err-soft)' }}>
              Cột “{emailCol}” không có email hợp lệ — hãy chọn lại cột email.
            </div>
          )}

          <div style={{ overflow: 'auto', maxHeight: 340 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 40, paddingLeft: 16 }}>#</th>
                  {headers.map((h) => (
                    <th key={h} style={h === emailCol ? { color: '#ffb37a' } : undefined}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((row, i) => {
                  const bad = emailCol && !isValidEmail(row[emailCol]);
                  return (
                    <tr key={i} style={{ background: bad ? 'rgba(248,113,113,.06)' : 'transparent' }}>
                      <td className="faint" style={{ paddingLeft: 16 }}>{i + 1}</td>
                      {headers.map((h) => (
                        <td key={h} style={{ color: h === emailCol && bad ? 'var(--err)' : 'var(--text)' }}>
                          {row[h] !== undefined && row[h] !== null && String(row[h]) !== '' ? String(row[h]) : '—'}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
