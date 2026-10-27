import type { Circuit, Driver, Race, Tyre, Weather } from "../api/types";

const percent = (value: number) => `${Math.round(value * 100)}%`;
const rainLabel = (intensity: number) => (intensity === 0 ? "Dry" : `Rain ${percent(intensity)}`);

export function RaceSummary({ race }: { race: Race }) {
  return (
    <section aria-label="Race" className="card">
      <h2>{race.name}</h2>
      <dl>
        <dt>Round</dt>
        <dd>{race.round}</dd>
        <dt>Date</dt>
        <dd>{race.date}</dd>
        <dt>Distance</dt>
        <dd>{race.laps} laps</dd>
        <dt>Temperature</dt>
        <dd>{race.temperature}°C</dd>
        <dt>Rain probability</dt>
        <dd>{percent(race.rainProbability)}</dd>
      </dl>
    </section>
  );
}

export function CircuitCard({ circuit }: { circuit: Circuit }) {
  return (
    <section aria-label="Circuit" className="card">
      <h2>Circuit</h2>
      <p className="card__title">{circuit.name}</p>
      <dl>
        <dt>Country</dt>
        <dd>{circuit.country}</dd>
        <dt>Type</dt>
        <dd>{circuit.type}</dd>
        <dt>Length</dt>
        <dd>{circuit.lengthKm} km</dd>
        <dt>Base lap time</dt>
        <dd>{circuit.baseLapTime} s</dd>
        <dt>Pit stop loss</dt>
        <dd>{circuit.pitStopLoss} s</dd>
        <dt>Tyre wear</dt>
        <dd>×{circuit.tyreWear}</dd>
        <dt>Overtaking difficulty</dt>
        <dd>{percent(circuit.overtakingDifficulty)}</dd>
      </dl>
    </section>
  );
}

export function WeatherCard({ weather }: { weather: Weather }) {
  return (
    <section aria-label="Weather" className="card">
      <h2>Weather</h2>
      <p>{weather.summary}</p>
      <ul className="plain">
        {weather.forecast.map((segment) => (
          <li key={segment.fromLap}>
            <span>
              Laps {segment.fromLap}–{segment.toLap}
            </span>{" "}
            · <span>{segment.temperature}°C</span> · <strong>{rainLabel(segment.rainIntensity)}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TyresTable({ tyres }: { tyres: Tyre[] }) {
  return (
    <section aria-label="Tyres" className="card">
      <h2>Tyres</h2>
      <table>
        <caption>Pace is seconds per lap versus HARD (negative is faster). Degradation is seconds lost per lap of age.</caption>
        <thead>
          <tr>
            <th>Compound</th>
            <th>Pace</th>
            <th>Degradation</th>
            <th>Wet grip</th>
            <th>Best in rain</th>
          </tr>
        </thead>
        <tbody>
          {tyres.map((tyre) => (
            <tr key={tyre.compound}>
              <td>
                <span className={`compound compound--${tyre.compound.toLowerCase()}`}>{tyre.compound}</span>
              </td>
              <td>{tyre.pace > 0 ? `+${tyre.pace}` : tyre.pace}</td>
              <td>{tyre.degradation}</td>
              <td>{percent(tyre.wetPerformance)}</td>
              <td>
                {percent(tyre.optimalRainIntensity.min)}–{percent(tyre.optimalRainIntensity.max)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function DriversTable({ drivers }: { drivers: Driver[] }) {
  return (
    <section aria-label="Drivers" className="card">
      <h2>Drivers</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Driver</th>
            <th>Team</th>
            <th>Driver pace</th>
            <th>Car performance</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map((driver) => (
            <tr key={driver.id}>
              <td>{driver.number}</td>
              <td>{driver.name}</td>
              <td>{driver.team?.name ?? "—"}</td>
              <td>{driver.pace}</td>
              <td>{driver.team?.carPerformance ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
