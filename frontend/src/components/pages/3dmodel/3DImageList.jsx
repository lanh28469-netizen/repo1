import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get3dImages } from '../../api';
import Header from '../../Header';
import Footer from '../../Footer';
import './3DImageList.css';
import fallbackThumbnail from '../../styles/thumbnails/3d.jpg';

export default function Image3DList() {
  const [models, setModels] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    get3dImages({ page: currentPage - 1, size: itemsPerPage })
      .then(data => {
        setModels(data.content);
        setTotalPages(data.totalPages);
      })
      .catch(err => console.error("Lỗi khi tải danh sách 3D Model:", err));
  }, [currentPage]);

  const handleClick = (model) => {
    navigate(`/3d/${model.name}`, { state: { model } });
  };

  return (
    <div className="dashboard-container">
      <Header />
      <main className="main-content">
        <div className="container">
          <h1>🧱 Danh sách mô hình 3D</h1>
          <div className="grid">
            {models.map((model, index) => (
              <div key={index} className="card" onClick={() => handleClick(model)}>
                <img
                  src={model.thumbnailUrl}
                  alt={model.name}
                  onError={(e) => e.target.src = fallbackThumbnail}
                />
                <p>{model.name.replace(/\.[^/.]+$/, "")}</p>
                <p className="note">{model.note && model.note.length > 250 ? model.note.substring(0, 250) + '...' : model.note}</p>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>{'<'}</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={currentPage === i + 1 ? 'active' : ''}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>{'>'}</button>
          </div>
        </div>
      </main>
      <Footer className="footer-banner" />
    </div>
  );
}
