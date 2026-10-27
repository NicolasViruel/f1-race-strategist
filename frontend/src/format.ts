const pad = (value: number, length: number) => String(value).padStart(length, "0");

function split(seconds: number) {
  const totalMs = Math.round(seconds * 1000);
  return {
    hours: Math.floor(totalMs / 3_600_000),
    minutes: Math.floor((totalMs % 3_600_000) / 60_000),
    seconds: Math.floor((totalMs % 60_000) / 1000),
    ms: totalMs % 1000,
  };
}

/** 5485 -> "1:31:25.000" */
export function formatRaceTime(seconds: number): string {
  const t = split(seconds);
  return `${t.hours}:${pad(t.minutes, 2)}:${pad(t.seconds, 2)}.${pad(t.ms, 3)}`;
}

/** 95.5 -> "1:35.500"; los stints de más de una hora siguen contando minutos. */
export function formatLapTime(seconds: number): string {
  const t = split(seconds);
  return `${t.hours * 60 + t.minutes}:${pad(t.seconds, 2)}.${pad(t.ms, 3)}`;
}
