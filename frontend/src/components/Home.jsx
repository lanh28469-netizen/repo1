import React, { useState, useEffect } from 'react';
import './Home.css';
import Header from './Header';
import Footer from './Footer';
import VietnamMapViewer from './VietnamMapViewer';
import Slideshow from './Slideshow';
import PostsSection from './PostsSection';
import { getHome, getAbout, fetchPostsByCategory, fetchImages, getListVideoMp4 } from './api';

const Home = () => {
  const [homePost, setHomePost] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleProvinceClick = (provinceName) => {
  };

  const fetchOtherData = async (lang) => {
    // 2. getAbout - Check localStorage first
    await getAbout(lang);
    
    // 3. fetchPostsByCategory - EDE - Check IndexedDB first
    await fetchPostsByCategory({ category: 'EDE', language: lang });
    
    // 4. fetchPostsByCategory - JRAI - Check IndexedDB first
    await fetchPostsByCategory({ category: 'JRAI', language: lang });
    
    // 5. fetchPostsByCategory - MNONG - Check IndexedDB first
    await fetchPostsByCategory({ category: 'MNONG', language: lang });

    // 6. Fetch images by ethnic in order: EDE, JRAI, MNONG - Check IndexedDB first

    // 6.1 EDE Images
    await fetchImages({ ethnic: 'EDE', page: 0, size: 10, language: lang });

    // 6.2 JRAI Images
    await fetchImages({ ethnic: 'JRAI', page: 0, size: 10, language: lang });

    // 6.3 MNONG Images
    await fetchImages({ ethnic: 'MNONG', page: 0, size: 10, language: lang });

    // 7. Fetch and cache videos - Check IndexedDB first
    await getListVideoMp4({ page: 0, size: 10, language: lang });
  };

  const loadHomePosts = async (langOverride) => {
    setLoading(true);
    try {
      const lang = langOverride || localStorage.getItem('lang') || 'vi';
      
      // First try to get data from localStorage
      const storedHomeData = localStorage.getItem(`homeData_${lang}`);
      if (storedHomeData) {
        const parsedData = JSON.parse(storedHomeData);
        setHomePost(parsedData);
        setLoading(false);
        
        // Still fetch other data in background
        fetchOtherData(lang);
        return;
      }
      
      // 1. getHome - If no data in localStorage, fetch from API
      const data = await getHome(lang);
      setHomePost(data);
      
      // Store home data in localStorage for future use
      localStorage.setItem(`homeData_${lang}`, JSON.stringify(data));
      
      // Fetch other data in order: getAbout, fetchPostsByCategory (3 categories)
      // Note: getNews is handled by PostsSection component
      await fetchOtherData(lang);
    } catch (error) {
      console.error('Error fetching home posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomePosts();
  }, []);

  useEffect(() => {
    const onLanguageChanged = (e) => {
      const lang = e?.detail?.lang || localStorage.getItem('lang') || 'vi';
      loadHomePosts(lang);
    };
    window.addEventListener('languageChanged', onLanguageChanged);
    return () => window.removeEventListener('languageChanged', onLanguageChanged);
  }, []);

  return (
    <div className="dashboard-container">
      <Header />

      <Slideshow />

      {/* Main Content */}
      <main className="main-content">
        <div className="map-column">
          <VietnamMapViewer
            svgPath="/vietnam_map_detailed.svg"
            onProvinceClick={handleProvinceClick}
          />
        </div>
        <div className="article-column">
          {/* Display home post content and title */}
          {!loading && homePost && (
            <div className="home-posts-section">
              <div className="home-post-item">
                <h2 className="home-post-title">
                  {homePost.title}
                </h2>
                <div className="home-post-content"
                  dangerouslySetInnerHTML={{ __html: homePost.content }}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      <PostsSection />
      <Footer />
    </div>
  );
};

export default Home;
