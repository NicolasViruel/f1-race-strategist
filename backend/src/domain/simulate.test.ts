import { describe, expect, it } from "vitest";
import { simulate } from "./simulate";
import type { SimulationInput, Tyre } from "./types";

const HARD: Tyre = {
  compound: "HARD",
  pace: 0,
  degradation: 0.1,
  wetPerformance: 0.2,
  optimalRainIntensity: { min: 0, max: 0.15 },
};
const SOFT: Tyre = {
  compound: "SOFT",
  pace: -1,
  degradation: 0.1,
  wetPerformance: 0.1,
  optimalRainIntensity: { min: 0, max: 0.05 },
};

// Escenario neutro: todos los efectos valen cero salvo que un test los active, así cada
// valor esperado de abajo se puede calcular a mano.
function input(overrides: Partial<SimulationInput> = {}): SimulationInput {
  return {
    circuit: { id: "c", name: "Test", laps: 10, baseLapTime: 100, tyreWear: 1 },
    params: { pitStopLoss: 20, tyreChangeTime: 2, fuelEffectPerLap: 0, minimumPitStops: 1 },
    weather: [{ fromLap: 1, toLap: 10, temperature: 25, rainIntensity: 0 }],
    tyres: [HARD, SOFT],
    driver: { id: "d", name: "Driver", teamId: "t", pace: 1, consistency: 1 },
    team: { id: "t", name: "Team", carPerformance: 1 },
    strategy: [{ compound: "HARD", laps: 10 }],
    ...overrides,
  };
}

describe("simulate", () => {
  it("applies the stints across the whole race distance", () => {
    const result = simulate(
      input({
        strategy: [
          { compound: "HARD", laps: 4 },
          { compound: "SOFT", laps: 6 },
        ],
      }),
    );

    expect(result.stints.map((s) => [s.compound, s.startLap, s.endLap, s.laps])).toEqual([
      ["HARD", 1, 4, 4],
      ["SOFT", 5, 10, 6],
    ]);
  });

  it("adds tyre degradation that grows with tyre age", () => {
    // edad 0..9 => 0.1 * (0+1+...+9) = 4.5 s en una carrera de 10 x 100 s
    const result = simulate(input());

    expect(result.stints[0]!.degradationLossSeconds).toBeCloseTo(4.5);
    expect(result.totalTimeSeconds).toBeCloseTo(1004.5);
  });

  it("resets tyre age after a pit stop and charges pit loss plus tyre change time", () => {
    // cada stint de 5 vueltas: 5 * 100 + 0.1 * (0+1+2+3+4) = 501 ; parada = 20 + 2
    const result = simulate(
      input({
        strategy: [
          { compound: "HARD", laps: 5 },
          { compound: "HARD", laps: 5 },
        ],
      }),
    );

    expect(result.pitStops).toEqual([
      { afterLap: 5, fromCompound: "HARD", toCompound: "HARD", lossSeconds: 22 },
    ]);
    expect(result.totalPitLossSeconds).toBe(22);
    expect(result.totalTimeSeconds).toBeCloseTo(1024);
  });

  it("applies the compound pace offset", () => {
    // SOFT es 1 s más rápido por vuelta que HARD: 10 * 99 + 4.5
    const result = simulate(input({ strategy: [{ compound: "SOFT", laps: 10 }] }));

    expect(result.totalTimeSeconds).toBeCloseTo(994.5);
  });

  it("scales the base lap time by driver pace and car performance", () => {
    // 100 / (0.5 * 1) = 200 s por vuelta
    const result = simulate(
      input({
        driver: { id: "d", name: "Driver", teamId: "t", pace: 0.5, consistency: 1 },
        tyres: [{ ...HARD, degradation: 0 }],
      }),
    );

    expect(result.totalTimeSeconds).toBeCloseTo(2000);
  });

  it("makes early laps slower because of the fuel load", () => {
    // 0.1 * (9+8+...+0) = 4.5 s sobre 1000 s
    const result = simulate(
      input({
        params: { pitStopLoss: 20, tyreChangeTime: 2, fuelEffectPerLap: 0.1, minimumPitStops: 1 },
        tyres: [{ ...HARD, degradation: 0 }],
      }),
    );

    expect(result.totalTimeSeconds).toBeCloseTo(1004.5);
  });

  it("penalises a compound outside its optimal rain range", () => {
    // intensidad 0.35, máximo del HARD 0.15 => 0.2 fuera del rango * 30 s/unidad = 6 s por vuelta, 10 vueltas
    const result = simulate(
      input({
        weather: [{ fromLap: 1, toLap: 10, temperature: 25, rainIntensity: 0.35 }],
        tyres: [{ ...HARD, degradation: 0 }],
      }),
    );

    expect(result.stints[0]!.wetPenaltySeconds).toBeCloseTo(60);
    expect(result.totalTimeSeconds).toBeCloseTo(1060);
  });

  it("does not penalise a compound inside its optimal rain range", () => {
    const result = simulate(
      input({
        weather: [{ fromLap: 1, toLap: 10, temperature: 25, rainIntensity: 0.1 }],
        tyres: [{ ...HARD, degradation: 0 }],
      }),
    );

    expect(result.stints[0]!.wetPenaltySeconds).toBe(0);
  });

  it("reports the average lap time of each stint", () => {
    const result = simulate(input());

    expect(result.stints[0]!.averageLapSeconds).toBeCloseTo(100.45);
  });
});
