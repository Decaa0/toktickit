import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import App from "../../src/App";

describe("Requester Ticket Detail View (Section 8.7)", () => {
  beforeEach(() => {
    localStorage.setItem("active_requester_id", "1");
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes("/requesters/active")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 1, name: "Jennifer Anderson", email: "jennifer@example.com" }]),
        });
      }
      if (url.endsWith("/tickets/10")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 10,
            ticketNumber: "TKT-2026-000010",
            summary: "Detailed Network Issue",
            description: "Full explanation of the outage",
            currentStatus: "New",
            requestedPriority: "MEDIUM",
            createdAt: new Date().toISOString(),
            requester: { name: "Jennifer Anderson" },
            attachments: [],
          }),
        });
      }
      if (url.includes("/tickets")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [{ id: 10, ticketNumber: "TKT-2026-000010", summary: "Detailed Network Issue" }],
            pagination: { totalItems: 1, totalPages: 1 },
          }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
  });

  it("navigates to ticket detail and renders full description", async () => {
    render(<App />);
    const viewBtn = await screen.findByRole("button", { name: /^View$/i });
    await userEvent.click(viewBtn);

    expect(await screen.findByText(/Full explanation of the outage/i)).toBeInTheDocument();
  });
});