import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../../utils/toastContext';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Header from '../../Header';
import Footer from '../../Footer';
import './3DImageViewer.css';

export default function Model3DViewer() {
  const { error } = useToast();
  const mountRef = useRef(null);
  const wrapperRef = useRef(null);
  const { name } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const modelFromState = location.state?.model;
  const [audio, setAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [model, setModel] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    let scene, camera, renderer, controls;

    const resizeRenderer = () => {
      if (renderer && mountRef.current && camera) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    };

    const handleFullscreenChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      setTimeout(resizeRenderer, 300); // ensure DOM update before resize
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('resize', resizeRenderer);

    if (!modelFromState) {
      console.error("Model not found");
      return;
    }
    setModel(modelFromState);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    const canvas = container.querySelector('canvas');
    if (canvas) container.removeChild(canvas); // Chỉ xoá canvas cũ

    container.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(0, 10, 10);
    scene.add(dirLight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Extract file ID from either direct Google Drive URL or proxy URL
    let fileId = null;
    let proxyUrl = modelFromState.url;
    
    // Check if it's a direct Google Drive URL
    const driveMatch = modelFromState.url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch) {
      fileId = driveMatch[1];
      proxyUrl = `http://localhost:9090/api/ggdrive/proxy/drive?id=${fileId}&name=${modelFromState.name}`;
    } 
    // Check if it's already a proxy URL
    else if (modelFromState.url.includes('/api/ggdrive/proxy/drive')) {
      // Use the URL as is
      const urlParams = new URLSearchParams(new URL(modelFromState.url).search);
      fileId = urlParams.get('id');
    }

    if (!fileId) {
      setLoading(false);
      console.error("URL không hợp lệ. Vui lòng sử dụng URL Google Drive hoặc URL proxy hợp lệ.");
      return;
    }

    const loader = new GLTFLoader();
    loader.load(
      proxyUrl,
      gltf => {
        scene.add(gltf.scene);
        setLoading(false);
        animate();
      },
      undefined,
      err => {
        setLoading(false);
        console.error("Không thể hiển thị mô hình: ", err.message);
      }
    );

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    const bgm = new Audio('/audio/music.mp3');
    bgm.preload = 'auto';
    // bgm.loop = true;
    setAudio(bgm);

    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('resize', resizeRenderer);
    };
  }, [modelFromState]);

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
    const elem = wrapperRef.current;
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
    // Gọi resize lại khi trạng thái fullscreen thay đổi
    const resizeRenderer = () => {
      const canvas = mountRef.current;
      if (canvas && canvas.firstChild && canvas.firstChild.tagName === 'CANVAS') {
        const rendererDom = canvas.firstChild;
        rendererDom.style.width = '100%';
        rendererDom.style.height = '100%';
      }
    };

    resizeRenderer();
  }, [isFullscreen]);
  return (
  <div className="dashboard-container">
    <Header />
    {loading && <div className="loader"></div>}
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
          <div className="model-canvas" ref={mountRef}>
            <button className="fullscreen-icon" onClick={enterFullscreen}>⛶</button>
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
            <h3>Mô tả mô hình: {model?.name?.replace(/\.[^/.]+$/, "")}</h3>
            <p>
              {model?.note}
            </p>
          </div>
        )}
      </div>
    </main>
    <Footer />
  </div>
);
  
}
