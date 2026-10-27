# F1 Race Strategist

Se elige una carrera, se arma una estrategia de neumáticos, se corre una simulación y se lee el desglose. TypeScript de punta a punta: backend con Fastify y frontend con React + Vite.

## Cómo correrlo

Requiere Node 22 o superior (algunas dependencias de test no soportan versiones anteriores).

```bash
npm install
npm run dev        # backend en :3001, frontend en :5173
```

Abrir http://localhost:5173. La API de F1 está en un plan gratuito y se duerme cuando no se usa, así que la primera solicitud puede tardar hasta un minuto. La interfaz lo avisa mientras carga y el backend reintenta.

```bash
npm test           # tests del backend y del frontend
npm run typecheck
npm run build
```

Variables de entorno opcionales: `PORT` (backend, por defecto 3001) y `F1_API_URL` (por defecto `https://tech-challenge101.onrender.com`).

## Cómo está organizado

```
backend/src
  domain/        simulación y validación de la estrategia, puras (sin I/O)
  infra/         cliente de la API de F1: timeout, reintentos, validación de respuestas
  application/   casos de uso: resumen de carrera, correr la simulación, mapeo de errores
  http/          rutas de Fastify
frontend/src     interfaz en React (los contenedores guardan el estado, los presentacionales dibujan)
```

El backend expone `GET /api/races`, `GET /api/races/:raceId` (carrera, circuito, clima, parámetros, neumáticos y pilotos en una sola llamada) y `POST /api/races/:raceId/simulate`.

Errores: una estrategia inválida devuelve `400` con todas las reglas rotas; una carrera inexistente es `404`; que la API de F1 esté caída, vacía o devuelva algo inesperado es `502`. La interfaz muestra el mensaje del servidor y ofrece reintentar.

Los textos de la interfaz y los mensajes de error están en español. Los datos que llegan de la API de F1 (nombres, resúmenes del clima, tipo de circuito) se muestran tal como vienen, en inglés.

## Supuestos de la simulación

El modelo es determinista: la misma estrategia siempre da el mismo resultado.

- Tiempo de vuelta = `baseLapTime / (driver.pace × team.carPerformance)` + ritmo del neumático + `tyre.degradation × circuit.tyreWear × edad del neumático` + `fuelEffectPerLap × vueltas restantes` + penalización por lluvia.
- La edad del neumático vuelve a 0 después de cada parada en boxes.
- Cada parada cuesta `pitStopLoss + tyreChangeTime`, tomados de los parámetros de simulación de la carrera.
- Penalización por lluvia: 30 s por vuelta por cada unidad de intensidad de lluvia fuera del rango óptimo del compuesto. El 30 es una constante propia, no viene de la API.
- No se modela, solo se muestra en pantalla: `lapTimeVariance`, `safetyCarProbability`, la `consistency` del piloto, la dificultad de adelantamiento y la temperatura de pista.
- Validación: las vueltas de los stints deben sumar las de la carrera, cada stint necesita al menos una vuelta, los compuestos deben existir y las paradas deben alcanzar `minimumPitStops`. En una carrera en seco (ningún tramo del pronóstico con lluvia) se exigen al menos dos compuestos distintos. Esta última regla viene de la F1 real, no del enunciado.

## Qué mejoraría con más tiempo

- Usar la aleatoriedad que insinúa la API (varianza, safety cars, consistencia) con un generador con semilla, y mostrar un rango en lugar de un solo número.
- Hacer que la temperatura afecte la degradación de los neumáticos.
- Comparar varias estrategias lado a lado (hoy cada corrida reemplaza a la anterior) y sugerir una buena.
- Compartir los tipos de la API entre frontend y backend (o generarlos desde la especificación OpenAPI) en lugar de duplicarlos.
- Cachear las respuestas de la API de F1 en el backend, ya que los datos no cambian.
- Agregar un test de punta a punta con un navegador real y un gráfico por vuelta en el resultado.
