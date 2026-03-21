import { useAuth0 } from '@auth0/auth0-react'

export const useAuth = () => {
  const auth0 = useAuth0()
  return {
    ...auth0,
    isReady: !auth0.isLoading,
  }
}
