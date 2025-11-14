import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../../utils/toastContext';
import Header from '../../Header';
import Footer from '../../Footer';
import './NormalImageViewer.css';

export default function NormalImageViewer() {
  const { error } = useToast();
  const { name } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const imageFromState = location.state?.image;
  const [audio, setAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');

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

  useEffect(() => {
    if (!imageFromState) {
      console.error("Image not found");
      navigate('/images');
      return;
    }
    setImageData(imageFromState);

    const audioElement = new Audio('/audio/music.mp3');
    audioElement.preload = 'auto';
    setAudio(audioElement);

    return () => {
      audioElement.pause();
      audioElement.currentTime = 0;
    };
  }, [imageFromState, navigate]);

  const handlePlayMusic = () => {
    if (audio) {
      audio.play().catch(e => console.error('Audio playback failed:', e));
      setIsPlaying(true);
    }
  };

  const handleStopMusic = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const goBack = () => {
    handleStopMusic();
    // Navigate back to /images with the correct tab and page information
    const activeTab = location.state?.activeTab || 'EDE';
    const currentPage = location.state?.currentPage || 0;
    navigate('/images', { 
      state: { 
        activeTab, 
        currentPage 
      } 
    });
  };

  const enterFullscreen = () => {
    const elem = document.querySelector('.image-viewer');
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

  // Handle fullscreen change
  const handleFullscreenChange = () => {
    const fs = !!document.fullscreenElement;
    setIsFullscreen(fs);
  };

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

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

        <div className={`image-viewer ${isFullscreen ? 'fullscreen-mode' : ''}`} style={{
          backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5'
        }}>
          <div className="viewer-layout" style={{
            backgroundColor: isDarkMode ? '#1e1e1e' : 'transparent'
          }}>
            <div className="viewer-left" style={{
              backgroundColor: isDarkMode ? '#2b2b2b' : 'white'
            }}>
              <div className="image-container">
                <img
                  src={imageData?.url || imageData?.thumbnailUrl}
                  alt={imageData?.name}
                  className="main-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="image-error" style={{ 
                  display: 'none',
                  backgroundColor: isDarkMode ? '#333' : '#f8f9fa',
                  color: isDarkMode ? '#e0e0e0' : '#6c757d'
                }}>
                  <div className="error-message">
                    <p>Không thể tải hình ảnh</p>
                    <p>Image could not be loaded</p>
                  </div>
                </div>
                {/* <button className="fullscreen-icon" onClick={enterFullscreen}>⛶</button> */}
              </div>
            </div>

            {!isFullscreen && (
              <div className="viewer-right" style={{
                backgroundColor: isDarkMode ? '#2b2b2b' : 'white'
              }}>
                {imageData?.ethnic && (
                  <div className="image-info">
                    <p style={{ color: isDarkMode ? '#e0e0e0' : '#555' }}>
                      <strong style={{ color: isDarkMode ? '#fff' : '#333' }}>Dân tộc:</strong> {imageData.ethnic}
                    </p>
                  </div>
                )}
                <h3 style={{ color: isDarkMode ? '#fff' : '#333' }}>
                  Mô tả hình ảnh: {imageData?.name?.replace(/\.[^/.]+$/, "")}
                </h3>
                <p style={{ color: isDarkMode ? '#e0e0e0' : '#666' }}>
                  {imageData?.note}
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
