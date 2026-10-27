import type { Race, RaceOverview, SimulationResponse, Stint, StrategyIssue } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    /** Broken strategy rules, present when the server rejects a strategy. */
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
    throw new ApiError("Could not reach the server. Check your connection and try again.");
  }

  const body: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    const error = (
      body as { error?: { code?: string; message?: string; issues?: StrategyIssue[] } } | undefined
    )?.error;
    throw new ApiError(error?.message ?? "Something went wrong. Please try again.", error?.code, error?.issues);
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
