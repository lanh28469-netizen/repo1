import React, { useState, useEffect } from 'react';
import { setToken, isTokenValid, clearAuthData, getMe, updateMe } from './api';
import { Link, Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from './utils/toastContext';
import LoginForm from './cms/LoginForm';
import UsersList from './cms/UsersList';
import PostForm from './cms/PostForm';
import PostFormQuill from './cms/PostFormQuill';
import PostFormPlate from './cms/PostFormPlate';
import PostsList from './cms/PostsList';
import PostDetail from './cms/PostDetail';
import Libraries from './cms/Libraries';
import UserPopup from './cms/UserPopup';

const canEdit = (roles) => roles?.includes('ADMIN') || roles?.includes('MANAGER');
const canAdmin = (roles) => roles?.includes('ADMIN');
const isManagerOnly = (roles) => roles?.includes('MANAGER') && !roles?.includes('ADMIN');

function Protected({ isAuthed, children }) {
  if (!isAuthed) return <Navigate to="login" replace />;
  return children;
}

export default function CMS() {
  const { success, error } = useToast();
  const [auth, setAuth] = useState(() => ({
    username: localStorage.getItem('username') || '',
    roles: JSON.parse(localStorage.getItem('roles') || '[]'),
    token: localStorage.getItem('token') || ''
  }));
  const [authToken, setAuthToken] = useState(localStorage.getItem('token') || '');
  const [editingPost, setEditingPost] = useState(null);
  const [viewingPost, setViewingPost] = useState(null);
  const [editorType, setEditorType] = useState('quill'); // 'tinymce' | 'quill'
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const [editingProfileUser, setEditingProfileUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Token validation effect
  useEffect(() => {
    const validateToken = () => {
      if (!isTokenValid()) {
        clearAuthData();
        setAuth({ username: '', roles: [], token: '' });
        setAuthToken('');
        if (location.pathname !== '/cms/login') {
          navigate('/cms/login', { replace: true });
        }
      }
    };

    // Validate token on component mount and when location changes
    validateToken();
  }, [location.pathname, navigate]);

  const isAuthed = Boolean(auth?.token) && isTokenValid();

  const handleLogin = ({ username, roles, token }) => {
    localStorage.setItem('username', username);
    localStorage.setItem('roles', JSON.stringify(roles));
    setAuth({ username, roles, token });
    setAuthToken(token);
    setToken(token);
    navigate('posts');
  };

  const handleLogout = () => {
    clearAuthData();
    setAuth({ username: '', roles: [], token: '' });
    setAuthToken('');
    navigate('login');
  };

  const gotoCreatePost = (type) => {
    setViewingPost(null);
    setEditingPost(null);
    setEditorType(type || 'quill');
    navigate('/cms/posts/new');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePostSaved = () => {
    setEditingPost(null);
    navigate('posts');
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    navigate('posts');
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    navigate(`posts/edit/${post.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditPost2 = (post) => {
    setEditorType('quill');
    setEditingPost(post);
    navigate(`posts/edit/${post.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewPost = (post) => {
    setViewingPost(post);
    navigate('posts/view');
  };

  const handleBackToList = () => {
    setViewingPost(null);
    navigate('posts');
  };

  const handleUpdateProfile = async () => {
    try {
      const currentUser = await getMe();
      setEditingProfileUser(currentUser);
      setIsProfilePopupOpen(true);
    } catch (error) {
      console.error('Lỗi khi lấy thông tin user', error);
    }
  };

  const handleSaveProfile = async (formData) => {
    try {
      await updateMe(formData);
      setIsProfilePopupOpen(false);
      setEditingProfileUser(null);
      // Update auth state with new info
      const updatedUser = await getMe();
      setAuth(prev => ({ ...prev, username: updatedUser.username }));
      localStorage.setItem('username', updatedUser.username);
      success('Cập nhật thành công');
    } catch (error) {
      error('Lỗi khi cập nhật profile');
    }
  };

  const handleCloseProfilePopup = () => {
    setIsProfilePopupOpen(false);
    setEditingProfileUser(null);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '40px auto', padding: 16 }}>
      <Link to="/">Trang Chủ</Link>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <h1>QUẢN TRỊ NỘI DUNG (CMS) 📝</h1>
      </div>

      {/* Auth bar - hidden on login to avoid duplicate form */}
      {location.pathname !== '/cms/login' && (
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          {!isAuthed ? (
            <LoginForm onLogin={handleLogin} auth={auth} />
          ) : (
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
              <span>Đã đăng nhập: <b>{auth.username}</b></span>
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
      </div>
      )}

      {isAuthed && location.pathname !== '/cms/login' && (
        <nav style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
          <Link to="posts" onClick={() => setViewingPost(null)} style={{ padding:'8px 12px', border:'1px solid #ddd' }}>Bài viết</Link>
          <Link to="libraries" style={{ padding:'8px 12px', border:'1px solid #ddd' }}>Thư viện</Link>
          {canAdmin(auth.roles) && (
            <Link to="users" style={{ padding:'8px 12px', border:'1px solid #ddd' }}>Users</Link>
          )}
          {canEdit(auth.roles) && (
            <button onClick={handleUpdateProfile} style={{ padding:'8px 12px', border:'1px solid #ddd', background:'white', cursor:'pointer' }}>Update Profile</button>
          )}
        </nav>
      )}

      <Routes>
        <Route path="login" element={<LoginForm onLogin={handleLogin} auth={auth} />} />
        <Route index element={<Navigate to="posts" replace />} />

        <Route
          path="posts"
          element={
            <Protected isAuthed={isAuthed}>
              <>
                <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginBottom:12 }}>
                  {canEdit(auth.roles) && (
                    <>
                      {/* <button onClick={() => gotoCreatePost('tinymce')} style={{ padding:'8px 12px' }}>Tạo Post (tinymce)</button> */}
                      <button onClick={() => gotoCreatePost('quill')} style={{ padding:'8px 12px' }}>Tạo Bài viết</button>
                      {/* <button onClick={() => gotoCreatePost('platejs')} style={{ padding:'8px 12px' }}>Tạo Bài viết 2</button> */}
                    </>
                  )}
                </div>
                {viewingPost ? (
                  <PostDetail post={viewingPost} onBack={handleBackToList} />
                ) : (
                  <PostsList auth={auth} onViewPost={handleViewPost} onEditPost={handleEditPost} onEditPost2={handleEditPost2} />
                )}
              </>
            </Protected>
          }
        />
        <Route
          path="posts/new"
          element={
            <Protected isAuthed={isAuthed}>
              {editorType === 'quill' ? (
                <PostFormQuill
                  auth={auth}
                  authToken={authToken}
                  onPostSaved={handlePostSaved}
                  editingPost={editingPost}
                  onCancelEdit={handleCancelEdit}
                />
              ) : editorType === 'platejs' ? (
                <PostFormPlate
                  auth={auth}
                  authToken={authToken}
                  onPostSaved={handlePostSaved}
                  editingPost={editingPost}
                  onCancelEdit={handleCancelEdit}
                />
              ) : (
                <PostForm
                  auth={auth}
                  authToken={authToken}
                  onPostSaved={handlePostSaved}
                  editingPost={editingPost}
                  onCancelEdit={handleCancelEdit}
                />
              )}
            </Protected>
          }
        />
        <Route
          path="posts/edit/:postId"
          element={
            <Protected isAuthed={isAuthed}>
              {editorType === 'quill' ? (
                <PostFormQuill
                  auth={auth}
                  authToken={authToken}
                  onPostSaved={handlePostSaved}
                  editingPost={editingPost}
                  onCancelEdit={handleCancelEdit}
                />
              ) : editorType === 'platejs' ? (
                <PostFormPlate
                  auth={auth}
                  authToken={authToken}
                  onPostSaved={handlePostSaved}
                  editingPost={editingPost}
                  onCancelEdit={handleCancelEdit}
                />
              ) : (
                <PostForm
                  auth={auth}
                  authToken={authToken}
                  onPostSaved={handlePostSaved}
                  editingPost={editingPost}
                  onCancelEdit={handleCancelEdit}
                />
              )}
            </Protected>
          }
        />
        <Route path="posts/view" element={<Protected isAuthed={isAuthed}><PostDetail post={viewingPost} onBack={handleBackToList} /></Protected>} />

        <Route
          path="users"
          element={
            <Protected isAuthed={isAuthed}>
              {canAdmin(auth.roles) ? (
                <UsersList
                  canCreate={canAdmin(auth.roles)}
                />
              ) : (
                <Navigate to="posts" replace />
              )}
            </Protected>
          }
        />

        <Route path="libraries" element={<Protected isAuthed={isAuthed}><Libraries auth={auth} /></Protected>} />

        <Route path="*" element={<Navigate to="posts" replace />} />
      </Routes>

      <UserPopup
        isOpen={isProfilePopupOpen}
        onClose={handleCloseProfilePopup}
        user={editingProfileUser}
        mode="profile"
        onSave={handleSaveProfile}
      />
    </div>
  );
}
