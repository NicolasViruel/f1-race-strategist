import { z } from "zod";
import { simulate } from "../domain/simulate";
import { validateStrategy } from "../domain/validateStrategy";
import type { F1Client } from "../infra/f1Client";
import { AppError } from "./appError";
import { loadRaceContext } from "./loadRaceContext";

const requestSchema = z.object({ driverId: z.string().min(1), strategy: z.unknown() });

export async function runSimulation(f1: F1Client, raceId: string, body: unknown) {
  const request = requestSchema.safeParse(body);
  if (!request.success) {
    throw new AppError("INVALID_REQUEST", 400, "Se requieren un driverId y una estrategia.");
  }

  const { race, circuit, weather, simulationParameters, tyres, drivers, teams } =
    await loadRaceContext(f1, raceId);

  const driver = drivers.find((d) => d.id === request.data.driverId);
  const team = teams.find((t) => t.id === driver?.teamId);
  if (!driver || !team) {
    throw new AppError("INVALID_REQUEST", 400, `Piloto desconocido: ${request.data.driverId}.`);
  }

  const validation = validateStrategy(request.data.strategy, {
    laps: race.laps,
    minimumPitStops: simulationParameters.minimumPitStops,
    weather: weather.forecast,
  });
  if (!validation.ok) {
    throw new AppError("INVALID_STRATEGY", 400, "La estrategia no es válida.", validation.issues);
  }

  const result = simulate({
    circuit: { ...circuit, laps: race.laps },
    params: simulationParameters,
    weather: weather.forecast,
    tyres,
    driver,
    team,
    strategy: validation.strategy,
  });

  return { race, driver, team, result };
}
