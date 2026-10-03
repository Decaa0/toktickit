import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import App from "../../src/App";

describe("Create Ticket Component (Section 8.3)", () => {
  beforeEach(() => {
    localStorage.setItem("active_requester_id", "1");
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes("/requesters/active")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 1, name: "Jennifer Anderson", email: "jennifer@example.com" }]),
        });
      }
      if (url.includes("/categories")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 1, name: "Hardware" }]),
        });
      }
      if (url.includes("/related-systems")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 1, name: "Laptop" }]),
        });
      }
      if (url.includes("/tickets")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [], pagination: { totalItems: 0, totalPages: 1 } }),
        });
      }
      return Promise.reject(new Error("Unknown endpoint"));
    });
  });

  it("renders Create Ticket form with read-only requester context", async () => {
    render(<App />);
    const newTicketBtn = await screen.findByRole("button", { name: /\+ New Ticket/i });
    await userEvent.click(newTicketBtn);

    expect(screen.getByText(/Create IT Support Ticket/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Jennifer Anderson/i)).toBeInTheDocument();
  });
});