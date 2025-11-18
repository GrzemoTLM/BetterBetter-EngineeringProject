
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '../components/RegisterForm';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const handleRegisterSuccess = () => {
    navigate('/dashboard');
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div>
      <RegisterForm onSuccess={handleRegisterSuccess} />
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <p>Już masz konto?</p>
        <button onClick={handleGoToLogin}>
          Zaloguj się
        </button>
      </div>
    </div>
  );
};

