
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate('/dashboard');
  };

  const handleGoToRegister = () => {
    navigate('/register');
  };

  return (
    <div>
      <LoginForm onSuccess={handleLoginSuccess} />
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <p>Nie masz konta?</p>
        <button onClick={handleGoToRegister}>
          Zarejestruj się
        </button>
      </div>
    </div>
  );
};

