import type { RaceOverview, SimulationResponse } from "../api/types";

export const race = {
  id: "race-01",
  name: "Bahrain Grand Prix",
  round: 1,
  date: "2025-04-13",
  circuitId: "circuit-01",
  laps: 57,
  temperature: 31,
  rainProbability: 0.02,
};

export const overview: RaceOverview = {
  race,
  circuit: {
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
  },
  weather: {
    raceId: "race-01",
    summary: "Very hot and completely dry. High thermal tyre stress.",
    forecast: [
      { fromLap: 1, toLap: 19, temperature: 32, rainIntensity: 0 },
      { fromLap: 20, toLap: 57, temperature: 30, rainIntensity: 0.35 },
    ],
  },
  simulationParameters: {
    raceId: "race-01",
    lapTimeVariance: 0.15,
    pitStopLoss: 22,
    tyreChangeTime: 2.5,
    fuelEffectPerLap: 0.037,
    safetyCarProbability: 0.2,
    minimumPitStops: 1,
  },
  tyres: [
    {
      compound: "SOFT",
      pace: -1,
      degradation: 0.09,
      wetPerformance: 0.1,
      optimalRainIntensity: { min: 0, max: 0.05 },
    },
    {
      compound: "HARD",
      pace: 0,
      degradation: 0.03,
      wetPerformance: 0.2,
      optimalRainIntensity: { min: 0, max: 0.15 },
    },
  ],
  drivers: [
    {
      id: "driver-01",
      name: "Lando Norris",
      number: 4,
      teamId: "team-01",
      pace: 0.98,
      consistency: 0.94,
      team: { id: "team-01", name: "McLaren", carPerformance: 0.99 },
    },
  ],
};

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export const simulationResponse: SimulationResponse = {
  race,
  driver: { id: "driver-01", name: "Lando Norris", number: 4, teamId: "team-01", pace: 0.98, consistency: 0.94 },
  team: { id: "team-01", name: "McLaren", carPerformance: 0.99 },
  result: {
    totalTimeSeconds: 5485,
    totalPitLossSeconds: 24.5,
    stints: [
      {
        index: 0,
        compound: "SOFT",
        startLap: 1,
        endLap: 29,
        laps: 29,
        timeSeconds: 2800.5,
        averageLapSeconds: 95.5,
        degradationLossSeconds: 12.3,
        wetPenaltySeconds: 0,
      },
      {
        index: 1,
        compound: "HARD",
        startLap: 30,
        endLap: 57,
        laps: 28,
        timeSeconds: 2660,
        averageLapSeconds: 95,
        degradationLossSeconds: 4.1,
        wetPenaltySeconds: 0,
      },
    ],
    pitStops: [{ afterLap: 29, fromCompound: "SOFT", toCompound: "HARD", lossSeconds: 24.5 }],
  },
};
