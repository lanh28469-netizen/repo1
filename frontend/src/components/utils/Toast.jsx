import React, { useState, useEffect } from 'react';

const Toast = ({ message, type, duration = 10000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getToastStyles = () => {
    const baseStyles = {
      padding: '14px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      minWidth: '250px',
      maxWidth: '400px',
      fontSize: '14px',
      fontWeight: '500',
      lineHeight: '1.4'
    };

    if (type === 'success') {
      return {
        ...baseStyles,
        backgroundColor: '#f0fdf4',
        color: '#16a34a',
        border: '1px solid #86efac'
      };
    } else if (type === 'error') {
      return {
        ...baseStyles,
        backgroundColor: '#fef2f2',
        color: '#dc2626',
        border: '1px solid #fca5a5'
      };
    } else {
      return {
        ...baseStyles,
        backgroundColor: '#f8f9fa',
        color: '#374151',
        border: '1px solid #d1d5db'
      };
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
      <div
        style={{
          ...getToastStyles(),
          animation: 'slideInRight 200ms ease-out',
          willChange: 'transform, opacity',
          transform: 'translateZ(0)'
        }}
      >
        {type === 'success' && (
          <span style={{ fontSize: '18px' }}>✓</span>
        )}
        {type === 'error' && (
          <span style={{ fontSize: '18px' }}>✕</span>
        )}
        <span style={{ flex: 1 }}>{message}</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0',
            fontSize: '18px',
            lineHeight: 1,
            color: 'inherit',
            opacity: '0.7'
          }}
        >
          ×
        </button>
      </div>
    </>
  );
};

export default Toast;

