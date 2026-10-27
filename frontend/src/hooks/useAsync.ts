import { useCallback, useEffect, useState } from "react";

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T };

/** Runs `load` on mount and whenever `retry` is called; ignores stale responses. */
export function useAsync<T>(load: () => Promise<T>): AsyncState<T> & { retry: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    load().then(
      (data) => !cancelled && setState({ status: "success", data }),
      (error: unknown) =>
        !cancelled &&
        setState({ status: "error", message: error instanceof Error ? error.message : "Unexpected error." }),
    );
    return () => {
      cancelled = true;
    };
    // `load` is stable per component instance; `attempt` triggers retries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
