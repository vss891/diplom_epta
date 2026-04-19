import React, { useState } from 'react';
import ProgressChart from './ProgressChart';

function Profile({ 
  userProfile, 
  updateProfile, 
  progress, 
  testProgress, 
  totalModules, 
  totalTests,
  resetProgress,
  resetTestProgress 
}) {
  const [formData, setFormData] = useState({
    name: userProfile.name || '',
    email: userProfile.email || '',
    language: userProfile.language || 'ru',
    notifications: userProfile.notifications || true,
    avatar: userProfile.avatar || ''
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setFormData(prev => ({ ...prev, avatar: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    if (!formData.email.includes('@')) {
      setMessage('Введите корректный email');
      return;
    }
    updateProfile(formData);
    setMessage('Профиль обновлён');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('Новые пароли не совпадают');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setMessage('Пароль должен быть не менее 6 символов');
      return;
    }
    setMessage('Пароль изменён (симуляция)');
    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setMessage(''), 3000);
  };

  const handleResetProgress = () => {
    if (window.confirm('Вы уверены? Весь прогресс обучения и тестов будет удалён.')) {
      resetProgress();
      resetTestProgress();
      setMessage('Прогресс сброшен');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const completedModules = Object.values(progress.modules || {}).filter(Boolean).length;
  const completedTests = Object.values(testProgress.modules || {}).filter(Boolean).length;

  return (
    <div id="profile" className="profile-container">
      <h1>Профиль пользователя</h1>

      {message && <div className="profile-message">{message}</div>}

      <div className="profile-content">
        {/* Личная информация */}
        <div className="profile-section">
          <h2>Личная информация</h2>
          <div className="form-group avatar-group">
            <label>Аватар:</label>
            <div className="avatar-preview">
              {formData.avatar ? (
                <img src={formData.avatar} alt="avatar" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">
                  {formData.name ? formData.name[0].toUpperCase() : 'U'}
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="avatar-input"
            />
          </div>

          <div className="form-group">
            <label>Имя:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ваше имя"
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="email@example.com"
            />
          </div>
          <div className="form-group">
            <label>Язык интерфейса:</label>
            <select name="language" value={formData.language} onChange={handleInputChange}>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="notifications"
                checked={formData.notifications}
                onChange={handleInputChange}
              />
              Получать уведомления на email
            </label>
          </div>
          <button onClick={handleSaveProfile} className="profile-save-btn">
            Сохранить изменения
          </button>
        </div>

        {/* Смена пароля */}
        <div className="profile-section">
          <h2>Безопасность</h2>
          <div className="form-group">
            <label>Старый пароль:</label>
            <input
              type="password"
              name="oldPassword"
              value={passwordData.oldPassword}
              onChange={handlePasswordChange}
            />
          </div>
          <div className="form-group">
            <label>Новый пароль:</label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
            />
          </div>
          <div className="form-group">
            <label>Подтверждение нового пароля:</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
            />
          </div>
          <button onClick={handleChangePassword} className="profile-save-btn">
            Сменить пароль
          </button>
        </div>

        {/* Прогресс обучения */}
        <div className="profile-section">
          <h2>Мой прогресс</h2>
          <div className="progress-charts">
            <ProgressChart 
              completed={completedModules} 
              total={totalModules} 
              label="Модули" 
            />
            <ProgressChart 
              completed={completedTests} 
              total={totalTests} 
              label="Тесты" 
            />
          </div>
          <div className="progress-stats">
            <p><strong>Модулей пройдено:</strong> {completedModules} из {totalModules}</p>
            <p><strong>Тестов пройдено:</strong> {completedTests} из {totalTests}</p>
            <p><strong>Общий прогресс обучения:</strong> {progress.overall_progress || 0}%</p>
            <p><strong>Прогресс тестов:</strong> {testProgress.overall_test_progress || 0}%</p>
          </div>
          <button onClick={handleResetProgress} className="reset-progress-btn">
            Сбросить прогресс
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;