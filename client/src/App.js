import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { loginApi, getMeApi, changePasswordApi, setToken, removeToken, getToken, fetchCategories, fetchRelatedSystems, createTicket, uploadAttachments, fetchMyTickets, fetchTicketDetail, softRemoveAttachment, fetchStaffQueue, assignTicketApi, updateTicketStatusApi, fetchAdminUsers, createAdminUser, updateAdminUser, checkSystem, } from "./api";
export const App = () => {
    const [systemOnline, setSystemOnline] = useState(null);
    const [systemCategories, setSystemCategories] = useState([]);
    const [systemError, setSystemError] = useState(null);
    const activeReqId = typeof window !== "undefined" ? localStorage.getItem("active_requester_id") : null;
    const storedToken = typeof window !== "undefined" ? getToken() : null;
    const [currentUser, setCurrentUser] = useState(() => {
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
    const [authLoading, setAuthLoading] = useState(!activeReqId && !!storedToken);
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changePwError, setChangePwError] = useState(null);
    const [isChangingPw, setIsChangingPw] = useState(false);
    const [activeTab, setActiveTab] = useState("my-tickets");
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [categories, setCategories] = useState([]);
    const [relatedSystems, setRelatedSystems] = useState([]);
    const [summary, setSummary] = useState("");
    const [description, setDescription] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [relatedSystemId, setRelatedSystemId] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [files, setFiles] = useState([]);
    const [attachmentError, setAttachmentError] = useState(null);
    const [createErrors, setCreateErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createSuccessMsg, setCreateSuccessMsg] = useState(null);
    const [createErrorMsg, setCreateErrorMsg] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [search, setSearch] = useState("");
    const [filterCat, setFilterCat] = useState("");
    const [filterPriority, setFilterPriority] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTickets, setTotalTickets] = useState(0);
    const [isLoadingTickets, setIsLoadingTickets] = useState(false);
    const [staffTickets, setStaffTickets] = useState([]);
    const [staffSearch, setStaffSearch] = useState("");
    const [staffStatus, setStaffStatus] = useState("");
    const [staffPriority, setStaffPriority] = useState("");
    const [isLoadingStaff, setIsLoadingStaff] = useState(false);
    const [adminUsers, setAdminUsers] = useState([]);
    const [newAdminEmail, setNewAdminEmail] = useState("");
    const [newAdminFullName, setNewAdminFullName] = useState("");
    const [newAdminRole, setNewAdminRole] = useState("IT_STAFF");
    const [newAdminPassword, setNewAdminPassword] = useState("");
    const [adminUserMsg, setAdminUserMsg] = useState(null);
    const [detailTicket, setDetailTicket] = useState(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [detailError, setDetailError] = useState(null);
    const [softRemoveId, setSoftRemoveId] = useState(null);
    const [removalReason, setRemovalReason] = useState("");
    const [softRemoveError, setSoftRemoveError] = useState(null);
    const handleCheckSystem = async () => {
        try {
            const res = await checkSystem();
            setSystemOnline(res.ok);
            setSystemCategories(res.categories || []);
            setSystemError(null);
        }
        catch {
            setSystemOnline(false);
            setSystemError("TokTickIT API is currently unavailable");
        }
    };
    useEffect(() => {
        const activeReq = localStorage.getItem("active_requester_id");
        if (activeReq) {
            setAuthLoading(false);
        }
        else if (storedToken) {
            getMeApi()
                .then((user) => {
                setCurrentUser(user);
                if (user.role === "IT_STAFF")
                    setActiveTab("staff-queue");
                if (user.role === "ADMINISTRATOR")
                    setActiveTab("staff-queue");
            })
                .catch(() => {
                removeToken();
                setCurrentUser(null);
            })
                .finally(() => setAuthLoading(false));
        }
        fetchCategories().then(setCategories).catch(() => { });
        fetchRelatedSystems().then(setRelatedSystems).catch(() => { });
    }, [storedToken]);
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError(null);
        setIsLoggingIn(true);
        try {
            const res = await loginApi(loginEmail, loginPassword);
            setToken(res.token);
            setCurrentUser(res.user);
            if (res.user.role === "IT_STAFF")
                setActiveTab("staff-queue");
            else if (res.user.role === "ADMINISTRATOR")
                setActiveTab("staff-queue");
            else
                setActiveTab("my-tickets");
        }
        catch (err) {
            setLoginError(err.message || "Login failed");
        }
        finally {
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
    const handleForcedPasswordChange = async (e) => {
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
        }
        catch (err) {
            setChangePwError(err.message || "Failed to update password");
        }
        finally {
            setIsChangingPw(false);
        }
    };
    const loadTickets = useCallback(async () => {
        if (!currentUser || currentUser.mustChangePassword)
            return;
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
            const items = res.items || res.data || [];
            setTickets(items);
            setTotalPages(res.totalPages || res.pagination?.totalPages || 1);
            setTotalTickets(res.total || res.pagination?.totalItems || items.length);
        }
        catch {
            setTickets([]);
        }
        finally {
            setIsLoadingTickets(false);
        }
    }, [currentUser, search, filterCat, filterPriority, filterStatus, page]);
    const loadStaffQueue = useCallback(async () => {
        if (!currentUser || (currentUser.role !== "IT_STAFF" && currentUser.role !== "ADMINISTRATOR"))
            return;
        setIsLoadingStaff(true);
        try {
            const res = await fetchStaffQueue({
                search: staffSearch.trim() || undefined,
                status: staffStatus || undefined,
                priority: staffPriority || undefined,
            });
            setStaffTickets(res.items || []);
        }
        catch {
            setStaffTickets([]);
        }
        finally {
            setIsLoadingStaff(false);
        }
    }, [currentUser, staffSearch, staffStatus, staffPriority]);
    const loadAdminUsers = useCallback(async () => {
        if (!currentUser || currentUser.role !== "ADMINISTRATOR")
            return;
        try {
            const res = await fetchAdminUsers();
            setAdminUsers(res.users || []);
        }
        catch {
            setAdminUsers([]);
        }
    }, [currentUser]);
    useEffect(() => {
        if (activeTab === "my-tickets")
            loadTickets();
        if (activeTab === "staff-queue")
            loadStaffQueue();
        if (activeTab === "admin-users")
            loadAdminUsers();
    }, [activeTab, loadTickets, loadStaffQueue, loadAdminUsers]);
    const openTicketDetail = (ticketId) => {
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
            .catch(() => { });
    };
    const handleFileChange = (e) => {
        if (!e.target.files)
            return;
        const selectedFiles = Array.from(e.target.files);
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        const hasInvalid = selectedFiles.some((file) => !allowedMimeTypes.includes(file.type) &&
            !file.name.match(/\.(jpg|jpeg|png|webp|pdf)$/i));
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
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        if (attachmentError)
            return;
        const errs = {};
        if (!summary.trim())
            errs.summary = "Summary is required.";
        if (!description.trim())
            errs.description = "Description is required.";
        if (!categoryId)
            errs.categoryId = "Category is required.";
        if (!relatedSystemId)
            errs.relatedSystemId = "Related System is required.";
        setCreateErrors(errs);
        if (Object.keys(errs).length > 0 || !currentUser)
            return;
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
                }
                catch { }
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
        }
        catch (err) {
            setCreateErrorMsg(err?.message || "Failed to submit ticket");
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleConfirmSoftRemove = async () => {
        if (!removalReason.trim()) {
            setSoftRemoveError("Removal reason is required.");
            return;
        }
        if (!currentUser || !softRemoveId || !selectedTicketId)
            return;
        const reqId = Number(currentUser.id) || 1;
        try {
            await softRemoveAttachment(reqId, softRemoveId, removalReason.trim());
            setSoftRemoveId(null);
            setRemovalReason("");
            setSoftRemoveError(null);
            openTicketDetail(selectedTicketId);
        }
        catch (err) {
            setSoftRemoveError(err.message || "Failed to remove attachment");
        }
    };
    const handleClaimTicket = async (ticketId) => {
        try {
            await assignTicketApi(ticketId);
            loadStaffQueue();
        }
        catch (err) {
            alert(err.message || "Failed to claim ticket");
        }
    };
    const handleUpdateStatus = async (ticketId, status) => {
        try {
            await updateTicketStatusApi(ticketId, status);
            loadStaffQueue();
        }
        catch (err) {
            alert(err.message || "Failed to update ticket status");
        }
    };
    const handleCreateAdminUser = async (e) => {
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
        }
        catch (err) {
            setAdminUserMsg(err.message || "Failed to create user");
        }
    };
    const handleToggleActive = async (userId, currentActive) => {
        try {
            await updateAdminUser(userId, { isActive: !currentActive });
            loadAdminUsers();
        }
        catch (err) {
            alert(err.message || "Failed to update user active status");
        }
    };
    const getBadgeStyle = (val) => {
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
        return (_jsx("div", { style: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }, children: _jsx("p", { children: "Loading TokTickIT..." }) }));
    }
    if (!currentUser) {
        return (_jsx("div", { style: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#F5F7F6", padding: "1rem" }, children: _jsxs("div", { style: { maxWidth: "420px", width: "100%", backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "2rem", boxShadow: "0 4px 6px rgba(0,0,0,0.04)" }, children: [_jsxs("div", { style: { textAlign: "center", marginBottom: "1.5rem" }, children: [_jsx("span", { style: { fontSize: "2rem" }, children: "\u23F1\uFE0F" }), _jsx("h1", { style: { fontSize: "1.5rem", fontWeight: "bold", color: "#1A2E26", marginTop: "0.5rem" }, children: "TokTickIT" }), _jsx("p", { style: { color: "#718096", fontSize: "0.875rem" }, children: "Enter credentials to access your portal" })] }), _jsxs("div", { style: { marginBottom: "1.5rem", padding: "0.75rem", backgroundColor: "#F7FAFC", borderRadius: "6px", textAlign: "center", border: "1px solid #EDF2F7" }, children: [_jsx("button", { onClick: handleCheckSystem, style: { backgroundColor: "#2B6CB0", color: "#FFFFFF", border: "none", borderRadius: "4px", padding: "0.35rem 0.75rem", fontSize: "0.8rem", cursor: "pointer", marginBottom: "0.5rem" }, children: "Check System" }), systemOnline === true && (_jsxs("div", { children: [_jsx("p", { style: { color: "#22543D", fontWeight: "bold", fontSize: "0.875rem" }, children: "Status: Online" }), _jsx("ul", { style: { listStyleType: "none", padding: 0, margin: "0.25rem 0", fontSize: "0.75rem", color: "#4A5568" }, children: systemCategories.map((c) => (_jsx("li", { children: c.name }, c.id))) })] })), systemOnline === false && (_jsxs("p", { style: { color: "#C53030", fontSize: "0.875rem", fontWeight: "bold" }, children: ["Offline: ", systemError || "TokTickIT API is currently unavailable"] }))] }), loginError && (_jsx("div", { style: { backgroundColor: "#FFF5F5", color: "#C53030", border: "1px solid #FEB2B2", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.875rem" }, children: loginError })), _jsxs("form", { onSubmit: handleLogin, children: [_jsxs("div", { style: { marginBottom: "1rem" }, children: [_jsx("label", { style: { display: "block", fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.25rem", color: "#4A5568" }, children: "Email Address" }), _jsx("input", { type: "email", required: true, value: loginEmail, onChange: (e) => setLoginEmail(e.target.value), placeholder: "user@toktickit.local", style: { width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" } })] }), _jsxs("div", { style: { marginBottom: "1.5rem" }, children: [_jsx("label", { style: { display: "block", fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.25rem", color: "#4A5568" }, children: "Password" }), _jsx("input", { type: "password", required: true, value: loginPassword, onChange: (e) => setLoginPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", style: { width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" } })] }), _jsx("button", { type: "submit", disabled: isLoggingIn, style: {
                                    width: "100%",
                                    backgroundColor: isLoggingIn ? "#A0AEC0" : "#006B3C",
                                    color: "#FFFFFF",
                                    padding: "0.75rem",
                                    border: "none",
                                    borderRadius: "4px",
                                    fontWeight: "bold",
                                    cursor: isLoggingIn ? "not-allowed" : "pointer",
                                }, children: isLoggingIn ? "Signing in..." : "Sign In" })] })] }) }));
    }
    if (currentUser.mustChangePassword) {
        return (_jsx("div", { style: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F5F7F6", padding: "1rem" }, children: _jsxs("div", { style: { maxWidth: "450px", width: "100%", backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "2rem", boxShadow: "0 4px 6px rgba(0,0,0,0.04)" }, children: [_jsxs("div", { style: { textAlign: "center", marginBottom: "1.5rem" }, children: [_jsx("span", { style: { fontSize: "2rem" }, children: "\uD83D\uDD12" }), _jsx("h2", { style: { fontSize: "1.5rem", fontWeight: "bold", color: "#1A2E26", marginTop: "0.5rem" }, children: "Password Change Required" }), _jsx("p", { style: { color: "#718096", fontSize: "0.875rem" }, children: "Your account requires a new password before you can proceed." })] }), changePwError && (_jsx("div", { style: { backgroundColor: "#FFF5F5", color: "#C53030", border: "1px solid #FEB2B2", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.875rem" }, children: changePwError })), _jsxs("form", { onSubmit: handleForcedPasswordChange, children: [_jsxs("div", { style: { marginBottom: "1rem" }, children: [_jsx("label", { style: { display: "block", fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.25rem", color: "#4A5568" }, children: "New Password" }), _jsx("input", { type: "password", required: true, value: newPassword, onChange: (e) => setNewPassword(e.target.value), placeholder: "At least 6 characters", style: { width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" } })] }), _jsxs("div", { style: { marginBottom: "1.5rem" }, children: [_jsx("label", { style: { display: "block", fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.25rem", color: "#4A5568" }, children: "Confirm New Password" }), _jsx("input", { type: "password", required: true, value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), placeholder: "Re-enter password", style: { width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" } })] }), _jsx("button", { type: "submit", disabled: isChangingPw, style: {
                                    width: "100%",
                                    backgroundColor: isChangingPw ? "#A0AEC0" : "#006B3C",
                                    color: "#FFFFFF",
                                    padding: "0.75rem",
                                    border: "none",
                                    borderRadius: "4px",
                                    fontWeight: "bold",
                                    cursor: isChangingPw ? "not-allowed" : "pointer",
                                }, children: isChangingPw ? "Updating Password..." : "Update Password & Continue" })] })] }) }));
    }
    const isStaffOrAdmin = currentUser.role === "IT_STAFF" || currentUser.role === "ADMINISTRATOR";
    const isAdmin = currentUser.role === "ADMINISTRATOR";
    return (_jsxs("div", { style: { minHeight: "100vh", backgroundColor: "#F5F7F6", display: "flex", flexDirection: "column" }, children: [_jsxs("header", { style: { backgroundColor: "#006B3C", color: "#FFFFFF", padding: "0.75rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "2rem" }, children: [_jsx("span", { style: { fontWeight: "bold", fontSize: "1.25rem" }, children: "\u23F1\uFE0F TokTickIT" }), _jsxs("nav", { style: { display: "flex", gap: "0.5rem" }, children: [_jsx("button", { onClick: () => { setActiveTab("my-tickets"); setSelectedTicketId(null); }, style: { background: activeTab === "my-tickets" && !selectedTicketId ? "#0B7A46" : "transparent", border: "none", color: "#FFFFFF", padding: "0.5rem 0.875rem", borderRadius: "4px", cursor: "pointer", fontWeight: activeTab === "my-tickets" ? "bold" : "normal" }, children: "\uD83D\uDCCB My Tickets" }), _jsx("button", { onClick: () => { setActiveTab("create-ticket"); setSelectedTicketId(null); }, style: { background: activeTab === "create-ticket" && !selectedTicketId ? "#0B7A46" : "transparent", border: "none", color: "#FFFFFF", padding: "0.5rem 0.875rem", borderRadius: "4px", cursor: "pointer", fontWeight: activeTab === "create-ticket" ? "bold" : "normal" }, children: "\u2795 + New Ticket" }), isStaffOrAdmin && (_jsx("button", { onClick: () => { setActiveTab("staff-queue"); setSelectedTicketId(null); }, style: { background: activeTab === "staff-queue" && !selectedTicketId ? "#0B7A46" : "transparent", border: "none", color: "#FFFFFF", padding: "0.5rem 0.875rem", borderRadius: "4px", cursor: "pointer", fontWeight: activeTab === "staff-queue" ? "bold" : "normal" }, children: "\uD83D\uDEE0\uFE0F Staff Queue" })), isAdmin && (_jsx("button", { onClick: () => { setActiveTab("admin-users"); setSelectedTicketId(null); }, style: { background: activeTab === "admin-users" && !selectedTicketId ? "#0B7A46" : "transparent", border: "none", color: "#FFFFFF", padding: "0.5rem 0.875rem", borderRadius: "4px", cursor: "pointer", fontWeight: activeTab === "admin-users" ? "bold" : "normal" }, children: "\u2699\uFE0F User Management" }))] })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.875rem" }, children: [_jsxs("span", { children: ["\uD83D\uDC64 ", _jsx("strong", { children: currentUser.fullName }), " (", currentUser.role, ")"] }), _jsx("button", { onClick: handleLogout, style: { backgroundColor: "#0B7A46", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.4)", borderRadius: "4px", padding: "0.25rem 0.75rem", cursor: "pointer" }, children: "Log Out" })] })] }), _jsx("main", { style: { flex: 1, padding: "2rem", maxWidth: "1100px", margin: "0 auto", width: "100%" }, children: selectedTicketId && detailTicket ? (_jsxs("div", { style: { backgroundColor: "#FFFFFF", padding: "2rem", borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }, children: [_jsx("button", { onClick: () => setSelectedTicketId(null), style: { marginBottom: "1.5rem", background: "none", border: "none", color: "#006B3C", cursor: "pointer", fontWeight: "bold" }, children: "\u2190 Back to My Tickets" }), _jsxs("div", { children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", borderBottom: "1px solid #E2E8F0", paddingBottom: "1rem", marginBottom: "1.5rem" }, children: [_jsxs("div", { children: [_jsx("span", { style: { fontSize: "0.75rem", color: "#718096" }, children: "Ticket Number" }), _jsx("h2", { style: { fontSize: "1.5rem", fontWeight: "bold", color: "#006B3C" }, children: detailTicket.ticketNumber })] }), _jsx("span", { style: { padding: "0.25rem 0.75rem", borderRadius: "12px", fontWeight: "bold", alignSelf: "center", ...getBadgeStyle(detailTicket.currentStatus || detailTicket.status || "New") }, children: detailTicket.currentStatus || detailTicket.status || "New" })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }, children: [_jsxs("div", { style: { backgroundColor: "#F7FAFC", padding: "0.75rem", borderRadius: "6px" }, children: [_jsx("span", { style: { fontSize: "0.75rem", color: "#718096" }, children: "Category" }), _jsx("p", { style: { fontWeight: "600", color: "#2D3748" }, children: detailTicket.category?.name || "-" })] }), _jsxs("div", { style: { backgroundColor: "#F7FAFC", padding: "0.75rem", borderRadius: "6px" }, children: [_jsx("span", { style: { fontSize: "0.75rem", color: "#718096" }, children: "Priority" }), _jsx("p", { style: { fontWeight: "600", color: "#2D3748" }, children: detailTicket.itPriority || detailTicket.requestedPriority || "-" })] }), _jsxs("div", { style: { backgroundColor: "#F7FAFC", padding: "0.75rem", borderRadius: "6px" }, children: [_jsx("span", { style: { fontSize: "0.75rem", color: "#718096" }, children: "Created Date" }), _jsx("p", { style: { fontWeight: "600", color: "#2D3748" }, children: detailTicket.createdAt ? new Date(detailTicket.createdAt).toLocaleString() : "-" })] })] }), _jsxs("div", { style: { marginBottom: "1rem" }, children: [_jsx("strong", { style: { color: "#4A5568" }, children: "Summary:" }), _jsx("p", { style: { marginTop: "0.25rem", color: "#2D3748", fontSize: "1.1rem", fontWeight: "600" }, children: detailTicket.summary })] }), _jsxs("div", { style: { marginBottom: "1.5rem" }, children: [_jsx("strong", { style: { color: "#4A5568" }, children: "Description:" }), _jsx("p", { style: { marginTop: "0.25rem", color: "#2D3748", backgroundColor: "#F7FAFC", padding: "1rem", borderRadius: "6px", whiteSpace: "pre-wrap" }, children: detailTicket.description || "Full explanation of the outage" })] }), _jsxs("div", { style: { borderTop: "1px solid #E2E8F0", paddingTop: "1.5rem" }, children: [_jsxs("h3", { style: { fontSize: "1.125rem", fontWeight: "bold", marginBottom: "0.75rem", color: "#1A2E26" }, children: ["Attachments (", detailTicket.attachments?.length || 0, ")"] }), (!detailTicket.attachments || detailTicket.attachments.length === 0) ? (_jsx("p", { style: { color: "#718096", fontSize: "0.875rem" }, children: "No attachments associated with this ticket." })) : (detailTicket.attachments.map((att) => (_jsxs("div", { style: {
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                padding: "0.75rem",
                                                border: "1px solid #E2E8F0",
                                                borderRadius: "6px",
                                                marginBottom: "0.5rem",
                                                backgroundColor: att.isRemoved ? "#FFF5F5" : "#FFFFFF",
                                            }, children: [_jsxs("div", { children: [_jsxs("span", { style: { fontWeight: "600", color: att.isRemoved ? "#A0AEC0" : "#2D3748" }, children: ["\uD83D\uDCCE ", att.fileName] }), _jsxs("span", { style: { fontSize: "0.75rem", color: "#718096", marginLeft: "0.5rem" }, children: ["(", (att.fileSize / 1024).toFixed(1), " KB)"] }), att.isRemoved && (_jsx("div", { style: { color: "#E53E3E", fontSize: "0.75rem", marginTop: "0.25rem" }, children: _jsxs("em", { children: ["Removed: ", att.removalReason] }) }))] }), _jsx("div", { children: !att.isRemoved ? (_jsx("button", { onClick: () => { setSoftRemoveId(att.id); setSoftRemoveError(null); }, style: { color: "#E53E3E", background: "#FFF5F5", border: "1px solid #FEB2B2", borderRadius: "4px", padding: "0.25rem 0.5rem", fontSize: "0.75rem", cursor: "pointer" }, children: "Remove" })) : (_jsx("span", { style: { color: "#A0AEC0", fontSize: "0.75rem", fontStyle: "italic" }, children: "Download Unavailable" })) })] }, att.id))))] }), softRemoveId && (_jsxs("div", { style: { marginTop: "1.5rem", padding: "1.25rem", backgroundColor: "#FFF5F5", border: "1px solid #FEB2B2", borderRadius: "6px" }, children: [_jsx("h4", { style: { fontWeight: "bold", color: "#C53030", marginBottom: "0.5rem" }, children: "Soft-Remove Attachment" }), _jsx("p", { style: { fontSize: "0.875rem", color: "#4A5568", marginBottom: "0.5rem" }, children: "Please enter the reason for removing this file:" }), _jsx("input", { type: "text", placeholder: "e.g. Uploaded wrong screenshot...", value: removalReason, onChange: (e) => setRemovalReason(e.target.value), style: { width: "100%", padding: "0.5rem", border: "1px solid #CBD5E0", borderRadius: "4px", marginBottom: "0.5rem" } }), softRemoveError && _jsx("p", { style: { color: "#E53E3E", fontSize: "0.75rem", marginBottom: "0.5rem" }, children: softRemoveError }), _jsx("button", { onClick: handleConfirmSoftRemove, style: { background: "#C53030", color: "#FFFFFF", padding: "0.5rem 1rem", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginRight: "0.5rem" }, children: "Confirm Removal" }), _jsx("button", { onClick: () => { setSoftRemoveId(null); setRemovalReason(""); setSoftRemoveError(null); }, style: { background: "#E2E8F0", padding: "0.5rem 1rem", border: "none", borderRadius: "4px", cursor: "pointer" }, children: "Cancel" })] }))] })] })) : activeTab === "staff-queue" ? (_jsxs("div", { style: { backgroundColor: "#FFFFFF", padding: "2rem", borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }, children: [_jsx("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }, children: _jsxs("div", { children: [_jsx("h2", { style: { fontSize: "1.5rem", fontWeight: "bold", color: "#1A2E26" }, children: "IT Staff Ticket Queue" }), _jsx("p", { style: { fontSize: "0.875rem", color: "#718096" }, children: "Manage ticket lifecycle, claiming, and resolutions" })] }) }), _jsxs("div", { style: { display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem", backgroundColor: "#F7FAFC", padding: "1rem", borderRadius: "6px" }, children: [_jsx("input", { type: "text", placeholder: "\uD83D\uDD0D Search tickets...", value: staffSearch, onChange: (e) => setStaffSearch(e.target.value), style: { padding: "0.5rem", flex: 1, minWidth: "160px", borderRadius: "4px", border: "1px solid #CBD5E0" } }), _jsxs("select", { value: staffStatus, onChange: (e) => setStaffStatus(e.target.value), style: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" }, children: [_jsx("option", { value: "", children: "All Statuses" }), _jsx("option", { value: "New", children: "New" }), _jsx("option", { value: "InProgress", children: "In Progress" }), _jsx("option", { value: "Resolved", children: "Resolved" }), _jsx("option", { value: "Closed", children: "Closed" })] }), _jsxs("select", { value: staffPriority, onChange: (e) => setStaffPriority(e.target.value), style: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" }, children: [_jsx("option", { value: "", children: "All Priorities" }), _jsx("option", { value: "Low", children: "Low" }), _jsx("option", { value: "Medium", children: "Medium" }), _jsx("option", { value: "High", children: "High" }), _jsx("option", { value: "Critical", children: "Critical" })] })] }), isLoadingStaff ? (_jsx("p", { style: { textAlign: "center", padding: "2rem" }, children: "Loading staff queue..." })) : staffTickets.length === 0 ? (_jsx("p", { style: { textAlign: "center", padding: "3rem", color: "#718096" }, children: "No tickets currently in the staff queue." })) : (_jsxs("table", { style: { width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }, children: [_jsx("thead", { children: _jsxs("tr", { style: { borderBottom: "2px solid #E2E8F0", color: "#4A5568" }, children: [_jsx("th", { style: { padding: "0.75rem" }, children: "Ticket No." }), _jsx("th", { style: { padding: "0.75rem" }, children: "Summary" }), _jsx("th", { style: { padding: "0.75rem" }, children: "Priority" }), _jsx("th", { style: { padding: "0.75rem" }, children: "Assigned To" }), _jsx("th", { style: { padding: "0.75rem" }, children: "Status" }), _jsx("th", { style: { padding: "0.75rem" }, children: "Actions" })] }) }), _jsx("tbody", { children: staffTickets.map((t) => (_jsxs("tr", { style: { borderBottom: "1px solid #EDF2F7" }, children: [_jsx("td", { style: { padding: "0.75rem", fontWeight: "bold", color: "#006B3C" }, children: t.ticketNumber }), _jsx("td", { style: { padding: "0.75rem", color: "#2D3748" }, children: t.summary }), _jsx("td", { style: { padding: "0.75rem" }, children: _jsx("span", { style: { padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600", ...getBadgeStyle(t.itPriority || t.requestedPriority) }, children: t.itPriority || t.requestedPriority || "-" }) }), _jsx("td", { style: { padding: "0.75rem", color: "#4A5568" }, children: t.assignedStaff?.fullName || "Unassigned" }), _jsx("td", { style: { padding: "0.75rem" }, children: _jsx("span", { style: { padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600", ...getBadgeStyle(t.currentStatus) }, children: t.currentStatus }) }), _jsxs("td", { style: { padding: "0.75rem", display: "flex", gap: "0.5rem" }, children: [!t.assignedStaffId && (_jsx("button", { onClick: () => handleClaimTicket(t.id), style: { backgroundColor: "#006B3C", color: "#FFFFFF", border: "none", borderRadius: "4px", padding: "0.25rem 0.5rem", fontSize: "0.75rem", cursor: "pointer" }, children: "Claim" })), t.currentStatus === "InProgress" && (_jsx("button", { onClick: () => handleUpdateStatus(t.id, "Resolved"), style: { backgroundColor: "#2B6CB0", color: "#FFFFFF", border: "none", borderRadius: "4px", padding: "0.25rem 0.5rem", fontSize: "0.75rem", cursor: "pointer" }, children: "Resolve" })), t.currentStatus === "Resolved" && (_jsx("button", { onClick: () => handleUpdateStatus(t.id, "Closed"), style: { backgroundColor: "#4A5568", color: "#FFFFFF", border: "none", borderRadius: "4px", padding: "0.25rem 0.5rem", fontSize: "0.75rem", cursor: "pointer" }, children: "Close" })), _jsx("button", { onClick: () => openTicketDetail(t.id), style: { color: "#006B3C", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontSize: "0.75rem" }, children: "View" })] })] }, t.id))) })] }))] })) : activeTab === "admin-users" ? (_jsxs("div", { style: { backgroundColor: "#FFFFFF", padding: "2rem", borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }, children: [_jsx("h2", { style: { fontSize: "1.5rem", fontWeight: "bold", color: "#1A2E26", marginBottom: "0.5rem" }, children: "User Management" }), _jsx("p", { style: { fontSize: "0.875rem", color: "#718096", marginBottom: "1.5rem" }, children: "Create users, assign roles, and manage account statuses" }), _jsxs("form", { onSubmit: handleCreateAdminUser, style: { backgroundColor: "#F7FAFC", padding: "1rem", borderRadius: "6px", marginBottom: "1.5rem" }, children: [_jsx("h3", { style: { fontSize: "1rem", fontWeight: "bold", marginBottom: "0.75rem", color: "#2D3748" }, children: "Onboard New User" }), adminUserMsg && (_jsx("div", { style: { padding: "0.5rem", borderRadius: "4px", marginBottom: "0.75rem", fontSize: "0.875rem", backgroundColor: "#EAF6EF", color: "#22543D" }, children: adminUserMsg })), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "0.75rem" }, children: [_jsx("input", { type: "email", placeholder: "Email address", required: true, value: newAdminEmail, onChange: (e) => setNewAdminEmail(e.target.value), style: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" } }), _jsx("input", { type: "text", placeholder: "Full name", required: true, value: newAdminFullName, onChange: (e) => setNewAdminFullName(e.target.value), style: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" } }), _jsxs("select", { value: newAdminRole, onChange: (e) => setNewAdminRole(e.target.value), style: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" }, children: [_jsx("option", { value: "REQUESTER", children: "Requester" }), _jsx("option", { value: "IT_STAFF", children: "IT Staff" }), _jsx("option", { value: "ADMINISTRATOR", children: "Administrator" })] }), _jsx("input", { type: "password", placeholder: "Temp password", required: true, value: newAdminPassword, onChange: (e) => setNewAdminPassword(e.target.value), style: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" } })] }), _jsx("button", { type: "submit", style: { backgroundColor: "#006B3C", color: "#FFFFFF", padding: "0.5rem 1rem", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }, children: "Create User" })] }), _jsxs("table", { style: { width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }, children: [_jsx("thead", { children: _jsxs("tr", { style: { borderBottom: "2px solid #E2E8F0", color: "#4A5568" }, children: [_jsx("th", { style: { padding: "0.75rem" }, children: "Name" }), _jsx("th", { style: { padding: "0.75rem" }, children: "Email" }), _jsx("th", { style: { padding: "0.75rem" }, children: "Role" }), _jsx("th", { style: { padding: "0.75rem" }, children: "Status" }), _jsx("th", { style: { padding: "0.75rem" }, children: "Actions" })] }) }), _jsx("tbody", { children: adminUsers.map((u) => (_jsxs("tr", { style: { borderBottom: "1px solid #EDF2F7" }, children: [_jsx("td", { style: { padding: "0.75rem", fontWeight: "600" }, children: u.fullName }), _jsx("td", { style: { padding: "0.75rem", color: "#4A5568" }, children: u.email }), _jsx("td", { style: { padding: "0.75rem" }, children: u.role }), _jsx("td", { style: { padding: "0.75rem" }, children: _jsx("span", { style: { padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold", backgroundColor: u.isActive ? "#C6F6D5" : "#FED7D7", color: u.isActive ? "#22543D" : "#9B2C2C" }, children: u.isActive ? "Active" : "Inactive" }) }), _jsx("td", { style: { padding: "0.75rem" }, children: _jsx("button", { onClick: () => handleToggleActive(u.id, u.isActive), style: { background: "none", border: "none", color: "#006B3C", cursor: "pointer", textDecoration: "underline", fontSize: "0.75rem" }, children: u.isActive ? "Deactivate" : "Activate" }) })] }, u.id))) })] })] })) : activeTab === "create-ticket" ? (_jsxs("div", { style: { backgroundColor: "#FFFFFF", padding: "2rem", borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }, children: [_jsx("h2", { style: { fontSize: "1.5rem", fontWeight: "bold", color: "#1A2E26", marginBottom: "1.5rem" }, children: "Create IT Support Ticket" }), createErrorMsg && _jsx("div", { style: { color: "#C53030", backgroundColor: "#FFF5F5", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem", border: "1px solid #FEB2B2" }, children: createErrorMsg }), createSuccessMsg && _jsx("div", { style: { color: "#22543D", backgroundColor: "#EAF6EF", padding: "1rem", borderRadius: "6px", marginBottom: "1rem", border: "1px solid #9AE6B4" }, children: createSuccessMsg }), _jsxs("form", { onSubmit: handleCreateSubmit, children: [_jsxs("div", { style: { marginBottom: "1rem" }, children: [_jsx("label", { style: { display: "block", fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.25rem" }, children: "Requester" }), _jsx("input", { type: "text", disabled: true, readOnly: true, value: currentUser.fullName, style: { width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0", backgroundColor: "#EDF2F7", color: "#4A5568" } })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: "block", fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.25rem" }, children: "Category *" }), _jsxs("select", { value: categoryId, onChange: (e) => setCategoryId(e.target.value ? Number(e.target.value) : ""), style: { width: "100%", padding: "0.5rem", borderRadius: "4px", border: createErrors.categoryId ? "1px solid #E53E3E" : "1px solid #CBD5E0" }, children: [_jsx("option", { value: "", children: "-- Select Category --" }), categories.map((c) => _jsx("option", { value: c.id, children: c.name }, c.id))] }), createErrors.categoryId && _jsx("span", { style: { color: "#E53E3E", fontSize: "0.75rem" }, children: createErrors.categoryId })] }), _jsxs("div", { children: [_jsx("label", { style: { display: "block", fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.25rem" }, children: "Related System *" }), _jsxs("select", { value: relatedSystemId, onChange: (e) => setRelatedSystemId(e.target.value ? Number(e.target.value) : ""), style: { width: "100%", padding: "0.5rem", borderRadius: "4px", border: createErrors.relatedSystemId ? "1px solid #E53E3E" : "1px solid #CBD5E0" }, children: [_jsx("option", { value: "", children: "-- Select System --" }), relatedSystems.map((s) => _jsx("option", { value: s.id, children: s.name }, s.id))] }), createErrors.relatedSystemId && _jsx("span", { style: { color: "#E53E3E", fontSize: "0.75rem" }, children: createErrors.relatedSystemId })] }), _jsxs("div", { children: [_jsx("label", { style: { display: "block", fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.25rem" }, children: "Priority" }), _jsxs("select", { value: priority, onChange: (e) => setPriority(e.target.value), style: { width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" }, children: [_jsx("option", { value: "Low", children: "Low" }), _jsx("option", { value: "Medium", children: "Medium" }), _jsx("option", { value: "High", children: "High" }), _jsx("option", { value: "Critical", children: "Critical" })] })] })] }), _jsxs("div", { style: { marginBottom: "1rem" }, children: [_jsx("label", { style: { display: "block", fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.25rem" }, children: "Summary *" }), _jsx("input", { type: "text", placeholder: "Brief summary of issue", value: summary, onChange: (e) => setSummary(e.target.value), style: { width: "100%", padding: "0.5rem", borderRadius: "4px", border: createErrors.summary ? "1px solid #E53E3E" : "1px solid #CBD5E0" } }), createErrors.summary && _jsx("span", { style: { color: "#E53E3E", fontSize: "0.75rem" }, children: createErrors.summary })] }), _jsxs("div", { style: { marginBottom: "1rem" }, children: [_jsx("label", { style: { display: "block", fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.25rem" }, children: "Description *" }), _jsx("textarea", { rows: 4, placeholder: "Detailed explanation...", value: description, onChange: (e) => setDescription(e.target.value), style: { width: "100%", padding: "0.5rem", borderRadius: "4px", border: createErrors.description ? "1px solid #E53E3E" : "1px solid #CBD5E0" } }), createErrors.description && _jsx("span", { style: { color: "#E53E3E", fontSize: "0.75rem" }, children: createErrors.description })] }), _jsxs("div", { style: { marginBottom: "1.5rem" }, children: [_jsx("label", { style: { display: "block", fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.25rem" }, children: "Attachments (Max 5, \u2264 5MB, JPG/PNG/WEBP/PDF)" }), _jsx("input", { type: "file", multiple: true, onChange: handleFileChange, style: { display: "block", marginTop: "0.5rem" } }), attachmentError && (_jsx("p", { style: { color: "#E53E3E", fontSize: "0.875rem", marginTop: "0.5rem", fontWeight: "600" }, children: attachmentError })), files.length > 0 && !attachmentError && (_jsx("ul", { style: { marginTop: "0.5rem", fontSize: "0.85rem", color: "#4A5568", paddingLeft: "1.25rem" }, children: files.map((f, i) => (_jsxs("li", { children: [f.name, " (", (f.size / 1024).toFixed(1), " KB)"] }, i))) }))] }), _jsx("button", { type: "submit", disabled: isSubmitting || !!attachmentError, style: {
                                        backgroundColor: isSubmitting || !!attachmentError ? "#A0AEC0" : "#006B3C",
                                        color: "#FFFFFF",
                                        padding: "0.75rem 1.5rem",
                                        border: "none",
                                        borderRadius: "4px",
                                        fontWeight: "bold",
                                        cursor: isSubmitting || !!attachmentError ? "not-allowed" : "pointer",
                                    }, children: "Submit Ticket" })] })] })) : (_jsxs("div", { style: { backgroundColor: "#FFFFFF", padding: "2rem", borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }, children: [_jsx("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }, children: _jsxs("div", { children: [_jsx("h2", { style: { fontSize: "1.5rem", fontWeight: "bold", color: "#1A2E26" }, children: "My Tickets" }), _jsx("p", { style: { fontSize: "0.875rem", color: "#718096" }, children: "Showing tickets submitted by you" })] }) }), _jsxs("div", { style: { display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem", backgroundColor: "#F7FAFC", padding: "1rem", borderRadius: "6px" }, children: [_jsx("input", { type: "text", placeholder: "\uD83D\uDD0D Search summary...", value: search, onChange: (e) => { setSearch(e.target.value); setPage(1); }, style: { padding: "0.5rem", flex: 1, minWidth: "160px", borderRadius: "4px", border: "1px solid #CBD5E0" } }), _jsxs("select", { value: filterCat, onChange: (e) => { setFilterCat(e.target.value ? Number(e.target.value) : ""); setPage(1); }, style: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" }, children: [_jsx("option", { value: "", children: "All Categories" }), categories.map((c) => _jsx("option", { value: c.id, children: c.name }, c.id))] }), _jsxs("select", { value: filterPriority, onChange: (e) => { setFilterPriority(e.target.value); setPage(1); }, style: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" }, children: [_jsx("option", { value: "", children: "All Priorities" }), _jsx("option", { value: "Low", children: "Low" }), _jsx("option", { value: "Medium", children: "Medium" }), _jsx("option", { value: "High", children: "High" }), _jsx("option", { value: "Critical", children: "Critical" })] }), _jsxs("select", { value: filterStatus, onChange: (e) => { setFilterStatus(e.target.value); setPage(1); }, style: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #CBD5E0" }, children: [_jsx("option", { value: "", children: "All Statuses" }), _jsx("option", { value: "New", children: "New" }), _jsx("option", { value: "InProgress", children: "In Progress" }), _jsx("option", { value: "Resolved", children: "Resolved" }), _jsx("option", { value: "Closed", children: "Closed" })] })] }), isLoadingTickets ? (_jsx("p", { style: { textAlign: "center", padding: "2rem" }, children: "Loading tickets..." })) : tickets.length === 0 ? (_jsxs("div", { style: { textAlign: "center", padding: "3rem 1rem", color: "#718096" }, children: [_jsx("p", { style: { fontSize: "1.25rem", marginBottom: "0.5rem" }, children: "\uD83D\uDCED No tickets found" }), _jsx("p", { style: { fontSize: "0.875rem" }, children: "Try clearing filters or create a new ticket." })] })) : (_jsxs("table", { style: { width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }, children: [_jsx("thead", { children: _jsxs("tr", { style: { borderBottom: "2px solid #E2E8F0", color: "#4A5568" }, children: [_jsx("th", { style: { padding: "0.75rem" }, children: "Ticket No." }), _jsx("th", { style: { padding: "0.75rem" }, children: "Summary" }), _jsx("th", { style: { padding: "0.75rem" }, children: "Category" }), _jsx("th", { style: { padding: "0.75rem" }, children: "Priority" }), _jsx("th", { style: { padding: "0.75rem" }, children: "Status" }), _jsx("th", { style: { padding: "0.75rem" }, children: "Action" })] }) }), _jsx("tbody", { children: tickets.map((t) => (_jsxs("tr", { style: { borderBottom: "1px solid #EDF2F7" }, children: [_jsx("td", { style: { padding: "0.75rem", fontWeight: "bold", color: "#006B3C" }, children: t.ticketNumber }), _jsx("td", { style: { padding: "0.75rem", color: "#2D3748" }, children: t.summary }), _jsx("td", { style: { padding: "0.75rem", color: "#4A5568" }, children: t.category?.name || "-" }), _jsx("td", { style: { padding: "0.75rem" }, children: _jsx("span", { style: { padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600", ...getBadgeStyle(t.requestedPriority) }, children: String(t.requestedPriority || "Medium").toUpperCase() }) }), _jsx("td", { style: { padding: "0.75rem" }, children: _jsx("span", { style: { padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600", ...getBadgeStyle(t.currentStatus || t.status || "New") }, children: t.currentStatus || t.status || "New" }) }), _jsx("td", { style: { padding: "0.75rem" }, children: _jsx("button", { onClick: () => openTicketDetail(t.id), style: { color: "#006B3C", cursor: "pointer", background: "none", border: "none", textDecoration: "underline", fontWeight: "bold" }, children: "View" }) })] }, t.id))) })] })), totalPages > 1 && (_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem", borderTop: "1px solid #E2E8F0", paddingTop: "1rem", fontSize: "0.875rem" }, children: [_jsxs("span", { style: { color: "#718096" }, children: ["Showing ", tickets.length, " of ", totalTickets] }), _jsxs("div", { style: { display: "flex", gap: "0.5rem" }, children: [_jsx("button", { disabled: page <= 1, onClick: () => setPage((p) => p - 1), style: { padding: "0.25rem 0.75rem", borderRadius: "4px", border: "1px solid #CBD5E0", background: page <= 1 ? "#EDF2F7" : "#FFFFFF", cursor: page <= 1 ? "not-allowed" : "pointer" }, children: "Prev" }), _jsxs("span", { style: { padding: "0.25rem 0.5rem", fontWeight: "bold" }, children: [page, " / ", totalPages] }), _jsx("button", { disabled: page >= totalPages, onClick: () => setPage((p) => p + 1), style: { padding: "0.25rem 0.75rem", borderRadius: "4px", border: "1px solid #CBD5E0", background: page >= totalPages ? "#EDF2F7" : "#FFFFFF", cursor: page >= totalPages ? "not-allowed" : "pointer" }, children: "Next" })] })] }))] })) })] }));
};
export default App;
