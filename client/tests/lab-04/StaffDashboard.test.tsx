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

describe("Staff Dashboard (Issue 4.7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.fetchStaffDashboard).mockResolvedValue({
      unassigned: 11,
      ownedByMe: 4,
      byStatus: { New: 6, "In Progress": 3 },
      byPriority: { High: 2 },
      recentlyUpdated: { count: 0, items: [] },
    });
  });

  it("renders counts and breakdown entries", async () => {
    render(<Dashboard role="IT_STAFF" onOpenTicket={vi.fn()} onDrill={vi.fn()} />);
    expect(await screen.findByText("Unassigned")).toBeInTheDocument();
    expect(screen.getByText("11")).toBeInTheDocument();
    expect(screen.getByText("Owned by Me")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(api.fetchRequesterDashboard).not.toHaveBeenCalled();
  });

  it("drills into the queue from the metric cards", async () => {
    const onDrill = vi.fn();
    render(<Dashboard role="ADMINISTRATOR" onOpenTicket={vi.fn()} onDrill={onDrill} />);
    await userEvent.click(await screen.findByRole("button", { name: "Unassigned" }));
    await userEvent.click(screen.getByRole("button", { name: "Owned by Me" }));
    expect(onDrill).toHaveBeenNthCalledWith(1, "unassigned");
    expect(onDrill).toHaveBeenNthCalledWith(2, "mine");
  });
});
