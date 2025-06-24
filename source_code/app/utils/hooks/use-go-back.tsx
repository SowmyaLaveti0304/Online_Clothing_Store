import { useLocation, useNavigate } from '@remix-run/react'

export const useGoBack = ({ fallback: globalFallback = '/' } = {}) => {
  const location = useLocation()
  const navigate = useNavigate()
  const thereIsAPrevPage = location.key !== 'default'

  return ({ fallback = globalFallback } = {}) => {
    if (thereIsAPrevPage) {
      navigate(-1)
    } else {
      navigate(fallback)
    }
  }
}
