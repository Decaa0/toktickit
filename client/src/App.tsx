import React, { useState, useEffect } from "react";
import "./index.css";
import * as api from "./api";

export function App() {
  const [activeUser, setActiveUser] = useState<any>(null);
  const [requesters, setRequesters] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState<"selector" | "my-tickets" | "create-ticket" | "ticket-detail">("selector");

  // Reference data
  const [categories, setCategories] = useState<any[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<any[]>([]);

  // Tickets List State
  const [tickets, setTickets] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, totalPages: 1, totalItems: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Ticket Detail State
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [ticketDetail, setTicketDetail] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    categoryId: "",
    relatedSystemId: "",
    requestedPriority: "MEDIUM",
    summary: "",
    description: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Soft Remove Modal
  const [removingAttachmentId, setRemovingAttachmentId] = useState<number | null>(null);
  const [removalReason, setRemovalReason] = useState("");

  // Lab 1 Diagnostic State
  const [systemStatus, setSystemStatus] = useState<string | null>(null);
  const [lab1Categories, setLab1Categories] = useState<any[]>([]);

  useEffect(() => {
    if (typeof api.fetchActiveRequesters === "function") {
      api.fetchActiveRequesters()
        .then((data) => {
          setRequesters(data || []);
          const storedId = api.getActiveRequesterId();
          if (storedId && Array.isArray(data)) {
            const user = data.find((u: any) => String(u.id) === String(storedId));
            if (user) {
              setActiveUser(user);
              setCurrentView("my-tickets");
            }
          }
        })
        .catch(() => {});
    }

    if (typeof api.fetchCategories === "function") {
      api.fetchCategories().then((res) => setCategories(res || [])).catch(() => {});
    }
    if (typeof api.fetchRelatedSystems === "function") {
      api.fetchRelatedSystems().then((res) => setRelatedSystems(res || [])).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (activeUser && currentView === "my-tickets") {
      loadTickets();
    }
  }, [activeUser, currentView, pagination.page, searchTerm, statusFilter, categoryFilter]);

  const loadTickets = async () => {
    try {
      const res = await api.fetchMyTickets({
        page: pagination.page,
        limit: 5,
        search: searchTerm,
        status: statusFilter,
        category: categoryFilter,
      });
      setTickets(res?.data || []);
      setPagination(res?.pagination || { page: 1, totalPages: 1, totalItems: 0 });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectUser = (user: any) => {
    setActiveUser(user);
    api.setActiveRequesterId(String(user.id));
    setCurrentView("my-tickets");
  };

  const handleSwitchUser = () => {
    api.clearActiveRequester();
    setActiveUser(null);
    setCurrentView("selector");
  };

  const handleCheckSystem = async () => {
    try {
      const res = await (api as any).checkSystem();
      if (res && res.ok) {
        setSystemStatus("Online");
        setLab1Categories(res.categories || []);
      } else {
        setSystemStatus("Offline");
      }
    } catch {
      setSystemStatus("Offline");
    }
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.categoryId || !formData.relatedSystemId || !formData.summary.trim() || !formData.description.trim()) {
      setFormError("All required fields must be filled.");
      return;
    }

    setSubmitting(true);
    try {
      const ticket = await api.createTicket(formData);
      for (const file of selectedFiles) {
        await api.uploadAttachment(ticket.id, file);
      }
      setFormData({
        categoryId: "",
        relatedSystemId: "",
        requestedPriority: "MEDIUM",
        summary: "",
        description: "",
      });
      setSelectedFiles([]);
      setCurrentView("my-tickets");
    } catch (err: any) {
      setFormError(err.message || "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      setFormError("Maximum of 5 attachments allowed.");
      return;
    }
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const viewTicketDetail = async (id: number) => {
    setSelectedTicketId(id);
    try {
      const data = await api.fetchTicketDetail(id);
      setTicketDetail(data);
      setCurrentView("ticket-detail");
    } catch (err) {
      alert("Failed to load ticket details or access denied.");
    }
  };

  const handleSoftRemoveSubmit = async () => {
    if (!removalReason.trim() || !removingAttachmentId) return;
    try {
      await api.softRemoveAttachment(removingAttachmentId, removalReason);
      setRemovingAttachmentId(null);
      setRemovalReason("");
      if (selectedTicketId) {
        const refreshed = await api.fetchTicketDetail(selectedTicketId);
        setTicketDetail(refreshed);
      }
    } catch (err: any) {
      alert(err.message || "Removal failed");
    }
  };

  return (
    <div>
      <header className="navbar">
        <h2>TokTickIT</h2>
        {activeUser ? (
          <div className="nav-links">
            <span style={{ alignSelf: "center" }}>Requester: <strong>{activeUser.name}</strong></span>
            <button className={currentView === "my-tickets" ? "active" : ""} onClick={() => setCurrentView("my-tickets")}>My Tickets</button>
            <button className={currentView === "create-ticket" ? "active" : ""} onClick={() => setCurrentView("create-ticket")}>+ New Ticket</button>
            <button onClick={handleSwitchUser}>Switch User</button>
          </div>
        ) : (
          <div>Development Mode</div>
        )}
      </header>

      <main className="container">
        {/* Requester Selector & Lab 1 Diagnostics */}
        {currentView === "selector" && (
          <div className="card" style={{ maxWidth: 500, margin: "2rem auto" }}>
            <h3>Select Active Requester</h3>
            <p style={{ color: "var(--color-text-muted)" }}>Simulates logging in as a test requester.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1.2rem" }}>
              {requesters.map((user) => (
                <button
                  key={user.id}
                  className="btn-primary"
                  style={{ textAlign: "left", padding: "0.8rem" }}
                  onClick={() => handleSelectUser(user)}
                >
                  <strong>{user.name}</strong> ({user.email})
                </button>
              ))}
            </div>

            <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px dashed var(--color-border)" }}>
              <button className="btn-secondary" style={{ width: "100%" }} onClick={handleCheckSystem}>
                Check System
              </button>
              {systemStatus && (
                <div style={{ marginTop: "0.75rem", textAlign: "center" }}>
                  {systemStatus === "Online" ? (
                    <div>
                      <p>Online</p>
                      {lab1Categories.length > 0 && (
                        <ul style={{ listStyle: "none", padding: 0, marginTop: "0.5rem" }}>
                          {lab1Categories.map((cat: any) => (
                            <li key={cat.id || cat.name}>{cat.name}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p>Offline</p>
                      <p style={{ color: "var(--color-danger)" }}>TokTickIT API is currently unavailable</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Tickets View */}
        {currentView === "my-tickets" && activeUser && (
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3>My Tickets</h3>
              <button className="btn-primary" onClick={() => setCurrentView("create-ticket")}>+ Create Ticket</button>
            </div>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              <input
                type="text"
                placeholder="Search ticket number or summary..."
                className="form-control"
                style={{ flex: 1 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
              <select className="form-control" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Summary</th>
                    <th>Category</th>
                    <th>System</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: "center" }}>No tickets found.</td></tr>
                  ) : (
                    tickets.map((t) => (
                      <tr key={t.id}>
                        <td><strong>{t.ticketNumber}</strong></td>
                        <td>{t.summary}</td>
                        <td>{t.category?.name}</td>
                        <td>{t.relatedSystem?.name}</td>
                        <td><span className="badge badge-priority">{t.requestedPriority}</span></td>
                        <td><span className="badge badge-new">{t.currentStatus}</span></td>
                        <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button className="btn-primary" style={{ padding: "0.3rem 0.6rem" }} onClick={() => viewTicketDetail(t.id)}>
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
              <span>Total: {pagination.totalItems} tickets</span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className="btn-secondary"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                >
                  Previous
                </button>
                <span style={{ alignSelf: "center" }}>Page {pagination.page} of {pagination.totalPages}</span>
                <button
                  className="btn-secondary"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Ticket Form */}
        {currentView === "create-ticket" && activeUser && (
          <div className="card" style={{ maxWidth: 700, margin: "auto" }}>
            <h3>Create IT Support Ticket</h3>
            {formError && <div className="alert-error">{formError}</div>}
            <form onSubmit={handleCreateTicketSubmit}>
              <div className="form-group">
                <label>Requester (Read-Only)</label>
                <input className="form-control read-only" value={`${activeUser.name} (${activeUser.email})`} readOnly />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  className="form-control"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Related System *</label>
                <select
                  className="form-control"
                  value={formData.relatedSystemId}
                  onChange={(e) => setFormData({ ...formData, relatedSystemId: e.target.value })}
                  required
                >
                  <option value="">Select System</option>
                  {relatedSystems.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Requested Priority</label>
                <select
                  className="form-control"
                  value={formData.requestedPriority}
                  onChange={(e) => setFormData({ ...formData, requestedPriority: e.target.value })}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="form-group">
                <label>Summary / Title *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  rows={4}
                  className="form-control"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Attachments (Max 5 files, JPG/PNG/WEBP/PDF &le; 5MB)</label>
                <input type="file" multiple onChange={handleFileChange} accept=".jpg,.jpeg,.png,.webp,.pdf" />
                {selectedFiles.length > 0 && (
                  <ul style={{ marginTop: "0.5rem" }}>
                    {selectedFiles.map((f, i) => (
                      <li key={i}>{f.name} ({(f.size / 1024).toFixed(1)} KB)</li>
                    ))}
                  </ul>
                )}
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setCurrentView("my-tickets")}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Ticket Detail View */}
        {currentView === "ticket-detail" && ticketDetail && (
          <div className="card" style={{ maxWidth: 800, margin: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3>Ticket: {ticketDetail.ticketNumber}</h3>
              <button className="btn-secondary" onClick={() => setCurrentView("my-tickets")}>Back to List</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div><strong>Status:</strong> <span className="badge badge-new">{ticketDetail.currentStatus}</span></div>
              <div><strong>Priority:</strong> <span className="badge badge-priority">{ticketDetail.requestedPriority}</span></div>
              <div><strong>Category:</strong> {ticketDetail.category?.name}</div>
              <div><strong>Related System:</strong> {ticketDetail.relatedSystem?.name}</div>
              <div><strong>Created:</strong> {new Date(ticketDetail.createdAt).toLocaleString()}</div>
              <div><strong>Requester:</strong> {ticketDetail.requester?.name}</div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <h4>Summary</h4>
              <p>{ticketDetail.summary}</p>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <h4>Description</h4>
              <p style={{ whiteSpace: "pre-line" }}>{ticketDetail.description}</p>
            </div>

            <hr style={{ border: "0", borderTop: "1px solid var(--color-border)", margin: "1.5rem 0" }} />

            <h4>Attachments</h4>
            {ticketDetail.attachments && ticketDetail.attachments.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {ticketDetail.attachments.map((att: any) => (
                  <li
                    key={att.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.6rem 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <div>
                      {att.isRemoved ? (
                        <span style={{ color: "var(--color-text-muted)", textDecoration: "line-through" }}>
                          {att.fileName} (Removed: {att.removalReason})
                        </span>
                      ) : (
                        <span>
                          <strong>{att.fileName}</strong> ({(att.fileSize / 1024).toFixed(1)} KB)
                        </span>
                      )}
                    </div>
                    <div>
                      {!att.isRemoved && (
                        <button
                          className="btn-danger"
                          style={{ fontSize: "0.8rem" }}
                          onClick={() => setRemovingAttachmentId(att.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: "var(--color-text-muted)" }}>No attachments uploaded.</p>
            )}
          </div>
        )}
      </main>

      {/* Soft Remove Modal */}
      {removingAttachmentId && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h4>Remove Attachment</h4>
            <p>Please enter the reason for removing this file (required for audit trail):</p>
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. Confidential data attached by mistake"
              value={removalReason}
              onChange={(e) => setRemovalReason(e.target.value)}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
              <button className="btn-secondary" onClick={() => setRemovingAttachmentId(null)}>Cancel</button>
              <button className="btn-danger" disabled={!removalReason.trim()} onClick={handleSoftRemoveSubmit}>
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;