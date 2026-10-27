import type { Compound, SimulationResponse } from "../api/types";
import { formatLapTime, formatRaceTime } from "../format";

const compoundClass = (compound: Compound) => `compound compound--${compound.toLowerCase()}`;

export function SimulationResult({ simulation }: { simulation: SimulationResponse }) {
  const { driver, team, race, result } = simulation;
  const drivingSeconds = result.totalTimeSeconds - result.totalPitLossSeconds;

  return (
    <section aria-label="Result" className="card result">
      <h2>Result</h2>
      <p className="result__total">{formatRaceTime(result.totalTimeSeconds)}</p>
      <p className="hint">
        {driver.name} · {team.name} · {race.name} · {race.laps} laps
      </p>
      <p className="hint">
        Driving {formatRaceTime(drivingSeconds)} + pit stops {result.totalPitLossSeconds.toFixed(1)} s
      </p>

      <div className="stintbar" role="img" aria-label="Stint distribution">
        {result.stints.map((stint) => (
          <div
            key={stint.index}
            className={compoundClass(stint.compound)}
            style={{ flexGrow: stint.laps }}
            title={`${stint.compound}: ${stint.laps} laps`}
          >
            {stint.compound}
          </div>
        ))}
      </div>

      <table>
        <caption>Time lost to tyre wear and to rain is already included in each stint time.</caption>
        <thead>
          <tr>
            <th>Stint</th>
            <th>Compound</th>
            <th>Laps</th>
            <th>Stint time</th>
            <th>Avg lap</th>
            <th>Tyre wear loss</th>
            <th>Rain loss</th>
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

      <h3>Pit stops</h3>
      {result.pitStops.length === 0 ? (
        <p className="hint">No pit stops.</p>
      ) : (
        <ul className="plain">
          {result.pitStops.map((stop) => (
            <li key={stop.afterLap}>
              <span>
                After lap {stop.afterLap}: {stop.fromCompound} → {stop.toCompound}
              </span>{" "}
              · <span>{stop.lossSeconds.toFixed(1)} s lost</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
