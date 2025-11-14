import React, { useEffect, useState, useRef } from 'react';
import { useToast } from '../utils/toastContext';
import { adminListUsers, adminGetUser, adminUpdateManager, adminDeleteUser, adminCreateManager } from '../api';
import UserPopup from './UserPopup';

export default function UsersList({ canCreate }) {
  const { success, error } = useToast();
  const [users, setUsers] = useState({ content: [], totalPages: 0, number: 0 });
  const [usersPage, setUsersPage] = useState(0);
  const [usersQ, setUsersQ] = useState('');
  const [debouncedUsersQ, setDebouncedUsersQ] = useState('');
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupMode, setPopupMode] = useState('edit');
  const [editingUser, setEditingUser] = useState(null);
  const isLoadingRef = useRef(false);

  const loadUsers = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      const trimmed = (debouncedUsersQ || '').trim();
      const effectiveQ = trimmed === '' ? '' : (trimmed.length >= 3 ? trimmed : '');
      const res = await adminListUsers({ page: usersPage, size: 10, q: effectiveQ });
      setUsers(res);
    } catch {} finally {
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    loadUsers();
  }, [usersPage, debouncedUsersQ]);

  // Debounce users search input by 1000ms
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedUsersQ(usersQ), 1000);
    return () => clearTimeout(handler);
  }, [usersQ]);

  const editUser = async (id) => {
    const user = await adminGetUser(id);
    setEditingUser(user);
    setPopupMode('edit');
    setIsPopupOpen(true);
  };

  const createUser = () => {
    setEditingUser(null);
    setPopupMode('create');
    setIsPopupOpen(true);
  };

  const handleSaveUser = async (formData) => {
    try {
      if (popupMode === 'edit') {
        await adminUpdateManager(editingUser.id, formData);
      } else if (popupMode === 'create') {
        await adminCreateManager(formData);
      }
      setIsPopupOpen(false);
      setEditingUser(null);
      await loadUsers();
      const action = popupMode === 'edit' ? 'Cập nhật' : 'Tạo';
      success(`${action} user thành công`);
    } catch (error) {
      const action = popupMode === 'edit' ? 'cập nhật' : 'tạo';
      error(`Lỗi khi ${action} user`);
    }
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setEditingUser(null);
  };

  const deleteUser = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa user này?')) {
      try {
        await adminDeleteUser(id);
        await loadUsers();
      } catch (error) {
        error('Lỗi khi xóa user');
      }
    }
  };

  return (
    <section style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', gap: 8, alignItems:'center', justifyContent:'flex-end' }}>
        {canCreate && <button onClick={createUser}>Create User</button>}
      </div>

      <h2>Danh sách Users</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <input
          placeholder="Tìm username/email (nhập từ 3 ký tự)..."
          value={usersQ}
          onChange={(e) => {
            setUsersPage(0);
            setUsersQ(e.target.value);
          }}
          style={{ flex: 1, padding: '8px 10px' }}
        />
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: '6px 4px' }}>
              Username
            </th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: '6px 4px' }}>
              Email
            </th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: '6px 4px' }}>
              Fullname
            </th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: '6px 4px' }}>
              Phone
            </th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: '6px 4px' }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.content.map((u) => (
            <tr key={u.id}>
              <td style={{ padding: '6px 4px', borderBottom: '1px solid #f2f2f2' }}>{u.username}</td>
              <td style={{ padding: '6px 4px', borderBottom: '1px solid #f2f2f2' }}>{u.email}</td>
              <td style={{ padding: '6px 4px', borderBottom: '1px solid #f2f2f2' }}>{u.fullName}</td>
              <td style={{ padding: '6px 4px', borderBottom: '1px solid #f2f2f2' }}>{u.phone}</td>
              <td style={{ padding: '6px 4px', borderBottom: '1px solid #f2f2f2' }}>
                <button onClick={() => editUser(u.id)}>Sửa</button>
                <button onClick={() => deleteUser(u.id)} style={{ marginLeft: 8 }}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 50, justifyContent: 'flex-end' }}>
        <button onClick={() => setUsersPage((p) => Math.max(0, p - 1))} disabled={users.number <= 0}>
          «
        </button>
        <span>
          Trang {users.number + 1} / {Math.max(1, users.totalPages || 1)}
        </span>
        <button
          onClick={() => setUsersPage((p) => (p + 1 < users.totalPages ? p + 1 : p))}
          disabled={users.number + 1 >= (users.totalPages || 1)}
        >
          »
        </button>
      </div>

      <UserPopup
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        user={editingUser}
        mode={popupMode}
        onSave={handleSaveUser}
      />
    </section>
  );
}
