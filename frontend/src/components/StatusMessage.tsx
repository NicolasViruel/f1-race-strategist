interface Props {
  kind: "loading" | "error";
  message: string;
  onRetry?: () => void;
}

export function StatusMessage({ kind, message, onRetry }: Props) {
  if (kind === "loading") {
    return (
      <p className="status" role="status">
        {message}
      </p>
    );
  }
  return (
    <div className="status status--error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
