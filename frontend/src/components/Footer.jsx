import React, { useEffect, useState } from 'react';

const Footer = ({ className = '' }) => {
  const [language, setLanguage] = useState(localStorage.getItem('lang') || '');

  useEffect(() => {
    const handleLanguageChanged = (e) => {
      const newLang = e?.detail?.lang ?? localStorage.getItem('lang') ?? '';
      setLanguage(newLang);
    };
    window.addEventListener('languageChanged', handleLanguageChanged);
    return () => window.removeEventListener('languageChanged', handleLanguageChanged);
  }, []);

  const translations = {
    vi: {
      aboutTitle: 'Về Chúng Tôi',
      aboutLine1: 'Bảo tàng Văn hóa các dân tộc Việt Nam tại Đắk Lắk',
      aboutLine2: 'Nơi lưu giữ và tôn vinh những giá trị văn hóa đặc sắc của các dân tộc Tây Nguyên',
      contactTitle: 'Liên Hệ',
      address: 'Số 2 Nguyễn Du, TP. Buôn Ma Thuột, Đắk Lắk',
      phone: '0262.3852.009',
      email: 'info@baotangdaklak.vn',
      quickLinks: 'Liên Kết Nhanh',
      linkAbout: 'Giới thiệu',
      linkExhibitions: 'Triển lãm',
      linkEvents: 'Sự kiện',
      linkContact: 'Liên hệ',
      followUs: 'Theo Dõi Chúng Tôi',
      copyright: 'Bảo tàng Văn hóa các dân tộc Việt Nam tại Đắk Lắk. Tất cả các quyền được bảo lưu.'
    },
    en: {
      aboutTitle: 'About Us',
      aboutLine1: 'Museum of Cultures of Vietnam Ethnic Groups in Đắk Lắk',
      aboutLine2: 'Preserving and honoring the unique cultural values of the Central Highlands ethnic groups',
      contactTitle: 'Contact',
      address: 'No. 2 Nguyen Du St., Buon Ma Thuot City, Dak Lak',
      phone: '0262.3852.009',
      email: 'info@baotangdaklak.vn',
      quickLinks: 'Quick Links',
      linkAbout: 'About',
      linkExhibitions: 'Exhibitions',
      linkEvents: 'Events',
      linkContact: 'Contact',
      followUs: 'Follow Us',
      copyright: 'Museum of Cultures of Vietnam Ethnic Groups in Dak Lak. All rights reserved.'
    }
  };
  translations[''] = translations.vi;
  const t = translations[language] || translations.vi;

  return (
    <footer className={`footer ${className}`.trim()}>
      <div className="footer-content">
        <div className="footer-section">
          <h3>{t.aboutTitle}</h3>
          <p>{t.aboutLine1}</p>
          <p>{t.aboutLine2}</p>
        </div>

        <div className="footer-section">
          <h3>{t.contactTitle}</h3>
          <p><i className="fas fa-map-marker-alt"></i>{t.address}</p>
          <p><i className="fas fa-phone"></i>{t.phone}</p>
          <p><i className="fas fa-envelope"></i>{t.email}</p>
        </div>

        <div className="footer-section">
          <h3>{t.quickLinks}</h3>
          <ul>
            <li><a href="/about">{t.linkAbout}</a></li>
            <li><a href="/exhibitions">{t.linkExhibitions}</a></li>
            <li><a href="/events">{t.linkEvents}</a></li>
            <li><a href="/contact">{t.linkContact}</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>{t.followUs}</h3>
          <div className="social-links">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook"></i></a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-youtube"></i></a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram"></i></a>
          </div>
        </div>

        <div className="footer-section" aria-label="QR code to video">
          <div className="qr-wrap">
            <img
              className="footer-qr"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent('Scan the QR code to watch the video: https://6p107cz6-5173.asse.devtunnels.ms/videos')}`}
              alt="QR code to video"
            />
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} {t.copyright}</p>
      </div>
    </footer>
  );
};

export default Footer;