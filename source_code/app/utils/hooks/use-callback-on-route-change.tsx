import * as React from 'react'

import { usePrevious } from '@mantine/hooks'
import { useLocation } from '@remix-run/react'

export const useCallbackOnRouteChange = (callback: () => void) => {
  const { pathname } = useLocation()
  const previousPathname = usePrevious(pathname)

  const callbackRef = React.useRef(callback)
  React.useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  React.useEffect(() => {
    if (!previousPathname) return

    if (pathname === previousPathname) {
      return
    }

    callbackRef.current()
  }, [pathname, previousPathname])
}
