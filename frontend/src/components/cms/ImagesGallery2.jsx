import React, { useEffect, useState, useRef } from 'react';
import { useToast } from '../utils/toastContext';
import { fetchImages, uploadImage, uploadImages, deleteImagesBulk } from '../api';
import genGLBThumbnail from '../utils/genGlbThumbnail';

export default function ImagesGallery({ auth }) {
  const { error } = useToast();
  const [imgs, setImgs] = useState({ content: [], totalPages: 0, number: 0 });
  const [imgsPage, setImgsPage] = useState(0);
  const [imgsQ, setImgsQ] = useState('');
  const [debouncedImgsQ, setDebouncedImgsQ] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [imgLang, setImgLang] = useState('');
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [thumbnails, setThumbnails] = useState({}); // map url -> dataUrl or 'loading' or 'error'
  const fileInputRef = useRef(null);
  const isLoadingRef = useRef(false);

  const loadImages = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      const trimmed = (debouncedImgsQ || '').trim();
      const effectiveSearch = trimmed === '' ? '' : (trimmed.length >= 3 ? trimmed : '');
      const res = await fetchImages({ page: imgsPage, size: 10, search: effectiveSearch, language: imgLang || undefined });
      setImgs(res);
      // kick off thumbnail generation for glb files
      try {
        (res.content || []).forEach((img) => {
          const url = img.url;
          if (!url) return;
          const isGLB = url.toLowerCase().endsWith('.glb');
          if (!isGLB) return;
          // if not cached yet, set loading and generate
          setThumbnails((t) => {
            if (t[url]) return t;
            return { ...t, [url]: 'loading' };
          });
          genGLBThumbnail(url, { width: 400, height: 300 }).then((dataUrl) => {
            setThumbnails((t) => ({ ...t, [url]: dataUrl }));
          }).catch((e) => {
            console.error('Thumbnail gen failed for', url, e);
            setThumbnails((t) => ({ ...t, [url]: 'error' }));
          });
        });
      } catch (e) {
        // ignore thumbnail errors
      }
    } catch {} finally {
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    loadImages();
  }, [imgsPage, debouncedImgsQ, imgLang]);

  // Debounce images search input by 1000ms
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedImgsQ(imgsQ), 1000);
    return () => clearTimeout(handler);
  }, [imgsQ]);

  const validateFileFormat = (file) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.glb'];
    const fileName = file.name.toLowerCase();
    return allowedExtensions.some(ext => fileName.endsWith(ext));
  };

  const onSelectFiles = (e) => {
    const files = Array.from(e.target.files || []);
    
    // Validate each file format
    const invalidFiles = files.filter(file => !validateFileFormat(file));
    if (invalidFiles.length > 0) {
      error('Định dạng file không được hỗ trợ. Chỉ cho phép file ảnh (.jpg, .png, .jpeg) và file model (.glb)');
      e.target.value = ''; // Clear the input
      return;
    }
    
    setFilesToUpload(files);
  };

  const doUpload = async () => {
    if (!filesToUpload.length) return;
    try {
      if (filesToUpload.length === 1) {
        await uploadImage(filesToUpload[0]);
      } else {
        await uploadImages(filesToUpload);
      }
      await loadImages();
      setFilesToUpload([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      if (err.response?.status === 413) {
        error('Kích thước ảnh quá lớn');
      } else {
        console.log('Upload error', err);
      }
    }
  };

  const toggleSelect = (id) =>
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const bulkDelete = async () => {
    if (!confirm('Xoá các ảnh đã chọn?')) return;
    await deleteImagesBulk(selectedIds);
    setSelectedIds([]);
    await loadImages();
  };

  const canEdit = (roles) => roles?.includes('ADMIN') || roles?.includes('MANAGER');

  if (!canEdit(auth.roles)) return null;

  return (
    <section style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
        <input ref={fileInputRef} type="file" multiple onChange={onSelectFiles} accept=".jpg,.jpeg,.png,.glb" />
        <button onClick={doUpload} disabled={!filesToUpload.length}>Upload</button>
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
              backgroundColor: 'white'
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
              {(() => {
                const url = img.url;
                const isGLB = url?.toLowerCase().endsWith('.glb');
                if (isGLB) {
                  const t = thumbnails[url];
                  if (!t || t === 'loading') {
                    return (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                        Generating preview...
                      </div>
                    );
                  }
                  if (t === 'error') {
                    return (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                        Preview lỗi
                      </div>
                    );
                  }
                  return (
                    <img src={t} alt={img.name || '3D model'} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                  );
                }
                return (
                  <img
                    src={img.thumbnailUrl || img.url}
                    alt={img.name || 'Image'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center'
                    }}
                  />
                );
              })()}
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
              <label style={{ 
                display: 'flex', 
                gap: '6px', 
                alignItems: 'center', 
                fontSize: 13,
                color: '#555',
                cursor: 'pointer',
                userSelect: 'none'
              }}>
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
    </section>
  );
}
