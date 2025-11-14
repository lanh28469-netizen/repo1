import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useToast } from '../utils/toastContext';
import { createPost, updatePost } from '../api';
import { PostCategory } from '../constants/PostCategory';

export default function PostFormPlate({ auth, authToken, onPostSaved, editingPost, onCancelEdit }) {
  const { error } = useToast();
  const [title, setTitle] = useState(editingPost?.title || '');
  const [content, setContent] = useState(editingPost?.content || '');
  const [language, setLanguage] = useState(editingPost?.language || 'vi');
  const [category, setCategory] = useState(editingPost?.category || '');
  const [loading, setLoading] = useState(false);

  const editorRef = useRef(null);

  // Initialize editor DOM once when entering edit mode/new mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = content || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingPost]);

  const canEdit = (roles) => roles?.includes('ADMIN') || roles?.includes('MANAGER');
  if (!canEdit(auth.roles)) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      error('Nhập tiêu đề và nội dung nha!');
      return;
    }
    setLoading(true);
    try {
      if (editingPost) {
        await updatePost(editingPost.id, { title, content, language, category });
      } else {
        await createPost({ title, content, language, category });
      }
      setTitle('');
      setContent('');
      setLanguage('');
      setCategory('');
      // Clear the editor DOM explicitly when saving to keep DOM and state in sync
      if (editorRef.current) editorRef.current.innerHTML = '';
      onPostSaved?.();
    } catch (e) {
      error(e?.response?.status === 403 ? 'Bạn không có quyền thực hiện hành động này' : 'Có lỗi khi lưu bài');
    } finally {
      setLoading(false);
    }
  };

  const imageHandler = useCallback(async () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.onchange = async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      try {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('http://localhost:9090/api/uploads', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken || ''}` },
          body: form
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        const url = data.url || data.path || data.link || data.location || data.fileUrl;
        
        // Insert image into editor
        const editor = editorRef.current;
        if (editor) {
          const img = document.createElement('img');
          img.src = url;
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          editor.appendChild(img);
        }
      } catch (err) {
        console.log(err);
      }
    };
    input.click();
  }, [authToken]);

  return (
    <form onSubmit={submit} style={{ marginBottom: 24 }}>
      <style dangerouslySetInnerHTML={{
        __html: `
          .plate-editor { 
            min-height: 350px; 
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 12px;
            font-family: Arial, sans-serif;
            line-height: 1.6;
          }
          .plate-toolbar {
            border-bottom: 1px solid #ddd;
            padding: 8px;
            margin-bottom: 8px;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }
          .plate-toolbar button {
            padding: 6px 12px;
            border: 1px solid #ddd;
            background: white;
            cursor: pointer;
            border-radius: 4px;
          }
          .plate-toolbar button:hover {
            background: #f5f5f5;
          }
          .plate-toolbar button.active {
            background: #007bff;
            color: white;
          }
        ` 
      }} />
      
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>Tiêu đề</label>
      <input id="title-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nhập tiêu đề"
        style={{ width: '100%', padding: '10px 12px', marginBottom: 12 }}
      />

      <label style={{ display: 'block', margin: '12px 0', fontWeight: 'bold' }}>Ngôn ngữ</label>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="radio" name="language" value="vi" checked={language === 'vi'} onChange={(e) => setLanguage(e.target.value)} />
          Tiếng Việt
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="radio" name="language" value="en" checked={language === 'en'} onChange={(e) => setLanguage(e.target.value)} />
          English
        </label>
      </div>

      <label style={{ display: 'block', marginTop: '30px', marginBottom: '12px', fontWeight: 'bold' }}>Chuyên mục</label>
      <div style={{ display: 'flex', marginBottom: 12 }}>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ width: '50%', padding: '10px 12px', minWidth: '200px' }}
        >
          <option value="" disabled hidden>Chọn chuyên mục</option>
          {Object.entries(PostCategory).map(([key, value]) => (
            <option key={key} value={key}>{value}</option>
          ))}
        </select>
        <button id="save1-btn" disabled={loading} style={{ padding: '10px 14px', marginLeft: 'auto'}}>
          {editingPost ? (loading ? 'Đang cập nhật...' : 'Cập nhật bài') : loading ? 'Đang đăng...' : 'Lưu bài'}
        </button>
      </div>

      <label style={{ display: 'block', marginTop: '30px', marginBottom: '15px', fontWeight: 'bold' }}>Nội dung</label>
      
      {/* Simple toolbar */}
      <div className="plate-toolbar">
        <button type="button" onClick={() => document.execCommand('bold')} title="Bold">B</button>
        <button type="button" onClick={() => document.execCommand('italic')} title="Italic">I</button>
        <button type="button" onClick={() => document.execCommand('underline')} title="Underline">U</button>
        <button type="button" onClick={() => document.execCommand('strikeThrough')} title="Strikethrough">S</button>
        <button type="button" onClick={() => document.execCommand('formatBlock', false, 'h1')} title="Heading 1">H1</button>
        <button type="button" onClick={() => document.execCommand('formatBlock', false, 'h2')} title="Heading 2">H2</button>
        <button type="button" onClick={() => document.execCommand('formatBlock', false, 'h3')} title="Heading 3">H3</button>
        <button type="button" onClick={() => document.execCommand('formatBlock', false, 'p')} title="Paragraph">P</button>
        <button type="button" onClick={() => document.execCommand('insertUnorderedList')} title="Bullet List">•</button>
        <button type="button" onClick={() => document.execCommand('insertOrderedList')} title="Numbered List">1.</button>
        <button type="button" onClick={() => document.execCommand('createLink', false, prompt('Enter URL:'))} title="Link">🔗</button>
        <button type="button" onClick={imageHandler} title="Insert Image">🖼️</button>
        <button type="button" onClick={() => document.execCommand('insertHorizontalRule')} title="Horizontal Rule">—</button>
        <button type="button" onClick={() => document.execCommand('removeFormat')} title="Remove Format">Clear</button>
      </div>

      <div style={{ marginBottom: 16, minHeight: 300 }}>
        <div 
          id="plate-editor"
          className="plate-editor"
          ref={editorRef}
          contentEditable
          onInput={(e) => setContent(e.currentTarget.innerHTML)}
          placeholder="Nhập nội dung..."
          style={{ 
            minHeight: '300px',
            outline: 'none',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '12px'
          }}
        />
      </div>

      <button id="save2-btn" disabled={loading} style={{ marginTop: 16, padding: '10px 14px' }}>
        {editingPost ? (loading ? 'Đang cập nhật...' : 'Cập nhật bài') : loading ? 'Đang đăng...' : 'Lưu bài'}
      </button>
      {(
        <button type="button" onClick={onCancelEdit} style={{ marginLeft: 8, padding: '10px 14px' }}>
          Hủy 
        </button>
      )}
    </form>
  );
}