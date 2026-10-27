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
      compound: z.enum(COMPOUNDS, { errorMap: () => ({ message: "compuesto desconocido" }) }),
      laps: z
        .number({ required_error: "faltan las vueltas", invalid_type_error: "las vueltas deben ser un número" })
        .int("las vueltas deben ser un número entero")
        .positive("las vueltas deben ser mayores a cero"),
    }),
    {
      required_error: "falta la estrategia",
      invalid_type_error: "la estrategia debe ser una lista de stints",
    },
  )
  .min(1, "la estrategia necesita al menos un stint");

const isDryRace = (weather: WeatherSegment[]) => weather.every((s) => s.rainIntensity === 0);

/**
 * Dos capas: Zod valida la forma (compuesto conocido, vueltas enteras positivas,
 * al menos un stint); las reglas de carrera corren solo sobre una estrategia
 * bien formada y se reportan todas juntas para que el usuario las corrija de una vez.
 */
export function validateStrategy(raw: unknown, ctx: StrategyContext): StrategyValidation {
  const parsed = strategySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => ({
        code: "INVALID_SHAPE" as const,
        message: `${issue.path.join(".") || "estrategia"}: ${issue.message}`,
      })),
    };
  }

  const strategy = parsed.data;
  const issues: StrategyIssue[] = [];

  const totalLaps = strategy.reduce((sum, s) => sum + s.laps, 0);
  if (totalLaps !== ctx.laps) {
    issues.push({
      code: "LAPS_MISMATCH",
      message: `Los stints suman ${totalLaps} vueltas pero la carrera tiene ${ctx.laps}.`,
    });
  }

  const pitStops = strategy.length - 1;
  if (pitStops < ctx.minimumPitStops) {
    issues.push({
      code: "MIN_PIT_STOPS",
      message: `Se requieren al menos ${ctx.minimumPitStops} parada(s) en boxes y hay ${pitStops}.`,
    });
  }

  if (isDryRace(ctx.weather) && new Set(strategy.map((s) => s.compound)).size < 2) {
    issues.push({
      code: "DRY_COMPOUND_RULE",
      message: "Una carrera en seco requiere al menos dos compuestos distintos.",
    });
  }

  return issues.length > 0 ? { ok: false, issues } : { ok: true, strategy };
}
