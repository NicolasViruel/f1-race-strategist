import { describe, expect, it, vi } from "vitest";
import { jsonResponse, overview, race } from "../test/fixtures";
import { ApiError, getRaceOverview, getRaces } from "./client";

describe("api client", () => {
  it("returns the races list", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ races: [race] }));
    vi.stubGlobal("fetch", fetchFn);

    expect(await getRaces()).toEqual([race]);
    expect(fetchFn.mock.calls[0]![0]).toBe("/api/races");
  });

  it("returns the overview of one race", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(overview));
    vi.stubGlobal("fetch", fetchFn);

    expect((await getRaceOverview("race-01")).circuit.name).toBe("Bahrain International Circuit");
    expect(fetchFn.mock.calls[0]![0]).toBe("/api/races/race-01");
  });

  it("surfaces the server's error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ error: { code: "F1_API_UNAVAILABLE", message: "The F1 API is not responding." } }, 502),
      ),
    );

    const error = await getRaces().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe("The F1 API is not responding.");
    expect((error as ApiError).code).toBe("F1_API_UNAVAILABLE");
  });

  it("falls back to a generic message when the error body is unreadable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>bad gateway</html>", { status: 502 })));

    const error = await getRaces().catch((e: unknown) => e);

    expect((error as ApiError).message).toMatch(/something went wrong/i);
  });

  it("reports an unreachable server with a friendly message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const error = await getRaces().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toMatch(/could not reach the server/i);
  });
});
