import { useAuth0 } from '@auth0/auth0-react'
import { AUTH0_CONFIG } from '../../config/auth0.config'
import './LoginButton.css'

export const LoginButton = () => {
  const { loginWithRedirect } = useAuth0()

  const handleLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        scope: AUTH0_CONFIG.scope,
      },
    })
  }

  return (
    <button
      onClick={handleLogin}
      className="button login"
      type="button"
      aria-label="Войти в систему"
    >
      Войти
    </button>
  )
}

export default LoginButton
