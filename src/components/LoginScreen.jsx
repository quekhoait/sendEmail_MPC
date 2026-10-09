import React from 'react';
import Tip from './Tip';

const MASCOT = 'https://res.cloudinary.com/ds11ggie4/image/upload/v1791383134/Emo1_nmkeka.png';

export default function LoginScreen({ onLogin }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 22 }}>
        <img src={MASCOT} alt="" style={{ width: 120, height: 'auto', objectFit: 'contain' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(24px,5vw,30px)', fontWeight: 700, lineHeight: 1.25, textWrap: 'balance' }}>
            Gửi email hàng loạt, cá nhân hoá cho từng người
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: 15, lineHeight: 1.55, textWrap: 'pretty' }}>
            Nhập danh sách, soạn một mẫu thư — mỗi người nhận được thông tin của riêng mình.
          </p>
        </div>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={onLogin}
            className="btn btn-primary btn-lg"
            style={{ flex: 1, minHeight: 52, fontSize: 16, gap: 12 }}
          >
            <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#fff', color: 'var(--acc-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 }}>G</span>
            Đăng nhập bằng Google
          </button>
          <Tip side="top-right" accent>
            Khi đăng nhập, hãy tích chọn quyền <b>“Gửi email thay bạn”</b> để ứng dụng gửi thư từ tài khoản Gmail của bạn.
          </Tip>
        </div>
      </div>
    </div>
  );
}
