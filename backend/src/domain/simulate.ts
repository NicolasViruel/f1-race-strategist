import type {
  PitStopResult,
  SimulationInput,
  SimulationResult,
  StintResult,
  Tyre,
  WeatherSegment,
} from "./types";

/** Segundos perdidos por vuelta por cada unidad de lluvia fuera del rango óptimo del neumático. */
export const WET_MISMATCH_SECONDS_PER_UNIT = 30;

function rainIntensityAt(weather: WeatherSegment[], lap: number): number {
  const segment = weather.find((s) => lap >= s.fromLap && lap <= s.toLap);
  return segment?.rainIntensity ?? 0;
}

function wetPenalty(tyre: Tyre, rainIntensity: number): number {
  const { min, max } = tyre.optimalRainIntensity;
  const distance = Math.max(min - rainIntensity, rainIntensity - max, 0);
  return distance * WET_MISMATCH_SECONDS_PER_UNIT;
}

/**
 * Simulación determinista de carrera, vuelta por vuelta. Asume que la estrategia
 * ya fue validada (las vueltas de los stints suman las de la carrera y los
 * compuestos existen).
 *
 * tiempo de vuelta = baseLapTime / (driver.pace * team.carPerformance)
 *                  + tyre.pace
 *                  + tyre.degradation * circuit.tyreWear * edad del neumático
 *                  + fuelEffectPerLap * vueltas restantes
 *                  + penalización por lluvia
 * Cada parada en boxes suma pitStopLoss + tyreChangeTime y reinicia la edad del neumático.
 */
export function simulate(input: SimulationInput): SimulationResult {
  const { circuit, params, weather, tyres, driver, team, strategy } = input;
  const baseLap = circuit.baseLapTime / (driver.pace * team.carPerformance);

  const stints: StintResult[] = [];
  const pitStops: PitStopResult[] = [];
  let lap = 0;

  strategy.forEach((stint, index) => {
    const tyre = tyres.find((t) => t.compound === stint.compound);
    if (!tyre) throw new Error(`Unknown compound: ${stint.compound}`);

    const startLap = lap + 1;
    let timeSeconds = 0;
    let degradationLossSeconds = 0;
    let wetPenaltySeconds = 0;

    for (let tyreAge = 0; tyreAge < stint.laps; tyreAge++) {
      lap++;
      const degradation = tyre.degradation * circuit.tyreWear * tyreAge;
      const fuel = params.fuelEffectPerLap * (circuit.laps - lap);
      const wet = wetPenalty(tyre, rainIntensityAt(weather, lap));

      timeSeconds += baseLap + tyre.pace + degradation + fuel + wet;
      degradationLossSeconds += degradation;
      wetPenaltySeconds += wet;
    }

    stints.push({
      index,
      compound: stint.compound,
      startLap,
      endLap: lap,
      laps: stint.laps,
      timeSeconds,
      averageLapSeconds: timeSeconds / stint.laps,
      degradationLossSeconds,
      wetPenaltySeconds,
    });

    const next = strategy[index + 1];
    if (next) {
      pitStops.push({
        afterLap: lap,
        fromCompound: stint.compound,
        toCompound: next.compound,
        lossSeconds: params.pitStopLoss + params.tyreChangeTime,
      });
    }
  });

  const totalPitLossSeconds = pitStops.reduce((sum, p) => sum + p.lossSeconds, 0);
  const drivingSeconds = stints.reduce((sum, s) => sum + s.timeSeconds, 0);

  return {
    totalTimeSeconds: drivingSeconds + totalPitLossSeconds,
    stints,
    pitStops,
    totalPitLossSeconds,
  };
}
