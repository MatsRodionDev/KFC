export function MenuLoadingState() {
  return (
    <div className="container">
      <h1>Каталог</h1>
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Загрузка каталога...</p>
      </div>
    </div>
  );
}
