import { F1ApiError } from "../infra/f1Client";
import { AppError } from "./appError";

/** Traduce una falla del adaptador de la API de F1 a un error de aplicación entendible por el usuario. */
export function toAppError(error: unknown): unknown {
  if (!(error instanceof F1ApiError)) return error;

  switch (error.code) {
    case "NOT_FOUND":
      return new AppError("RACE_NOT_FOUND", 404, "Esa carrera no existe.");
    case "EMPTY":
      return new AppError("F1_API_EMPTY", 502, "La API de F1 no devolvió datos. Inténtalo de nuevo más tarde.");
    case "INVALID_RESPONSE":
      return new AppError(
        "F1_API_INVALID_RESPONSE",
        502,
        "La API de F1 devolvió datos que no pudimos interpretar.",
      );
    case "UNAVAILABLE":
      return new AppError(
        "F1_API_UNAVAILABLE",
        502,
        "La API de F1 no responde. Puede estar despertando; inténtalo de nuevo en un momento.",
      );
  }
}

export async function withF1Errors<T>(work: Promise<T>): Promise<T> {
  try {
    return await work;
  } catch (error) {
    throw toAppError(error);
  }
}
