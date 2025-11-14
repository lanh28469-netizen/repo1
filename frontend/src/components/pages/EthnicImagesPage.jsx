import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../Header';
import Footer from '../Footer';
import { fetchImages } from '../api';
import GenerateGlbThumbnail from '../utils/GenerateGlbThumbnail';
import imagesCache from '../utils/imagesIndexedDB';

export default function EthnicImagesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('EDE');
  const [images, setImages] = useState({ content: [] });
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const language = localStorage.getItem('lang') || 'vi';

  const ethnicGroups = [
    { key: 'EDE', name: language === 'en' ? 'Ede' : 'Ê đê' },
    { key: 'JRAI', name: language === 'en' ? 'Jrai' : 'Gia rai' },
    { key: 'MNONG', name: language === 'en' ? 'Mnong' : 'M\'nông' }
  ];

  // Handle state restoration from navigation
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
    if (location.state?.currentPage !== undefined) {
      setCurrentPage(location.state.currentPage);
    }
  }, [location.state]);

  // Listen for theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      setIsDarkMode(localStorage.getItem('theme') === 'dark');
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  // Pre-fetch next page data function
  const preFetchNextPage = async (ethnic, currentPageNum, totalPagesNum) => {
    // Only pre-fetch if there's a next page and we're not on the last page
    if (currentPageNum < totalPagesNum - 1) {
      const nextPage = currentPageNum + 1;
      const nextPageCacheKey = imagesCache.generateImagesKey({ 
        ethnic, 
        page: nextPage, 
        size: 10 
      });
      
      // Check if next page data is already cached
      const cachedNextPageData = await imagesCache.get(nextPageCacheKey);
      
      // If not cached, fetch and store it
      if (!cachedNextPageData) {
        try {
          console.log(`Pre-fetching next page data for ${ethnic}, page ${nextPage}`);
          const nextPageData = await fetchImages({ 
            ethnic, 
            page: nextPage, 
            size: 10,
            language
          });
          
          // Store in IndexedDB for future use
          await imagesCache.set(nextPageCacheKey, nextPageData, 10 * 60 * 1000);
          console.log(`Successfully pre-fetched and cached data for ${ethnic}, page ${nextPage}`);
        } catch (error) {
          console.error('Error pre-fetching next page data:', error);
        }
      } else {
        console.log(`Next page data for ${ethnic}, page ${nextPage} already cached`);
      }
    }
  };

  // Handle tab changes and page changes with a single effect
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    
    const loadImages = async () => {
      try {
        const result = await fetchImages({ 
          ethnic: activeTab, 
          page: currentPage, 
          size: 10,
          language
        });

        // Only update state if the request wasn't aborted
        if (!signal.aborted) {
          setImages(result);
          setTotalPages(result.totalPages || 0);
          setLoading(false);
          
          // Pre-fetch next page data after successfully loading current page
          // Use setTimeout to avoid blocking the UI update
          setTimeout(() => {
            preFetchNextPage(activeTab, currentPage, result.totalPages || 0);
          }, 100);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching images:', error);
          setImages({ content: [] });
          setTotalPages(0);
        }
      } finally {
        // loading state set earlier
      }
    };

    // Always load images on mount and when dependencies change
    loadImages();

    // Cleanup function to abort the fetch if the component unmounts or dependencies change
    return () => {
      controller.abort();
    };
  }, [activeTab, currentPage]);

  // Reset to first page when changing tabs or clicking the same tab
  const handleTabChange = (ethnicKey) => {
    setCurrentPage(0);
    if (activeTab !== ethnicKey) {
      setActiveTab(ethnicKey);
    }
  };

  const handleImageClick = (image) => {
    // Route to appropriate viewer based on image type, passing current tab and page info
    const navigationState = { 
      image: image, 
      activeTab: activeTab, 
      currentPage: currentPage 
    };
    
    if (image.type === 'MODEL_3D') {
      navigate('/3d/viewer', { state: { model: image, activeTab, currentPage } });
    } else if (image.type === 'PHOTO_360') {
      navigate('/360/viewer', { state: { image: image, activeTab, currentPage } });
    } else if (image.type === 'NORMAL') {
      navigate('/image/viewer', { state: { image: image, activeTab, currentPage } });
    } else {
      // Default to normal image viewer for unknown types
      navigate('/image/viewer', { state: { image: image, activeTab, currentPage } });
    }
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
            <span style={{ color: '#333', fontWeight: '500' }}>
              {language === 'en' ? 'Ethnic Images' : 'Hình ảnh dân tộc'}
            </span>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '2px solid #e0e0e0',
            marginBottom: '20px'
          }}>
            {ethnicGroups.map((group) => (
              <button
                key={group.key}
                onClick={() => handleTabChange(group.key)}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  backgroundColor: activeTab === group.key ? '#007bff' : 'transparent',
                  color: isDarkMode ? 'white' : (activeTab === group.key ? 'white' : '#333'),
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: activeTab === group.key ? 'bold' : 'normal',
                  borderBottom: activeTab === group.key ? '2px solid #007bff' : '2px solid transparent',
                  transition: 'all 0.3s ease'
                }}
              >
                {group.name}
              </button>
            ))}
          </div>

          {/* Images Grid */}
          {loading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '200px',
              fontSize: '18px',
              color: '#666'
            }}>
              {language === 'en' ? 'Loading images...' : 'Đang tải hình ảnh...'}
            </div>
          ) : images.content.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '20px',
              marginBottom: '20px'
            }}>
              {images.content.map((image, index) => (
                <div
                  key={image.id || index}
                  onClick={() => handleImageClick(image)}
                  style={{
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition: 'transform 0.3s ease',
                    backgroundColor: 'white'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-5px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  {(() => {
                    const imageUrl = image.url || image.thumbnailUrl || image.imageUrl;
                    const isGlbFile = (imageUrl || '').toLowerCase().endsWith('.glb');
                    
                    if (isGlbFile) {
                      return (
                        <div style={{
                          width: '100%',
                          height: '200px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f5f5f5'
                        }}>
                          <GenerateGlbThumbnail 
                            url={imageUrl} 
                            size={200} 
                            placeholder={'/image-placeholder.png'} 
                          />
                        </div>
                      );
                    } else {
                      return (
                        <img
                          src={imageUrl}
                          alt={image.name || image.title || `Image ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '200px',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      );
                    }
                  })()}
                  <div style={{
                    display: 'none',
                    width: '100%',
                    height: '200px',
                    backgroundColor: '#f5f5f5',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                    fontSize: '14px'
                  }}>
                    {language === 'en' ? 'Image not available' : 'Không có hình ảnh'}
                  </div>
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
                      {image.name || image.title || `Image ${index + 1}`}
                    </span>
                    {image.description && (
                      <p style={{
                        margin: '0',
                        fontSize: '14px',
                        color: '#666',
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {image.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
              <div>{language === 'en' ? 'No images found' : 'Không tìm thấy hình ảnh'}</div>
              <div style={{ fontSize: '14px', color: '#999' }}>
                {language === 'en' ? 'Try switching to another ethnic group' : 'Thử chuyển sang nhóm dân tộc khác'}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              alignItems: 'center',
              gap: '10px',
              marginTop: '20px'
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
