import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Viewer } from '@photo-sphere-viewer/core';
import { GyroscopePlugin } from '@photo-sphere-viewer/gyroscope-plugin';
import '@photo-sphere-viewer/core/index.css';
import './360ImageViewer.css';
import Header from '../../Header';
import Footer from '../../Footer';

export default function Image360Viewer() {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const { name } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const imageFromState = location.state?.image;
  const [audio, setAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const viewerRef = useRef(null);

  const enterFullscreen = () => {
    const elem = wrapperRef.current;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  };

  // Handle fullscreen change
  const handleFullscreenChange = () => {
    const fs = !!document.fullscreenElement;
    setIsFullscreen(fs);
    if (viewerRef.current) {
      viewerRef.current.autoSize();
    }
  };

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
    // Set up fullscreen event listener
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    setLoading(true);

    if (!imageFromState) {
      console.error('Image not found');
      navigate('/360');
      return;
    }

    setImageData(imageFromState);

    // Prepend API base URL for proxy URLs
    const API_BASE = 'http://localhost:9090';
    const panoramaUrl = imageFromState.url.startsWith('/api') ? API_BASE + imageFromState.url : imageFromState.url;

    // Initialize the viewer
    if (containerRef.current) {
      const viewer = new Viewer({
        container: containerRef.current,
        panorama: panoramaUrl,
        loadingTxt: 'Loading...',
        defaultYaw: '0deg',
        defaultPitch: '0deg',
        size: {
          width: '100%',
          height: '100%',
        },
        panoData: imageFromState.manual360 ? {
          fullWidth: imageFromState.fullWidth,
          fullHeight: imageFromState.fullHeight,
          croppedWidth: imageFromState.croppedWidth,
          croppedHeight: imageFromState.croppedHeight,
          croppedX: imageFromState.croppedX,
          croppedY: imageFromState.croppedY
        } : undefined,
        plugins: [
          [GyroscopePlugin, {
            // Gyroscope plugin options
          }]
        ]
      });

      // Store the viewer instance
      viewerRef.current = viewer;

      // Set up event listeners
      const onLoad = () => {
        setLoading(false);
      };

      const onError = (error) => {
        console.error('Viewer error:', error);
        setLoading(false);
      };

      viewer.addEventListener('ready', onLoad);
      viewer.addEventListener('error', onError);

      const audioElement = new Audio('/audio/music.mp3');
      audioElement.preload = 'auto';
      //audioElement.loop = true;
      setAudio(audioElement);

      // Cleanup function
      return () => {
        viewer.removeEventListener('ready', onLoad);
        viewer.removeEventListener('error', onError);
        if (viewerRef.current) {
          viewerRef.current.destroy();
          viewerRef.current = null;
        }
      };
    }

    // Cleanup function for the effect
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [imageFromState]);

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

  // Navigate back to the previous page
  const goBack = () => {
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

  return (
    <div className="dashboard-container">
      <Header />
      {loading}
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

        <div className={`viewer-layout ${isFullscreen ? 'fullscreen-mode' : ''}`} ref={wrapperRef}>
          <div className="viewer-left">
            <div className="viewer" ref={containerRef}>
            </div>
            <div className="controls">
              {!isPlaying ? (
                <button onClick={handlePlayMusic}>🔊 Play audio</button>
              ) : (
                <button onClick={handleStopMusic}>🔈 Pause</button>
              )}
            </div>
          </div>
  
          {!isFullscreen && (
            <div className="viewer-right">
              <h3>Mô tả hình ảnh: {imageData?.name?.replace(/\.[^/.]+$/, "")}</h3>
              <p>
                {imageData?.note}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}