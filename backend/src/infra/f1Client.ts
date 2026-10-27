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
  /** Tiempo máximo por intento. La API alojada puede tardar hasta un minuto en despertar. */
  timeoutMs?: number;
  /** Intentos extra después del primero, para timeouts, errores de red y 5xx. */
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
          `No se pudo contactar la API de F1 (${cause instanceof Error ? cause.message : "error desconocido"}).`,
        );
        continue;
      }

      if (response.status === 404) {
        throw new F1ApiError("NOT_FOUND", `La API de F1 no tiene el recurso ${path}.`);
      }
      if (response.status >= 500) {
        lastError = new F1ApiError("UNAVAILABLE", `La API de F1 respondió con el estado ${response.status}.`);
        continue;
      }
      if (!response.ok) {
        throw new F1ApiError("INVALID_RESPONSE", `Estado inesperado de la API de F1: ${response.status}.`);
      }

      const body: unknown = await response.json().catch(() => undefined);
      const envelope = envelopeSchema.safeParse(body);
      if (!envelope.success) {
        throw new F1ApiError("INVALID_RESPONSE", "La API de F1 devolvió un cuerpo que no es JSON con datos.");
      }
      return envelope.data.data;
    }

    throw lastError ?? new F1ApiError("UNAVAILABLE", "API de F1 no disponible.");
  }

  async function request<T>(path: string, schema: z.ZodType<T>): Promise<T> {
    const parsed = schema.safeParse(await fetchData(path));
    if (!parsed.success) {
      throw new F1ApiError("INVALID_RESPONSE", `La respuesta de la API de F1 para ${path} tiene una forma inesperada.`);
    }
    return parsed.data;
  }

  async function requestList<T>(path: string, key: string, item: z.ZodType<T>): Promise<T[]> {
    const { [key]: items } = await request(path, z.object({ [key]: z.array(item) }));
    if (!items || items.length === 0) {
      throw new F1ApiError("EMPTY", `La API de F1 no devolvió elementos para ${path}.`);
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
