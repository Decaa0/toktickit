import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

describe("App", () => {
  // WORKED EXAMPLE — provided for you.
  it("renders the TokTickIT heading", () => {
    render(<App />);
    expect(screen.getByText(/TokTickIT/i)).toBeInTheDocument();
  });

  // Issue 4 — Success test
  it("shows Online and the seeded categories on success", async () => {
    const user = userEvent.setup();
    const mockCategories = [
      { id: 1, name: "Account and Access" },
      { id: 2, name: "Hardware" },
      { id: 3, name: "Software" },
      { id: 4, name: "Network" },
    ];

    vi.spyOn(api, "checkSystem").mockResolvedValueOnce({
      ok: true,
      categories: mockCategories,
    });

    render(<App />);

    const button = screen.getByRole("button", { name: /Check System/i });
    await user.click(button);

    expect(await screen.findByText(/Online/i)).toBeInTheDocument();
    for (const cat of mockCategories) {
      expect(screen.getByText(cat.name)).toBeInTheDocument();
    }
  });

  // Issue 4 — Error test
  it("shows an Offline error message when the API is unavailable", async () => {
    const user = userEvent.setup();

    vi.spyOn(api, "checkSystem").mockRejectedValueOnce(new Error("Network Error"));

    render(<App />);

    const button = screen.getByRole("button", { name: /Check System/i });
    await user.click(button);

    expect(await screen.findByText(/Offline/i)).toBeInTheDocument();
    expect(
      screen.getByText(/TokTickIT API is currently unavailable|Unable to reach the server/i)
    ).toBeInTheDocument();
  });
});