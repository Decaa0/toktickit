import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import App from "../../src/App";

describe("Attachment Section and Soft Removal (Section 4.5)", () => {
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
            summary: "Ticket with file",
            description: "Test description",
            currentStatus: "New",
            requestedPriority: "LOW",
            createdAt: new Date().toISOString(),
            attachments: [
              { id: 1, fileName: "error_screen.png", fileSize: 2048, isRemoved: false },
            ],
          }),
        });
      }
      if (url.includes("/tickets")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [{ id: 10, ticketNumber: "TKT-2026-000010", summary: "Ticket with file" }],
            pagination: { totalItems: 1, totalPages: 1 },
          }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
  });

  it("opens soft-remove modal when remove button is clicked", async () => {
    render(<App />);
    const viewBtn = await screen.findByRole("button", { name: /^View$/i });
    await userEvent.click(viewBtn);

    const removeBtn = await screen.findByRole("button", { name: /^Remove$/i });
    await userEvent.click(removeBtn);

    expect(screen.getByText(/Please enter the reason for removing this file/i)).toBeInTheDocument();
  });
});