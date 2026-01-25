import { Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { LoginButton } from './LoginButton';
import { LoadingSpinner } from './LoadingSpinner';
import './LoginPage.css';

export const LoginPage = () => {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="app-container">
      <div className="main-card-wrapper">
        <h1 className="main-title">🍕 Food.by</h1>
        <div className="action-card">
          <p className="action-text">Войдите в систему, чтобы продолжить</p>
          <LoginButton />
        </div>
      </div>
    </div>
  );
};
