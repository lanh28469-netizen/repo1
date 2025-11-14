import React from 'react';

export default function PostDetail({ post, onBack }) {
  const language = localStorage.getItem('lang') || 'vi';
 
  if (!post) return null;

  return (
    <article style={{ padding: '12px 20px', minHeight: '100vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <div style={{
            marginBottom: '5px',
            padding: '10px 0'
          }}>
            <a href="#"
              onClick={(e) => { e.preventDefault(); onBack ? onBack() : navigate(-1); }}
              style={{
                display: 'inline-block',
                color: '#007bff',
                textDecoration: 'none'
              }}>
              ← {localStorage.getItem('lang') === 'en' ? 'Back' : 'Quay lại'}
            </a>
          </div>
        <h3 style={{ fontSize: '23px', marginBottom: 6 }}>{post.title}</h3>
      </div>
      <div style={{ fontSize: '15px', fontFamily: 'Arial, Verdana, sans-serif', lineHeight: '1.5' }} dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
