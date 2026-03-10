export interface MenuErrorStateProps {
  error: string;
}

export function MenuErrorState({ error }: MenuErrorStateProps) {
  return (
    <div className="container">
      <h1>Каталог</h1>
      <div className="error-state">
        <div className="error-icon">⚠️</div>
        <p className="error-title">Не удалось загрузить каталог</p>
        <p className="error-message">{error}</p>
      </div>
    </div>
  );
}
