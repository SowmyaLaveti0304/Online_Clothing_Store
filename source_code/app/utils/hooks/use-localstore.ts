import { useCallback, useEffect, useState } from "react";

interface UseLocalStorageStateOptions<T> {
  key: string;
  defaultValue: T;
}

export function useLocalStorageState<T>({ key, defaultValue }: UseLocalStorageStateOptions<T>) {
  // Initialize state with a function to avoid unnecessary JSON parsing on every render
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") {
      return defaultValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return defaultValue;
    }
  });

  // Update localStorage whenever state changes
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error("Error writing to localStorage:", error);
    }
  }, [key, state]);

  // Wrapper function to handle state updates
  const setLocalStorageState = useCallback((newState: T | ((prevState: T) => T)) => {
    setState((prevState) => {
      const nextState =
        typeof newState === "function" ? (newState as (prevState: T) => T)(prevState) : newState;

      return nextState;
    });
  }, []);

  return [state, setLocalStorageState] as const;
}
