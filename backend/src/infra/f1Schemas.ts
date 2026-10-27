import { z } from "zod";
import { COMPOUNDS } from "../domain/types";

export const raceSchema = z.object({
  id: z.string(),
  name: z.string(),
  round: z.number(),
  date: z.string(),
  circuitId: z.string(),
  laps: z.number(),
  temperature: z.number(),
  rainProbability: z.number(),
});

export const circuitSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  type: z.string(),
  laps: z.number(),
  lengthKm: z.number(),
  baseLapTime: z.number(),
  pitStopLoss: z.number(),
  tyreWear: z.number(),
  overtakingDifficulty: z.number(),
});

export const raceDetailSchema = raceSchema.extend({ circuit: circuitSchema });

export const driverSchema = z.object({
  id: z.string(),
  name: z.string(),
  number: z.number(),
  teamId: z.string(),
  pace: z.number(),
  consistency: z.number(),
});

export const teamSchema = z.object({
  id: z.string(),
  name: z.string(),
  carPerformance: z.number(),
});

export const tyreSchema = z.object({
  compound: z.enum(COMPOUNDS),
  pace: z.number(),
  degradation: z.number(),
  wetPerformance: z.number(),
  optimalRainIntensity: z.object({ min: z.number(), max: z.number() }),
});

export const weatherSchema = z.object({
  raceId: z.string(),
  summary: z.string(),
  forecast: z.array(
    z.object({
      fromLap: z.number(),
      toLap: z.number(),
      temperature: z.number(),
      rainIntensity: z.number(),
    }),
  ),
});

export const simulationParametersSchema = z.object({
  raceId: z.string(),
  lapTimeVariance: z.number(),
  pitStopLoss: z.number(),
  tyreChangeTime: z.number(),
  fuelEffectPerLap: z.number(),
  safetyCarProbability: z.number(),
  minimumPitStops: z.number(),
});

export type Race = z.infer<typeof raceSchema>;
export type RaceDetail = z.infer<typeof raceDetailSchema>;
export type CircuitInfo = z.infer<typeof circuitSchema>;
export type DriverInfo = z.infer<typeof driverSchema>;
export type TeamInfo = z.infer<typeof teamSchema>;
export type TyreInfo = z.infer<typeof tyreSchema>;
export type Weather = z.infer<typeof weatherSchema>;
export type RaceSimulationParameters = z.infer<typeof simulationParametersSchema>;
