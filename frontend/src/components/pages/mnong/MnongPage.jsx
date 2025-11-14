import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../Header';
import Footer from '../../Footer';
import { fetchPostsByCategory } from '../../api';

export default function MnongPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ content: [] });
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const language = localStorage.getItem('lang') || 'vi';

  // Listen for theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      setIsDarkMode(document.body.classList.contains('dark-mode'));
    };

    // Listen for storage changes (when theme is changed in another tab)
    window.addEventListener('storage', (e) => {
      if (e.key === 'theme') {
        handleThemeChange();
      }
    });

    // Listen for custom theme change events
    window.addEventListener('themeChanged', handleThemeChange);

    return () => {
      window.removeEventListener('storage', handleThemeChange);
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [language]);

  useEffect(() => {
    const load = async () => {
      try {
        // First try to get data from localStorage (only for page 0)
        if (currentPage === 0) {
          const storedData = localStorage.getItem(`mnongData_${language}`);
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            setData(parsedData);
            setTotalPages(parsedData.totalPages || 0);
            return;
          }
        }
        
        // If no data in localStorage or not page 0, fetch from API
        const result = await fetchPostsByCategory({ category: 'MNONG', language, page: currentPage, size: 5 });
        setData(result);
        setTotalPages(result.totalPages || 0);
        
        // Store in localStorage for future use (only for page 0)
        if (currentPage === 0) {
          localStorage.setItem(`mnongData_${language}`, JSON.stringify(result));
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };
    load();
  }, [language, currentPage]);

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

  const handlePostClick = (id) => {
    navigate(`/post/${id}`);
  };

  return (
    <div className="dashboard-container" style={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh'
    }}>
      <Header />
      <main className="main-content" style={{ 
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        flex: 1
      }}>
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          width: '100%',
          maxWidth: '1200px'
        }}>
          {/* Breadcrumb */}
          <div style={{
            marginBottom: '10px',
            padding: '10px 0'
          }}>
            <span 
              onClick={() => navigate('/')} 
              style={{
                color: '#007bff',
                cursor: 'pointer',
                fontWeight: '500',
                textDecoration: 'underline'
              }}
            >
            {language === 'en' ? 'Home page' : 'Trang chủ'}
            </span>
            <span style={{ margin: '0 8px', color: '#666' }}>/</span>
            <span style={{ color: '#333', fontWeight: '500' }}>{language === 'en' ? 'Mnong Longhouse' : 'Nhà dài M\'nông'}</span>
          </div>
          {data.content.map((p) => (
            <article key={p.id} style={{ 
              padding: '20px 0', 
              borderBottom: '1px solid #eee', 
              display: 'block',
              width: '100%',
              clear: 'both'
            }}>
              <h3 onClick={() => handlePostClick(p.id)} style={{ 
                marginBottom: '25px', 
                fontWeight: 'bold', 
                fontSize: '1.3em', 
                cursor: 'pointer',
                color: isDarkMode ? '#fff' : '#333',
                display: 'block',
                width: '100%'
              }}>
                {p.title}
              </h3>
              {(() => {
                const firstImg = getFirstImage(p.content);
                return firstImg ? (
                  <div style={{ 
                    marginBottom: '20px',
                    display: 'block',
                    width: '100%'
                  }}>
                    <img 
                      onClick={() => handlePostClick(p.id)} 
                      src={firstImg} 
                      alt="Post image" 
                      style={{ 
                        maxWidth: '300px', 
                        width: '100%',
                        height: 'auto',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'block'
                      }} 
                    />
                  </div>
                ) : null;
              })()}
              <div style={{ 
                lineHeight: '1.5',
                color: isDarkMode ? '#e0e0e0' : '#555',
                display: 'block',
                width: '100%',
                fontSize: '15px',
                fontFamily: 'Arial, Verdana, sans-serif',
                textAlign: 'justify'
              }}>
                {truncateContent(p.content)}
              </div>
              <div style={{
                marginTop: '12px',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <span 
                  onClick={() => handlePostClick(p.id)} 
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
        </div>
      </main>
      <div style={{ textAlign: 'right', margin: '20px' }}>
        <button onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))} disabled={currentPage === 0}>Previous</button>
        <span style={{ margin: '0 10px' }}>Page {currentPage + 1} of {totalPages}</span>
        <button onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))} disabled={currentPage >= totalPages - 1}>Next</button>
      </div>
      <Footer />
    </div>
  );
}