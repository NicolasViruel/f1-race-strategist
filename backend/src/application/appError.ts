import type { StrategyIssue } from "../domain/validateStrategy";

export type AppErrorCode =
  | "RACE_NOT_FOUND"
  | "INVALID_REQUEST"
  | "INVALID_STRATEGY"
  | "F1_API_UNAVAILABLE"
  | "F1_API_EMPTY"
  | "F1_API_INVALID_RESPONSE";

/** Una falla que el usuario puede entender, con el estado HTTP al que corresponde. */
export class AppError extends Error {
  constructor(
    readonly code: AppErrorCode,
    readonly status: number,
    message: string,
    readonly issues?: StrategyIssue[],
  ) {
    super(message);
    this.name = "AppError";
  }
}
