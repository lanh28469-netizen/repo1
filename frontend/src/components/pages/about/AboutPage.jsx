import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../Header';
import Footer from '../../Footer';
import PostView from '../../pages/PostView';
import { getAbout } from '../../api';
import './AboutPage.css';

export default function AboutPage() {
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const lang = localStorage.getItem('lang') || 'vi';
        
        // First try to get data from localStorage
        const storedData = localStorage.getItem(`aboutData_${lang}`);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setPost(parsedData);
          setLoading(false);
          return;
        }
        
        // If no data in localStorage, fetch from API
        const result = await getAbout(lang);
        setPost(result);
        // Store in localStorage for future use
        localStorage.setItem(`aboutData_${lang}`, JSON.stringify(result));
      } catch (err) {
        setError('Failed to load about post');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadPost();
  }, []);

  if (loading) return (
    <div className="dashboard-container about-page">
      <Header />
      <main className="main-content" style={{ padding: '20px', textAlign: 'center', marginBottom: 0 }}>
        Loading...
      </main>
      <Footer />
    </div>
  );

  if (error) return (
    <div className="dashboard-container about-page">
      <Header />
      <main className="main-content" style={{ padding: '20px', textAlign: 'center', marginBottom: 0 }}>
        {error}
        <br />
        <button onClick={() => navigate('/')}>Go Back</button>
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="dashboard-container about-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main className="main-content" style={{ flex: 1, padding: '10px' }}>
        <PostView post={post} onBack={() => navigate('/')} />
      </main>
    </div>
  );
}