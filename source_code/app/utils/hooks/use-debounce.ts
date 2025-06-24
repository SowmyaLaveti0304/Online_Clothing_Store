import * as React from 'react'

/**
 * Simple debounce implementation
 */
function debounce<Callback extends (...args: Parameters<Callback>) => void>(
  fn: Callback,
  delay: number,
) {
  let timer: NodeJS.Timeout | null = null
  return (...args: Parameters<Callback>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

/**
 * Debounce a callback function
 */
export function useDebounce<
  Callback extends (
    ...args: Parameters<Callback>
  ) => ReturnType<Callback> | void,
>(callback: Callback, delay: number) {
  const callbackRef = React.useRef(callback)
  React.useEffect(() => {
    callbackRef.current = callback
  })
  return React.useMemo(
    () =>
      debounce(
        (...args: Parameters<Callback>) => callbackRef.current(...args),
        delay,
      ),
    [delay],
  )
}
