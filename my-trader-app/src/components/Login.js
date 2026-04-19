import React, { useState } from 'react';
import Register from './Register';

function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка входа');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      onLogin(data.username);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegisterSuccess = () => {
    setIsLogin(true);
    setError('Регистрация прошла успешно! Теперь вы можете войти.');
    setUsername('');
    setPassword('');
  };

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        {isLogin ? (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <h2>Вход в систему</h2>
            {error && <div className="error-message">{error}</div>}
            <div className="form-group">
              <label>Логин</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit">Войти</button>
            <p style={{ marginTop: 15, textAlign: 'center' }}>
              Нет аккаунта?{' '}
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                style={{ background: 'none', border: 'none', color: '#ff6b35', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Зарегистрируйтесь
              </button>
            </p>
          </form>
        ) : (
          <>
            <Register onRegister={handleRegisterSuccess} />
            <p style={{ marginTop: 15, textAlign: 'center' }}>
              Уже есть аккаунт?{' '}
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                style={{ background: 'none', border: 'none', color: '#ff6b35', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Войти
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;