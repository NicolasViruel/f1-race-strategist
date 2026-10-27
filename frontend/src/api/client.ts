import type { Race, RaceOverview, SimulationResponse, Stint, StrategyIssue } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    /** Reglas rotas de la estrategia; viene cuando el servidor la rechaza. */
    readonly issues?: StrategyIssue[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch {
    throw new ApiError("No se pudo contactar al servidor. Revisa tu conexión e inténtalo de nuevo.");
  }

  const body: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    const error = (
      body as { error?: { code?: string; message?: string; issues?: StrategyIssue[] } } | undefined
    )?.error;
    throw new ApiError(error?.message ?? "Algo salió mal. Inténtalo de nuevo.", error?.code, error?.issues);
  }
  return body as T;
}

export const getRaces = () => request<{ races: Race[] }>("/api/races").then((body) => body.races);

export const getRaceOverview = (raceId: string) =>
  request<RaceOverview>(`/api/races/${encodeURIComponent(raceId)}`);

export const simulateRace = (raceId: string, body: { driverId: string; strategy: Stint[] }) =>
  request<SimulationResponse>(`/api/races/${encodeURIComponent(raceId)}/simulate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
