import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFromU2bePlaylist } from '../../api';
import videosCache from '../../utils/videosIndexedDB';
import Header from '../../Header';
import Footer from '../../Footer';
import fallbackThumbnail from '../../styles/thumbnails/video.jpg';
import './YoutubePlayList.css';

export default function YoutubePlayList() {
   const [videos, setVideos] = useState([]);
   const [currentPage, setCurrentPage] = useState(0);
   const [totalPages, setTotalPages] = useState(0);
   const [loading, setLoading] = useState(true);
   const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
   const itemsPerPage = 10;
   const navigate = useNavigate();
   const language = localStorage.getItem('lang') || 'vi';

  // Listen for theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      setIsDarkMode(localStorage.getItem('theme') === 'dark');
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const cacheKey = `u2be_${currentPage}_${itemsPerPage}`;
        const cachedData = await videosCache.get(cacheKey);
        if (cachedData && cachedData.content) {
          setVideos(cachedData.content);
          setTotalPages(cachedData.totalPages || Math.ceil(cachedData.content.length / itemsPerPage));
          setLoading(false);
          return;
        }

        const response = await getFromU2bePlaylist({ page: currentPage, size: itemsPerPage });
        if (response && response.content) {
          setVideos(response.content);
          setTotalPages(response.totalPages);
          await videosCache.set(cacheKey, response, 10 * 60 * 1000);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [currentPage]);

  const handleVideoClick = (video) => {
    navigate(`/u2be/${video.id}`, { state: { video, currentPage } });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`pagination-button ${currentPage === i ? 'active' : ''}`}
        >
          {i + 1}
        </button>
      );
    }

    return (
      <div className="pagination">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="pagination-button"
        >
          Previous
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="pagination-button"
        >
          Next
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-container">
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
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '200px',
            fontSize: '18px',
            color: '#666',
            width: '100%'
          }}>
            {language === 'en' ? 'Loading videos...' : 'Đang tải video...'}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
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
             padding: '10px 0',
             textAlign: 'left'
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
            <span style={{ color: '#333', fontWeight: '500' }}>
              {language === 'en' ? 'Video Playlist' : 'Danh sách video'}
            </span>
          </div>

          {/* Videos Grid */}
          {(() => {
            if (videos.length > 0) {
              return (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '20px',
                  marginBottom: '20px'
                }}>
                  {videos.map((video) => (
                    <div key={video.id || video.name} style={{
                      cursor: 'pointer',
                      overflow: 'hidden',
                      transition: 'transform 0.3s ease',
                      backgroundColor: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onClick={() => handleVideoClick(video)}
                    tabIndex={0}
                    role="button"
                    aria-label={language === 'en' ? `Play video ${video.name}` : `Phát video ${video.name}`}
                    >
                      <img
                        src={video.thumbnailUrl || fallbackThumbnail}
                        alt={video.name}
                        onError={(e) => { e.target.src = fallbackThumbnail; }}
                        style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
                      />
                      <div style={{ padding: '12px' }}>
                        <span style={{
                          margin: '0 0 8px 0',
                          fontSize: '16px',
                          color: isDarkMode ? '#000' : '#333',
                          lineHeight: '1.4',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          whiteSpace: 'normal',
                          ...(isDarkMode && { color: '#000000', WebkitTextFillColor: '#000000' })
                        }}>
                          {video.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            }
            return (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '200px',
                fontSize: '18px',
                color: '#666',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div>{language === 'en' ? 'No videos found' : 'Không tìm thấy video'}</div>
              </div>
            );
          })()}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              alignItems: 'center',
              gap: '10px',
              marginTop: '40px'
            }}>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))} 
                disabled={currentPage === 0 || loading}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  backgroundColor: currentPage === 0 || loading ? '#f5f5f5' : 'white',
                  color: currentPage === 0 || loading ? '#999' : '#333',
                  cursor: currentPage === 0 || loading ? 'not-allowed' : 'pointer',
                  borderRadius: '4px'
                }}
              >
                {language === 'en' ? 'Previous' : 'Trước'}
              </button>
              <span style={{ 
                padding: '8px 16px',
                fontSize: '14px',
                color: '#666'
              }}>
                {language === 'en' ? 'Page' : 'Trang'} {currentPage + 1} {language === 'en' ? 'of' : 'của'} {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))} 
                disabled={currentPage >= totalPages - 1 || loading}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  backgroundColor: currentPage >= totalPages - 1 || loading ? '#f5f5f5' : 'white',
                  color: currentPage >= totalPages - 1 || loading ? '#999' : '#333',
                  cursor: currentPage >= totalPages - 1 || loading ? 'not-allowed' : 'pointer',
                  borderRadius: '4px'
                }}
              >
                {language === 'en' ? 'Next' : 'Tiếp'}
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
