import type { Stint, Tyre } from "./api/types";

/** A valid dry-race starting point: MEDIUM then HARD (or the first two compounds on offer). */
export function defaultStrategy(raceLaps: number, tyres: Tyre[]): Stint[] {
  const preferred = ["MEDIUM", "HARD"]
    .map((compound) => tyres.find((tyre) => tyre.compound === compound))
    .filter((tyre): tyre is Tyre => tyre !== undefined);
  const [first, second] = preferred.length === 2 ? preferred : tyres;
  if (!first) return [];

  const firstLaps = Math.ceil(raceLaps / 2);
  return [
    { compound: first.compound, laps: firstLaps },
    { compound: (second ?? first).compound, laps: raceLaps - firstLaps },
  ];
}

export const assignedLaps = (stints: Stint[]) => stints.reduce((sum, stint) => sum + stint.laps, 0);
