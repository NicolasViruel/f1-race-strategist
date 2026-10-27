export type Compound = "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET";

export interface Race {
  id: string;
  name: string;
  round: number;
  date: string;
  circuitId: string;
  laps: number;
  temperature: number;
  rainProbability: number;
}

export interface Circuit {
  id: string;
  name: string;
  country: string;
  type: string;
  laps: number;
  lengthKm: number;
  baseLapTime: number;
  pitStopLoss: number;
  tyreWear: number;
  overtakingDifficulty: number;
}

export interface WeatherSegment {
  fromLap: number;
  toLap: number;
  temperature: number;
  rainIntensity: number;
}

export interface Weather {
  raceId: string;
  summary: string;
  forecast: WeatherSegment[];
}

export interface SimulationParameters {
  raceId: string;
  lapTimeVariance: number;
  pitStopLoss: number;
  tyreChangeTime: number;
  fuelEffectPerLap: number;
  safetyCarProbability: number;
  minimumPitStops: number;
}

export interface Tyre {
  compound: Compound;
  pace: number;
  degradation: number;
  wetPerformance: number;
  optimalRainIntensity: { min: number; max: number };
}

export interface Team {
  id: string;
  name: string;
  carPerformance: number;
}

export interface Driver {
  id: string;
  name: string;
  number: number;
  teamId: string;
  pace: number;
  consistency: number;
  team: Team | null;
}

export interface RaceOverview {
  race: Race;
  circuit: Circuit;
  weather: Weather;
  simulationParameters: SimulationParameters;
  tyres: Tyre[];
  drivers: Driver[];
}
