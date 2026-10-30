import React, { useEffect, useState } from "react";
import {
  fetchRequesterDashboard,
  fetchStaffDashboard,
  RequesterDashboard,
  StaffDashboard,
  TicketSummary,
} from "./api";

interface DashboardProps {
  role: "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";
  onOpenTicket: (id: number) => void;
  onDrill: (target: string) => void;
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  padding: "1.25rem",
  borderRadius: "8px",
  border: "1px solid #E2E8F0",
  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  textAlign: "left",
  font: "inherit",
};

const MetricCard: React.FC<{ label: string; value: number; onClick?: () => void }> = ({ label, value, onClick }) => {
  const content = (
    <>
      <div style={{ color: "#4A5568", fontSize: "0.875rem" }}>{label}</div>
      <div style={{ color: "#0B7A46", fontSize: "2rem", fontWeight: "bold" }}>{value}</div>
    </>
  );
  return onClick ? (
    <button onClick={onClick} style={{ ...cardStyle, cursor: "pointer" }} aria-label={label}>
      {content}
    </button>
  ) : (
    <div style={cardStyle}>{content}</div>
  );
};

const Breakdown: React.FC<{ title: string; data: Record<string, number> }> = ({ title, data }) => (
  <div style={cardStyle}>
    <div style={{ color: "#4A5568", fontSize: "0.875rem", marginBottom: "0.5rem" }}>{title}</div>
    {Object.keys(data).length === 0 ? (
      <div style={{ color: "#718096" }}>Nothing here yet.</div>
    ) : (
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {Object.entries(data).map(([k, v]) => (
          <li key={k} style={{ display: "flex", justifyContent: "space-between", padding: "0.125rem 0" }}>
            <span>{k}</span>
            <strong style={{ color: "#0B7A46" }}>{v}</strong>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const RecentList: React.FC<{ title: string; items: TicketSummary[]; onOpen: (id: number) => void }> = ({ title, items, onOpen }) => (
  <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
    <h3 style={{ margin: "0 0 0.75rem", color: "#0B7A46", fontSize: "1rem" }}>{title}</h3>
    {items.length === 0 ? (
      <div style={{ color: "#718096" }}>Nothing here yet.</div>
    ) : (
      items.map((t) => (
        <button
          key={t.id}
          onClick={() => onOpen(t.id)}
          style={{ display: "flex", gap: "0.75rem", width: "100%", background: "transparent", border: "none", borderTop: "1px solid #E2E8F0", padding: "0.5rem 0", cursor: "pointer", textAlign: "left", font: "inherit" }}
        >
          <strong>{t.ticketNumber}</strong>
          <span style={{ flex: 1 }}>{t.summary}</span>
          <span style={{ color: "#0B7A46" }}>{t.currentStatus}</span>
        </button>
      ))
    )}
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ role, onOpenTicket, onDrill }) => {
  const isStaff = role === "IT_STAFF" || role === "ADMINISTRATOR";
  const [requester, setRequester] = useState<RequesterDashboard | null>(null);
  const [staff, setStaff] = useState<StaffDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const load = isStaff
      ? fetchStaffDashboard().then((d) => !cancelled && setStaff(d))
      : fetchRequesterDashboard().then((d) => !cancelled && setRequester(d));
    load
      .catch(() => !cancelled && setError("Unable to load the dashboard. Please try again."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [isStaff]);

  if (loading) return <div style={{ color: "#4A5568" }}>Loading dashboard...</div>;
  if (error) {
    return (
      <div role="alert" style={{ backgroundColor: "#FFF5F5", color: "#C53030", border: "1px solid #FEB2B2", padding: "0.75rem 1rem", borderRadius: "4px" }}>
        {error}
      </div>
    );
  }

  const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" };

  return (
    <div>
      <h2 style={{ color: "#0B7A46", marginTop: 0 }}>Dashboard</h2>
      {isStaff && staff ? (
        <div style={grid}>
          <MetricCard label="Unassigned" value={staff.unassigned} onClick={() => onDrill("unassigned")} />
          <MetricCard label="Owned by Me" value={staff.ownedByMe} onClick={() => onDrill("mine")} />
          <Breakdown title="By Status" data={staff.byStatus ?? {}} />
          <Breakdown title="By Priority" data={staff.byPriority ?? {}} />
          <RecentList title="Recently Updated" items={staff.recentlyUpdated?.items ?? []} onOpen={onOpenTicket} />
        </div>
      ) : requester ? (
        <div style={grid}>
          <MetricCard label="Open Tickets" value={requester.totalOpen} />
          <MetricCard label="Waiting for Me" value={requester.waitingForRequester} />
          <RecentList title="Recently Updated" items={requester.recentlyUpdated?.items ?? []} onOpen={onOpenTicket} />
          <RecentList title="Recently Resolved" items={requester.recentlyResolved?.items ?? []} onOpen={onOpenTicket} />
        </div>
      ) : null}
    </div>
  );
};

export default Dashboard;
export { Dashboard };
