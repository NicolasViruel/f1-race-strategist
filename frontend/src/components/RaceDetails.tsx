import { getRaceOverview } from "../api/client";
import { useAsync } from "../hooks/useAsync";
import { CircuitCard, DriversTable, RaceSummary, TyresTable, WeatherCard } from "./RaceInfo";
import { SimulationPanel } from "./SimulationPanel";
import { StatusMessage } from "./StatusMessage";

/** Carga y muestra todo sobre una carrera. Montar con `key={raceId}` para reiniciar al cambiar. */
export function RaceDetails({ raceId }: { raceId: string }) {
  const overview = useAsync(() => getRaceOverview(raceId));

  if (overview.status === "loading") {
    return <StatusMessage kind="loading" message="Cargando información de la carrera…" />;
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
