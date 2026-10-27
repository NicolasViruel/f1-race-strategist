import { buildApp } from "./http/app";
import { createF1Client } from "./infra/f1Client";

const f1 = createF1Client({
  baseUrl: process.env.F1_API_URL ?? "https://tech-challenge101.onrender.com",
});

const app = buildApp(f1, { logger: true });
const port = Number(process.env.PORT ?? 3001);
await app.listen({ port, host: "0.0.0.0" });
