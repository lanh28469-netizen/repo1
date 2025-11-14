import React, { useState, useEffect } from 'react';
import { getNews } from './api';
import postsCache from './utils/postsIndexedDB';

const PostsSection = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = async (langOverride) => {
    setLoading(true);
    try {
      const lang = langOverride || localStorage.getItem('lang') || 'vi';
      const cacheKey = `news_${lang}`;
      
      // First try to get data from IndexedDB
      const cachedData = await postsCache.get(cacheKey);
      if (cachedData) {
        // getNews returns a list now; fallback to common paginated shapes
        const normalized = Array.isArray(cachedData) ? cachedData : (cachedData?.content || cachedData?.items || cachedData?.data || []);
        setPosts(normalized);
        setLoading(false);
        return;
      }
      
      // If no data in IndexedDB, fetch from API
      const data = await getNews(lang);
      // getNews returns a list now; fallback to common paginated shapes
      const normalized = Array.isArray(data) ? data : (data?.content || data?.items || data?.data || []);
      setPosts(normalized);
      
      // Store in IndexedDB for future use with 10 minutes TTL
      try {
        await postsCache.set(cacheKey, data, 10 * 60 * 1000);
      } catch (cacheError) {
        console.error('Error saving to IndexedDB:', cacheError);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    const onLanguageChanged = (e) => {
      const lang = e?.detail?.lang || localStorage.getItem('lang') || 'vi';
      loadPosts(lang);
    };
    window.addEventListener('languageChanged', onLanguageChanged);
    return () => window.removeEventListener('languageChanged', onLanguageChanged);
  }, []);

  const truncateText = (text, maxLength = 500) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const extractImageFromContent = (content) => {
    if (!content) return null;
    
    // Tìm thẻ img đầu tiên trong content HTML với nhiều pattern khác nhau
    const patterns = [
      /<img[^>]+src="([^"]+)"/i,           // src="url"
      /<img[^>]+src='([^']+)'/i,           // src='url'
      /<img[^>]+src=([^\s>]+)/i,           // src=url (không có quotes)
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        let imageUrl = match[1];
        // Loại bỏ quotes nếu có
        imageUrl = imageUrl.replace(/^["']|["']$/g, '');
        return imageUrl;
      }
    }
    
    return null;
  };

  const stripHtmlTags = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const currentLang = localStorage.getItem('lang') || 'vi';

  return (
    <section className="posts-section">
      <div className="posts-container">
        <div className="posts-header">
          <h2 className="posts-title">{currentLang === 'en' ? 'News' : 'Bài Viết'}</h2>
          <a href="/search" className="view-all-btn">
            {currentLang === 'en' ? 'View all' : 'Xem tất cả'}
          </a>
        </div>
        {loading ? (
          <div className="posts-loading">{currentLang === 'en' ? 'Loading...' : 'Đang tải...'}</div>
        ) : (
          <div className="posts-grid">
             {posts.map((post, index) => {
               const imageUrl = extractImageFromContent(post.content);
               const cleanContent = stripHtmlTags(post.content);
               
               return (
                 <a key={post.id || index} href={`/post/${post.id}`} className="post-preview">
                   <div className="post-image">
                     {imageUrl ? (
                       <img src={imageUrl} alt={post.title} />
                     ) : (
                       <div className="post-image-placeholder">
                         <i className="fas fa-image"></i>
                       </div>
                     )}
                   </div>
                  <div className="post-section-content">
                    <h3 className="post-section-title post-section-title-text">{post.title}</h3>
                     <p className="post-section-description">
                      {truncateText(cleanContent, 300)}
                     </p>
                   </div>
                 </a>
               );
             })}
          </div>
        )}
      </div>
    </section>
  );
};

export default PostsSection;
