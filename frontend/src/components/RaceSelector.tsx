import type { Race } from "../api/types";

interface Props {
  races: Race[];
  selectedId: string;
  onSelect: (raceId: string) => void;
}

export function RaceSelector({ races, selectedId, onSelect }: Props) {
  return (
    <div className="field">
      <label htmlFor="race">Race</label>
      <select id="race" value={selectedId} onChange={(event) => onSelect(event.target.value)}>
        <option value="">Select a race…</option>
        {races.map((race) => (
          <option key={race.id} value={race.id}>
            Round {race.round} — {race.name} ({race.date})
          </option>
        ))}
      </select>
    </div>
  );
}
