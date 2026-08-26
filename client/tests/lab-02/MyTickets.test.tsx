import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import App from "../../src/App";

describe("My Tickets Table View (Section 8.5)", () => {
  beforeEach(() => {
    localStorage.setItem("active_requester_id", "1");
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes("/requesters/active")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 1, name: "Jennifer Anderson", email: "jennifer@example.com" }]),
        });
      }
      if (url.includes("/tickets")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [
              {
                id: 10,
                ticketNumber: "TKT-2026-000001",
                summary: "VPN Connection Issue",
                currentStatus: "New",
                requestedPriority: "HIGH",
                createdAt: new Date().toISOString(),
                category: { name: "Network" },
                relatedSystem: { name: "VPN" },
              },
            ],
            pagination: { page: 1, limit: 5, totalItems: 1, totalPages: 1 },
          }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
  });

  it("renders ticket list columns and ticket number correctly", async () => {
    render(<App />);
    expect(await screen.findByText("TKT-2026-000001")).toBeInTheDocument();
    expect(screen.getByText("VPN Connection Issue")).toBeInTheDocument();
    expect(screen.getByText("HIGH")).toBeInTheDocument();
  });
});