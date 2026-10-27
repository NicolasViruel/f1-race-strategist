import type { F1Client } from "../infra/f1Client";
import { loadRaceContext } from "./loadRaceContext";

export async function getRaceOverview(f1: F1Client, raceId: string) {
  const { teams, drivers, ...rest } = await loadRaceContext(f1, raceId);
  const teamById = new Map(teams.map((team) => [team.id, team]));

  return {
    ...rest,
    drivers: drivers.map((driver) => ({ ...driver, team: teamById.get(driver.teamId) ?? null })),
  };
}
