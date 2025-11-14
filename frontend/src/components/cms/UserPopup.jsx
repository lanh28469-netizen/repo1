import React, { useState, useEffect } from 'react';
import { useToast } from '../utils/toastContext';
import './UserPopup.css';

export default function UserPopup({ isOpen, onClose, user, mode, onSave }) {
  const { error } = useToast();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: ''
  });
  const [emailError, setEmailError] = useState('');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const isEditMode = mode === 'edit';
  const isProfileMode = mode === 'profile';

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '', // Always empty for edit mode
        fullName: user.fullName || '',
        phone: user.phone || ''
      });
    } else {
      // Reset form for create mode
      setFormData({
        username: '',
        email: '',
        password: '',
        fullName: '',
        phone: ''
      });
    }
  }, [user, mode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // validate email before submit (skip validation for profile mode since email is disabled)
    if (!isProfileMode && (!formData.email || !emailRegex.test(formData.email))) {
      setEmailError('Địa chỉ email không hợp lệ');
      return;
    }

    // For edit/profile mode, don't include password if it's empty
    let dataToSave;
    if (isProfileMode) {
      // For profile mode, only send fullName, phone, and password (if provided)
      dataToSave = {
        fullName: formData.fullName,
        phone: formData.phone
      };
      if (formData.password && formData.password.trim()) {
        dataToSave.password = formData.password;
      }
    } else if (isEditMode) {
      // For edit mode, send all fields except password if empty
      dataToSave = { ...formData, ...(formData.password && { password: formData.password }) };
    } else {
      // For create mode, send all fields
      dataToSave = formData;
    }

    onSave(dataToSave);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for phone input to only allow numbers and common phone characters
    if (name === 'phone') {
      const filteredValue = value.replace(/[^0-9+\s()\-]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: filteredValue
      }));
    } else if (name === 'email') {
      // Only update the value here. Validation will run on blur (focusOut).
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Validate when the field loses focus (focusOut)
  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === 'email') {
      if (value === '' || emailRegex.test(value)) {
        setEmailError('');
      } else {
        setEmailError('Địa chỉ email không hợp lệ');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="user-popup-overlay">
      <div className="user-popup-content">
        <div className="user-popup-header">
          <h3>
            {isEditMode ? 'Sửa thông tin user' : 
             isProfileMode ? 'Cập nhật thông tin cá nhân' : 
             'Tạo user mới'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="user-popup-form">
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={isEditMode || isProfileMode}
              className={(isEditMode || isProfileMode) ? "disabled-input" : ""}
              required={!(isEditMode || isProfileMode)}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isProfileMode}
              className={isProfileMode ? "disabled-input" : (emailError ? 'input-error' : '')}
              aria-invalid={!!emailError}
              required={!isProfileMode}
            />
            {emailError && <div className="error-text">{emailError}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">
              Mật khẩu:
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!(isEditMode || isProfileMode)}
              placeholder={(isEditMode || isProfileMode) ? "Để trống nếu không muốn thay đổi" : "Nhập mật khẩu"}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="fullName">Họ và tên:</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Số điện thoại:</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onKeyPress={(e) => {
                // Only allow numbers and some special characters
                if (!/[0-9+\s()\-]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
                  e.preventDefault();
                }
              }}
              pattern="[0-9+\s()\-]*"
              placeholder="Ví dụ: 0123456789"
            />
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Hủy
            </button>
            <button type="submit" className="save-button">
              {isEditMode ? 'Lưu thay đổi' : 
               isProfileMode ? 'Cập nhật thông tin' : 
               'Tạo user'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
