import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get360Images } from '../../api';
import Header from '../../Header';
import Footer from '../../Footer';
import './360ImageList.css';
import fallbackThumbnail from '../../styles/thumbnails/360.jpg';

export default function Image360List() {
  const [models, setModels] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    get360Images({ page: currentPage - 1, size: itemsPerPage })
      .then(data => {
        setModels(data.content);
        setTotalPages(data.totalPages);
      })
      .catch(err => console.error("Lỗi khi tải danh sách ảnh 360:", err));
  }, [currentPage]);

  const handleClick = (image) => {
    navigate(`/360/${image.name}`, { state: { image } });
  };

  return (
    <div className="dashboard-container">
      <Header />
      <main className="main-content">
        <div className="container">
          <h1>📸 Danh sách ảnh 360 độ</h1>
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
