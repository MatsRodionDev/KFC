import './ErrorDisplay.css';

interface ErrorDisplayProps {
  error: Error;
}

export const ErrorDisplay = ({ error }: ErrorDisplayProps) => {
  const errorMessage = error?.message || 'Произошла неизвестная ошибка';

  return (
    <div className="app-container">
      <div className="error-state">
        <div className="error-title">Ошибка!</div>
        <div className="error-message">Что-то пошло не так</div>
        <div className="error-sub-message">{errorMessage}</div>
      </div>
    </div>
  );
};
