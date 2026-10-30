import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import ActionsTaken from "../../src/ActionsTaken";
import * as api from "../../src/api";

vi.mock("../../src/api", () => ({
  fetchTicketActions: vi.fn(),
  createTicketAction: vi.fn(),
  updateTicketAction: vi.fn(),
}));

const sampleAction = {
  id: 1,
  ticketId: 10,
  actionDateTime: new Date().toISOString(),
  description: "Restarted service",
  result: "Resolved",
  performedByUserId: "2",
  performedByName: "Sam Staff",
  followUpRequired: true,
  followUpNote: "Check tomorrow",
  attachmentNotes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("Actions Taken UI (Issue 4.3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.fetchTicketActions).mockResolvedValue([sampleAction]);
  });

  it("renders required create-form fields for staff", async () => {
    render(<ActionsTaken ticketId={10} canEdit={true} />);
    await userEvent.click(await screen.findByRole("button", { name: /add action/i }));
    expect(screen.getByLabelText(/action date\/time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^result/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/follow-up required/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/attachment notes/i)).toBeInTheDocument();
  });

  it("shows follow-up note only when the checkbox is checked", async () => {
    render(<ActionsTaken ticketId={10} canEdit={true} />);
    await userEvent.click(await screen.findByRole("button", { name: /add action/i }));
    expect(screen.queryByLabelText(/follow-up note/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByLabelText(/follow-up required/i));
    expect(screen.getByLabelText(/follow-up note/i)).toBeInTheDocument();
  });

  it("blocks submit and shows an error when description is empty", async () => {
    render(<ActionsTaken ticketId={10} canEdit={true} />);
    await userEvent.click(await screen.findByRole("button", { name: /add action/i }));
    await userEvent.click(screen.getByRole("button", { name: /save action/i }));
    expect(await screen.findByText(/description is required/i)).toBeInTheDocument();
    expect(api.createTicketAction).not.toHaveBeenCalled();
  });

  it("hides Add and Edit buttons for a requester but lists actions", async () => {
    render(<ActionsTaken ticketId={10} canEdit={false} />);
    await waitFor(() => expect(screen.getByText("Restarted service")).toBeInTheDocument());
    expect(screen.getByText("Yes - Check tomorrow")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add action/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
  });
});
