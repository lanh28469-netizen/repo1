import React, { useRef, useState, useCallback } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './PostFormQuill.css';
import { useToast } from '../utils/toastContext';
import { createPost, updatePost } from '../api';
import { PostCategory } from '../constants/PostCategory';
import Quill from 'quill';
import QuillResize from 'quill-resize-module';

Quill.register('modules/resize', QuillResize);

export default function PostFormQuill({ auth, authToken, onPostSaved, editingPost, onCancelEdit }) {
  const { error } = useToast();
  const [title, setTitle] = useState(editingPost?.title || '');
  const [content, setContent] = useState(editingPost?.content || '');
  const [language, setLanguage] = useState(editingPost?.language || 'vi');
  const [category, setCategory] = useState(editingPost?.category || '');
  const [loading, setLoading] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const quillRef = useRef(null);

  // Initialize Quill ref
  const handleEditorChange = useCallback((value) => {
    setContent(value);
  }, []);

  // Handle keyboard events for undo/redo
  const handleKeyDown = useCallback((e) => {
    // Check for Ctrl+Z (undo) or Ctrl+Y (redo)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'y')) {
      e.preventDefault();
      if (!quillRef.current) return;
      
      const quill = quillRef.current.getEditor();
      if (e.key === 'z') {
        quill.history.undo();
      } else {
        quill.history.redo();
      }
    }
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setTitleError('');
    setCategoryError('');
    
    let hasError = false;
    
    if (!title.trim() || !content.trim()) {
      setTitleError('Nhập tiêu đề và nội dung bài viết');
      hasError = true;
    }
    if (!category.trim()) {
      setCategoryError('Vui lòng chọn chuyên mục');
      hasError = true;
    }
    
    if (hasError) return;
    
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
      onPostSaved?.();
    } catch (e) {
      error(e?.response?.status === 403 ? 'Bạn không có quyền thực hiện hành động này' : 'Có lỗi khi lưu bài');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = (roles) => roles?.includes('ADMIN') || roles?.includes('MANAGER');
  if (!canEdit(auth.roles)) return null;


  const imageHandler = useCallback(() => {
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
        const editor = quillRef.current;
        if (editor) {
          const range = editor.getSelection(true);
          editor.insertEmbed(range.index, 'image', url, 'user');
        }
      } catch (err) {
        console.log(err);
      }
    };
    input.click();
  }, [authToken]);

  // Initialize Quill with history module
  const modules = React.useMemo(() => ({
    history: {
      delay: 200,
      maxStack: 100,
      userOnly: true
    },
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ font: [] }],
        [{ size: [] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ direction: 'rtl' }],
        [{ align: [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video', 'formula'],
        ['code'],
        ['clean']
      ],
      handlers: { image: imageHandler }
    },
    resize: {
      // Enable feature modules
      modules: ['DisplaySize', 'Toolbar', 'Resize', 'Keyboard'],
      
      // Enable keyboard arrow keys for selection
      keyboardSelect: true,
      
      // CSS classes for selected and active states
      selectedClass: 'selected',
      activeClass: 'active',
      
      // Resizable embedded tags (video and iframe by default)
      embedTags: ['VIDEO', 'IFRAME'],
      
      // Toolbar buttons (default: left align, center, right align, full width, edit)
      tools: ['left', 'center', 'right', 'full', 'edit'],
      
      // Parchment configuration: set attributes and limits for different element types
      parchment: {
        // Image configuration
        image: {
          attribute: ['width', 'height'],  // Allow both width and height adjustment
          limit: {
            minWidth: 50,        // Lower minimum width limit
            maxWidth: 1200,      // Higher maximum width limit
            minHeight: 50,       // Lower minimum height limit
            maxHeight: 800       // Higher maximum height limit
          }
        },
        // Video configuration
        video: {
          attribute: ['width', 'height'],  // Adjustable attributes
          limit: {
            minWidth: 200,       // Minimum width limit
            maxWidth: 1200,      // Higher maximum width limit
            ratio: 0.5625        // Width/height ratio limit (16:9)
          }
        }
      },
      
      // Event callbacks
      onActive: function (blot, target) {
        // Force toolbar to be visible
        setTimeout(() => {
          const toolbar = document.querySelector('.ql-resize-toolbar');
          if (toolbar) {
            toolbar.style.display = 'block';
            toolbar.style.opacity = '1';
            toolbar.style.visibility = 'visible';
          }
        }, 100);
      },
      
    }
  }), []);

  return (
    <form onSubmit={submit} style={{ marginBottom: 24 }}>
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>Tiêu đề</label>
      <input id="title-input"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (titleError) setTitleError('');
        }}
        placeholder="Nhập tiêu đề"
        style={{ width: '100%', padding: '10px 12px', marginBottom: 12 }}
      />
      {titleError && (
        <div style={{ color: 'red', fontSize: '14px', marginTop: '-8px', marginBottom: '12px' }}>
          {titleError}
        </div>
      )}

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
          onChange={(e) => {
            setCategory(e.target.value);
            if (categoryError) setCategoryError('');
          }}
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
      {categoryError && (
        <div style={{ color: 'red', fontSize: '14px', marginTop: '-8px', marginBottom: '12px' }}>
          {categoryError}
        </div>
      )}

      <label style={{ display: 'block', marginTop: '30px', marginBottom: '15px', fontWeight: 'bold' }}>Nội dung</label>
      <div style={{ marginBottom: 16, minHeight: 300 }}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={content}
          onChange={handleEditorChange}
          modules={modules}
          placeholder="Nhập nội dung bài viết..."
          style={{ minHeight: '300px', height: '100%' }}
          preserveWhitespace
          onKeyDown={handleKeyDown}
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
