const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const getToken = () => localStorage.getItem('toktickit_token');
export const setToken = (token) => localStorage.setItem('toktickit_token', token);
export const removeToken = () => localStorage.removeItem('toktickit_token');
export const getAuthHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};
// ---------------- AUTH API ----------------
export const loginApi = async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to login');
    }
    return res.json();
};
export const getMeApi = async () => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { ...getAuthHeaders() },
    });
    if (!res.ok) {
        throw new Error('Unauthorized or session expired');
    }
    const data = await res.json();
    return data.user;
};
export const changePasswordApi = async (newPassword) => {
    const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        body: JSON.stringify({ newPassword }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to change password');
    }
};
// ---------------- STAFF API ----------------
export const fetchStaffQueue = async (params) => {
    const query = new URLSearchParams();
    if (params.status)
        query.append('status', params.status);
    if (params.priority)
        query.append('priority', params.priority);
    if (params.assignedTo)
        query.append('assignedTo', params.assignedTo);
    if (params.categoryId)
        query.append('categoryId', String(params.categoryId));
    if (params.search)
        query.append('search', params.search);
    const res = await fetch(`${API_BASE_URL}/staff/tickets?${query.toString()}`, {
        headers: { ...getAuthHeaders() },
    });
    if (!res.ok)
        throw new Error('Failed to fetch staff queue');
    return res.json();
};
export const assignTicketApi = async (ticketId, staffId) => {
    const res = await fetch(`${API_BASE_URL}/staff/tickets/${ticketId}/assign`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        body: JSON.stringify({ staffId }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to assign ticket');
    }
    return res.json();
};
export const updateTicketStatusApi = async (ticketId, status, itPriority) => {
    const res = await fetch(`${API_BASE_URL}/staff/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        body: JSON.stringify({ status, itPriority }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update ticket status');
    }
    return res.json();
};
// ---------------- ADMIN API ----------------
export const fetchAdminUsers = async (params) => {
    const query = new URLSearchParams();
    if (params?.role)
        query.append('role', params.role);
    if (params?.isActive)
        query.append('isActive', params.isActive);
    if (params?.search)
        query.append('search', params.search);
    const res = await fetch(`${API_BASE_URL}/admin/users?${query.toString()}`, {
        headers: { ...getAuthHeaders() },
    });
    if (!res.ok)
        throw new Error('Failed to list admin users');
    return res.json();
};
export const createAdminUser = async (userData) => {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        body: JSON.stringify(userData),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create user');
    }
    return res.json();
};
export const updateAdminUser = async (userId, updateData) => {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        body: JSON.stringify(updateData),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update user');
    }
    return res.json();
};
export const resetAdminUserPassword = async (userId, temporaryPassword) => {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        body: JSON.stringify({ temporaryPassword }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to reset password');
    }
    return res.json();
};
// ---------------- RECOVERY / HEALTH CHECK (Lab 1) ----------------
export const checkSystem = async () => {
    const res = await fetch(`${API_BASE_URL}/categories`);
    if (!res.ok)
        throw new Error('Unable to reach the server');
    const cats = await res.json();
    return { ok: true, categories: cats };
};
// ---------------- TICKETS & REQUESTERS (Lab 2) ----------------
export const fetchActiveRequesters = async () => {
    const res = await fetch(`${API_BASE_URL}/requesters/active`);
    if (!res.ok)
        throw new Error('Failed to load active requesters');
    return res.json();
};
export const fetchCategories = async () => {
    const res = await fetch(`${API_BASE_URL}/categories`);
    if (!res.ok)
        throw new Error('Failed to load categories');
    return res.json();
};
export const fetchRelatedSystems = async () => {
    const res = await fetch(`${API_BASE_URL}/related-systems`);
    if (!res.ok)
        throw new Error('Failed to load related systems');
    return res.json();
};
export const createTicket = async (requesterId, ticketData) => {
    const res = await fetch(`${API_BASE_URL}/tickets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-requester-id': String(requesterId),
            ...getAuthHeaders(),
        },
        body: JSON.stringify(ticketData),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create ticket');
    }
    return res.json();
};
export const uploadAttachments = async (ticketId, files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/attachments`, {
        method: 'POST',
        headers: { ...getAuthHeaders() },
        body: formData,
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload attachments');
    }
    return res.json();
};
export const fetchMyTickets = async (requesterId, params) => {
    const query = new URLSearchParams();
    if (params.search)
        query.append('search', params.search);
    if (params.categoryId)
        query.append('categoryId', String(params.categoryId));
    if (params.priority)
        query.append('priority', params.priority);
    if (params.status)
        query.append('status', params.status);
    if (params.page)
        query.append('page', String(params.page));
    if (params.pageSize)
        query.append('pageSize', String(params.pageSize));
    const res = await fetch(`${API_BASE_URL}/tickets?${query.toString()}`, {
        headers: {
            'x-requester-id': String(requesterId),
            ...getAuthHeaders(),
        },
    });
    if (!res.ok)
        throw new Error('Failed to fetch tickets');
    return res.json();
};
export const fetchTicketDetail = async (requesterId, ticketId) => {
    const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
        headers: {
            "x-requester-id": String(requesterId),
            ...getAuthHeaders(),
        },
    });
    if (!res.ok) {
        throw new Error("Failed to load ticket detail");
    }
    return res.json();
};
export const softRemoveAttachment = async (requesterId, attachmentId, removalReason) => {
    const res = await fetch(`${API_BASE_URL}/attachments/${attachmentId}/soft-remove`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'x-requester-id': String(requesterId),
            ...getAuthHeaders(),
        },
        body: JSON.stringify({ removalReason }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to remove attachment');
    }
    return res.json();
};
