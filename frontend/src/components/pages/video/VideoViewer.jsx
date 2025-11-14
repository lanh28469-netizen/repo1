import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './VideoViewer.css';
import Header from '../../Header';
import Footer from '../../Footer';

export default function VideoViewer() {
  const videoRef = useRef(null);
  const wrapperRef = useRef(null);
  const { name } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const videoFromState = location.state?.video;
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [error, setError] = useState(null);

  // Listen for theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      setIsDarkMode(document.body.classList.contains('dark-mode'));
    };

    // Listen for storage changes (when theme is changed in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'theme') {
        setIsDarkMode(e.newValue === 'dark');
      }
    };

    // Listen for custom theme change event
    window.addEventListener('themeChanged', handleThemeChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Handle fullscreen change
  const handleFullscreenChange = () => {
    const fs = !!document.fullscreenElement;
    setIsFullscreen(fs);
  };

  useEffect(() => {
    // Set up fullscreen event listener
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    setLoading(true);
    setError(null);

    if (!videoFromState) {
      console.error('Video not found');
      navigate('/videos');
      return;
    }

    setVideoData(videoFromState);

    // Prepend API base URL for proxy URLs
    const API_BASE = 'http://localhost:9090';
    const videoUrl = videoFromState.url.startsWith('/api') ? API_BASE + videoFromState.url : videoFromState.url;

    // Set video source
    if (videoRef.current) {
      videoRef.current.src = videoUrl;
      videoRef.current.load();
    }

    // Cleanup function
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [videoFromState, navigate]);

  const handleVideoLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleVideoError = (error) => {
    setLoading(false);
    setError('error');
  };

  // Navigate back to the previous page
  const goBack = () => {
    // Navigate back to /videos with the correct tab and page information
    const activeTab = location.state?.activeTab || 'EDE';
    const currentPage = location.state?.currentPage || 0;
    navigate('/videos', { 
      state: { 
        activeTab, 
        currentPage 
      } 
    });
  };

  const enterFullscreen = () => {
    const elem = document.querySelector('.video-viewer');
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    } else {
      setIsFullscreen(false);
    }
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

        <div className={`video-viewer ${isFullscreen ? 'fullscreen-mode' : ''}`} style={{
          backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5'
        }}>
          <div className="viewer-layout" style={{
            backgroundColor: isDarkMode ? '#1e1e1e' : 'transparent'
          }}>
            <div className="viewer-left" style={{
              backgroundColor: isDarkMode ? '#2b2b2b' : 'white'
            }}>
              <div className="video-container">
                {loading && !error && (
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
                      <p>Không thể tải video</p>
                      <p>Video could not be loaded</p>
                    </div>
                  </div>
                )}
                <video
                  ref={videoRef}
                  controls
                  onLoadedData={handleVideoLoad}
                  onError={handleVideoError}
                  className="main-video"
                  style={{ display: loading || error ? 'none' : 'block' }}
                />
              </div>
            </div>

            {!isFullscreen && (
              <div className="viewer-right" style={{
                backgroundColor: isDarkMode ? '#2b2b2b' : 'white'
              }}>
                {videoData?.ethnic && (
                  <div className="video-info">
                    <p style={{ color: isDarkMode ? '#e0e0e0' : '#555' }}>
                      <strong style={{ color: isDarkMode ? '#fff' : '#333' }}>Dân tộc:</strong> {videoData.ethnic}
                    </p>
                  </div>
                )}
                <h3 style={{ color: isDarkMode ? '#fff' : '#333' }}>
                  Mô tả video: {videoData?.name?.replace(/\.[^/.]+$/, "")}
                </h3>
                <p style={{ color: isDarkMode ? '#e0e0e0' : '#666' }}>
                  {videoData?.note != null ? videoData?.note : "Nhà sàn Đắk Lắk 2025"}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
