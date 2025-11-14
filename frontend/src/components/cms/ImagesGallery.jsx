import React, { useEffect, useState, useRef } from 'react';
import { useToast } from '../utils/toastContext';
import { fetchImages, uploadImage, deleteImagesBulk, updateImage, invalidateImagesCache } from '../api';
import GenerateGlbThumbnail from '../utils/GenerateGlbThumbnail';

export default function ImagesGallery({ auth, ethnic }) {
  const { success, error } = useToast();
  const [imgs, setImgs] = useState({ content: [], totalPages: 0, number: 0 });
  const [imgsPage, setImgsPage] = useState(0);
  const [imgsQ, setImgsQ] = useState('');
  const [debouncedImgsQ, setDebouncedImgsQ] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [imgLang, setImgLang] = useState('');
  const [filesToUpload, setFilesToUpload] = useState([]);
  const isLoadingRef = useRef(false);
  const [isUploading, setIsUploading] = useState(false);

  // Modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState('NORMAL');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [fileError, setFileError] = useState('');

  // Image info popup state
  const [showImageInfoModal, setShowImageInfoModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const loadImages = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      const trimmed = (debouncedImgsQ || '').trim();
      const effectiveSearch = trimmed === '' ? '' : (trimmed.length >= 3 ? trimmed : '');
      
      // Use the enhanced fetchImages method with caching
      const res = await fetchImages({ 
        page: imgsPage, 
        size: 10, 
        search: effectiveSearch, 
        language: imgLang || undefined, 
        ethnic: ethnic || undefined,
        useCache: effectiveSearch === '' // Only use cache when no search query
      });
      setImgs(res);
    } catch {} finally {
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    loadImages();
  }, [imgsPage, debouncedImgsQ, imgLang, ethnic]);

  // Debounce images search input by 1000ms
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedImgsQ(imgsQ), 1000);
    return () => clearTimeout(handler);
  }, [imgsQ]);

  const onSelectFiles = (e) => {
    const files = Array.from(e.target.files || []);
    setFilesToUpload(files);
  };

  const openUploadPopup = () => {
    setUploadName('');
    setUploadType('NORMAL');
    setUploadDesc('');
    setUploadFile(null);
    setFileError('');
    setShowUploadModal(true);
  };

  const closeUploadPopup = () => {
    setShowUploadModal(false);
  };

  const openImageInfoPopup = (image) => {
    setSelectedImage(image);
    setEditName(image.name || '');
    setEditType(image.type || 'NORMAL');
    setEditDescription(image.note || '');
    setShowImageInfoModal(true);
  };

  const closeImageInfoPopup = () => {
    setShowImageInfoModal(false);
    setSelectedImage(null);
    setEditName('');
    setEditType('');
    setEditDescription('');
  };

  const saveImageChanges = async () => {
    if (!selectedImage) return;
    
    try {
      const updateData = {
        name: editName,
        type: editType,
        note: editDescription
      };
      
      await updateImage(selectedImage.id, updateData);
      
      // Invalidate cache for this ethnic group
      await invalidateImagesCache(ethnic);
      
      // Update the image in the current list without calling API
      setImgs(prevImgs => ({
        ...prevImgs,
        content: prevImgs.content.map(img => 
          img.id === selectedImage.id 
            ? { ...img, name: editName, type: editType, note: editDescription }
            : img
        )
      }));
      
      closeImageInfoPopup();
    } catch (err) {
      console.error('Error updating image:', err);
      error('Failed to update image. Please try again.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeUploadPopup();
      closeImageInfoPopup();
    }
  };

  useEffect(() => {
    if (showUploadModal || showImageInfoModal) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showUploadModal, showImageInfoModal]);

  const validateFileFormat = (file) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.glb'];
    const fileName = file.name.toLowerCase();
    return allowedExtensions.some(ext => fileName.endsWith(ext));
  };

  const doUpload = async () => {
    if (!uploadFile) return;
    
    // Validate file format
    if (!validateFileFormat(uploadFile)) {
      setFileError('Định dạng file không được hỗ trợ. Chỉ cho phép file ảnh (.jpg, .jpeg, .png) và file model (.glb)');
      return;
    }
    
    setIsUploading(true);
    try {
      const meta = {
        name: uploadName || uploadFile.name,
        type: uploadType,
        note: uploadDesc,
        ethnic: ethnic || undefined,
      };
      await uploadImage(uploadFile, meta);
      
      // Invalidate cache for this ethnic group
      await invalidateImagesCache(ethnic);
      
      await loadImages();
      closeUploadPopup();
    } catch (err) {
      if (err.response?.status === 413) {
        error('Kích thước ảnh quá lớn');
      } else {
        console.log('Upload error', err);
        error('Lỗi khi upload ảnh. Vui lòng thử lại.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const toggleSelect = (id) =>
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const bulkDelete = async () => {
    if (!confirm('Xoá các ảnh đã chọn?')) return;
    await deleteImagesBulk(selectedIds);
    setSelectedIds([]);
    
    // Invalidate cache for this ethnic group
    try {
      const cacheKey = imagesCache.generateImagesKey({ 
        ethnic: ethnic || 'ALL', 
        page: imgsPage, 
        size: 10 
      });
      await imagesCache.delete(cacheKey);
    } catch (e) {
      // Non-fatal error
    }
    
    await loadImages();
  };

  const canEdit = (roles) => roles?.includes('ADMIN') || roles?.includes('MANAGER');

  if (!canEdit(auth.roles)) return null;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <section style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button onClick={openUploadPopup}>Upload</button>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <input
          placeholder="Tìm (nhập từ 3 ký tự)..."
          value={imgsQ}
          onChange={(e) => {
            setImgsPage(0);
            setImgsQ(e.target.value);
          }}
          style={{ marginLeft: 0, flex: 1, padding: '8px 10px'}}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, justifyContent: 'flex-end' }}>
        <button onClick={() => setSelectedIds(imgs.content.map(img => img.id))} disabled={!imgs.content.length}>Select All</button>
        <button onClick={bulkDelete} disabled={!selectedIds.length}>Delete</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, padding: '8px 0' }}>
        {imgs.content.map((img) => (
          <div 
            key={img.id} 
            onClick={() => openImageInfoPopup(img)}
            style={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: 8,
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              ':hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
              },
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <div style={{ 
              width: '100%', 
              aspectRatio: '4/3', 
              backgroundColor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative'
            }}>
               { (img.url || '').toLowerCase().endsWith('.glb') ? (
                 <GenerateGlbThumbnail url={img.url} size={320} placeholder={'/image-placeholder.png'} />
               ) : (
                 <img
                   src={(() => {
                     // Prioritize thumbnailUrl for better performance
                     if (img.thumbnailUrl) {
                       return img.thumbnailUrl;
                     }
                     // Fallback to original URL
                     return img.url;
                   })()}
                   alt={img.name || 'Image'}
                   style={{
                     width: '100%',
                     height: '100%',
                     objectFit: 'cover',
                     objectPosition: 'center',
                     transition: 'transform 0.3s ease'
                   }}
                   onError={(e) => {
                     // Enhanced fallback mechanism for thumbnail loading
                     const currentSrc = e.target.src;
                     
                     // If thumbnail fails to load, try different URL formats
                     if (img.thumbnailUrl && currentSrc === img.thumbnailUrl) {
                       // Try original URL first
                       if (img.url && currentSrc !== img.url) {
                         e.target.src = img.url;
                       } else if (img.url && img.url.includes('proxy/drive')) {
                         // If proxy URL fails, try Google CDN URL
                         const fileIdMatch = img.url.match(/id=([-\w]{25,})/);
                         if (fileIdMatch) {
                           e.target.src = `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}=w200-h200`;
                         }
                       }
                     } else if (img.url && currentSrc === img.url) {
                       // If original URL also fails, try Google CDN format
                       if (img.url.includes('drive.google.com') || img.url.includes('proxy/drive')) {
                         const fileIdMatch = img.url.match(/[-\w]{25,}/);
                         if (fileIdMatch) {
                           e.target.src = `https://lh3.googleusercontent.com/d/${fileIdMatch[0]}=w200-h200`;
                         }
                       }
                     }
                   }}
                 />
               )}
            </div>
            <div style={{ 
              padding: '12px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ 
                fontSize: 13, 
                color: '#333',
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                marginBottom: '8px'
              }}>
                {img.name || img.id}
              </div>
              <label 
                onClick={(e) => e.stopPropagation()}
                style={{ 
                  display: 'flex', 
                  gap: '6px', 
                  alignItems: 'center', 
                  fontSize: 13,
                  color: '#555',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <input 
                  type="checkbox" 
                  checked={selectedIds.includes(img.id)} 
                  onChange={() => toggleSelect(img.id)}
                  style={{ cursor: 'pointer' }}
                /> 
                <span>Chọn</span>
              </label>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, justifyContent: 'center' }}>
        <button 
          onClick={() => setImgsPage(0)} 
          disabled={imgs.number <= 0}
          style={{ 
            padding: '6px 12px', 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            backgroundColor: imgs.number <= 0 ? '#f5f5f5' : 'white',
            cursor: imgs.number <= 0 ? 'not-allowed' : 'pointer',
            color: imgs.number <= 0 ? '#999' : '#333'
          }}
        >
          ⟪
        </button>
        <button 
          onClick={() => setImgsPage((p) => Math.max(0, p - 1))} 
          disabled={imgs.number <= 0}
          style={{ 
            padding: '6px 12px', 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            backgroundColor: imgs.number <= 0 ? '#f5f5f5' : 'white',
            cursor: imgs.number <= 0 ? 'not-allowed' : 'pointer',
            color: imgs.number <= 0 ? '#999' : '#333'
          }}
        >
          «
        </button>
        <span style={{ 
          padding: '6px 12px', 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #ddd', 
          borderRadius: '4px',
          minWidth: '120px',
          textAlign: 'center',
          fontSize: '14px'
        }}>
          Trang {imgs.number + 1} / {Math.max(1, imgs.totalPages || 1)}
        </span>
        <button
          onClick={() => setImgsPage((p) => (p + 1 < imgs.totalPages ? p + 1 : p))}
          disabled={imgs.number + 1 >= (imgs.totalPages || 1)}
          style={{ 
            padding: '6px 12px', 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            backgroundColor: imgs.number + 1 >= (imgs.totalPages || 1) ? '#f5f5f5' : 'white',
            cursor: imgs.number + 1 >= (imgs.totalPages || 1) ? 'not-allowed' : 'pointer',
            color: imgs.number + 1 >= (imgs.totalPages || 1) ? '#999' : '#333'
          }}
        >
          »
        </button>
        <button
          onClick={() => setImgsPage(Math.max(0, (imgs.totalPages || 1) - 1))}
          disabled={imgs.number + 1 >= (imgs.totalPages || 1)}
          style={{ 
            padding: '6px 12px', 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            backgroundColor: imgs.number + 1 >= (imgs.totalPages || 1) ? '#f5f5f5' : 'white',
            cursor: imgs.number + 1 >= (imgs.totalPages || 1) ? 'not-allowed' : 'pointer',
            color: imgs.number + 1 >= (imgs.totalPages || 1) ? '#999' : '#333'
          }}
        >
          ⟫
        </button>
      </div>

      {showUploadModal && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.6)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            style={{ 
              width: '90%',
              maxWidth: 500, 
              background: '#fff', 
              borderRadius: 16, 
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)', 
              overflow: 'hidden',
              animation: 'slideUp 0.3s ease-out',
              transform: 'translateY(0)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ 
              padding: '20px 24px', 
              borderBottom: '1px solid #f0f0f0', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>📸 Upload Image</h2>
                <button 
                  onClick={closeUploadPopup}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: 18,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Name Field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
                  🏷️ Image Name
                </label>
                <input 
                  value={uploadName} 
                  onChange={(e) => setUploadName(e.target.value)} 
                  placeholder="Enter a descriptive name for your image"
                  style={{
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Type Field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
                  🎨 Image Type
                </label>
                <select 
                  value={uploadType} 
                  onChange={(e) => setUploadType(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                >
                  <option value="NORMAL">📷 Normal Image</option>
                  <option value="MODEL_3D">🎲 3D Model</option>
                  <option value="PHOTO_360">🌐 360° Photo</option>
                </select>
              </div>

              {/* File Upload Field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
                  📁 Select File
                </label>
                <div style={{
                  border: '2px dashed #d1d5db',
                  borderRadius: 8,
                  padding: '20px',
                  textAlign: 'center',
                  background: uploadFile ? '#f0f9ff' : '#fafafa',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  position: 'relative'
                }}>
                  <input 
                    type="file" 
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file && !validateFileFormat(file)) {
                        setFileError('Định dạng file không được hỗ trợ. Chỉ cho phép file ảnh (.jpg, .jpeg, .png) và file model (.glb)');
                        e.target.value = ''; // Clear the input
                        return;
                      }
                      setFileError(''); // Clear error when valid file is selected
                      setUploadFile(file);
                    }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0,
                      cursor: 'pointer'
                    }}
                    accept=".jpg,.jpeg,.png,.glb"
                  />
                  {uploadFile ? (
                    <div>
                      <div style={{ fontSize: 16, color: '#059669', marginBottom: 4 }}>✅</div>
                      <div style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>{uploadFile.name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>📤</div>
                      <div style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>Click to select file</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Hỗ trợ: JPG, JPEG, PNG, GLB</div>
                    </div>
                  )}
                </div>
                {/* Error Message */}
                {fileError && (
                  <div style={{
                    color: '#dc2626',
                    fontSize: '12px',
                    marginTop: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ fontSize: '14px' }}>⚠️</span>
                    {fileError}
                  </div>
                )}
              </div>

              {/* Description Field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
                  📝 Description
                </label>
                <textarea 
                  rows={3} 
                  value={uploadDesc} 
                  onChange={(e) => setUploadDesc(e.target.value)} 
                  placeholder="Add a description for your image (optional)"
                  style={{
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    resize: 'vertical',
                    minHeight: 80,
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: 12, 
              padding: '16px 24px', 
              borderTop: '1px solid #f0f0f0',
              background: '#fafafa'
            }}>
              <button 
                onClick={closeUploadPopup} 
                style={{ 
                  padding: '10px 20px',
                  border: '2px solid #e5e7eb',
                  borderRadius: 8,
                  background: 'white',
                  color: '#374151',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.background = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.background = 'white';
                }}
              >
                Cancel
              </button>
              <button
                onClick={doUpload}
                disabled={!uploadFile || isUploading}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: 8,
                  background: (uploadFile && !isUploading) ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#d1d5db',
                  color: (uploadFile && !isUploading) ? 'white' : '#9ca3af',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: (uploadFile && !isUploading) ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  boxShadow: (uploadFile && !isUploading) ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (uploadFile && !isUploading) {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (uploadFile && !isUploading) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                  }
                }}
              >
                {isUploading ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Uploading...
                  </div>
                ) : (
                  uploadFile ? '🚀 Upload' : 'Select File First'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Info Modal */}
      {showImageInfoModal && selectedImage && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.6)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            style={{ 
              width: '90%',
              maxWidth: 800, 
              background: '#fff', 
              borderRadius: 16, 
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)', 
              overflow: 'hidden',
              animation: 'slideUp 0.3s ease-out',
              transform: 'translateY(0)',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ 
              padding: '20px 24px', 
              borderBottom: '1px solid #f0f0f0', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>🖼️ Image Details</h2>
                <button 
                  onClick={closeImageInfoPopup}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: 18,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ 
              padding: '24px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 20
            }}>
              {/* Image Preview */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <div style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  {selectedImage.url && selectedImage.url.toLowerCase().endsWith('.glb') ? (
                    <GenerateGlbThumbnail 
                      url={selectedImage.url} 
                      size={300} 
                      placeholder={'/image-placeholder.png'} 
                    />
                  ) : (
                    <img
                      src={selectedImage.thumbnailUrl || selectedImage.url}
                      alt={selectedImage.name || 'Image'}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        objectFit: 'contain',
                        display: 'block'
                      }}
                      onError={(e) => {
                        e.target.src = '/image-placeholder.png';
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Editable Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Name Field */}
                <div>
                  <label style={{ fontSize: 14, color: '#374151', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                    🏷️ Name
                  </label>
                  <input 
                    type="text"
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter image name"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 14,
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                {/* Type Field */}
                <div>
                  <label style={{ fontSize: 14, color: '#374151', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                    🎨 Type
                  </label>
                  <select 
                    value={editType} 
                    onChange={(e) => setEditType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 14,
                      background: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  >
                    <option value="NORMAL">📷 Normal Image</option>
                    <option value="MODEL_3D">🎲 3D Model</option>
                    <option value="PHOTO_360">🌐 360° Photo</option>
                  </select>
                </div>

                {/* Description Field */}
                <div>
                  <label style={{ fontSize: 14, color: '#374151', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                    📝 Description
                  </label>
                  <textarea 
                    rows={4} 
                    value={editDescription} 
                    onChange={(e) => setEditDescription(e.target.value)} 
                    placeholder="Enter image description"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 14,
                      resize: 'vertical',
                      minHeight: 100,
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: 12, 
              padding: '16px 24px', 
              borderTop: '1px solid #f0f0f0',
              background: '#fafafa'
            }}>
              <button 
                onClick={closeImageInfoPopup} 
                style={{ 
                  padding: '10px 20px',
                  border: '2px solid #e5e7eb',
                  borderRadius: 8,
                  background: 'white',
                  color: '#374151',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.background = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.background = 'white';
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveImageChanges}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }}
              >
                💾 Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      </section>
    </>
  );
}
