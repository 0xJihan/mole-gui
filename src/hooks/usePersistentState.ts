import { useState, useEffect } from "react";

export function usePersistentState<T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(`mole_pref_${key}`);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn(`Failed to read preference ${key} from localStorage:`, e);
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(`mole_pref_${key}`, JSON.stringify(state));
    } catch (e) {
      console.warn(`Failed to persist preference ${key} to localStorage:`, e);
    }
  }, [key, state]);

  return [state, setState];
}
export default usePersistentState;
