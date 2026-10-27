import { getRaceOverview } from "../api/client";
import { useAsync } from "../hooks/useAsync";
import { CircuitCard, DriversTable, RaceSummary, TyresTable, WeatherCard } from "./RaceInfo";
import { SimulationPanel } from "./SimulationPanel";
import { StatusMessage } from "./StatusMessage";

/** Loads and shows everything about one race. Mount with `key={raceId}` to reset on change. */
export function RaceDetails({ raceId }: { raceId: string }) {
  const overview = useAsync(() => getRaceOverview(raceId));

  if (overview.status === "loading") {
    return <StatusMessage kind="loading" message="Loading race information…" />;
  }
  if (overview.status === "error") {
    return <StatusMessage kind="error" message={overview.message} onRetry={overview.retry} />;
  }

  const { race, circuit, weather, tyres, drivers } = overview.data;
  return (
    <>
      <div className="grid">
        <RaceSummary race={race} />
        <CircuitCard circuit={circuit} />
        <WeatherCard weather={weather} />
        <TyresTable tyres={tyres} />
        <DriversTable drivers={drivers} />
      </div>
      <SimulationPanel overview={overview.data} />
    </>
  );
}
