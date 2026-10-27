import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { jsonResponse, overview, race } from "./test/fixtures";

function stubApi(routes: Record<string, () => Response>) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      const route = routes[url];
      return Promise.resolve(route ? route() : jsonResponse({ error: { message: "unexpected" } }, 500));
    }),
  );
}

describe("App", () => {
  it("lets the user pick a race and shows its information", async () => {
    stubApi({
      "/api/races": () => jsonResponse({ races: [race] }),
      "/api/races/race-01": () => jsonResponse(overview),
    });
    render(<App />);

    await userEvent.selectOptions(await screen.findByLabelText("Carrera"), "race-01");

    const circuit = await screen.findByRole("region", { name: "Circuito" });
    expect(within(circuit).getByText("Bahrain International Circuit")).toBeInTheDocument();
    expect(within(circuit).getByText("5.412 km")).toBeInTheDocument();

    const weather = screen.getByRole("region", { name: "Clima" });
    expect(within(weather).getByText(/completely dry/i)).toBeInTheDocument();
    expect(within(weather).getByText("Seco")).toBeInTheDocument();
    expect(within(weather).getByText("Lluvia 35%")).toBeInTheDocument();

    const tyres = screen.getByRole("region", { name: "Neumáticos" });
    expect(within(tyres).getByText("SOFT")).toBeInTheDocument();
    expect(within(tyres).getByText("HARD")).toBeInTheDocument();

    const drivers = screen.getByRole("region", { name: "Pilotos" });
    expect(within(drivers).getByText("Lando Norris")).toBeInTheDocument();
    expect(within(drivers).getByText("McLaren")).toBeInTheDocument();
  });

  it("shows the server's message with a retry when the races fail to load", async () => {
    let attempts = 0;
    stubApi({
      "/api/races": () =>
        ++attempts === 1
          ? jsonResponse({ error: { code: "F1_API_UNAVAILABLE", message: "La API de F1 no responde." } }, 502)
          : jsonResponse({ races: [race] }),
    });
    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent("La API de F1 no responde.");

    await userEvent.click(screen.getByRole("button", { name: "Intentar de nuevo" }));

    expect(await screen.findByLabelText("Carrera")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an error when a race's information fails to load", async () => {
    stubApi({
      "/api/races": () => jsonResponse({ races: [race] }),
      "/api/races/race-01": () => jsonResponse({ error: { message: "Esa carrera no existe." } }, 404),
    });
    render(<App />);

    await userEvent.selectOptions(await screen.findByLabelText("Carrera"), "race-01");

    expect(await screen.findByRole("alert")).toHaveTextContent("Esa carrera no existe.");
  });

  it("tells the user the first load can be slow", () => {
    stubApi({ "/api/races": () => jsonResponse({ races: [race] }) });
    render(<App />);

    expect(screen.getByRole("status")).toHaveTextContent(/hasta un minuto/i);
  });
});
