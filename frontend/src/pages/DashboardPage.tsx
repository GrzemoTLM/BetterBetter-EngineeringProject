import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDateFormatter } from '../hooks/useDateFormatter';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { formatDate } = useDateFormatter();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div>
          <button onClick={() => navigate('/money-flow')} style={{ marginRight: '10px' }}>
            Money Flow
          </button>
          <button onClick={() => navigate('/settings')} style={{ marginRight: '10px' }}>
            Ustawienia
          </button>
          <button onClick={handleLogout} className="logout-button">
            Wyloguj się
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-card">
          <h2>Witaj, {user?.username || 'Guest'}!</h2>
          <p>Email: {user?.email || 'N/A'}</p>
          <p>Zarejestrowany: {user?.registered_at ? formatDate(user.registered_at, false) : 'N/A'}</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <h3>Zarządzaj kuponami</h3>
            <p>Dodawaj, edytuj i monitoruj swoje kupony</p>
          </div>
          <div className="feature-card">
            <h3>Finanse</h3>
            <p>Śledź swoje konta i transakcje</p>
          </div>
          <div className="feature-card">
            <h3>Alerty</h3>
            <p>Konfiguruj alerty dla swoich zasad</p>
          </div>
          <div className="feature-card">
            <h3>Wsparcie</h3>
            <p>Otwórz ticket do naszego zespołu wsparcia</p>
          </div>
        </div>
      </main>
    </div>
  );
};
