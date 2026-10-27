import { describe, expect, it } from "vitest";
import { validateStrategy, type StrategyContext } from "./validateStrategy";

const dry: StrategyContext = {
  laps: 10,
  minimumPitStops: 1,
  weather: [{ fromLap: 1, toLap: 10, temperature: 25, rainIntensity: 0 }],
};
const wet: StrategyContext = {
  ...dry,
  weather: [{ fromLap: 1, toLap: 10, temperature: 15, rainIntensity: 0.5 }],
};

const codes = (result: ReturnType<typeof validateStrategy>) =>
  result.ok ? [] : result.issues.map((i) => i.code);

describe("validateStrategy", () => {
  it("accepts a well-formed dry strategy and returns it typed", () => {
    const result = validateStrategy(
      [
        { compound: "SOFT", laps: 4 },
        { compound: "HARD", laps: 6 },
      ],
      dry,
    );

    expect(result).toEqual({
      ok: true,
      strategy: [
        { compound: "SOFT", laps: 4 },
        { compound: "HARD", laps: 6 },
      ],
    });
  });

  it("rejects input that is not a list of stints", () => {
    expect(codes(validateStrategy("soft then hard", dry))).toEqual(["INVALID_SHAPE"]);
    expect(codes(validateStrategy(undefined, dry))).toEqual(["INVALID_SHAPE"]);
  });

  it("rejects an empty strategy", () => {
    expect(codes(validateStrategy([], dry))).toEqual(["INVALID_SHAPE"]);
  });

  it("rejects an unknown compound", () => {
    const result = validateStrategy([{ compound: "PURPLE", laps: 10 }], dry);

    expect(codes(result)).toEqual(["INVALID_SHAPE"]);
  });

  it.each([0, -3, 2.5])("rejects a stint with %s laps", (laps) => {
    const result = validateStrategy([{ compound: "HARD", laps }], dry);

    expect(codes(result)).toEqual(["INVALID_SHAPE"]);
  });

  it("rejects stints whose laps do not add up to the race distance", () => {
    const result = validateStrategy(
      [
        { compound: "SOFT", laps: 4 },
        { compound: "HARD", laps: 4 },
      ],
      dry,
    );

    expect(codes(result)).toContain("LAPS_MISMATCH");
  });

  it("rejects a strategy with fewer pit stops than the minimum", () => {
    const result = validateStrategy([{ compound: "HARD", laps: 10 }], dry);

    expect(codes(result)).toContain("MIN_PIT_STOPS");
  });

  it("requires at least two distinct compounds in a dry race", () => {
    const result = validateStrategy(
      [
        { compound: "HARD", laps: 5 },
        { compound: "HARD", laps: 5 },
      ],
      dry,
    );

    expect(codes(result)).toEqual(["DRY_COMPOUND_RULE"]);
  });

  it("does not require two distinct compounds in a wet race", () => {
    const result = validateStrategy(
      [
        { compound: "INTERMEDIATE", laps: 5 },
        { compound: "INTERMEDIATE", laps: 5 },
      ],
      wet,
    );

    expect(result.ok).toBe(true);
  });

  it("reports every broken rule at once", () => {
    const result = validateStrategy([{ compound: "HARD", laps: 4 }], dry);

    expect(codes(result).sort()).toEqual(
      ["DRY_COMPOUND_RULE", "LAPS_MISMATCH", "MIN_PIT_STOPS"].sort(),
    );
  });
});
