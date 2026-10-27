import { useState } from "react";
import { getRaces } from "./api/client";
import { RaceDetails } from "./components/RaceDetails";
import { RaceSelector } from "./components/RaceSelector";
import { StatusMessage } from "./components/StatusMessage";
import { useAsync } from "./hooks/useAsync";

export function App() {
  const races = useAsync(getRaces);
  const [raceId, setRaceId] = useState("");

  return (
    <main className="page">
      <h1>F1 Race Strategist</h1>

      {races.status === "loading" && (
        <StatusMessage
          kind="loading"
          message="Cargando carreras… La primera solicitud puede tardar hasta un minuto mientras el servicio de datos de F1 se despierta."
        />
      )}
      {races.status === "error" && (
        <StatusMessage kind="error" message={races.message} onRetry={races.retry} />
      )}
      {races.status === "success" && (
        <>
          <RaceSelector races={races.data} selectedId={raceId} onSelect={setRaceId} />
          {raceId && <RaceDetails key={raceId} raceId={raceId} />}
        </>
      )}
    </main>
  );
}
