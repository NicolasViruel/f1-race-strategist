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

    await userEvent.selectOptions(await screen.findByLabelText("Race"), "race-01");

    const circuit = await screen.findByRole("region", { name: "Circuit" });
    expect(within(circuit).getByText("Bahrain International Circuit")).toBeInTheDocument();
    expect(within(circuit).getByText("5.412 km")).toBeInTheDocument();

    const weather = screen.getByRole("region", { name: "Weather" });
    expect(within(weather).getByText(/completely dry/i)).toBeInTheDocument();
    expect(within(weather).getByText("Dry")).toBeInTheDocument();
    expect(within(weather).getByText("Rain 35%")).toBeInTheDocument();

    const tyres = screen.getByRole("region", { name: "Tyres" });
    expect(within(tyres).getByText("SOFT")).toBeInTheDocument();
    expect(within(tyres).getByText("HARD")).toBeInTheDocument();

    const drivers = screen.getByRole("region", { name: "Drivers" });
    expect(within(drivers).getByText("Lando Norris")).toBeInTheDocument();
    expect(within(drivers).getByText("McLaren")).toBeInTheDocument();
  });

  it("shows the server's message with a retry when the races fail to load", async () => {
    let attempts = 0;
    stubApi({
      "/api/races": () =>
        ++attempts === 1
          ? jsonResponse({ error: { code: "F1_API_UNAVAILABLE", message: "The F1 API is not responding." } }, 502)
          : jsonResponse({ races: [race] }),
    });
    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent("The F1 API is not responding.");

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByLabelText("Race")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an error when a race's information fails to load", async () => {
    stubApi({
      "/api/races": () => jsonResponse({ races: [race] }),
      "/api/races/race-01": () => jsonResponse({ error: { message: "That race does not exist." } }, 404),
    });
    render(<App />);

    await userEvent.selectOptions(await screen.findByLabelText("Race"), "race-01");

    expect(await screen.findByRole("alert")).toHaveTextContent("That race does not exist.");
  });

  it("tells the user the first load can be slow", () => {
    stubApi({ "/api/races": () => jsonResponse({ races: [race] }) });
    render(<App />);

    expect(screen.getByRole("status")).toHaveTextContent(/up to a minute/i);
  });
});
