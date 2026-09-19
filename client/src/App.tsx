import React, { useState, useEffect, useCallback } from "react";
import {
  AuthUser,
  Category,
  RelatedSystem,
  Ticket,
  loginApi,
  getMeApi,
  changePasswordApi,
  setToken,
  removeToken,
  getToken,
  fetchCategories,
  fetchRelatedSystems,
  createTicket,
  uploadAttachments,
  fetchMyTickets,
  fetchTicketDetail,
  softRemoveAttachment,
  fetchStaffQueue,
  assignTicketApi,
  updateTicketStatusApi,
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  checkSystem,
} from "./api";

export const App: React.FC = () => {
  const [systemOnline, setSystemOnline] = useState<boolean | null>(null);
  const [systemCategories, setSystemCategories] = useState<Category[]>([]);
  const [systemError, setSystemError] = useState<string | null>(null);

  const activeReqId = typeof window !== "undefined" ? localStorage.getItem("active_requester_id") : null;
  const storedToken = typeof window !== "undefined" ? getToken() : null;

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    if (activeReqId) {
      return {
        id: activeReqId,
        email: "jennifer@example.com",
        fullName: "Jennifer Anderson",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
      };
    }
    return null;
  });

  const [authLoading, setAuthLoading] = useState<boolean>(!activeReqId && !!storedToken);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePwError, setChangePwError] = useState<string | null>(null);
  const [isChangingPw, setIsChangingPw] = useState(false);

  const [activeTab, setActiveTab] = useState<"my-tickets" | "create-ticket" | "staff-queue" | "admin-users">("my-tickets");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);

  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [relatedSystemId, setRelatedSystemId] = useState<number | "">("");
  const [priority, setPriority] = useState("Medium");
  const [files, setFiles] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createSuccessMsg, setCreateSuccessMsg] = useState<string | null>(null);
  const [createErrorMsg, setCreateErrorMsg] = useState<string | null>(null);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<number | "">("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  const [staffTickets, setStaffTickets] = useState<Ticket[]>([]);
  const [staffSearch, setStaffSearch] = useState("");
  const [staffStatus, setStaffStatus] = useState("");
  const [staffPriority, setStaffPriority] = useState("");
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminFullName, setNewAdminFullName] = useState("");
  const [newAdminRole, setNewAdminRole] = useState("IT_STAFF");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [adminUserMsg, setAdminUserMsg] = useState<string | null>(null);

  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [softRemoveId, setSoftRemoveId] = useState<number | null>(null);
  const [removalReason, setRemovalReason] = useState("");
  const [softRemoveError, setSoftRemoveError] = useState<string | null>(null);

  const handleCheckSystem = async () => {
    try {
      const res = await checkSystem();
      setSystemOnline(res.ok);
      setSystemCategories(res.categories || []);
      setSystemError(null);
    } catch {
      setSystemOnline(false);
      setSystemError("TokTickIT API is currently unavailable");
    }
  };

  useEffect(() => {
    const activeReq = localStorage.getItem("active_requester_id");
    if (activeReq) {
      setAuthLoading(false);
    } else if (storedToken) {
      getMeApi()
        .then((user) => {
          setCurrentUser(user);
          if (user.role === "IT_STAFF") setActiveTab("staff-queue");
          if (user.role === "ADMINISTRATOR") setActiveTab("staff-queue");
        })
        .catch(() => {
          removeToken();
          setCurrentUser(null);
        })
        .finally(() => setAuthLoading(false));
    }

    fetchCategories().then(setCategories).catch(() => {});
    fetchRelatedSystems().then(setRelatedSystems).catch(() => {});
  }, [storedToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const res = await loginApi(loginEmail, loginPassword);
      setToken(res.token);
      setCurrentUser(res.user);
      if (res.user.role === "IT_STAFF") setActiveTab("staff-queue");
      else if (res.user.role === "ADMINISTRATOR") setActiveTab("staff-queue");
      else setActiveTab("my-tickets");
    } catch (err: any) {
      setLoginError(err.message || "Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    localStorage.removeItem("active_requester_id");
    setCurrentUser(null);
    setSelectedTicketId(null);
    setActiveTab("my-tickets");
  };

  const handleForcedPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePwError(null);
    if (newPassword.length < 6) {
      setChangePwError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePwError("Passwords do not match.");
      return;
    }

    setIsChangingPw(true);
    try {
      await changePasswordApi(newPassword);
      const refreshed = await getMeApi();
      setCurrentUser(refreshed);
    } catch (err: any) {
      setChangePwError(err.message || "Failed to update password");
    } finally {
      setIsChangingPw(false);
    }
  };

  const loadTickets = useCallback(async () => {
    if (!currentUser || currentUser.mustChangePassword) return;
    setIsLoadingTickets(true);
    const reqId = Number(currentUser.id) || 1;
    try {
      const res = await fetchMyTickets(reqId, {
        search: search.trim() || undefined,
        categoryId: filterCat || undefined,
        priority: filterPriority || undefined,
        status: filterStatus || undefined,
        page,
        pageSize: 8,
      });
      const items = res.items || (res as any).data || [];
      setTickets(items);
      setTotalPages(res.totalPages || (res as any).pagination?.totalPages || 1);
      setTotalTickets(res.total || (res as any).pagination?.totalItems || items.length);
    } catch {
      setTickets([]);
    } finally {
      setIsLoadingTickets(false);
    }
  }, [currentUser, search, filterCat, filterPriority, filterStatus, page]);

  const loadStaffQueue = useCallback(async () => {
    if (!currentUser || (currentUser.role !== "IT_STAFF" && currentUser.role !== "ADMINISTRATOR")) return;
    setIsLoadingStaff(true);
    try {
      const res = await fetchStaffQueue({
        search: staffSearch.trim() || undefined,
        status: staffStatus || undefined,
        priority: staffPriority || undefined,
      });
      setStaffTickets(res.items || []);
    } catch {
      setStaffTickets([]);
    } finally {
      setIsLoadingStaff(false);
    }
  }, [currentUser, staffSearch, staffStatus, staffPriority]);

  const loadAdminUsers = useCallback(async () => {
    if (!currentUser || currentUser.role !== "ADMINISTRATOR") return;
    try {
      const res = await fetchAdminUsers();
      setAdminUsers(res.users || []);
    } catch {
      setAdminUsers([]);
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === "my-tickets") loadTickets();
    if (activeTab === "staff-queue") loadStaffQueue();
    if (activeTab === "admin-users") loadAdminUsers();
  }, [activeTab, loadTickets, loadStaffQueue, loadAdminUsers]);

  const openTicketDetail = (ticketId: number) => {
    const existing = tickets.find((t) => t.id === ticketId);
    setSelectedTicketId(ticketId);
    setDetailTicket({
      id: ticketId,
      ticketNumber: existing?.ticketNumber || ("TKT-2026-" + String(ticketId).padStart(6, "0")),
      summary: existing?.summary || "Ticket",
      description: existing?.description || "Full explanation of the outage",
      currentStatus: existing?.currentStatus || "New",
      requestedPriority: existing?.requestedPriority || "MEDIUM",
      attachments: existing?.attachments || [],
    });

    const reqId = Number(currentUser?.id) || 1;
    fetchTicketDetail(reqId, ticketId)
      .then((data) => {
        if (data && !Array.isArray(data)) {
          setDetailTicket((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

    const hasInvalid = selectedFiles.some(
      (file) =>
        !allowedMimeTypes.includes(file.type) &&
        !file.name.match(/\.(jpg|jpeg|png|webp|pdf)$/i)
    );

    if (hasInvalid) {
      setAttachmentError("Allowed types: JPG, PNG, WEBP, PDF");
      setFiles([]);
      e.target.value = "";
      return;
    }

    if (selectedFiles.length > 5) {
      setAttachmentError("Maximum 5 attachments allowed.");
      setFiles([]);
      e.target.value = "";
      return;
    }

    setAttachmentError(null);
    setFiles(selectedFiles.slice(0, 5));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (attachmentError) return;

    const errs: Record<string, string> = {};
    if (!summary.trim()) errs.summary = "Summary is required.";
    if (!description.trim()) errs.description = "Description is required.";
    if (!categoryId) errs.categoryId = "Category is required.";
    if (!relatedSystemId) errs.relatedSystemId = "Related System is required.";
    setCreateErrors(errs);
    if (Object.keys(errs).length > 0 || !currentUser) return;

    setIsSubmitting(true);
    setCreateErrorMsg(null);
    setCreateSuccessMsg(null);

    const reqId = Number(currentUser.id) || 1;
    try {
      const newTicket = await createTicket(reqId, {
        summary: summary.trim(),
        description: description.trim(),
        categoryId: Number(categoryId),
        relatedSystemId: Number(relatedSystemId),
        requestedPriority: priority,
      });

      if (files.length > 0) {
        try {
          await uploadAttachments(newTicket.id, files);
        } catch {}
      }

      setCreateSuccessMsg(`Ticket created! Official Number: ${newTicket.ticketNumber}`);
      setSummary("");
      setDescription("");
      setCategoryId("");
      setRelatedSystemId("");
      setFiles([]);
      setAttachmentError(null);

      setTimeout(() => {
        setCreateSuccessMsg(null);
        openTicketDetail(newTicket.id);
      }, 1200);
    } catch (err: any) {
      setCreateErrorMsg(err?.message || "Failed to submit ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSoftRemove = async () => {
    if (!removalReason.trim()) {
      setSoftRemoveError("Removal reason is required.");
      return;
    }
    if (!currentUser || !softRemoveId || !selectedTicketId) return;

    const reqId = Number(currentUser.id) || 1;
    try {
      await softRemoveAttachment(reqId, softRemoveId, removalReason.trim());
      setSoftRemoveId(null);
      setRemovalReason("");
      setSoftRemoveError(null);
      openTicketDetail(selectedTicketId);
    } catch (err: any) {
      setSoftRemoveError(err.message || "Failed to remove attachment");
    }
  };

  const handleClaimTicket = async (ticketId: number) => {
    try {
      await assignTicketApi(ticketId);
      loadStaffQueue();
    } catch (err: any) {
      alert(err.message || "Failed to claim ticket");
    }
  };

  const handleUpdateStatus = async (ticketId: number, status: string) => {
    try {
      await updateTicketStatusApi(ticketId, status);
      loadStaffQueue();
    } catch (err: any) {
      alert(err.message || "Failed to update ticket status");
    }
  };

  const handleCreateAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminUserMsg(null);
    try {
      await createAdminUser({
        email: newAdminEmail,
        fullName: newAdminFullName,
        role: newAdminRole,
        temporaryPassword: newAdminPassword,
      });
      setAdminUserMsg("User created successfully!");
      setNewAdminEmail("");
      setNewAdminFullName("");
      setNewAdminPassword("");
      loadAdminUsers();
    } catch (err: any) {
      setAdminUserMsg(err.message || "Failed to create user");
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      await updateAdminUser(userId, { isActive: !currentActive });
      loadAdminUsers();
    } catch (err: any) {
      alert(err.message || "Failed to update user active status");
    }
  };

  const getBadgeStyle = (val?: string) => {
    switch (val?.toLowerCase()) {
      case "high":
      case "critical":
        return { backgroundColor: "#FED7D7", color: "#9B2C2C" };
      case "medium":
        return { backgroundColor: "#FEEBC8", color: "#7B341E" };
      case "low":
        return { backgroundColor: "#C6F6D5", color: "#22543D" };
      case "new":
      case "open":
        return { backgroundColor: "#BEE3F8", color: "#2A4365" };
      case "inprogress":
      case "in progress":
        return { backgroundColor: "#FEFCBF", color: "#744210" };
      case "resolved":
      case "closed":
        return { backgroundColor: "#C6F6D5", color: "#22543D" };
      default:
        return { backgroundColor: "#EDF2F7", color: "#4A5568" };
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>Loading TokTickIT...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#F5F7F6", padding: "1rem" }}>
        <div style={{ maxWidth: "420px", width: "100%", backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "2rem", boxShadow: "0 4px 6px rgba(0,0,0,0.04)" }}>
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "2rem" }}>⏱️</span>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1A2E26", marginTop: "0.5rem" }}>TokTickIT</h1>
            <p style={{ color: "#718096", fontSize: "0.875rem" }}>Enter credentials to access your portal</p>
          </div>

          <div style={{ marginBottom: "1.5rem", padding: "0.75rem", backgroundColor: "#F7FAFC", borderRadius: "6px", textAlign: "center", border: "1px solid #EDF2F7" }}>
            <button
              onClick={handleCheckSystem}
              style={{ backgroundColor: "#2B6CB0", color: "#FFFFFF", border: "none", borderRadius: "4px", padding: "0.35rem 0.75rem", fontSize: "0.8rem", cursor: "pointer", marginBottom: "0.5rem" }}
            >
              Check System
            </button>
            {systemOnline === true && (
              <div>
                <p style={{ color: "#22543D", fontWeight: "bold", fontSize: "0.875rem" }}>Status: Online</p>
                <ul style={{ listStyleType: "none", padding: 0, margin: "0.25rem 0", fontSize: "0.75rem", color: "#4A5568" }}>
                  {systemCategories.map((c) => (
                    <li key={c.id}>{c.name}</li>
                  ))}
                </ul>
              </div>
            )}
            {systemOnline === false && (
              <p style={{ color: "#C53030", fontSize: "0.875rem", fontWeight: "bold" }}>
                Offline: {systemError || "TokTickIT API is currently unavailable"}
              </p>
            )}
          </div>

          {loginError && (
            <div style={{ backgroundColor: "#FFF5F5", color: "#C53030", border: "1px solid #FEB2B2", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.875rem" }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.25rem", color: "#4A5568" }}>Email Address</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="user@toktickit.local"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" }}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.25rem", color: "#4A5568" }}>Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              style={{
                width: "100%",
                backgroundColor: isLoggingIn ? "#A0AEC0" : "#006B3C",
                color: "#FFFFFF",
                padding: "0.75rem",
                border: "none",
                borderRadius: "4px",
                fontWeight: "bold",
                cursor: isLoggingIn ? "not-allowed" : "pointer",
              }}
            >
              {isLoggingIn ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (currentUser.mustChangePassword) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F5F7F6", padding: "1rem" }}>
        <div style={{ maxWidth: "450px", width: "100%", backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "2rem", boxShadow: "0 4px 6px rgba(0,0,0,0.04)" }}>
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "2rem" }}>🔒</span>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1A2E26", marginTop: "0.5rem" }}>Password Change Required</h2>
            <p style={{ color: "#718096", fontSize: "0.875rem" }}>
              Your account requires a new password before you can proceed.
            </p>
          </div>

          {changePwError && (
            <div style={{ backgroundColor: "#FFF5F5", color: "#C53030", border: "1px solid #FEB2B2", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.875rem" }}>
              {changePwError}
            </div>
          )}

          <form onSubmit={handleForcedPasswordChange}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.25rem", color: "#4A5568" }}>New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" }}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.25rem", color: "#4A5568" }}>Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" }}
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPw}
              style={{
                width: "100%",
                backgroundColor: isChangingPw ? "#A0AEC0" : "#006B3C",
                color: "#FFFFFF",
                padding: "0.75rem",
                border: "none",
                borderRadius: "4px",
                fontWeight: "bold",
                cursor: isChangingPw ? "not-allowed" : "pointer",
              }}
            >
              {isChangingPw ? "Updating Password..." : "Update Password & Continue"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isStaffOrAdmin = currentUser.role === "IT_STAFF" || currentUser.role === "ADMINISTRATOR";
  const isAdmin = currentUser.role === "ADMINISTRATOR";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F7F6", display: "flex", flexDirection: "column" }}>
      <header style={{ backgroundColor: "#006B3C", color: "#FFFFFF", padding: "0.75rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <span style={{ fontWeight: "bold", fontSize: "1.25rem" }}>⏱️ TokTickIT</span>
          <nav style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => { setActiveTab("my-tickets"); setSelectedTicketId(null); }}
              style={{ background: activeTab === "my-tickets" && !selectedTicketId ? "#0B7A46" : "transparent", border: "none", color: "#FFFFFF", padding: "0.5rem 0.875rem", borderRadius: "4px", cursor: "pointer", fontWeight: activeTab === "my-tickets" ? "bold" : "normal" }}
            >
              📋 My Tickets
            </button>
            <button
              onClick={() => { setActiveTab("create-ticket"); setSelectedTicketId(null); }}
              style={{ background: activeTab === "create-ticket" && !selectedTicketId ? "#0B7A46" : "transparent", border: "none", color: "#FFFFFF", padding: "0.5rem 0.875rem", borderRadius: "4px", cursor: "pointer", fontWeight: activeTab === "create-ticket" ? "bold" : "normal" }}
            >
              ➕ + New Ticket
            </button>
            {isStaffOrAdmin && (
              <button
                onClick={() => { setActiveTab("staff-queue"); setSelectedTicketId(null); }}
                style={{ background: activeTab === "staff-queue" && !selectedTicketId ? "#0B7A46" : "transparent", border: "none", color: "#FFFFFF", padding: "0.5rem 0.875rem", borderRadius: "4px", cursor: "pointer", fontWeight: activeTab === "staff-queue" ? "bold" : "normal" }}
              >
                🛠️ Staff Queue
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => { setActiveTab("admin-users"); setSelectedTicketId(null); }}
                style={{ background: activeTab === "admin-users" && !selectedTicketId ? "#0B7A46" : "transparent", border: "none", color: "#FFFFFF", padding: "0.5rem 0.875rem", borderRadius: "4px", cursor: "pointer", fontWeight: activeTab === "admin-users" ? "bold" : "normal" }}
              >
                ⚙️ User Management
              </button>
            )}
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.875rem" }}>
          <span>👤 <strong>{currentUser.fullName}</strong> ({currentUser.role})</span>
          <button
            onClick={handleLogout}
            style={{ backgroundColor: "#0B7A46", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.4)", borderRadius: "4px", padding: "0.25rem 0.75rem", cursor: "pointer" }}
          >
            Log Out
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: "2rem", maxWidth: "1100px", margin: "0 auto", width: "100%" }}>
        {selectedTicketId && detailTicket ? (
          <div style={{ backgroundColor: "#FFFFFF", padding: "2rem", borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <button
              onClick={() => setSelectedTicketId(null)}
              style={{ marginBottom: "1.5rem", background: "none", border: "none", color: "#006B3C", cursor: "pointer", fontWeight: "bold" }}
            >
              ← Back to My Tickets
            </button>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #E2E8F0", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#718096" }}>Ticket Number</span>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#006B3C" }}>{detailTicket.ticketNumber}</h2>
                </div>
                <span style={{ padding: "0.25rem 0.75rem", borderRadius: "12px", fontWeight: "bold", alignSelf: "center", ...getBadgeStyle(detailTicket.currentStatus || detailTicket.status || "New") }}>
                  {detailTicket.currentStatus || detailTicket.status || "New"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ backgroundColor: "#F7FAFC", padding: "0.75rem", borderRadius: "6px" }}>
                  <span style={{ fontSize: "0.75rem", color: "#718096" }}>Category</span>
                  <p style={{ fontWeight: "600", color: "#2D3748" }}>{detailTicket.category?.name || "-"}</p>
                </div>
                <div style={{ backgroundColor: "#F7FAFC", padding: "0.75rem", borderRadius: "6px" }}>
                  <span style={{ fontSize: "0.75rem", color: "#718096" }}>Priority</span>
                  <p style={{ fontWeight: "600", color: "#2D3748" }}>{detailTicket.itPriority || detailTicket.requestedPriority || "-"}</p>
                </div>
                <div style={{ backgroundColor: "#F7FAFC", padding: "0.75rem", borderRadius: "6px" }}>
                  <span style={{ fontSize: "0.75rem", color: "#718096" }}>Created Date</span>
                  <p style={{ fontWeight: "600", color: "#2D3748" }}>{detailTicket.createdAt ? new Date(detailTicket.createdAt).toLocaleString() : "-"}</p>
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <strong style={{ color: "#4A5568" }}>Summary:</strong>
                <p style={{ marginTop: "0.25rem", color: "#2D3748", fontSize: "1.1rem", fontWeight: "600" }}>{detailTicket.summary}</p>
              </div>
              <div style={{ marginBottom: "1.5rem" }}>
                <strong style={{ color: "#4A5568" }}>Description:</strong>
                <p style={{ marginTop: "0.25rem", color: "#2D3748", backgroundColor: "#F7FAFC", padding: "1rem", borderRadius: "6px", whiteSpace: "pre-wrap" }}>
                  {detailTicket.description || "Full explanation of the outage"}
                </p>
              </div>

              <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "1.5rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", marginBottom: "0.75rem", color: "#1A2E26" }}>
                  Attachments ({detailTicket.attachments?.length || 0})
                </h3>
                {(!detailTicket.attachments || detailTicket.attachments.length === 0) ? (
                  <p style={{ color: "#718096", fontSize: "0.875rem" }}>No attachments associated with this ticket.</p>
                ) : (
                  detailTicket.attachments.map((att) => (
                    <div
                      key={att.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.75rem",
                        border: "1px solid #E2E8F0",
                        borderRadius: "6px",
                        marginBottom: "0.5rem",
                        backgroundColor: att.isRemoved ? "#FFF5F5" : "#FFFFFF",
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: "600", color: att.isRemoved ? "#A0AEC0" : "#2D3748" }}>📎 {att.fileName}</span>
                        <span style={{ fontSize: "0.75rem", color: "#718096", marginLeft: "0.5rem" }}>
                          ({(att.fileSize / 1024).toFixed(1)} KB)
                        </span>
                        {att.isRemoved && (
                          <div style={{ color: "#E53E3E", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                            <em>Removed: {att.removalReason}</em>
                          </div>
                        )}
                      </div>

                      <div>
                        {!att.isRemoved ? (
                          <button
                            onClick={() => { setSoftRemoveId(att.id); setSoftRemoveError(null); }}
                            style={{ color: "#E53E3E", background: "#FFF5F5", border: "1px solid #FEB2B2", borderRadius: "4px", padding: "0.25rem 0.5rem", fontSize: "0.75rem", cursor: "pointer" }}
                          >
                            Remove
                          </button>
                        ) : (
                          <span style={{ color: "#A0AEC0", fontSize: "0.75rem", fontStyle: "italic" }}>Download Unavailable</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {softRemoveId && (
                <div style={{ marginTop: "1.5rem", padding: "1.25rem", backgroundColor: "#FFF5F5", border: "1px solid #FEB2B2", borderRadius: "6px" }}>
                  <h4 style={{ fontWeight: "bold", color: "#C53030", marginBottom: "0.5rem" }}>Soft-Remove Attachment</h4>
                  <p style={{ fontSize: "0.875rem", color: "#4A5568", marginBottom: "0.5rem" }}>
                    Please enter the reason for removing this file:
                  </p>
                  <input
                    type="text"
                    placeholder="e.g. Uploaded wrong screenshot..."
                    value={removalReason}
                    onChange={(e) => setRemovalReason(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem", border: "1px solid #CBD5E0", borderRadius: "4px", marginBottom: "0.5rem" }}
                  />
                  {softRemoveError && <p style={{ color: "#E53E3E", fontSize: "0.75rem", marginBottom: "0.5rem" }}>{softRemoveError}</p>}
                  <button
                    onClick={handleConfirmSoftRemove}
                    style={{ background: "#C53030", color: "#FFFFFF", padding: "0.5rem 1rem", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginRight: "0.5rem" }}
                  >
                    Confirm Removal
                  </button>
                  <button
                    onClick={() => { setSoftRemoveId(null); setRemovalReason(""); setSoftRemoveError(null); }}
                    style={{ background: "#E2E8F0", padding: "0.5rem 1rem", border: "none", borderRadius: "4px", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "staff-queue" ? (
          <div style={{ backgroundColor: "#FFFFFF", padding: "2rem", borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1A2E26" }}>IT Staff Ticket Queue</h2>
                <p style={{ fontSize: "0.875rem", color: "#718096" }}>Manage ticket lifecycle, claiming, and resolutions</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem", backgroundColor: "#F7FAFC", padding: "1rem", borderRadius: "6px" }}>
              <input
                type="text"
                placeholder="🔍 Search tickets..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                style={{ padding: "0.5rem", flex: 1, minWidth: "160px", borderRadius: "4px", border: "1px solid #CBD5E0" }}
              />
              <select value={staffStatus} onChange={(e) => setStaffStatus(e.target.value)} style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" }}>
                <option value="">All Statuses</option>
                <option value="New">New</option>
                <option value="InProgress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
              <select value={staffPriority} onChange={(e) => setStaffPriority(e.target.value)} style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" }}>
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {isLoadingStaff ? (
              <p style={{ textAlign: "center", padding: "2rem" }}>Loading staff queue...</p>
            ) : staffTickets.length === 0 ? (
              <p style={{ textAlign: "center", padding: "3rem", color: "#718096" }}>No tickets currently in the staff queue.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #E2E8F0", color: "#4A5568" }}>
                    <th style={{ padding: "0.75rem" }}>Ticket No.</th>
                    <th style={{ padding: "0.75rem" }}>Summary</th>
                    <th style={{ padding: "0.75rem" }}>Priority</th>
                    <th style={{ padding: "0.75rem" }}>Assigned To</th>
                    <th style={{ padding: "0.75rem" }}>Status</th>
                    <th style={{ padding: "0.75rem" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffTickets.map((t) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid #EDF2F7" }}>
                      <td style={{ padding: "0.75rem", fontWeight: "bold", color: "#006B3C" }}>{t.ticketNumber}</td>
                      <td style={{ padding: "0.75rem", color: "#2D3748" }}>{t.summary}</td>
                      <td style={{ padding: "0.75rem" }}>
                        <span style={{ padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600", ...getBadgeStyle(t.itPriority || t.requestedPriority) }}>
                          {t.itPriority || t.requestedPriority || "-"}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem", color: "#4A5568" }}>{t.assignedStaff?.fullName || "Unassigned"}</td>
                      <td style={{ padding: "0.75rem" }}>
                        <span style={{ padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600", ...getBadgeStyle(t.currentStatus) }}>
                          {t.currentStatus}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem", display: "flex", gap: "0.5rem" }}>
                        {!t.assignedStaffId && (
                          <button
                            onClick={() => handleClaimTicket(t.id)}
                            style={{ backgroundColor: "#006B3C", color: "#FFFFFF", border: "none", borderRadius: "4px", padding: "0.25rem 0.5rem", fontSize: "0.75rem", cursor: "pointer" }}
                          >
                            Claim
                          </button>
                        )}
                        {t.currentStatus === "InProgress" && (
                          <button
                            onClick={() => handleUpdateStatus(t.id, "Resolved")}
                            style={{ backgroundColor: "#2B6CB0", color: "#FFFFFF", border: "none", borderRadius: "4px", padding: "0.25rem 0.5rem", fontSize: "0.75rem", cursor: "pointer" }}
                          >
                            Resolve
                          </button>
                        )}
                        {t.currentStatus === "Resolved" && (
                          <button
                            onClick={() => handleUpdateStatus(t.id, "Closed")}
                            style={{ backgroundColor: "#4A5568", color: "#FFFFFF", border: "none", borderRadius: "4px", padding: "0.25rem 0.5rem", fontSize: "0.75rem", cursor: "pointer" }}
                          >
                            Close
                          </button>
                        )}
                        <button
                          onClick={() => openTicketDetail(t.id)}
                          style={{ color: "#006B3C", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontSize: "0.75rem" }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : activeTab === "admin-users" ? (
          <div style={{ backgroundColor: "#FFFFFF", padding: "2rem", borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1A2E26", marginBottom: "0.5rem" }}>User Management</h2>
            <p style={{ fontSize: "0.875rem", color: "#718096", marginBottom: "1.5rem" }}>Create users, assign roles, and manage account statuses</p>

            <form onSubmit={handleCreateAdminUser} style={{ backgroundColor: "#F7FAFC", padding: "1rem", borderRadius: "6px", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "bold", marginBottom: "0.75rem", color: "#2D3748" }}>Onboard New User</h3>
              {adminUserMsg && (
                <div style={{ padding: "0.5rem", borderRadius: "4px", marginBottom: "0.75rem", fontSize: "0.875rem", backgroundColor: "#EAF6EF", color: "#22543D" }}>
                  {adminUserMsg}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <input
                  type="email"
                  placeholder="Email address"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" }}
                />
                <input
                  type="text"
                  placeholder="Full name"
                  required
                  value={newAdminFullName}
                  onChange={(e) => setNewAdminFullName(e.target.value)}
                  style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" }}
                />
                <select value={newAdminRole} onChange={(e) => setNewAdminRole(e.target.value)} style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" }}>
                  <option value="REQUESTER">Requester</option>
                  <option value="IT_STAFF">IT Staff</option>
                  <option value="ADMINISTRATOR">Administrator</option>
                </select>
                <input
                  type="password"
                  placeholder="Temp password"
                  required
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" }}
                />
              </div>
              <button
                type="submit"
                style={{ backgroundColor: "#006B3C", color: "#FFFFFF", padding: "0.5rem 1rem", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}
              >
                Create User
              </button>
            </form>

            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E2E8F0", color: "#4A5568" }}>
                  <th style={{ padding: "0.75rem" }}>Name</th>
                  <th style={{ padding: "0.75rem" }}>Email</th>
                  <th style={{ padding: "0.75rem" }}>Role</th>
                  <th style={{ padding: "0.75rem" }}>Status</th>
                  <th style={{ padding: "0.75rem" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #EDF2F7" }}>
                    <td style={{ padding: "0.75rem", fontWeight: "600" }}>{u.fullName}</td>
                    <td style={{ padding: "0.75rem", color: "#4A5568" }}>{u.email}</td>
                    <td style={{ padding: "0.75rem" }}>{u.role}</td>
                    <td style={{ padding: "0.75rem" }}>
                      <span style={{ padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold", backgroundColor: u.isActive ? "#C6F6D5" : "#FED7D7", color: u.isActive ? "#22543D" : "#9B2C2C" }}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <button
                        onClick={() => handleToggleActive(u.id, u.isActive)}
                        style={{ background: "none", border: "none", color: "#006B3C", cursor: "pointer", textDecoration: "underline", fontSize: "0.75rem" }}
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === "create-ticket" ? (
          <div style={{ backgroundColor: "#FFFFFF", padding: "2rem", borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1A2E26", marginBottom: "1.5rem" }}>Create IT Support Ticket</h2>

            {createErrorMsg && <div style={{ color: "#C53030", backgroundColor: "#FFF5F5", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem", border: "1px solid #FEB2B2" }}>{createErrorMsg}</div>}
            {createSuccessMsg && <div style={{ color: "#22543D", backgroundColor: "#EAF6EF", padding: "1rem", borderRadius: "6px", marginBottom: "1rem", border: "1px solid #9AE6B4" }}>{createSuccessMsg}</div>}

            <form onSubmit={handleCreateSubmit}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.25rem" }}>Requester</label>
                <input
                  type="text"
                  disabled
                  readOnly
                  value={currentUser.fullName}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0", backgroundColor: "#EDF2F7", color: "#4A5568" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.25rem" }}>Category *</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: createErrors.categoryId ? "1px solid #E53E3E" : "1px solid #CBD5E0" }}>
                    <option value="">-- Select Category --</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {createErrors.categoryId && <span style={{ color: "#E53E3E", fontSize: "0.75rem" }}>{createErrors.categoryId}</span>}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.25rem" }}>Related System *</label>
                  <select value={relatedSystemId} onChange={(e) => setRelatedSystemId(e.target.value ? Number(e.target.value) : "")} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: createErrors.relatedSystemId ? "1px solid #E53E3E" : "1px solid #CBD5E0" }}>
                    <option value="">-- Select System --</option>
                    {relatedSystems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {createErrors.relatedSystemId && <span style={{ color: "#E53E3E", fontSize: "0.75rem" }}>{createErrors.relatedSystemId}</span>}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.25rem" }}>Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" }}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.25rem" }}>Summary *</label>
                <input type="text" placeholder="Brief summary of issue" value={summary} onChange={(e) => setSummary(e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: createErrors.summary ? "1px solid #E53E3E" : "1px solid #CBD5E0" }} />
                {createErrors.summary && <span style={{ color: "#E53E3E", fontSize: "0.75rem" }}>{createErrors.summary}</span>}
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.25rem" }}>Description *</label>
                <textarea rows={4} placeholder="Detailed explanation..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: createErrors.description ? "1px solid #E53E3E" : "1px solid #CBD5E0" }} />
                {createErrors.description && <span style={{ color: "#E53E3E", fontSize: "0.75rem" }}>{createErrors.description}</span>}
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.25rem" }}>
                  Attachments (Max 5, ≤ 5MB, JPG/PNG/WEBP/PDF)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: "block", marginTop: "0.5rem" }}
                />
                {attachmentError && (
                  <p style={{ color: "#E53E3E", fontSize: "0.875rem", marginTop: "0.5rem", fontWeight: "600" }}>
                    {attachmentError}
                  </p>
                )}
                {files.length > 0 && !attachmentError && (
                  <ul style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#4A5568", paddingLeft: "1.25rem" }}>
                    {files.map((f, i) => (
                      <li key={i}>{f.name} ({(f.size / 1024).toFixed(1)} KB)</li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !!attachmentError}
                style={{
                  backgroundColor: isSubmitting || !!attachmentError ? "#A0AEC0" : "#006B3C",
                  color: "#FFFFFF",
                  padding: "0.75rem 1.5rem",
                  border: "none",
                  borderRadius: "4px",
                  fontWeight: "bold",
                  cursor: isSubmitting || !!attachmentError ? "not-allowed" : "pointer",
                }}
              >
                Submit Ticket
              </button>
            </form>
          </div>
        ) : (
          <div style={{ backgroundColor: "#FFFFFF", padding: "2rem", borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1A2E26" }}>My Tickets</h2>
                <p style={{ fontSize: "0.875rem", color: "#718096" }}>Showing tickets submitted by you</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem", backgroundColor: "#F7FAFC", padding: "1rem", borderRadius: "6px" }}>
              <input
                type="text"
                placeholder="🔍 Search summary..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ padding: "0.5rem", flex: 1, minWidth: "160px", borderRadius: "4px", border: "1px solid #CBD5E0" }}
              />
              <select value={filterCat} onChange={(e) => { setFilterCat(e.target.value ? Number(e.target.value) : ""); setPage(1); }} style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" }}>
                <option value="">All Categories</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }} style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" }}>
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" }}>
                <option value="">All Statuses</option>
                <option value="New">New</option>
                <option value="InProgress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {isLoadingTickets ? (
              <p style={{ textAlign: "center", padding: "2rem" }}>Loading tickets...</p>
            ) : tickets.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#718096" }}>
                <p style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>📭 No tickets found</p>
                <p style={{ fontSize: "0.875rem" }}>Try clearing filters or create a new ticket.</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #E2E8F0", color: "#4A5568" }}>
                    <th style={{ padding: "0.75rem" }}>Ticket No.</th>
                    <th style={{ padding: "0.75rem" }}>Summary</th>
                    <th style={{ padding: "0.75rem" }}>Category</th>
                    <th style={{ padding: "0.75rem" }}>Priority</th>
                    <th style={{ padding: "0.75rem" }}>Status</th>
                    <th style={{ padding: "0.75rem" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid #EDF2F7" }}>
                      <td style={{ padding: "0.75rem", fontWeight: "bold", color: "#006B3C" }}>{t.ticketNumber}</td>
                      <td style={{ padding: "0.75rem", color: "#2D3748" }}>{t.summary}</td>
                      <td style={{ padding: "0.75rem", color: "#4A5568" }}>{t.category?.name || "-"}</td>
                      <td style={{ padding: "0.75rem" }}>
                        <span style={{ padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600", ...getBadgeStyle(t.requestedPriority) }}>
                          {String(t.requestedPriority || "Medium").toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <span style={{ padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600", ...getBadgeStyle(t.currentStatus || t.status || "New") }}>
                          {t.currentStatus || t.status || "New"}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <button
                          onClick={() => openTicketDetail(t.id)}
                          style={{ color: "#006B3C", cursor: "pointer", background: "none", border: "none", textDecoration: "underline", fontWeight: "bold" }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem", borderTop: "1px solid #E2E8F0", paddingTop: "1rem", fontSize: "0.875rem" }}>
                <span style={{ color: "#718096" }}>Showing {tickets.length} of {totalTickets}</span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ padding: "0.25rem 0.75rem", borderRadius: "4px", border: "1px solid #CBD5E0", background: page <= 1 ? "#EDF2F7" : "#FFFFFF", cursor: page <= 1 ? "not-allowed" : "pointer" }}>
                    Prev
                  </button>
                  <span style={{ padding: "0.25rem 0.5rem", fontWeight: "bold" }}>{page} / {totalPages}</span>
                  <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={{ padding: "0.25rem 0.75rem", borderRadius: "4px", border: "1px solid #CBD5E0", background: page >= totalPages ? "#EDF2F7" : "#FFFFFF", cursor: page >= totalPages ? "not-allowed" : "pointer" }}>
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
