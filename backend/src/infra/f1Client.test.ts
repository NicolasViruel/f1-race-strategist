import { describe, expect, it, vi } from "vitest";
import { createF1Client, F1ApiError } from "./f1Client";

const BASE_URL = "https://f1.example.test";

const envelope = (data: unknown) => ({ statusCode: 200, code: "OK", message: "ok", data });
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const race = {
  id: "race-01",
  name: "Bahrain Grand Prix",
  round: 1,
  date: "2025-04-13",
  circuitId: "circuit-01",
  laps: 57,
  temperature: 31,
  rainProbability: 0.02,
};
const circuit = {
  id: "circuit-01",
  name: "Bahrain International Circuit",
  country: "Bahrain",
  type: "permanent",
  laps: 57,
  lengthKm: 5.412,
  baseLapTime: 91.5,
  pitStopLoss: 22,
  tyreWear: 1.35,
  overtakingDifficulty: 0.3,
};

function client(fetchFn: typeof fetch, overrides: { retries?: number; timeoutMs?: number } = {}) {
  return createF1Client({
    baseUrl: BASE_URL,
    fetch: fetchFn,
    retries: overrides.retries ?? 2,
    retryDelayMs: 0,
    timeoutMs: overrides.timeoutMs ?? 1000,
  });
}

const failureCode = async (promise: Promise<unknown>) => {
  const error = await promise.then(
    () => undefined,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(F1ApiError);
  return (error as F1ApiError).code;
};

describe("f1 client", () => {
  it("returns the races from the API envelope", async () => {
    const fetchFn = vi.fn().mockResolvedValue(json(envelope({ races: [race] })));

    const races = await client(fetchFn).getRaces();

    expect(races).toEqual([race]);
    expect(fetchFn.mock.calls[0]![0]).toBe(`${BASE_URL}/api/races`);
  });

  it("returns one race with its circuit embedded", async () => {
    const fetchFn = vi.fn().mockResolvedValue(json(envelope({ ...race, circuit })));

    const result = await client(fetchFn).getRace("race-01");

    expect(result.circuit.baseLapTime).toBe(91.5);
    expect(fetchFn.mock.calls[0]![0]).toBe(`${BASE_URL}/api/races/race-01`);
  });

  it("returns weather and simulation parameters for a race", async () => {
    const weather = {
      raceId: "race-01",
      summary: "Dry",
      forecast: [{ fromLap: 1, toLap: 57, temperature: 32, rainIntensity: 0 }],
    };
    const params = {
      raceId: "race-01",
      lapTimeVariance: 0.15,
      pitStopLoss: 22,
      tyreChangeTime: 2.5,
      fuelEffectPerLap: 0.037,
      safetyCarProbability: 0.2,
      minimumPitStops: 1,
    };
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(json(envelope(weather)))
      .mockResolvedValueOnce(json(envelope(params)));
    const f1 = client(fetchFn);

    expect((await f1.getWeather("race-01")).forecast).toHaveLength(1);
    expect((await f1.getSimulationParameters("race-01")).minimumPitStops).toBe(1);
  });

  it("retries a 5xx response and succeeds", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(json({ message: "waking up" }, 503))
      .mockResolvedValueOnce(json(envelope({ races: [race] })));

    const races = await client(fetchFn).getRaces();

    expect(races).toHaveLength(1);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("retries a network error and succeeds", async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(json(envelope({ races: [race] })));

    await client(fetchFn).getRaces();

    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("fails with UNAVAILABLE after exhausting retries", async () => {
    const fetchFn = vi.fn().mockResolvedValue(json({}, 500));

    const code = await failureCode(client(fetchFn, { retries: 2 }).getRaces());

    expect(code).toBe("UNAVAILABLE");
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it("fails with UNAVAILABLE when the request times out", async () => {
    const hanging = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(init.signal!.reason));
        }),
    ) as unknown as typeof fetch;

    const code = await failureCode(client(hanging, { retries: 0, timeoutMs: 20 }).getRaces());

    expect(code).toBe("UNAVAILABLE");
  });

  it("does not retry a 404 and reports NOT_FOUND", async () => {
    const fetchFn = vi.fn().mockResolvedValue(json({ message: "not found" }, 404));

    const code = await failureCode(client(fetchFn).getRace("race-99"));

    expect(code).toBe("NOT_FOUND");
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("reports EMPTY when the API returns no items", async () => {
    const fetchFn = vi.fn().mockResolvedValue(json(envelope({ races: [] })));

    expect(await failureCode(client(fetchFn).getRaces())).toBe("EMPTY");
  });

  it("reports INVALID_RESPONSE when the body does not match the contract", async () => {
    const fetchFn = vi.fn().mockResolvedValue(json(envelope({ races: [{ id: 1 }] })));

    expect(await failureCode(client(fetchFn).getRaces())).toBe("INVALID_RESPONSE");
  });

  it("reports INVALID_RESPONSE when the body is not JSON", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response("<html>oops</html>", { status: 200 }));

    expect(await failureCode(client(fetchFn).getRaces())).toBe("INVALID_RESPONSE");
  });
});
