import React from 'react';
import { useToast } from '../utils/toastContext';
import { login } from '../api';

export default function LoginForm({ onLogin }) {
  const { error } = useToast();
  
  const doLogin = async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;
    try {
      const { token, username: u, roles } = await login(username, password);
      onLogin({ username: u, roles, token });
    } catch {
      error('Sai tài khoản/mật khẩu');
    }
  };

  return (
    <div>
      <form onSubmit={doLogin} style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <input name="username" placeholder="username (vd: admin)" />
        <input name="password" placeholder="password (vd: admin123)" type="password" />
        <button>Đăng nhập</button>
      </form>
      <div style={{ marginTop: 30, fontSize: 20 }}>
        <p><strong>Giới thiệu về hệ thống quản lý nội dung (CMS):</strong></p>
        <p>CMS cung cấp các chức năng chính để quản trị viên quản lý nội dung website:</p>
        <ul>
          <li><strong>Quản lý bài viết:</strong> Tạo, chỉnh sửa, xóa các bài viết.</li>
          <li><strong>Quản lý người dùng:</strong> Admin thêm, sửa, xóa tài khoản người quản trị nội dung (Manager).</li>
          <li><strong>Quản lý hình ảnh:</strong> Upload và quản lý thư viện hình ảnh, video.</li>
          <li><strong>Cập nhật hồ sơ:</strong> Cập nhật thông tin cá nhân, thay đổi mật khẩu</li>
        </ul>
      </div>
    </div>
  );
}

