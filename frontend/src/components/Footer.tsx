import { Link } from 'react-router-dom';
import './Footer.css';

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <Link to="/" className="footer-logo">🍕 Food.by</Link>
        <span className="footer-text">© 2024 Food.by — Доставка еды</span>
      </div>
    </footer>
  );
};

