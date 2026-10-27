import type { Race } from "../api/types";

interface Props {
  races: Race[];
  selectedId: string;
  onSelect: (raceId: string) => void;
}

export function RaceSelector({ races, selectedId, onSelect }: Props) {
  return (
    <div className="field">
      <label htmlFor="race">Carrera</label>
      <select id="race" value={selectedId} onChange={(event) => onSelect(event.target.value)}>
        <option value="">Selecciona una carrera…</option>
        {races.map((race) => (
          <option key={race.id} value={race.id}>
            Ronda {race.round} — {race.name} ({race.date})
          </option>
        ))}
      </select>
    </div>
  );
}
