export function formatGmailApiError(status, errJson, googleClientId = '') {
  const msg = errJson?.error?.message || '';
  const reason = errJson?.error?.errors?.[0]?.reason || errJson?.error?.status || '';
  const proj = (googleClientId || '').split('-')[0] || '275736693360';

  if (status === 401) {
    return 'Phiên đăng nhập đã hết hạn (401). Vui lòng bấm "Đổi tài khoản" và đăng nhập lại!';
  }

  if (status === 403) {
    if (reason === 'insufficientPermissions' || msg.toLowerCase().includes('insufficient authentication scopes')) {
      return 'Lỗi 403 (Thiếu quyền gửi mail): Bạn chưa tích chọn ô vuông "Gửi email thay mặt bạn" (Send email on your behalf) khi đăng nhập Google. Hãy bấm "Cấp lại quyền gửi thư" ở Bước 1 và nhớ TÍCH CHỌN ô vuông này!';
    }
    if (reason === 'accessNotConfigured' || msg.toLowerCase().includes('has not been used in project') || msg.toLowerCase().includes('disabled')) {
      return `Lỗi 403 (Gmail API chưa được bật): Dịch vụ Gmail API chưa được BẬT trên Google Cloud Project ${proj}. Vui lòng truy cập https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=${proj} và nhấn nút "ENABLE" (BẬT).`;
    }
    if (reason === 'rateLimitExceeded' || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('limit')) {
      return 'Lỗi 403 (Vượt hạn mức): Đã đạt giới hạn gửi thư của tài khoản Gmail hôm nay (Gmail cá nhân: ~500 thư/ngày, Workspace: ~2000 thư/ngày).';
    }
    return `Lỗi 403 (Bị từ chối quyền gửi thư): ${msg || 'Google từ chối yêu cầu. Vui lòng kiểm tra quyền tài khoản hoặc trạng thái Gmail API trên Google Cloud'}`;
  }

  return msg || `Lỗi Gmail API (Mã HTTP ${status})`;
}

function encodeHeaderWords(text) {
  if (!/[^\x20-\x7e]/.test(text)) return text;
  const words = [];
  let chunk = '';
  let bytes = 0;
  for (const ch of text) {
    const len = new TextEncoder().encode(ch).length;
    if (bytes + len > 45) {
      words.push(chunk);
      chunk = '';
      bytes = 0;
    }
    chunk += ch;
    bytes += len;
  }
  if (chunk) words.push(chunk);
  return words.map(w => `=?UTF-8?B?${btoa(unescape(encodeURIComponent(w)))}?=`).join(' ');
}

export function createBase64UrlEmail({ to, cc, bcc, subject, html, fromName, fromEmail, lineSpacing = '1.6', fontFamily = "'Times New Roman', Times, serif" }) {
  const utf8Subject = encodeHeaderWords(String(subject || '').replace(/[\r\n]+/g, ' '));
  const safeName = (fromName || '').replace(/[\r\n]+/g, ' ').trim();
  const fromHeader = safeName
    ? (/[^\x20-\x7e]/.test(safeName)
      ? `${encodeHeaderWords(safeName)} <${fromEmail}>`
      : `"${safeName.replace(/(["\\])/g, '\\$1')}" <${fromEmail}>`)
    : fromEmail;
  const emailLines = [
    `From: ${fromHeader}`,
    `To: ${to}`
  ];

  if (cc && cc.trim()) {
    emailLines.push(`Cc: ${cc.trim()}`);
  }
  if (bcc && bcc.trim()) {
    emailLines.push(`Bcc: ${bcc.trim()}`);
  }

  emailLines.push(
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    `<div style="font-family: ${fontFamily}; font-size: 14px; line-height: ${lineSpacing}; color: #1e293b;">${html}</div>`
  );

  const raw = emailLines.join('\r\n');
  return btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Kiểm tra quyền thực tế (Scopes) của token qua endpoint Google OAuth tokeninfo
export async function verifyGoogleTokenScopes(token) {
  if (!token) return { valid: false, canSend: false, scopes: [] };
  try {
    const res = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`);
    if (res.ok) {
      const data = await res.json();
      const scopes = (data.scope || '').split(' ');
      const canSend = scopes.some(s => s.includes('gmail.send') || s.includes('mail.google.com') || s.includes('gmail'));
      return {
        valid: true,
        canSend,
        email: data.email || '',
        scopes
      };
    }
  } catch (err) {
    console.warn('Lỗi kiểm tra tokeninfo:', err);
  }
  // Mặc định cho phép nếu đã có access token để tránh chặn oan do mạng/adblocker
  return { valid: true, canSend: true, scopes: [] };
}

export async function fetchGoogleUserProfile(token) {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Lỗi fetch Google userinfo:', err);
  }
  return null;
}

// Gửi 1 email trực tiếp qua Gmail REST API
export async function sendGmailMessage({ token, rawEmail, googleClientId = '' }) {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: rawEmail })
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    const errorText = formatGmailApiError(res.status, errJson, googleClientId);
    const err = new Error(errorText);
    err.status = res.status;
    err.details = errJson;
    throw err;
  }

  return await res.json();
}

/**
 * Trích xuất Sheet ID từ link Google Sheets
 */
export function extractGoogleSheetId(url) {
  if (!url) return null;
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * Tải file từ Google Drive theo fileId và mimeType bằng access token
 */
export async function fetchGoogleDriveFile({ fileId, mimeType, token }) {
  if (!fileId || !token) throw new Error('Thiếu File ID hoặc Google Access Token');

  const isGoogleSheet = mimeType === 'application/vnd.google-apps.spreadsheet';
  const url = isGoogleSheet
    ? `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`
    : `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Lỗi tải file từ Google Drive (${res.status}): ${errText || 'Kiểm tra quyền truy cập file'}`);
  }

  if (isGoogleSheet) {
    return await res.text(); // Chuỗi CSV
  }
  return await res.blob(); // File nhị phân .xlsx / .csv
}

/**
 * Tải nội dung CSV từ URL Google Sheets
 */
export async function fetchGoogleSheetFromUrl(url, token = '') {
  const sheetId = extractGoogleSheetId(url);
  if (!sheetId) throw new Error('Đường dẫn Google Sheets không đúng định dạng!');

  // Thử 1: Dùng Drive Export API nếu có token
  if (token) {
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${sheetId}/export?mimeType=text/csv`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        return await res.text();
      }
    } catch (_) {}
  }

  // Thử 2: Tải công khai qua endpoint docs.google.com export
  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  const res = await fetch(exportUrl);
  if (!res.ok) {
    throw new Error('Không thể tải Google Sheet. Vui lòng đảm bảo file đã được bật chia sẻ (Bất kỳ ai có đường liên kết) hoặc tài khoản có quyền truy cập!');
  }
  return await res.text();
}

/**
 * Mở hộp thoại chọn file Google Drive Picker
 */
export function openGoogleDrivePicker({ clientId, token, onSelect, onError }) {
  if (typeof window.gapi === 'undefined') {
    onError?.(new Error('Thư viện Google API chưa sẵn sàng. Vui lòng thử lại sau vài giây!'));
    return;
  }

  window.gapi.load('picker', {
    callback: () => {
      try {
        if (!window.google?.picker) {
          onError?.(new Error('Không thể khởi tạo Google Picker'));
          return;
        }

        const view = new window.google.picker.View(window.google.picker.ViewId.SPREADSHEETS);
        view.setMimeTypes('application/vnd.google-apps.spreadsheet,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/vnd.ms-excel');

        const picker = new window.google.picker.PickerBuilder()
          .addView(view)
          .setOAuthToken(token)
          .setAppId((clientId || '').split('-')[0])
          .setCallback((data) => {
            if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
              const doc = data[window.google.picker.Response.DOCUMENTS][0];
              onSelect?.({
                id: doc[window.google.picker.Document.ID],
                name: doc[window.google.picker.Document.NAME],
                mimeType: doc[window.google.picker.Document.MIME_TYPE]
              });
            }
          })
          .build();

        picker.setVisible(true);
      } catch (err) {
        onError?.(err);
      }
    }
  });
}

