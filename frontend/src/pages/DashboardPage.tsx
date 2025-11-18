
import React from 'react';
import { useAuth } from '../hooks/useAuth';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">
          Wyloguj się
        </button>
      </header>

      <main className="dashboard-main">
        <div className="welcome-card">
          <h2>Witaj, {user?.username}!</h2>
          <p>Email: {user?.email}</p>
          <p>Zarejestrowany: {new Date(user?.registered_at || '').toLocaleDateString('pl-PL')}</p>
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

