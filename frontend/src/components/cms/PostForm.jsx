import React, { useState } from 'react';
import { useToast } from '../utils/toastContext';
import { createPost, updatePost } from '../api';
import { Editor } from '@tinymce/tinymce-react';

export default function PostForm({ auth, authToken, onPostSaved, editingPost, onCancelEdit }) {
  const { error } = useToast();
  const [title, setTitle] = useState(editingPost?.title || '');
  const [content, setContent] = useState(editingPost?.content || '');
  const [language, setLanguage] = useState(editingPost?.language || '');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      error('Nhập tiêu đề và nội dung');
      return;
    }
    setLoading(true);
    try {
      if (editingPost) {
        await updatePost(editingPost.id, { title, content, language });
      } else {
        await createPost({ title, content, language });
      }
      setTitle('');
      setContent('');
      setLanguage('');
      onPostSaved?.();
    } catch (e) {
      error(e?.response?.status === 403 ? 'Bạn không có quyền thực hiện hành động này' : 'Có lỗi khi lưu bài');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = (roles) => roles?.includes('ADMIN') || roles?.includes('MANAGER');

  if (!canEdit(auth.roles)) return null;

  return (
    <form onSubmit={submit} style={{ marginBottom: 24 }}>
      <label style={{ display: 'block', marginBottom: 6 }}>Tiêu đề</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nhập tiêu đề"
        style={{ width: '100%', padding: '10px 12px', marginBottom: 12 }}
      />

      <label style={{ display: 'block', margin: '12px 0' }}>Ngôn ngữ</label>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="radio"
            name="language"
            value="vi"
            checked={language === 'vi'}
            onChange={(e) => setLanguage(e.target.value)}
          />
          Tiếng Việt
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="radio"
            name="language"
            value="en"
            checked={language === 'en'}
            onChange={(e) => setLanguage(e.target.value)}
          />
          English
        </label>
      </div>

      <label style={{ display: 'block', margin: '12px 0' }}>Nội dung</label>
      <Editor
        apiKey={import.meta.env.TINYMCE_API_KEY}
        value={content}
        onEditorChange={(val) => setContent(val)}
        init={{
          height: 400,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
          ],
          toolbar:
            'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | ' +
            'bullist numlist outdent indent | removeformat | image link | help',
          images_upload_url: 'http://localhost:9090/api/uploads',
          images_upload_credentials: true,
          images_upload_handler: async (blobInfo, success, failure) => {
            try {
              const form = new FormData();
              form.append('file', blobInfo.blob(), blobInfo.filename());
              const res = await fetch('http://localhost:9090/api/uploads', {
                method: 'POST',
                headers: { Authorization: `Bearer ${authToken || ''}` },
                body: form
              });
              if (!res.ok) throw new Error('Upload failed');
              const data = await res.json();
              success(data.url || data.path || data.link || data.location || data.fileUrl);
            } catch (err) {
              failure('Upload error');
            }
          }
        }}
      />

      <button disabled={loading} style={{ marginTop: 16, padding: '10px 14px' }}>
        {editingPost
          ? loading
            ? 'Updating...'
            : 'Save editing'
          : loading
          ? 'Saving...'
          : 'Save'}
      </button>
      {editingPost && (
        <button type="button" onClick={onCancelEdit} style={{ marginLeft: 8, padding: '10px 14px' }}>
          Cancel editing
        </button>
      )}
    </form>
  );
}
