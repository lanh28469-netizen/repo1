import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from './styles/logo.svg';
import './styles/header.css'

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState(localStorage.getItem('lang') || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    localStorage.setItem('lang', language);
  }, [language]);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    // Dispatch custom event to notify other components after DOM update
    window.dispatchEvent(new CustomEvent('themeChanged'));
  }, [isDarkMode]);

  // Extract search query from URL when on search page
  useEffect(() => {
    if (location.pathname === '/search') {
      const params = new URLSearchParams(location.search);
      const query = params.get('q') || '';
      setSearchQuery(query);
    }
  }, [location]);

  const translations = {
    vi: {
      menus: ['Giới thiệu chung', 'Nhà dài Ê đê', 'Nhà dài Gia rai', 'Nhà dài M\'nông', 'Thư viện'],
      dropdown: ['Ảnh', 'Video', 'Youtube'],
      search: 'Tìm kiếm...'
    },
    en: {
      menus: ['General Introduction', 'Ede Longhouse', 'Jrai Longhouse', 'Mnong Longhouse', 'Libraries'],
      dropdown: ['Images', 'Video', 'Youtube'],
      search: 'Search...'
    }
  };
  translations[''] = translations.vi;

  const currentTranslations = translations[language];

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    localStorage.setItem('lang', newLang);
    // Notify app parts that depend on language to refetch data
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: newLang } }));
  };

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 3) {
      const encodedQuery = encodeURIComponent(searchQuery.trim());
      navigate(`/search?q=${encodedQuery}`);
    }
  };

  return (
    <header className="dashboard-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img 
            src={logo} 
            alt="Logo" 
            style={{ 
              height: '50px',
              backgroundColor: isDarkMode ? '#2b2b2b' : 'transparent',
              filter: isDarkMode ? 'invert(0.8) brightness(1.5) contrast(1.8)' : 'none',
            }} 
          />
        </div>
        <form onSubmit={handleSearch} style={{ position: 'relative', display: 'inline-block' }}>
          <input 
            className="search" 
            type="text" 
            placeholder={currentTranslations.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '10px', paddingRight: '30px' }} 
          />
          <i
            className="fa fa-search"
            onClick={(e) => {
              e.preventDefault();
              handleSearch(e);
            }}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: 'pointer',
              color: '#888'
            }}
          />
        </form>
      </div>
      <nav className="nav">
        {currentTranslations.menus.map((menu, index) => (
          <div
            className="nav-item"
            key={menu}
            onClick={() => {
              if (index === 0) navigate('/about');
              else if (index === 1) navigate('/ede');
              else if (index === 2) navigate('/jarai');
              else if (index === 3) navigate('/mnong');
            }}
            style={{ cursor: (index === 0 || index >= 1 && index <= 3) ? 'pointer' : 'default' }}
          >
            {menu}
            {menu === currentTranslations.menus[4] && (
              <div className="dropdown">
                <div
                  className="dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/images');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {currentTranslations.dropdown[0]}
                </div>
                <div
                  className="dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/videos');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {currentTranslations.dropdown[1]}
                </div>
                <div
                  className="dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/u2be');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {currentTranslations.dropdown[2]}
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <select
          value={language}
          onChange={handleLanguageChange}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: isDarkMode ? 'white' : 'inherit',
            cursor: 'pointer'
          }}
        >
          <option value="vi" style={{ color: isDarkMode ? 'black' : 'inherit' }}>VN</option>
          <option value="en" style={{ color: isDarkMode ? 'black' : 'inherit' }}>EN</option>
        </select>
        <button
          className="theme-toggle"
          onClick={handleThemeToggle}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '5px 10px',
            borderRadius: '5px',
            transition: 'background-color 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.1)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          {isDarkMode ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
};

export default Header;