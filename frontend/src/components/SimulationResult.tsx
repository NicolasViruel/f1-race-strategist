import type { Compound, SimulationResponse } from "../api/types";
import { formatLapTime, formatRaceTime } from "../format";

const compoundClass = (compound: Compound) => `compound compound--${compound.toLowerCase()}`;

export function SimulationResult({ simulation }: { simulation: SimulationResponse }) {
  const { driver, team, race, result } = simulation;
  const drivingSeconds = result.totalTimeSeconds - result.totalPitLossSeconds;

  return (
    <section aria-label="Resultado" className="card result">
      <h2>Resultado</h2>
      <p className="result__total">{formatRaceTime(result.totalTimeSeconds)}</p>
      <p className="hint">
        {driver.name} · {team.name} · {race.name} · {race.laps} vueltas
      </p>
      <p className="hint">
        Conducción {formatRaceTime(drivingSeconds)} + paradas en boxes {result.totalPitLossSeconds.toFixed(1)} s
      </p>

      <div className="stintbar" role="img" aria-label="Distribución de stints">
        {result.stints.map((stint) => (
          <div
            key={stint.index}
            className={compoundClass(stint.compound)}
            style={{ flexGrow: stint.laps }}
            title={`${stint.compound}: ${stint.laps} vueltas`}
          >
            {stint.compound}
          </div>
        ))}
      </div>

      <table>
        <caption>La pérdida por desgaste y por lluvia ya está incluida en el tiempo de cada stint.</caption>
        <thead>
          <tr>
            <th>Stint</th>
            <th>Compuesto</th>
            <th>Vueltas</th>
            <th>Tiempo del stint</th>
            <th>Vuelta promedio</th>
            <th>Pérdida por desgaste</th>
            <th>Pérdida por lluvia</th>
          </tr>
        </thead>
        <tbody>
          {result.stints.map((stint) => (
            <tr key={stint.index}>
              <td>{stint.index + 1}</td>
              <td>
                <span className={compoundClass(stint.compound)}>{stint.compound}</span>
              </td>
              <td>
                {stint.startLap}–{stint.endLap}
              </td>
              <td>{formatLapTime(stint.timeSeconds)}</td>
              <td>{formatLapTime(stint.averageLapSeconds)}</td>
              <td>{stint.degradationLossSeconds.toFixed(1)} s</td>
              <td>{stint.wetPenaltySeconds.toFixed(1)} s</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Paradas en boxes</h3>
      {result.pitStops.length === 0 ? (
        <p className="hint">Sin paradas en boxes.</p>
      ) : (
        <ul className="plain">
          {result.pitStops.map((stop) => (
            <li key={stop.afterLap}>
              <span>
                Tras la vuelta {stop.afterLap}: {stop.fromCompound} → {stop.toCompound}
              </span>{" "}
              · <span>{stop.lossSeconds.toFixed(1)} s perdidos</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
