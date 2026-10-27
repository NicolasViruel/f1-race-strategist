import { describe, expect, it, vi } from "vitest";
import { jsonResponse, simulationResponse } from "../test/fixtures";
import { ApiError, simulateRace } from "./client";

const request = {
  driverId: "driver-01",
  strategy: [
    { compound: "SOFT" as const, laps: 29 },
    { compound: "HARD" as const, laps: 28 },
  ],
};

describe("simulateRace", () => {
  it("posts the driver and strategy as JSON and returns the simulation", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(simulationResponse));
    vi.stubGlobal("fetch", fetchFn);

    const response = await simulateRace("race-01", request);

    expect(response.result.totalTimeSeconds).toBe(5485);
    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toBe("/api/races/race-01/simulate");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "content-type": "application/json" });
    expect(JSON.parse(init.body)).toEqual(request);
  });

  it("carries the list of broken rules when the strategy is rejected", async () => {
    const issues = [{ code: "LAPS_MISMATCH", message: "Stints add up to 49 laps but the race has 57." }];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ error: { code: "INVALID_STRATEGY", message: "The strategy is not valid.", issues } }, 400),
      ),
    );

    const error = await simulateRace("race-01", request).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe("INVALID_STRATEGY");
    expect((error as ApiError).issues).toEqual(issues);
  });
});
