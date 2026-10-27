import { useState } from "react";
import { ApiError, simulateRace } from "../api/client";
import type { RaceOverview, SimulationResponse, Stint, StrategyIssue } from "../api/types";
import { defaultStrategy } from "../strategy";
import { SimulationResult } from "./SimulationResult";
import { StrategyBuilder } from "./StrategyBuilder";

interface Failure {
  message: string;
  issues: StrategyIssue[];
}

/** Guarda la estrategia que se está editando y el resultado de la última corrida. */
export function SimulationPanel({ overview }: { overview: RaceOverview }) {
  const { race, tyres, drivers } = overview;
  const [driverId, setDriverId] = useState(drivers[0]?.id ?? "");
  const [stints, setStints] = useState<Stint[]>(() => defaultStrategy(race.laps, tyres));
  const [running, setRunning] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);

  async function run() {
    setRunning(true);
    setFailure(null);
    try {
      setSimulation(await simulateRace(race.id, { driverId, strategy: stints }));
    } catch (error) {
      setSimulation(null);
      setFailure(
        error instanceof ApiError
          ? { message: error.message, issues: error.issues ?? [] }
          : { message: "Error inesperado. Inténtalo de nuevo.", issues: [] },
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <StrategyBuilder
        raceLaps={race.laps}
        tyres={tyres}
        drivers={drivers}
        driverId={driverId}
        stints={stints}
        running={running}
        onDriverChange={setDriverId}
        onStintChange={(index, change) =>
          setStints((current) => current.map((stint, i) => (i === index ? { ...stint, ...change } : stint)))
        }
        onAddStint={() =>
          setStints((current) => [...current, { compound: current.at(-1)?.compound ?? "HARD", laps: 1 }])
        }
        onRemoveStint={(index) => setStints((current) => current.filter((_, i) => i !== index))}
        onRun={run}
      />

      {failure && (
        <div className="status status--error" role="alert">
          <p>{failure.message}</p>
          {failure.issues.length > 0 && (
            <ul>
              {failure.issues.map((issue, index) => (
                <li key={`${issue.code}-${index}`}>{issue.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {simulation && <SimulationResult simulation={simulation} />}
    </>
  );
}
