export const COMPOUNDS = ["SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET"] as const;
export type Compound = (typeof COMPOUNDS)[number];

export interface Tyre {
  compound: Compound;
  /** Segundos que suma a una vuelta respecto al HARD (negativo = más rápido). */
  pace: number;
  /** Segundos que se pierden por cada vuelta de uso, antes del factor de desgaste del circuito. */
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
  /** Tiempo de conducción del stint, sin la parada en boxes que le sigue. */
  timeSeconds: number;
  averageLapSeconds: number;
  /** Tiempo total perdido por desgaste del neumático dentro del stint. */
  degradationLossSeconds: number;
  /** Tiempo total perdido por usar un compuesto que no sirve para la lluvia. */
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
