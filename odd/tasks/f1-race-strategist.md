# F1 Race Strategist
Objetivo: app web full-stack para elegir una carrera, armar una estrategia de neumáticos y simularla. Rama: feat/f1-race-strategist.
Entrega: single-pr (repo chico, challenge de 2-3 hs). Test runner: Vitest (npm workspaces: `backend`, `frontend`).

## Specs
Las citas del PDF se dejan en inglés textual (entre comillas) con su aclaración en español.
- S1 "Pick a race." (Elegir una carrera.)
- S2 "See the relevant race, circuit and tyre information." (Ver la información de carrera, circuito y neumáticos.) También mostrar pilotos, equipos y clima en pantalla ("We expect you to use as much of it as you reasonably can").
- S3 "Build a tyre strategy — which compounds, and when to pit." (Armar la estrategia: qué compuestos y cuándo parar.)
- S4 "Run a simulation." y "See and understand the result." (Correr la simulación y entender el resultado.)
- S5 Backend: "fetch data from the F1 API, expose an endpoint for your frontend, run the simulation, validate the submitted strategy, and handle errors from the F1 API." La API de F1 no tiene endpoint de simulación; la simulación es nuestra. URL base `https://tech-challenge101.onrender.com` (el primer request tras inactividad puede tardar hasta un minuto).
- S6 La simulación debe, como mínimo: "Apply the chosen tyre stints across the race distance." (aplicar los stints elegidos a toda la carrera); "Account for tyre degradation." (degradación); "Account for pit-stop time loss." (pérdida por parada); "Produce an estimated total race time plus a breakdown: stints, compounds, laps per stint, pit stops." (tiempo total más desglose).
- S7 Manejo de errores: "an invalid strategy, and the F1 API failing or returning nothing." (estrategia inválida y falla o respuesta vacía de la API). Cómo se muestran al usuario es decisión nuestra.
- S8 "Write down your main assumptions." (Anotar los supuestos.) README con: cómo correrlo, supuestos de la simulación y qué mejoraríamos con más tiempo. Debe funcionar desde un checkout limpio.
- S9 (decisión, L4) El usuario elige un piloto; el `pace` del piloto y el `carPerformance` del equipo escalan el tiempo base de vuelta. `consistency` no se usa (modelo determinista) y se documenta como supuesto.
- S10 (supuesto) Validación: las vueltas de los stints suman las vueltas de la carrera, ningún stint vacío, compuestos conocidos, al menos `minimumPitStops` paradas, y al menos 2 compuestos distintos en carreras secas.

## Tasks
- [x] T1 (S8) Scaffold de npm workspaces, TS, Vitest | inline | commit: c757329
- [x] T2 (S6, S9) Simulador puro en el dominio del backend, tests primero | inline | commit: ver git log (feat: simulator)
- [x] T3 (S7, S10) Validación de la estrategia con Zod | inline | commit: ver git log (feat: validation)
- [ ] T4 (S5, S7) Adaptador cliente de la API F1 con timeout, reintento y mapeo de errores | inline | commit: -
- [ ] T5 (S5) Endpoints HTTP: datos de carrera + POST simulate | inline | commit: -
- [ ] T6 (S1, S2) Frontend: lista de carreras e info de carrera/circuito/neumáticos/pilotos/clima | inline | commit: -
- [ ] T7 (S3, S4, S7) Frontend: constructor de estrategia, ejecución, desglose del resultado y errores | inline | commit: -
- [ ] T8 (S8) README y verificación final desde un checkout limpio | inline | commit: -

## Log
- L1 (2026-10-27) Requerimiento: desafío técnico "F1 Race Strategist". Nicolás define el alcance (verificar los requerimientos del desafío y construirlo con ODD); el asistente analiza y propone.
- L2 (2026-10-27) Decisión de Nicolás: stack TypeScript full-stack (Fastify + Zod en el backend, React + Vite en el frontend, Vitest).
- L3 (2026-10-27) Decisión de Nicolás: entender cada pieza para poder explicarla y justificarla en la entrevista técnica; cada tarea se entrega con su razonamiento.
- L4 (2026-10-27) Decisión de Nicolás: incluir al piloto en la simulación (el pace del piloto y el carPerformance del equipo escalan el tiempo base de vuelta).
- L5 (2026-10-27) Decisión de Nicolás: repositorio público en GitHub, con las ramas main y feat/f1-race-strategist.
- L6 (2026-10-27) Decisión de Nicolás: la documentación ODD se mantiene en español para lectura directa; el código y la documentación técnica quedan en inglés.
- Forma de los datos verificada: existe `/api/tyres` (no figura en la tabla del PDF): compound, pace, degradation, wetPerformance, optimalRainIntensity. Parámetros de simulación: lapTimeVariance, pitStopLoss, tyreChangeTime, fuelEffectPerLap, safetyCarProbability, minimumPitStops.
- Declaración de ruta: todas las tareas inline; no se cumple ningún trigger de Writer (unidades secuenciales y dependientes).
- T2: RED observado (módulo inexistente), GREEN 9/9. Constante WET_MISMATCH_SECONDS_PER_UNIT=30 es un supuesto nuestro.
- T3: RED observado (módulo inexistente), GREEN 12/12 (21 en total). "Carrera seca" = ningún tramo del pronóstico con rainIntensity > 0. Todas las reglas rotas se reportan juntas.
- Siguiente: T4 cliente de la API F1.
