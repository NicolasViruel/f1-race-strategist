# F1 Race Strategist
Objective: full-stack web app to pick a race, build a tyre strategy and simulate it. Branch: feat/f1-race-strategist.
Delivery: single-pr (small repo, ~2-3h challenge). Test runner: Vitest (npm workspaces: `backend`, `frontend`).

## Specs
- S1 "Pick a race."
- S2 "See the relevant race, circuit and tyre information." Also show drivers, teams and weather on screen ("We expect you to use as much of it as you reasonably can").
- S3 "Build a tyre strategy — which compounds, and when to pit."
- S4 "Run a simulation." and "See and understand the result."
- S5 Backend: "fetch data from the F1 API, expose an endpoint for your frontend, run the simulation, validate the submitted strategy, and handle errors from the F1 API." The F1 API has no simulation endpoint; the simulation is ours. Base URL `https://tech-challenge101.onrender.com` (first request after idle can take up to a minute).
- S6 The simulation should at least: "Apply the chosen tyre stints across the race distance."; "Account for tyre degradation."; "Account for pit-stop time loss."; "Produce an estimated total race time plus a breakdown: stints, compounds, laps per stint, pit stops."
- S7 Error handling: "an invalid strategy, and the F1 API failing or returning nothing." How they are surfaced is our call.
- S8 "Write down your main assumptions." README: how to run it, simulation assumptions, what we would improve with more time. Must run from a clean checkout.
- S9 (decision, L4) The user picks a driver; driver `pace` and team `carPerformance` scale the base lap time. `consistency` is unused (deterministic model), documented as an assumption.
- S10 (assumption) Validation: stint laps sum to race laps, no empty stint, known compounds, at least `minimumPitStops` stops, at least 2 distinct compounds in dry races.

## Tasks
- [x] T1 (S8) Scaffold npm workspaces, TS, Vitest, lint config | inline | commit: see git log (chore: scaffold)
- [ ] T2 (S6, S9) Pure simulator in backend domain, tests first | inline | commit: -
- [ ] T3 (S7, S10) Strategy validation with Zod | inline | commit: -
- [ ] T4 (S5, S7) F1 API client adapter with timeout/retry/error mapping | inline | commit: -
- [ ] T5 (S5) HTTP endpoints: race data + POST simulate | inline | commit: -
- [ ] T6 (S1, S2) Frontend: race list and race/circuit/tyre/driver/weather info | inline | commit: -
- [ ] T7 (S3, S4, S7) Frontend: strategy builder, run, result breakdown, errors | inline | commit: -
- [ ] T8 (S8) README and final check from clean checkout | inline | commit: -

## Log
- L1 (2026-10-27) Requerimiento: desafío técnico "F1 Race Strategist". Nicolás define el alcance (verificar los requerimientos del desafío y construirlo con ODD); el asistente analiza y propone.
- L2 (2026-10-27) Decisión de Nicolás: stack TypeScript full-stack (Fastify + Zod en el backend, React + Vite en el frontend, Vitest).
- L3 (2026-10-27) Decisión de Nicolás: entender cada pieza para poder explicarla y justificarla en la entrevista técnica; cada tarea se entrega con su razonamiento.
- L4 (2026-10-27) Decisión de Nicolás: incluir al piloto en la simulación (el pace del piloto y el carPerformance del equipo escalan el tiempo base de vuelta).
- L5 (2026-10-27) Decisión de Nicolás: repositorio público en GitHub, con las ramas main y feat/f1-race-strategist.
- L6 (2026-10-27) Decisión de Nicolás: la documentación ODD se mantiene en español para lectura directa; el código y la documentación técnica quedan en inglés.
- Data shape verified: `/api/tyres` exists (undocumented in PDF table): compound, pace, degradation, wetPerformance, optimalRainIntensity. Sim params: lapTimeVariance, pitStopLoss, tyreChangeTime, fuelEffectPerLap, safetyCarProbability, minimumPitStops.
- Route declaration: all tasks inline; no Writer trigger holds (sequential dependent units).
- Next: T2 simulator (tests first).
