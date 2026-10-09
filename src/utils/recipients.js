export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value) => EMAIL_RE.test(String(value ?? '').trim());

export const getRecipientName = (row, headers = []) =>
  row?.['Họ và tên'] || row?.['Tên'] || row?.[headers[0]] || '—';

// Chỉ số (theo dòng dữ liệu) của những người nhận có email hợp lệ ở cột emailCol
export const getValidIndexes = (records, emailCol) =>
  records.reduce((acc, row, i) => {
    if (emailCol && isValidEmail(row[emailCol])) acc.push(i);
    return acc;
  }, []);
