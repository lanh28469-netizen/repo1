import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchPosts } from '../api';
import Header from '../Header';
import Footer from '../Footer';

export default function SearchResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [data, setData] = useState({ content: [], totalPages: 0, number: 0 });
  const isLoadingRef = useRef(false);

  // Get search query from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q') || '';
    setQ(query);
    setDebouncedQ(query);
    setPage(0); // Reset to first page when query changes
  }, [location.search]);

  const load = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      const params = new URLSearchParams(location.search);
      const query = params.get('q') || '';
      const trimmed = (debouncedQ) ? (debouncedQ || '').trim() : query.trim();
      const effectiveQ = trimmed.length >= 3 ? trimmed : '';
      setData(await fetchPosts({ page, size, q: effectiveQ }));
    } finally {
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    load();
  }, [debouncedQ, page, size]);

  // Debounce the search input by 1200ms
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQ(q), 1200);
    return () => clearTimeout(handler);
  }, [q]);

  const truncateContent = (htmlContent, maxLength = 1200) => {
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
      <Header />
      
      <main style={{ minHeight: 'calc(100vh - 140px)', padding: '20px', backgroundColor: '#f8f9fa' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <input
              value={q}
              onChange={(e) => {
                setPage(0);
                setQ(e.target.value);
              }}
              placeholder="Nhập từ tìm kiếm từ 3 ký tự..."
              style={{ flex: 1, padding: '8px 10px' }}
            />
          </div>

          {debouncedQ && <h2>Kết quả tìm kiếm cho: "{q}"</h2>}
          
          {data.content.length === 0 && debouncedQ && (
            <p>Không tìm thấy kết quả nào cho "{debouncedQ}"</p>
          )}
          
          {data.content.map((p) => (
            <article key={p.id} style={{ borderBottom: '1px solid #eee', backgroundColor: 'white', padding: '30px', marginBottom: '15px', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginBottom: 6, fontWeight: 'bold', fontSize: '1.2em' }}>
                <button
                  onClick={() => navigate(`/post/${p.id}`)}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#0b5ed7', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2em', textAlign: 'left' }}
                >
                  {p.title}
                </button>
              </h3>
              {(() => {
                const firstImg = getFirstImage(p.content);
                return firstImg ? <img src={firstImg} alt="Post image" style={{ maxWidth: '200px', marginBottom: '8px' }} /> : null;
              })()}
              <div style={{ fontSize: '15px', fontFamily: 'Arial, Verdana, sans-serif', lineHeight: '1.5', color: '#333', textAlign: 'justify' }}
                dangerouslySetInnerHTML={{ __html: truncateContent(p.content) }}></div>
              <div style={{
                marginTop: '12px',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <span 
                  onClick={() => navigate(`/post/${p.id}`)}
                  style={{
                    color: '#007bff',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontStyle: 'italic',
                    textDecoration: 'underline'
                  }}
                >
                  Xem tiếp
                </span>
              </div>
            </article>
          ))}

          <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center', justifyContent: 'flex-end' }}>
            <select
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
      </main>
      
      <Footer />
    </div>
  );
}