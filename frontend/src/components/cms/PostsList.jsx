import React, { useEffect, useState, useRef } from 'react';
import { useToast } from '../utils/toastContext';
import { fetchPosts, fetchPostsByCategory, deletePost } from '../api';
import { PostCategory } from '../constants/PostCategory';

export default function PostsList({ auth, onViewPost, onEditPost2 }) {
  const { error } = useToast();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [data, setData] = useState({ content: [], totalPages: 0, number: 0 });
  const isLoadingRef = useRef(false);

  const load = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      const trimmed = (debouncedQ || '').trim();
      const effectiveQ = trimmed === '' ? '' : (trimmed.length >= 3 ? trimmed : '');
      
      if (selectedCategory) {
        setData(await fetchPostsByCategory({ page, size, category: selectedCategory }));
      } else {
        setData(await fetchPosts({ page, size, q: effectiveQ }));
      }
    } finally {
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    load();
  }, [page, size, debouncedQ, selectedCategory]);

  // Debounce the search input by 1000ms
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQ(q), 1000);
    return () => clearTimeout(handler);
  }, [q]);

  const onDelete = async (id) => {
    if (!confirm('Xóa bài này?')) return;
    try {
      await deletePost(id);
      // Cache will be automatically invalidated by deletePost function
      // Reload the data to show updated list
      load();
    } catch (e) {
      error('Không có quyền xoá');
    }
  };

  const canEdit = (roles) => roles?.includes('ADMIN') || roles?.includes('MANAGER');

  const truncateContent = (htmlContent, maxLength = 1000) => {
    if (!htmlContent) return '';

    // Remove HTML tags to get plain text
    const textContent = htmlContent.replace(/<[^>]*>/g, '');

    if (textContent.length <= maxLength) {
      return htmlContent;
    }

    // Truncate plain text and add ellipsis
    const truncatedText = textContent.substring(0, maxLength) + '...';
    return truncatedText;
  };

  const getFirstImage = (htmlContent) => {
    if (!htmlContent) return null;
    const imgMatch = htmlContent.match(/<img[^>]+src="([^"]+)"/);
    return imgMatch ? imgMatch[1] : null;
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <select
          value={selectedCategory}
          onChange={(e) => {
            setPage(0);
            setSelectedCategory(e.target.value);
          }}
          style={{ padding: '8px 10px', minWidth: '300px' }}
        >
          <option value="">Tất cả danh mục</option>
          {Object.entries(PostCategory).map(([key, value]) => (
            <option key={key} value={key}>{value}</option>
          ))}
        </select>
        <input
          value={q}
          onChange={(e) => {
            setPage(0);
            setQ(e.target.value);
          }}
          placeholder="Nhập từ tìm kiếm từ 3 ký tự..."
          style={{ flex: 1, padding: '8px 10px' }}
        />
      </div>

      <h2>Bài viết</h2>
      {data.content.map((p) => (
        <article key={p.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <h3 style={{ margin: '15px 0 20px 0', fontWeight: 'bold', fontSize: '1.2em' }}>
              <button
                onClick={() => onViewPost(p)}
                style={{ background: 'none', border: 'none', padding: 0, color: '#0b5ed7', cursor: 'pointer', bold: 'bold', fontSize: '1.5em', textAlign: 'left' }}
              >
                {p.title}
              </button>
            </h3>
            {p.category && (
              <span style={{ 
                background: '#e3f2fd', 
                color: '#1976d2', 
                padding: '4px 8px', 
                borderRadius: '4px', 
                fontSize: '0.8em',
                fontWeight: '500'
              }}>
                {PostCategory[p.category] || p.category}
              </span>
            )}
          </div>
          {(() => {
            const firstImg = getFirstImage(p.content);
            return firstImg ? <img src={firstImg} alt="image" style={{ maxWidth: '200px', marginBottom: '8px' }} /> : null;
          })()}
          <div style={{ fontSize: '15px', fontFamily: 'Arial, Verdana, sans-serif', lineHeight: '1.5', textAlign: 'justify' }}>{truncateContent(p.content)}</div>
          {canEdit(auth.roles) && (
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
              {/* <button onClick={() => onEditPost(p)}>Sửa</button> */}
              {onEditPost2 && (
                <button onClick={() => onEditPost2(p)} style={{ marginLeft: 8 }}>Chỉnh sửa
                </button>
              )}
              <button onClick={() => onDelete(p.id)} style={{ marginLeft: 8 }}>Xóa
              </button>
            </div>
          )}
        </article>
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center', justifyContent: 'flex-end' }}>
        <select
          value={size}
          onChange={(e) => {
            setPage(0);
            setSize(parseInt(e.target.value));
          }}
        >
          <option value={10}> 10 </option>
          <option value={20}> 20 </option>
          <option value={50}> 50 </option>
        </select>

        <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={data.number <= 0}>
          « Trước
        </button>
        <span>
          Trang {data.number + 1} / {Math.max(1, data.totalPages)}
        </span>
        <button
          onClick={() => setPage((p) => (p + 1 < data.totalPages ? p + 1 : p))}
          disabled={data.number + 1 >= data.totalPages}
        >
          Sau »
        </button>
      </div>
    </div>
  );
}
