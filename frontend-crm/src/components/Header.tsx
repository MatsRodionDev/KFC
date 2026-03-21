import { Link, useLocation } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { LogoutButton } from './auth'
import './Header.css'

export const Header = () => {
  const location = useLocation()
  const { isAuthenticated } = useAuth0()

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/dishes" className="logo">
          CRM
        </Link>

        <nav className="navigation">
          <Link
            to="/dishes"
            className={`nav-link ${isActive('/dishes') ? 'active' : ''}`}
          >
            Блюда
          </Link>
          <Link
            to="/ingredients"
            className={`nav-link ${isActive('/ingredients') ? 'active' : ''}`}
          >
            Ингредиенты
          </Link>
          <Link
            to="/toppings"
            className={`nav-link ${isActive('/toppings') ? 'active' : ''}`}
          >
            Топинги
          </Link>
          <Link
            to="/drinks"
            className={`nav-link ${isActive('/drinks') ? 'active' : ''}`}
          >
            Напитки
          </Link>
        </nav>

        <div className="actions">
          {isAuthenticated && <LogoutButton />}
        </div>
      </div>
    </header>
  )
}
