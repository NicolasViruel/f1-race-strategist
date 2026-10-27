export type Compound = "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET";

export interface Tyre {
  compound: Compound;
  /** Seconds added to a lap versus HARD (negative = faster). */
  pace: number;
  /** Seconds lost per lap of tyre age, before the circuit wear factor. */
  degradation: number;
  wetPerformance: number;
  optimalRainIntensity: { min: number; max: number };
}

export interface Circuit {
  id: string;
  name: string;
  laps: number;
  baseLapTime: number;
  tyreWear: number;
}

export interface Driver {
  id: string;
  name: string;
  teamId: string;
  pace: number;
  consistency: number;
}

export interface Team {
  id: string;
  name: string;
  carPerformance: number;
}

export interface SimulationParameters {
  pitStopLoss: number;
  tyreChangeTime: number;
  fuelEffectPerLap: number;
  minimumPitStops: number;
}

export interface WeatherSegment {
  fromLap: number;
  toLap: number;
  temperature: number;
  rainIntensity: number;
}

export interface Stint {
  compound: Compound;
  laps: number;
}

export interface SimulationInput {
  circuit: Circuit;
  params: SimulationParameters;
  weather: WeatherSegment[];
  tyres: Tyre[];
  driver: Driver;
  team: Team;
  strategy: Stint[];
}

export interface StintResult {
  index: number;
  compound: Compound;
  startLap: number;
  endLap: number;
  laps: number;
  /** Driving time of the stint, excluding the pit stop that follows it. */
  timeSeconds: number;
  averageLapSeconds: number;
  /** Total time lost to tyre wear within the stint. */
  degradationLossSeconds: number;
  /** Total time lost to running a compound unsuited to the rain. */
  wetPenaltySeconds: number;
}

export interface PitStopResult {
  afterLap: number;
  fromCompound: Compound;
  toCompound: Compound;
  lossSeconds: number;
}

export interface SimulationResult {
  totalTimeSeconds: number;
  stints: StintResult[];
  pitStops: PitStopResult[];
  totalPitLossSeconds: number;
}
