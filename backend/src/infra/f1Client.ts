import { z } from "zod";
import {
  circuitSchema,
  driverSchema,
  raceDetailSchema,
  raceSchema,
  simulationParametersSchema,
  teamSchema,
  tyreSchema,
  weatherSchema,
  type CircuitInfo,
  type DriverInfo,
  type Race,
  type RaceDetail,
  type RaceSimulationParameters,
  type TeamInfo,
  type TyreInfo,
  type Weather,
} from "./f1Schemas";

export type F1ApiErrorCode = "UNAVAILABLE" | "NOT_FOUND" | "EMPTY" | "INVALID_RESPONSE";

export class F1ApiError extends Error {
  constructor(
    readonly code: F1ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "F1ApiError";
  }
}

export interface F1ClientOptions {
  baseUrl: string;
  fetch?: typeof fetch;
  /** Per-attempt timeout. The hosted API can take up to a minute to wake up. */
  timeoutMs?: number;
  /** Extra attempts after the first one, for timeouts, network errors and 5xx. */
  retries?: number;
  retryDelayMs?: number;
}

const envelopeSchema = z.object({ data: z.unknown() });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function createF1Client(options: F1ClientOptions) {
  const {
    baseUrl,
    fetch: fetchFn = fetch,
    timeoutMs = 70_000,
    retries = 2,
    retryDelayMs = 1_000,
  } = options;

  async function fetchData(path: string): Promise<unknown> {
    let lastError: F1ApiError | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) await sleep(retryDelayMs);

      let response: Response;
      try {
        response = await fetchFn(`${baseUrl}${path}`, { signal: AbortSignal.timeout(timeoutMs) });
      } catch (cause) {
        lastError = new F1ApiError(
          "UNAVAILABLE",
          `F1 API unreachable (${cause instanceof Error ? cause.message : "unknown error"}).`,
        );
        continue;
      }

      if (response.status === 404) {
        throw new F1ApiError("NOT_FOUND", `F1 API has no resource at ${path}.`);
      }
      if (response.status >= 500) {
        lastError = new F1ApiError("UNAVAILABLE", `F1 API responded with ${response.status}.`);
        continue;
      }
      if (!response.ok) {
        throw new F1ApiError("INVALID_RESPONSE", `Unexpected F1 API status ${response.status}.`);
      }

      const body: unknown = await response.json().catch(() => undefined);
      const envelope = envelopeSchema.safeParse(body);
      if (!envelope.success) {
        throw new F1ApiError("INVALID_RESPONSE", "F1 API returned a body that is not JSON data.");
      }
      return envelope.data.data;
    }

    throw lastError ?? new F1ApiError("UNAVAILABLE", "F1 API unavailable.");
  }

  async function request<T>(path: string, schema: z.ZodType<T>): Promise<T> {
    const parsed = schema.safeParse(await fetchData(path));
    if (!parsed.success) {
      throw new F1ApiError("INVALID_RESPONSE", `F1 API response for ${path} has an unexpected shape.`);
    }
    return parsed.data;
  }

  async function requestList<T>(path: string, key: string, item: z.ZodType<T>): Promise<T[]> {
    const { [key]: items } = await request(path, z.object({ [key]: z.array(item) }));
    if (!items || items.length === 0) {
      throw new F1ApiError("EMPTY", `F1 API returned no items for ${path}.`);
    }
    return items as T[];
  }

  return {
    getRaces: (): Promise<Race[]> => requestList("/api/races", "races", raceSchema),
    getRace: (raceId: string): Promise<RaceDetail> =>
      request(`/api/races/${encodeURIComponent(raceId)}`, raceDetailSchema),
    getWeather: (raceId: string): Promise<Weather> =>
      request(`/api/races/${encodeURIComponent(raceId)}/weather`, weatherSchema),
    getSimulationParameters: (raceId: string): Promise<RaceSimulationParameters> =>
      request(`/api/races/${encodeURIComponent(raceId)}/simulation-parameters`, simulationParametersSchema),
    getTyres: (): Promise<TyreInfo[]> => requestList("/api/tyres", "tyres", tyreSchema),
    getDrivers: (): Promise<DriverInfo[]> => requestList("/api/drivers", "drivers", driverSchema),
    getTeams: (): Promise<TeamInfo[]> => requestList("/api/teams", "teams", teamSchema),
    getCircuits: (): Promise<CircuitInfo[]> => requestList("/api/circuits", "circuits", circuitSchema),
  };
}

export type F1Client = ReturnType<typeof createF1Client>;
