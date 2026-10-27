import type { Circuit, Driver, Race, Tyre, Weather } from "../api/types";

const percent = (value: number) => `${Math.round(value * 100)}%`;
const rainLabel = (intensity: number) => (intensity === 0 ? "Seco" : `Lluvia ${percent(intensity)}`);

export function RaceSummary({ race }: { race: Race }) {
  return (
    <section aria-label="Resumen de la carrera" className="card">
      <h2>{race.name}</h2>
      <dl>
        <dt>Ronda</dt>
        <dd>{race.round}</dd>
        <dt>Fecha</dt>
        <dd>{race.date}</dd>
        <dt>Distancia</dt>
        <dd>{race.laps} vueltas</dd>
        <dt>Temperatura</dt>
        <dd>{race.temperature}°C</dd>
        <dt>Probabilidad de lluvia</dt>
        <dd>{percent(race.rainProbability)}</dd>
      </dl>
    </section>
  );
}

export function CircuitCard({ circuit }: { circuit: Circuit }) {
  return (
    <section aria-label="Circuito" className="card">
      <h2>Circuito</h2>
      <p className="card__title">{circuit.name}</p>
      <dl>
        <dt>País</dt>
        <dd>{circuit.country}</dd>
        <dt>Tipo</dt>
        <dd>{circuit.type}</dd>
        <dt>Longitud</dt>
        <dd>{circuit.lengthKm} km</dd>
        <dt>Tiempo base de vuelta</dt>
        <dd>{circuit.baseLapTime} s</dd>
        <dt>Pérdida por parada en boxes</dt>
        <dd>{circuit.pitStopLoss} s</dd>
        <dt>Desgaste de neumáticos</dt>
        <dd>×{circuit.tyreWear}</dd>
        <dt>Dificultad de adelantamiento</dt>
        <dd>{percent(circuit.overtakingDifficulty)}</dd>
      </dl>
    </section>
  );
}

export function WeatherCard({ weather }: { weather: Weather }) {
  return (
    <section aria-label="Clima" className="card">
      <h2>Clima</h2>
      <p>{weather.summary}</p>
      <ul className="plain">
        {weather.forecast.map((segment) => (
          <li key={segment.fromLap}>
            <span>
              Vueltas {segment.fromLap}–{segment.toLap}
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
    <section aria-label="Neumáticos" className="card card--wide">
      <h2>Neumáticos</h2>
      <table>
        <caption>
          El ritmo está en segundos por vuelta respecto al HARD (negativo es más rápido). La degradación son los
          segundos que se pierden por cada vuelta de uso.
        </caption>
        <thead>
          <tr>
            <th>Compuesto</th>
            <th>Ritmo</th>
            <th>Degradación</th>
            <th>Agarre en mojado</th>
            <th>Lluvia óptima</th>
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
    <section aria-label="Pilotos" className="card card--wide">
      <h2>Pilotos</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Piloto</th>
            <th>Equipo</th>
            <th>Ritmo del piloto</th>
            <th>Rendimiento del auto</th>
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
