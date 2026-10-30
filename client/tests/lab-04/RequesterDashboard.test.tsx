import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import Dashboard from "../../src/Dashboard";
import * as api from "../../src/api";

vi.mock("../../src/api", () => ({
  fetchRequesterDashboard: vi.fn(),
  fetchStaffDashboard: vi.fn(),
}));

const item = {
  id: 7,
  ticketNumber: "TKT-2026-000007",
  summary: "Printer jam",
  currentStatus: "In Progress",
  itPriority: null,
  requestedPriority: "Medium",
  updatedAt: new Date().toISOString(),
};

describe("Requester Dashboard (Issue 4.7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.fetchRequesterDashboard).mockResolvedValue({
      totalOpen: 5,
      waitingForRequester: 2,
      recentlyUpdated: { count: 1, items: [item] },
      recentlyResolved: { count: 0, items: [] },
    });
  });

  it("renders metrics and recent items, and opens a ticket", async () => {
    const onOpenTicket = vi.fn();
    render(<Dashboard role="REQUESTER" onOpenTicket={onOpenTicket} onDrill={vi.fn()} />);
    expect(await screen.findByText("Open Tickets")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Waiting for Me")).toBeInTheDocument();
    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Printer jam"));
    expect(onOpenTicket).toHaveBeenCalledWith(7);
    expect(api.fetchStaffDashboard).not.toHaveBeenCalled();
  });

  it("shows an error banner on failure", async () => {
    vi.mocked(api.fetchRequesterDashboard).mockRejectedValue(new Error("boom"));
    render(<Dashboard role="REQUESTER" onOpenTicket={vi.fn()} onDrill={vi.fn()} />);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
