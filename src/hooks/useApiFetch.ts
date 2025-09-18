import { useState, useEffect, useRef } from 'react';

type Fetcher = (signal?: AbortSignal) => Promise<any>;

export function useApiFetch(fetcher: Fetcher, deps: any[] = [], options?: { retries?: number, retryDelay?: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any>(null);
  const mounted = useRef(true);

  const retries = options?.retries ?? 2;
  const retryDelay = options?.retryDelay ?? 500; // ms

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();

    let attempts = 0;

    const run = async () => {
      setLoading(true);
      setError(null);
      while (attempts <= retries) {
        try {
          const result = await fetcher(controller.signal);
          if (!mounted.current) return;
          setData(result);
          setLoading(false);
          return;
        } catch (err: any) {
          attempts += 1;
          if (attempts > retries) {
            if (!mounted.current) return;
            setError(err);
            setLoading(false);
            return;
          }
          // backoff
          await new Promise(r => setTimeout(r, retryDelay * attempts));
        }
      }
    };

    run();

    return () => {
      mounted.current = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { loading, error, data };
}
