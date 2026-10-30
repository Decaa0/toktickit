import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import App from "../../src/App.tsx";

describe("Responsive table wrapper (Issue 4.6)", () => {
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

  it("wraps the ticket table in a horizontally scrollable .tk-table-wrap", async () => {
    render(<App />);
    await screen.findByText("TKT-2026-000001");
    const table = document.querySelector("table");
    expect(table).not.toBeNull();
    const wrap = table!.closest(".tk-table-wrap");
    expect(wrap).not.toBeNull();
    expect(wrap!.contains(table)).toBe(true);
  });
});
