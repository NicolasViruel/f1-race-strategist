import { useCallback, useEffect, useState } from "react";

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T };

/** Ejecuta `load` al montar y cada vez que se llama a `retry`; ignora respuestas viejas. */
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
        setState({ status: "error", message: error instanceof Error ? error.message : "Error inesperado." }),
    );
    return () => {
      cancelled = true;
    };
    // `load` es estable por instancia del componente; `attempt` dispara los reintentos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
