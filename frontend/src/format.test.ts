import { describe, expect, it } from "vitest";
import { formatLapTime, formatRaceTime } from "./format";

describe("formatRaceTime", () => {
  it.each([
    [5485, "1:31:25.000"],
    [5489.306, "1:31:29.306"],
    [59.5, "0:00:59.500"],
  ])("formats %s seconds as %s", (seconds, expected) => {
    expect(formatRaceTime(seconds)).toBe(expected);
  });
});

describe("formatLapTime", () => {
  it.each([
    [95.5, "1:35.500"],
    [2800.5, "46:40.500"],
    [9.0049, "0:09.005"],
  ])("formats %s seconds as %s", (seconds, expected) => {
    expect(formatLapTime(seconds)).toBe(expected);
  });
});
