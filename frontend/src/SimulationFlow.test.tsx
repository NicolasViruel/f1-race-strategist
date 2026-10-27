import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { jsonResponse, overview, race, simulationResponse } from "./test/fixtures";

type SimulateHandler = () => Promise<Response> | Response;

function stubApi(onSimulate: SimulateHandler) {
  const fetchFn = vi.fn((url: string, init?: RequestInit) => {
    if (url === "/api/races") return Promise.resolve(jsonResponse({ races: [race] }));
    if (url === "/api/races/race-01") return Promise.resolve(jsonResponse(overview));
    if (url === "/api/races/race-01/simulate" && init?.method === "POST") {
      return Promise.resolve(onSimulate());
    }
    return Promise.resolve(jsonResponse({ error: { message: "unexpected" } }, 500));
  });
  vi.stubGlobal("fetch", fetchFn);
  return fetchFn;
}

const postedBody = (fetchFn: ReturnType<typeof stubApi>) => {
  const call = fetchFn.mock.calls.find(([, init]) => init?.method === "POST");
  return JSON.parse(call![1]!.body as string);
};

async function openRace() {
  render(<App />);
  await userEvent.selectOptions(await screen.findByLabelText("Carrera"), "race-01");
  return screen.findByRole("region", { name: "Estrategia" });
}

describe("strategy builder", () => {
  it("starts with a valid split that covers every lap", async () => {
    stubApi(() => jsonResponse(simulationResponse));
    const strategy = await openRace();

    expect(within(strategy).getByLabelText("Compuesto del stint 1")).toHaveValue("SOFT");
    expect(within(strategy).getByLabelText("Vueltas del stint 1")).toHaveValue(29);
    expect(within(strategy).getByLabelText("Compuesto del stint 2")).toHaveValue("HARD");
    expect(within(strategy).getByLabelText("Vueltas del stint 2")).toHaveValue(28);
    expect(within(strategy).getByText("57 de 57 vueltas asignadas")).toBeInTheDocument();
    expect(within(strategy).getByLabelText("Piloto")).toHaveValue("driver-01");
  });

  it("updates the lap counter as the user edits a stint", async () => {
    stubApi(() => jsonResponse(simulationResponse));
    const strategy = await openRace();

    const laps = within(strategy).getByLabelText("Vueltas del stint 2");
    await userEvent.clear(laps);
    await userEvent.type(laps, "20");

    expect(within(strategy).getByText("49 de 57 vueltas asignadas")).toBeInTheDocument();
  });

  it("adds and removes stints, keeping at least one", async () => {
    stubApi(() => jsonResponse(simulationResponse));
    const strategy = await openRace();

    await userEvent.click(within(strategy).getByRole("button", { name: "Agregar stint" }));
    expect(within(strategy).getByLabelText("Vueltas del stint 3")).toBeInTheDocument();

    await userEvent.click(within(strategy).getByRole("button", { name: "Quitar stint 3" }));
    expect(within(strategy).queryByLabelText("Vueltas del stint 3")).not.toBeInTheDocument();

    await userEvent.click(within(strategy).getByRole("button", { name: "Quitar stint 2" }));
    expect(within(strategy).getByRole("button", { name: "Quitar stint 1" })).toBeDisabled();
  });
});

describe("running the simulation", () => {
  it("sends the chosen driver and stints and shows the breakdown", async () => {
    const fetchFn = stubApi(() => jsonResponse(simulationResponse));
    const strategy = await openRace();

    await userEvent.selectOptions(within(strategy).getByLabelText("Compuesto del stint 1"), "HARD");
    await userEvent.click(within(strategy).getByRole("button", { name: "Ejecutar simulación" }));

    const result = await screen.findByRole("region", { name: "Resultado" });
    expect(postedBody(fetchFn)).toEqual({
      driverId: "driver-01",
      strategy: [
        { compound: "HARD", laps: 29 },
        { compound: "HARD", laps: 28 },
      ],
    });

    expect(within(result).getByText("1:31:25.000")).toBeInTheDocument();
    expect(within(result).getByText(/Lando Norris/)).toBeInTheDocument();
    expect(within(result).getByText(/McLaren/)).toBeInTheDocument();

    const rows = within(result).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByText("SOFT")).toBeInTheDocument();
    expect(within(rows[0]!).getByText("1–29")).toBeInTheDocument();
    expect(within(rows[0]!).getByText("46:40.500")).toBeInTheDocument();
    expect(within(rows[0]!).getByText("1:35.500")).toBeInTheDocument();
    expect(within(rows[1]!).getByText("HARD")).toBeInTheDocument();
    expect(within(rows[1]!).getByText("30–57")).toBeInTheDocument();

    expect(within(result).getByText("Tras la vuelta 29: SOFT → HARD")).toBeInTheDocument();
    expect(within(result).getByText("24.5 s perdidos")).toBeInTheDocument();
  });

  it("disables the button while the simulation is running", async () => {
    let finish!: (response: Response) => void;
    stubApi(() => new Promise<Response>((resolve) => (finish = resolve)));
    const strategy = await openRace();

    await userEvent.click(within(strategy).getByRole("button", { name: "Ejecutar simulación" }));

    expect(within(strategy).getByRole("button", { name: "Simulando…" })).toBeDisabled();

    finish(jsonResponse(simulationResponse));
    await waitFor(() =>
      expect(within(strategy).getByRole("button", { name: "Ejecutar simulación" })).toBeEnabled(),
    );
  });

  it("lists every rule the server says the strategy breaks", async () => {
    stubApi(() =>
      jsonResponse(
        {
          error: {
            code: "INVALID_STRATEGY",
            message: "La estrategia no es válida.",
            issues: [
              { code: "LAPS_MISMATCH", message: "Los stints suman 49 vueltas pero la carrera tiene 57." },
              {
                code: "DRY_COMPOUND_RULE",
                message: "Una carrera en seco requiere al menos dos compuestos distintos.",
              },
            ],
          },
        },
        400,
      ),
    );
    const strategy = await openRace();

    await userEvent.click(within(strategy).getByRole("button", { name: "Ejecutar simulación" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("La estrategia no es válida.");
    expect(
      within(alert).getByText("Los stints suman 49 vueltas pero la carrera tiene 57."),
    ).toBeInTheDocument();
    expect(
      within(alert).getByText("Una carrera en seco requiere al menos dos compuestos distintos."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Resultado" })).not.toBeInTheDocument();
  });

  it("shows the message when the F1 API fails while simulating", async () => {
    stubApi(() =>
      jsonResponse({ error: { code: "F1_API_UNAVAILABLE", message: "La API de F1 no responde." } }, 502),
    );
    const strategy = await openRace();

    await userEvent.click(within(strategy).getByRole("button", { name: "Ejecutar simulación" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("La API de F1 no responde.");
  });
});
