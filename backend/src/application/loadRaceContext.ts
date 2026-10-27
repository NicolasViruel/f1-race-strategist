import type { F1Client } from "../infra/f1Client";
import { withF1Errors } from "./f1Errors";

/** Everything known about one race, fetched in parallel from the F1 API. */
export async function loadRaceContext(f1: F1Client, raceId: string) {
  const [race, weather, simulationParameters, tyres, drivers, teams] = await withF1Errors(
    Promise.all([
      f1.getRace(raceId),
      f1.getWeather(raceId),
      f1.getSimulationParameters(raceId),
      f1.getTyres(),
      f1.getDrivers(),
      f1.getTeams(),
    ]),
  );

  const { circuit, ...raceInfo } = race;
  return { race: raceInfo, circuit, weather, simulationParameters, tyres, drivers, teams };
}

export type RaceContext = Awaited<ReturnType<typeof loadRaceContext>>;
