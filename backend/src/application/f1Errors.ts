import { F1ApiError } from "../infra/f1Client";
import { AppError } from "./appError";

/** Translates a failure of the F1 API adapter into a user-facing application error. */
export function toAppError(error: unknown): unknown {
  if (!(error instanceof F1ApiError)) return error;

  switch (error.code) {
    case "NOT_FOUND":
      return new AppError("RACE_NOT_FOUND", 404, "That race does not exist.");
    case "EMPTY":
      return new AppError("F1_API_EMPTY", 502, "The F1 API returned no data. Please try again later.");
    case "INVALID_RESPONSE":
      return new AppError(
        "F1_API_INVALID_RESPONSE",
        502,
        "The F1 API returned data we could not understand.",
      );
    case "UNAVAILABLE":
      return new AppError(
        "F1_API_UNAVAILABLE",
        502,
        "The F1 API is not responding. It may be waking up, so try again in a moment.",
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
