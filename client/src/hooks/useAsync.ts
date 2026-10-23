import { useEffect, useState } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/** Runs `load` once on mount. Works the same for mock data and real API calls. */
export function useAsync<T>(load: () => Promise<T>): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    let active = true;
    load()
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((error: Error) => active && setState({ data: null, loading: false, error }));
    return () => {
      active = false;
    };
    // `load` is a stable module-level function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
