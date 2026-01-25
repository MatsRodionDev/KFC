import { useAuth0 } from '@auth0/auth0-react';
import { AUTH0_CONFIG } from '../../config/auth0.config';
import './LogoutButton.css';

export const LogoutButton = () => {
  const { logout } = useAuth0();

  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: AUTH0_CONFIG.redirectUri,
      },
    });
  };

  return (
    <button
      onClick={handleLogout}
      className="button logout"
      type="button"
      aria-label="Выйти из системы"
    >
      Выйти
    </button>
  );
};

export default LogoutButton;
