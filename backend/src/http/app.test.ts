import { describe, expect, it, vi } from "vitest";
import { buildApp } from "./app";
import { F1ApiError, type F1Client } from "../infra/f1Client";

const circuit = {
  id: "circuit-01",
  name: "Test Circuit",
  country: "Testland",
  type: "permanent",
  laps: 4,
  lengthKm: 5,
  baseLapTime: 100,
  pitStopLoss: 20,
  tyreWear: 1,
  overtakingDifficulty: 0.3,
};
const race = {
  id: "race-01",
  name: "Test Grand Prix",
  round: 1,
  date: "2025-01-01",
  circuitId: "circuit-01",
  laps: 4,
  temperature: 25,
  rainProbability: 0,
};
const tyres = [
  {
    compound: "SOFT" as const,
    pace: -1,
    degradation: 0,
    wetPerformance: 0.1,
    optimalRainIntensity: { min: 0, max: 0.05 },
  },
  {
    compound: "HARD" as const,
    pace: 0,
    degradation: 0,
    wetPerformance: 0.2,
    optimalRainIntensity: { min: 0, max: 0.15 },
  },
];
const drivers = [{ id: "driver-01", name: "Test Driver", number: 7, teamId: "team-01", pace: 1, consistency: 1 }];
const teams = [{ id: "team-01", name: "Test Team", carPerformance: 1 }];

function fakeF1(overrides: Partial<F1Client> = {}): F1Client {
  return {
    getRaces: vi.fn().mockResolvedValue([race]),
    getRace: vi.fn().mockResolvedValue({ ...race, circuit }),
    getWeather: vi.fn().mockResolvedValue({
      raceId: "race-01",
      summary: "Dry",
      forecast: [{ fromLap: 1, toLap: 4, temperature: 25, rainIntensity: 0 }],
    }),
    getSimulationParameters: vi.fn().mockResolvedValue({
      raceId: "race-01",
      lapTimeVariance: 0.1,
      pitStopLoss: 20,
      tyreChangeTime: 2,
      fuelEffectPerLap: 0,
      safetyCarProbability: 0.2,
      minimumPitStops: 1,
    }),
    getTyres: vi.fn().mockResolvedValue(tyres),
    getDrivers: vi.fn().mockResolvedValue(drivers),
    getTeams: vi.fn().mockResolvedValue(teams),
    getCircuits: vi.fn().mockResolvedValue([circuit]),
    ...overrides,
  };
}

const simulate = (f1: F1Client, body: unknown, raceId = "race-01") =>
  buildApp(f1).inject({ method: "POST", url: `/api/races/${raceId}/simulate`, payload: body as object });

describe("GET /api/races", () => {
  it("lists the races", async () => {
    const response = await buildApp(fakeF1()).inject({ method: "GET", url: "/api/races" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ races: [race] });
  });

  it("answers 502 F1_API_UNAVAILABLE when the F1 API is down", async () => {
    const f1 = fakeF1({ getRaces: vi.fn().mockRejectedValue(new F1ApiError("UNAVAILABLE", "down")) });

    const response = await buildApp(f1).inject({ method: "GET", url: "/api/races" });

    expect(response.statusCode).toBe(502);
    expect(response.json().error.code).toBe("F1_API_UNAVAILABLE");
  });

  it("answers 502 F1_API_EMPTY when the F1 API returns nothing", async () => {
    const f1 = fakeF1({ getRaces: vi.fn().mockRejectedValue(new F1ApiError("EMPTY", "nothing")) });

    const response = await buildApp(f1).inject({ method: "GET", url: "/api/races" });

    expect(response.statusCode).toBe(502);
    expect(response.json().error.code).toBe("F1_API_EMPTY");
  });
});

describe("GET /api/races/:raceId", () => {
  it("returns everything the frontend needs about the race in one call", async () => {
    const response = await buildApp(fakeF1()).inject({ method: "GET", url: "/api/races/race-01" });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.race.name).toBe("Test Grand Prix");
    expect(body.circuit.baseLapTime).toBe(100);
    expect(body.weather.forecast).toHaveLength(1);
    expect(body.simulationParameters.minimumPitStops).toBe(1);
    expect(body.tyres.map((t: { compound: string }) => t.compound)).toEqual(["SOFT", "HARD"]);
    expect(body.drivers[0].team.name).toBe("Test Team");
  });

  it("answers 404 RACE_NOT_FOUND for an unknown race", async () => {
    const f1 = fakeF1({ getRace: vi.fn().mockRejectedValue(new F1ApiError("NOT_FOUND", "no race")) });

    const response = await buildApp(f1).inject({ method: "GET", url: "/api/races/race-99" });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("RACE_NOT_FOUND");
  });
});

describe("POST /api/races/:raceId/simulate", () => {
  const valid = {
    driverId: "driver-01",
    strategy: [
      { compound: "SOFT", laps: 2 },
      { compound: "HARD", laps: 2 },
    ],
  };

  it("simulates a valid strategy and returns the breakdown", async () => {
    // 2 SOFT laps at 99 s + 2 HARD laps at 100 s + one stop of 20 + 2 s
    const response = await simulate(fakeF1(), valid);
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.result.totalTimeSeconds).toBeCloseTo(420);
    expect(body.result.stints.map((s: { compound: string; laps: number }) => [s.compound, s.laps])).toEqual([
      ["SOFT", 2],
      ["HARD", 2],
    ]);
    expect(body.result.pitStops).toHaveLength(1);
    expect(body.driver.name).toBe("Test Driver");
    expect(body.team.name).toBe("Test Team");
  });

  it("answers 400 INVALID_STRATEGY with every broken rule", async () => {
    const response = await simulate(fakeF1(), {
      driverId: "driver-01",
      strategy: [{ compound: "HARD", laps: 3 }],
    });

    expect(response.statusCode).toBe(400);
    const { error } = response.json();
    expect(error.code).toBe("INVALID_STRATEGY");
    expect(error.issues.map((i: { code: string }) => i.code).sort()).toEqual(
      ["DRY_COMPOUND_RULE", "LAPS_MISMATCH", "MIN_PIT_STOPS"].sort(),
    );
  });

  it("answers 400 INVALID_STRATEGY when the strategy is missing", async () => {
    const response = await simulate(fakeF1(), { driverId: "driver-01" });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("INVALID_STRATEGY");
  });

  it("answers 400 INVALID_REQUEST when the driver is missing or unknown", async () => {
    const missing = await simulate(fakeF1(), { strategy: valid.strategy });
    const unknown = await simulate(fakeF1(), { ...valid, driverId: "driver-99" });

    expect(missing.statusCode).toBe(400);
    expect(missing.json().error.code).toBe("INVALID_REQUEST");
    expect(unknown.statusCode).toBe(400);
    expect(unknown.json().error.code).toBe("INVALID_REQUEST");
  });

  it("answers 404 RACE_NOT_FOUND for an unknown race", async () => {
    const f1 = fakeF1({ getRace: vi.fn().mockRejectedValue(new F1ApiError("NOT_FOUND", "no race")) });

    const response = await simulate(f1, valid, "race-99");

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("RACE_NOT_FOUND");
  });

  it("answers 502 when the F1 API fails while simulating", async () => {
    const f1 = fakeF1({ getTyres: vi.fn().mockRejectedValue(new F1ApiError("UNAVAILABLE", "down")) });

    const response = await simulate(f1, valid);

    expect(response.statusCode).toBe(502);
    expect(response.json().error.code).toBe("F1_API_UNAVAILABLE");
  });
});
