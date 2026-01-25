import { useAuth0 } from '@auth0/auth0-react';
import { LogoutButton } from '../../components/auth';
import './ProfilePage.css';

export const ProfilePage = () => {
  const { user, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="container">
        <h1>Профиль</h1>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <h1>Профиль</h1>
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p className="error-title">Не удалось загрузить данные профиля</p>
        </div>
      </div>
    );
  }

  const displayName = user.name || user.nickname || user.email || 'Пользователь';
  const email = user.email || 'Email не указан';
  const picture = user.picture;
  const emailVerified = user.email_verified ? '✓ Подтвержден' : '✗ Не подтвержден';

  return (
    <div className="container">
      <h1>Профиль</h1>
      
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            {picture && (
              <div className="profile-picture-wrapper">
                <img 
                  src={picture} 
                  alt={displayName}
                  className="profile-picture"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="profile-info">
              <h2 className="profile-name">{displayName}</h2>
              <p className="profile-email">{email}</p>
              <div className={`profile-email-status ${user.email_verified ? 'verified' : 'unverified'}`}>
                {emailVerified}
              </div>
            </div>
          </div>

          <div className="profile-details">
            <div className="profile-detail-item">
              <span className="detail-label">Имя пользователя:</span>
              <span className="detail-value">{user.nickname || 'Не указано'}</span>
            </div>
            
            {user.given_name && (
              <div className="profile-detail-item">
                <span className="detail-label">Имя:</span>
                <span className="detail-value">{user.given_name}</span>
              </div>
            )}

            {user.family_name && (
              <div className="profile-detail-item">
                <span className="detail-label">Фамилия:</span>
                <span className="detail-value">{user.family_name}</span>
              </div>
            )}

            <div className="profile-detail-item">
              <span className="detail-label">ID пользователя:</span>
              <span className="detail-value detail-value-small">{user.sub}</span>
            </div>

            {user.updated_at && (
              <div className="profile-detail-item">
                <span className="detail-label">Последнее обновление:</span>
                <span className="detail-value">
                  {new Date(user.updated_at).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
          </div>

          <div className="profile-actions">
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
};
