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
    <section aria-label="Estrategia" className="card">
      <h2>Estrategia</h2>

      <div className="field">
        <label htmlFor="driver">Piloto</label>
        <select id="driver" value={driverId} onChange={(event) => props.onDriverChange(event.target.value)}>
          {drivers.map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.name} — {driver.team?.name ?? "Sin equipo"}
            </option>
          ))}
        </select>
      </div>

      <ol className="stints">
        {stints.map((stint, index) => (
          <li key={index} className="stint">
            <span className="stint__label">Stint {index + 1}</span>
            <select
              aria-label={`Compuesto del stint ${index + 1}`}
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
              aria-label={`Vueltas del stint ${index + 1}`}
              value={stint.laps}
              onChange={(event) => props.onStintChange(index, { laps: Number(event.target.value) || 0 })}
            />
            <button
              type="button"
              aria-label={`Quitar stint ${index + 1}`}
              disabled={stints.length === 1}
              onClick={() => props.onRemoveStint(index)}
            >
              Quitar
            </button>
          </li>
        ))}
      </ol>

      <p className={assigned === raceLaps ? "hint" : "hint hint--warn"}>
        {assigned} de {raceLaps} vueltas asignadas
      </p>
      <p className="hint">Paradas en boxes: {Math.max(stints.length - 1, 0)}</p>

      <div className="actions">
        <button type="button" onClick={props.onAddStint}>
          Agregar stint
        </button>
        <button type="button" className="primary" disabled={running} onClick={props.onRun}>
          {running ? "Simulando…" : "Ejecutar simulación"}
        </button>
      </div>
    </section>
  );
}
