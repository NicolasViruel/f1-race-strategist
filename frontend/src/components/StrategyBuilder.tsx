import type { Driver, Stint, Tyre } from "../api/types";
import { assignedLaps } from "../strategy";

interface Props {
  raceLaps: number;
  tyres: Tyre[];
  drivers: Driver[];
  driverId: string;
  stints: Stint[];
  running: boolean;
  onDriverChange: (driverId: string) => void;
  onStintChange: (index: number, change: Partial<Stint>) => void;
  onAddStint: () => void;
  onRemoveStint: (index: number) => void;
  onRun: () => void;
}

export function StrategyBuilder(props: Props) {
  const { raceLaps, tyres, drivers, driverId, stints, running } = props;
  const assigned = assignedLaps(stints);

  return (
    <section aria-label="Strategy" className="card">
      <h2>Strategy</h2>

      <div className="field">
        <label htmlFor="driver">Driver</label>
        <select id="driver" value={driverId} onChange={(event) => props.onDriverChange(event.target.value)}>
          {drivers.map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.name} — {driver.team?.name ?? "No team"}
            </option>
          ))}
        </select>
      </div>

      <ol className="stints">
        {stints.map((stint, index) => (
          <li key={index} className="stint">
            <span className="stint__label">Stint {index + 1}</span>
            <select
              aria-label={`Stint ${index + 1} compound`}
              value={stint.compound}
              onChange={(event) =>
                props.onStintChange(index, { compound: event.target.value as Stint["compound"] })
              }
            >
              {tyres.map((tyre) => (
                <option key={tyre.compound} value={tyre.compound}>
                  {tyre.compound}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              step={1}
              aria-label={`Stint ${index + 1} laps`}
              value={stint.laps}
              onChange={(event) => props.onStintChange(index, { laps: Number(event.target.value) || 0 })}
            />
            <button
              type="button"
              aria-label={`Remove stint ${index + 1}`}
              disabled={stints.length === 1}
              onClick={() => props.onRemoveStint(index)}
            >
              Remove
            </button>
          </li>
        ))}
      </ol>

      <p className={assigned === raceLaps ? "hint" : "hint hint--warn"}>
        {assigned} of {raceLaps} laps assigned
      </p>
      <p className="hint">
        Pit stops: {Math.max(stints.length - 1, 0)}
      </p>

      <div className="actions">
        <button type="button" onClick={props.onAddStint}>
          Add stint
        </button>
        <button type="button" className="primary" disabled={running} onClick={props.onRun}>
          {running ? "Simulating…" : "Run simulation"}
        </button>
      </div>
    </section>
  );
}
