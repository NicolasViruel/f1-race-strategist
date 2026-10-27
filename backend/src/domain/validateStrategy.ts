import { z } from "zod";
import { COMPOUNDS, type Stint, type WeatherSegment } from "./types";

export interface StrategyContext {
  laps: number;
  minimumPitStops: number;
  weather: WeatherSegment[];
}

export type StrategyIssueCode =
  | "INVALID_SHAPE"
  | "LAPS_MISMATCH"
  | "MIN_PIT_STOPS"
  | "DRY_COMPOUND_RULE";

export interface StrategyIssue {
  code: StrategyIssueCode;
  message: string;
}

export type StrategyValidation =
  | { ok: true; strategy: Stint[] }
  | { ok: false; issues: StrategyIssue[] };

const strategySchema = z
  .array(
    z.object({
      compound: z.enum(COMPOUNDS),
      laps: z.number().int().positive(),
    }),
  )
  .min(1);

const isDryRace = (weather: WeatherSegment[]) => weather.every((s) => s.rainIntensity === 0);

/**
 * Two layers: Zod checks the shape (known compound, positive integer laps,
 * at least one stint); the race rules run only on a well-formed strategy and
 * are all reported together so the user can fix them in one pass.
 */
export function validateStrategy(raw: unknown, ctx: StrategyContext): StrategyValidation {
  const parsed = strategySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => ({
        code: "INVALID_SHAPE" as const,
        message: `${issue.path.join(".") || "strategy"}: ${issue.message}`,
      })),
    };
  }

  const strategy = parsed.data;
  const issues: StrategyIssue[] = [];

  const totalLaps = strategy.reduce((sum, s) => sum + s.laps, 0);
  if (totalLaps !== ctx.laps) {
    issues.push({
      code: "LAPS_MISMATCH",
      message: `Stints add up to ${totalLaps} laps but the race has ${ctx.laps}.`,
    });
  }

  const pitStops = strategy.length - 1;
  if (pitStops < ctx.minimumPitStops) {
    issues.push({
      code: "MIN_PIT_STOPS",
      message: `At least ${ctx.minimumPitStops} pit stop(s) required, got ${pitStops}.`,
    });
  }

  if (isDryRace(ctx.weather) && new Set(strategy.map((s) => s.compound)).size < 2) {
    issues.push({
      code: "DRY_COMPOUND_RULE",
      message: "A dry race requires at least two different compounds.",
    });
  }

  return issues.length > 0 ? { ok: false, issues } : { ok: true, strategy };
}
