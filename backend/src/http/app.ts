import cors from "@fastify/cors";
import Fastify from "fastify";
import { AppError } from "../application/appError";
import { withF1Errors } from "../application/f1Errors";
import { getRaceOverview } from "../application/getRaceOverview";
import { runSimulation } from "../application/runSimulation";
import type { F1Client } from "../infra/f1Client";

interface RaceParams {
  raceId: string;
}

export function buildApp(f1: F1Client, options: { logger?: boolean } = {}) {
  const app = Fastify({ logger: options.logger ?? false });
  app.register(cors, { origin: true });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.status).send({
        error: { code: error.code, message: error.message, issues: error.issues },
      });
    }
    // JSON mal formado y otros errores de cliente que lanza el propio Fastify.
    const status = (error as { statusCode?: number }).statusCode;
    if (status && status >= 400 && status < 500) {
      return reply.status(status).send({
        error: { code: "INVALID_REQUEST", message: "No se pudo leer la solicitud." },
      });
    }
    app.log.error(error);
    return reply.status(500).send({
      error: { code: "INTERNAL_ERROR", message: "Algo salió mal de nuestro lado." },
    });
  });

  app.get("/health", async () => ({ status: "ok" }));

  app.get("/api/races", async () => ({ races: await withF1Errors(f1.getRaces()) }));

  app.get<{ Params: RaceParams }>("/api/races/:raceId", async (request) =>
    getRaceOverview(f1, request.params.raceId),
  );

  app.post<{ Params: RaceParams }>("/api/races/:raceId/simulate", async (request) =>
    runSimulation(f1, request.params.raceId, request.body),
  );

  return app;
}
