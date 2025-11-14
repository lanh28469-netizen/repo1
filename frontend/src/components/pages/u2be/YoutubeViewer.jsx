import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import '../video/VideoViewer.css';
import Header from '../../Header';
import Footer from '../../Footer';
import api from '../../api';

export default function YoutubeViewer() {
  const { clipId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const videoFromState = location.state?.video;
  const [embedUrl, setEmbedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDarkMode(document.body.classList.contains('dark-mode'));
    };
    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  useEffect(() => {
    setLoading(true);
    const normalizeEmbed = (url) => {
      if (!url) return null;
      // Already an embed URL
      if (url.includes('/embed/')) return url;
      // Convert watch URL
      const vIdx = url.indexOf('v=');
      if (url.startsWith('https://www.youtube.com/watch') && vIdx > -1) {
        const id = url.substring(vIdx + 2).split('&')[0];
        return `https://www.youtube.com/embed/${id}`;
      }
      // Convert youtu.be short link
      if (url.startsWith('https://youtu.be/')) {
        const id = url.split('/').pop().split('?')[0];
        return `https://www.youtube.com/embed/${id}`;
      }
      // Fallback assume it's an id
      if (!url.includes('/') && !url.includes('=')) {
        return `https://www.youtube.com/embed/${url}`;
      }
      return url;
    };

    const fetchEmbedUrl = async () => {
      try {
        const { data } = await api.get(`/api/u2be/clip/${clipId}/embed`, { responseType: 'text' });
        const url = typeof data === 'string' ? data : String(data || '');
        setEmbedUrl(normalizeEmbed(url));
      } catch (err) {
        setError('Failed to load video');
        console.error('Error fetching embed URL:', err);
      }
    };

    if (clipId) {
      fetchEmbedUrl();
    }
  }, [clipId]);

  const goBack = () => {
    const currentPage = location.state?.currentPage || 0;
    navigate('/u2be', { state: { currentPage } });
  };

  return (
    <div className="dashboard-container">
      <Header />
      <main className="main-content" style={{
        flex: 1,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5'
      }}>
        <a href="#"
          onClick={(e) => { e.preventDefault(); goBack(); }}
          style={{
            marginBottom: '20px',
            display: 'inline-block',
            color: isDarkMode ? '#4a9eff' : '#007bff',
            textDecoration: 'none'
          }}>
          ← {localStorage.getItem('lang') === 'en' ? 'Back' : 'Quay lại'}
        </a>

        <div className="video-viewer" style={{
          backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5'
        }}>
          <div className="viewer-layout" style={{
            backgroundColor: isDarkMode ? '#1e1e1e' : 'transparent'
          }}>
            <div className="viewer-left" style={{
              backgroundColor: isDarkMode ? '#2b2b2b' : 'white'
            }}>
              <div className="video-container">
                {loading && (
                  <div className="video-error" style={{ 
                    backgroundColor: isDarkMode ? '#333' : '#f8f9fa',
                    color: isDarkMode ? '#e0e0e0' : '#6c757d',
                    transform: 'translateY(-150px)'
                  }}>
                    {localStorage.getItem('lang') === 'en' ? 'Loading video...' : 'Đang tải video...'}
                  </div>
                )}
                {error && (
                  <div className="video-error" style={{ 
                    backgroundColor: isDarkMode ? '#333' : '#f8f9fa',
                    color: isDarkMode ? '#e0e0e0' : '#6c757d'
                  }}>
                    <div className="error-message">
                      <p>{localStorage.getItem('lang') === 'en' ? 'Failed to load video' : 'Không thể tải video'}</p>
                    </div>
                  </div>
                )}
                {embedUrl && !error && (
                  <iframe
                    src={embedUrl || ''}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="main-video"
                    style={{ height: '75vh' }}
                    onLoad={() => setLoading(false)}
                  />
                )}
              </div>
            </div>

            <div className="viewer-right" style={{
              backgroundColor: isDarkMode ? '#2b2b2b' : 'white'
            }}>
              {videoFromState?.ethnic && (
                <div className="video-info">
                  <p style={{ color: isDarkMode ? '#e0e0e0' : '#555' }}>
                    <strong style={{ color: isDarkMode ? '#fff' : '#333' }}>Dân tộc:</strong> {videoFromState.ethnic}
                  </p>
                </div>
              )}
              <h3 style={{ color: isDarkMode ? '#fff' : '#333' }}>
                {localStorage.getItem('lang') === 'en' ? 'Video description:' : 'Mô tả video:'} {videoFromState?.name || clipId}
              </h3>
              {videoFromState?.note && (
                <p style={{ color: isDarkMode ? '#e0e0e0' : '#666' }}>
                  {videoFromState.note}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
