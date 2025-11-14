import React, { useState, useEffect } from 'react';
import { getListVideoMp4 } from '../api';
import videosCache from '../utils/videosIndexedDB';
import ImagesGallery from './ImagesGallery';
import ClipEditPopup from './ClipEditPopup';

export default function Libraries({ auth }) {
  const [selectedType, setSelectedType] = useState('EDE');
  const [data, setData] = useState({ content: [], totalPages: 0, number: 0 });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedClip, setSelectedClip] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    setPage(0);
  }, [selectedType]);

  useEffect(() => {
    if (!selectedType) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        let result;
        if (selectedType === 'video') {
          const language = localStorage.getItem('lang') || 'vi';
          const cacheKey = videosCache.generateVideosKey({ page, size: 10 });
          const cached = await videosCache.get(cacheKey);
          if (cached) {
            result = cached;
          } else {
            result = await getListVideoMp4({ page, size: 10, language });
            try { await videosCache.set(cacheKey, result, 10 * 60 * 1000); } catch (_) {}
          }
        }
        setData(result || { content: [], totalPages: 0, number: 0 });
      } catch (error) {
        console.error('Error fetching data:', error);
        setData({ content: [], totalPages: 0, number: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedType, page]);

  const handleClipClick = (clip) => {
    setSelectedClip(clip);
    setIsPopupOpen(true);
  };

  const handlePopupClose = () => {
    setIsPopupOpen(false);
    setSelectedClip(null);
  };

  const handleClipUpdate = (updatedClip) => {
    setData(prevData => ({
      ...prevData,
      content: prevData.content.map(clip => 
        clip.id === updatedClip.id ? updatedClip : clip
      )
    }));
  };

  return (
    <div>
      <h2>Thư viện</h2>
      <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: 16 }}>
        <div
          onClick={() => setSelectedType('EDE')}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            borderBottom: selectedType === 'EDE' ? '2px solid #007bff' : '2px solid transparent',
            color: selectedType === 'EDE' ? '#007bff' : '#666'
          }}
        >
          Ê Đê
        </div>
        <div
          onClick={() => setSelectedType('JRAI')}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            borderBottom: selectedType === 'JRAI' ? '2px solid #007bff' : '2px solid transparent',
            color: selectedType === 'JRAI' ? '#007bff' : '#666'
          }}
        >
          Gia Rai
        </div>
        <div
          onClick={() => setSelectedType('MNONG')}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            borderBottom: selectedType === 'MNONG' ? '2px solid #007bff' : '2px solid transparent',
            color: selectedType === 'MNONG' ? '#007bff' : '#666'
          }}
        >
          M'Nông
        </div>
        <div
          onClick={() => setSelectedType('video')}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            borderBottom: selectedType === 'video' ? '2px solid #007bff' : '2px solid transparent',
            color: selectedType === 'video' ? '#007bff' : '#666'
          }}
        >
          Video
        </div>
      </div>
      {loading && <p>Loading...</p>}

      {selectedType && !loading && (
        selectedType === 'video' ? (
          <div>
            {data.content.length === 0 ? (
              <p>No items found.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, padding: '8px 0' }}>
                {data.content.map((item, index) => (
                  <div 
                    key={item.id || index} 
                    onClick={() => handleClipClick(item)}
                    style={{ 
                      border: '1px solid #e0e0e0', 
                      borderRadius: 8, 
                      overflow: 'hidden', 
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
                      transition: 'transform 0.2s, box-shadow 0.2s', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      height: '100%', 
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div style={{ width: '100%', aspectRatio: '4/3', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                      <img src={item.thumbnailUrl || item.thumbnail || item.url} alt={item.name || item.title || 'Item'} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', transition: 'transform 0.3s ease' }} />
                    </div>
                    <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 13, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '8px' }}>
                        {item.name || item.title || `Item ${index + 1}`}
                      </div>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: '4px' }}>
                        {item.ethnic && `Ethnic: ${item.ethnic}`}
                      </div>
                      {item.url && (
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          onClick={(e) => e.stopPropagation()}
                          style={{ fontSize: 13, color: '#007bff', textDecoration: 'none' }}
                        >
                          View
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={data.number <= 0}>«</button>
              <span>Trang {data.number + 1} / {Math.max(1, data.totalPages || 1)}</span>
              <button onClick={() => setPage((p) => (p + 1 < data.totalPages ? p + 1 : p))} disabled={data.number + 1 >= (data.totalPages || 1)}>»</button>
            </div>
          </div>
        ) : (
          <ImagesGallery auth={auth} ethnic={selectedType} />
        )
      )}

      <ClipEditPopup
        clip={selectedClip}
        isOpen={isPopupOpen}
        onClose={handlePopupClose}
        onUpdate={handleClipUpdate}
      />
    </div>
  );
}