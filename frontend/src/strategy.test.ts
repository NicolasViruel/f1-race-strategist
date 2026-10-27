import { describe, expect, it } from "vitest";
import type { Tyre } from "./api/types";
import { assignedLaps, defaultStrategy } from "./strategy";

const tyre = (compound: Tyre["compound"]): Tyre => ({
  compound,
  pace: 0,
  degradation: 0,
  wetPerformance: 0,
  optimalRainIntensity: { min: 0, max: 0 },
});

describe("defaultStrategy", () => {
  it("starts with a MEDIUM then HARD split that covers every lap", () => {
    const tyres = [tyre("SOFT"), tyre("MEDIUM"), tyre("HARD")];

    expect(defaultStrategy(57, tyres)).toEqual([
      { compound: "MEDIUM", laps: 29 },
      { compound: "HARD", laps: 28 },
    ]);
  });

  it("falls back to the first two compounds when MEDIUM and HARD are not both available", () => {
    expect(defaultStrategy(10, [tyre("SOFT"), tyre("HARD")])).toEqual([
      { compound: "SOFT", laps: 5 },
      { compound: "HARD", laps: 5 },
    ]);
  });
});

describe("assignedLaps", () => {
  it("adds up the laps of every stint", () => {
    expect(
      assignedLaps([
        { compound: "SOFT", laps: 20 },
        { compound: "HARD", laps: 15 },
      ]),
    ).toBe(35);
  });
});
