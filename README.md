# F1 Race Strategist

Pick a race, build a tyre strategy, run a simulation and read the breakdown. TypeScript end to end: Fastify backend, React + Vite frontend.

## Run it

Requires Node 22 or newer (some test dependencies do not support older versions).

```bash
npm install
npm run dev        # backend on :3001, frontend on :5173
```

Open http://localhost:5173. The F1 API is hosted on a free tier and sleeps when idle, so the first request can take up to a minute; the UI says so while loading, and the backend retries.

```bash
npm test           # backend and frontend tests
npm run typecheck
npm run build
```

Optional environment variables: `PORT` (backend, default 3001) and `F1_API_URL` (default `https://tech-challenge101.onrender.com`).

## How it is organised

```
backend/src
  domain/        pure simulation and strategy validation (no I/O)
  infra/         F1 API client: timeout, retries, response validation
  application/   use cases: race overview, run simulation, error mapping
  http/          Fastify routes
frontend/src     React UI (container components own state, presentational ones render)
```

The backend exposes `GET /api/races`, `GET /api/races/:raceId` (race, circuit, weather, parameters, tyres and drivers in one call) and `POST /api/races/:raceId/simulate`.

Errors: an invalid strategy returns `400` with every broken rule listed; a missing race is `404`; the F1 API being down, empty or returning something unexpected is `502`. The UI shows the server's message and offers a retry.

## Simulation assumptions

The model is deterministic, so the same strategy always gives the same result.

- Lap time = `baseLapTime / (driver.pace × team.carPerformance)` + tyre pace offset + `tyre.degradation × circuit.tyreWear × tyre age` + `fuelEffectPerLap × laps remaining` + rain penalty.
- Tyre age restarts at 0 after every pit stop.
- Each pit stop costs `pitStopLoss + tyreChangeTime` from the race's simulation parameters.
- Rain penalty: 30 s per lap for every unit of rain intensity outside the compound's optimal range. The 30 is my own constant, not from the API.
- Not modelled, only shown on screen: `lapTimeVariance`, `safetyCarProbability`, driver `consistency`, overtaking difficulty and track temperature.
- Validation: stint laps must add up to the race laps, every stint needs at least one lap, compounds must exist, and the stops must reach `minimumPitStops`. In a dry race (no forecast segment with rain) at least two different compounds are required. That last rule comes from real F1, not from the brief.

## What I would improve with more time

- Use the randomness the API hints at (variance, safety cars, consistency) with a seeded generator, and show a range instead of one number.
- Let temperature affect tyre degradation.
- Compare several strategies side by side, and suggest a good one.
- Share the API types between frontend and backend (or generate them from the OpenAPI spec) instead of duplicating them.
- Cache the F1 API responses in the backend, since the data never changes.
- Add an end-to-end test with a real browser, and a per-lap chart in the result.
