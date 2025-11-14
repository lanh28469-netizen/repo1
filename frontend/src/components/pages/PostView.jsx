import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../Header';
import Footer from '../Footer';
import './PostView.css';
import { getPost } from '../api';

export default function PostView({ post: propPost, onBack }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(propPost || null);
  const [loading, setLoading] = useState(!propPost);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const contentRef = useRef(null);

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
    if (propPost) {
      setPost(propPost);
      setLoading(false);
    } else {
      const loadPost = async () => {
        try {
          const result = await getPost(id);
          setPost(result);
        } catch (err) {
          setError('Failed to load post');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      loadPost();
    }
  }, [id, propPost]);

  useEffect(() => {
    if (post && contentRef.current) {
      // Make images and videos responsive
      const imgs = contentRef.current.getElementsByTagName('img');
      for (let img of imgs) {
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.loading = 'lazy';
      }

      const videos = contentRef.current.getElementsByTagName('video');
      for (let v of videos) {
        v.style.maxWidth = '100%';
        v.style.height = 'auto';
        v.setAttribute('controls', '');
      }

      // Wrap iframes in responsive container if not already wrapped
      const iframes = contentRef.current.getElementsByTagName('iframe');
      for (let iframe of Array.from(iframes)) {
        const parent = iframe.parentElement;
        if (!parent.classList.contains('iframe-wrapper')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'iframe-wrapper';
          parent.replaceChild(wrapper, iframe);
          wrapper.appendChild(iframe);
        }
      }
    }
  }, [post]);

  if (loading) return (
    <div className="dashboard-container">
      <Header />
      <main className="main-content" style={{ padding: '20px', textAlign: 'center' }}>
        Loading...
      </main>
      <Footer />
    </div>
  );

  if (error) return (
    <div className="dashboard-container">
      <Header />
      <main className="main-content" style={{ padding: '20px', textAlign: 'center' }}>
        {error}
        <br />
        <a href="#" onClick={(e) => { e.preventDefault(); navigate(-1); }}>Go Back</a>
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="dashboard-container post-view-container">
      <Header />
      <main className="main-content post-main">
        <a href="#"
          onClick={(e) => { e.preventDefault(); onBack ? onBack() : navigate(-1); }}
          className="post-back">
          ← {localStorage.getItem('lang') === 'en' ? 'Back' : 'Quay lại'}
        </a>
        <h1 style={{ color: isDarkMode ? '#fff' : 'inherit' }} className="post-title">{post.title}</h1>
        <div ref={contentRef} style={{ color: isDarkMode ? '#e0e0e0' : 'inherit' }} className="post-content"
          dangerouslySetInnerHTML={{ __html: post.content }} />
      </main>
      <Footer />
    </div>
  );
}
