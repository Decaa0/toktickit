const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export type UserRole = 'REQUESTER' | 'IT_STAFF' | 'ADMINISTRATOR';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface RequesterUser {
  id: number;
  name: string;
  email: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface RelatedSystem {
  id: number;
  name: string;
}

export interface Attachment {
  id: number;
  ticketId: number;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  isRemoved: boolean;
  removalReason?: string | null;
  removedAt?: string | null;
  createdAt: string;
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  summary: string;
  description?: string;
  requestedPriority?: 'Low' | 'Medium' | 'High' | 'Critical' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  itPriority?: string | null;
  currentStatus?: string;
  status?: string;
  requesterId?: number | string | null;
  assignedStaffId?: string | null;
  categoryId?: number;
  relatedSystemId?: number | null;
  createdAt?: string;
  category?: Category;
  relatedSystem?: RelatedSystem;
  requester?: { name: string; email?: string };
  assignedStaff?: { id: string; email: string; fullName: string; role: string } | null;
  attachments?: Attachment[];
}

export interface TicketListResponse {
  items: Ticket[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const getToken = (): string | null => localStorage.getItem('toktickit_token');
export const setToken = (token: string): void => localStorage.setItem('toktickit_token', token);
export const removeToken = (): void => localStorage.removeItem('toktickit_token');

export const getAuthHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ---------------- AUTH API ----------------
export const loginApi = async (email: string, password: string): Promise<LoginResponse> => {
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

export const getMeApi = async (): Promise<AuthUser> => {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    throw new Error('Unauthorized or session expired');
  }
  const data = await res.json();
  return data.user;
};

export const changePasswordApi = async (newPassword: string): Promise<void> => {
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
export const fetchStaffQueue = async (params: {
  status?: string;
  priority?: string;
  assignedTo?: string;
  categoryId?: number | '';
  search?: string;
}): Promise<{ items: Ticket[]; total: number }> => {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.priority) query.append('priority', params.priority);
  if (params.assignedTo) query.append('assignedTo', params.assignedTo);
  if (params.categoryId) query.append('categoryId', String(params.categoryId));
  if (params.search) query.append('search', params.search);

  const res = await fetch(`${API_BASE_URL}/staff/tickets?${query.toString()}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch staff queue');
  return res.json();
};

export const assignTicketApi = async (ticketId: number, staffId?: string): Promise<{ ticket: Ticket }> => {
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

export const updateTicketStatusApi = async (
  ticketId: number,
  status: string,
  itPriority?: string
): Promise<{ ticket: Ticket }> => {
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

// ---------------- ACTIONS TAKEN API ----------------
export interface ActionTaken {
  id: number;
  ticketId: number;
  actionDateTime: string;
  description: string;
  result: string | null;
  performedByUserId: string | number;
  performedByName: string;
  followUpRequired: boolean;
  followUpNote: string | null;
  attachmentNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActionTakenInput {
  actionDateTime?: string;
  description?: string;
  result?: string;
  followUpRequired?: boolean;
  followUpNote?: string;
  attachmentNotes?: string;
}

export const fetchTicketActions = async (ticketId: number): Promise<ActionTaken[]> => {
  const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/actions`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to load actions taken');
  }
  const data = await res.json();
  return data.items || [];
};

export const createTicketAction = async (
  ticketId: number,
  data: ActionTakenInput
): Promise<ActionTaken> => {
  const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/actions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create action');
  }
  return res.json();
};

export const updateTicketAction = async (
  ticketId: number,
  actionId: number,
  data: ActionTakenInput
): Promise<ActionTaken> => {
  const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/actions/${actionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update action');
  }
  return res.json();
};

// ---------------- ADMIN API ----------------
export const fetchAdminUsers = async (params?: { role?: string; isActive?: string; search?: string }) => {
  const query = new URLSearchParams();
  if (params?.role) query.append('role', params.role);
  if (params?.isActive) query.append('isActive', params.isActive);
  if (params?.search) query.append('search', params.search);

  const res = await fetch(`${API_BASE_URL}/admin/users?${query.toString()}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to list admin users');
  return res.json();
};

export const createAdminUser = async (userData: {
  email: string;
  fullName: string;
  role: string;
  temporaryPassword: string;
}) => {
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

export const updateAdminUser = async (
  userId: string,
  updateData: { fullName?: string; role?: string; isActive?: boolean }
) => {
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

export const resetAdminUserPassword = async (userId: string, temporaryPassword: string) => {
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
export const checkSystem = async (): Promise<{ ok: boolean; categories: Category[] }> => {
  const res = await fetch(`${API_BASE_URL}/categories`);
  if (!res.ok) throw new Error('Unable to reach the server');
  const cats = await res.json();
  return { ok: true, categories: cats };
};

// ---------------- TICKETS & REQUESTERS (Lab 2) ----------------
export const fetchActiveRequesters = async (): Promise<RequesterUser[]> => {
  const res = await fetch(`${API_BASE_URL}/requesters/active`);
  if (!res.ok) throw new Error('Failed to load active requesters');
  return res.json();
};

export const fetchCategories = async (): Promise<Category[]> => {
  const res = await fetch(`${API_BASE_URL}/categories`);
  if (!res.ok) throw new Error('Failed to load categories');
  return res.json();
};

export const fetchRelatedSystems = async (): Promise<RelatedSystem[]> => {
  const res = await fetch(`${API_BASE_URL}/related-systems`);
  if (!res.ok) throw new Error('Failed to load related systems');
  return res.json();
};

export const createTicket = async (
  requesterId: number,
  ticketData: {
    summary: string;
    description: string;
    categoryId: number;
    relatedSystemId: number;
    requestedPriority: string;
  }
): Promise<Ticket> => {
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

export const uploadAttachments = async (
  ticketId: number,
  files: File[]
): Promise<Attachment[]> => {
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

export const fetchMyTickets = async (
  requesterId: number,
  params: {
    search?: string;
    categoryId?: number | '';
    priority?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<TicketListResponse> => {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.categoryId) query.append('categoryId', String(params.categoryId));
  if (params.priority) query.append('priority', params.priority);
  if (params.status) query.append('status', params.status);
  if (params.page) query.append('page', String(params.page));
  if (params.pageSize) query.append('pageSize', String(params.pageSize));

  const res = await fetch(`${API_BASE_URL}/tickets?${query.toString()}`, {
    headers: {
      'x-requester-id': String(requesterId),
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error('Failed to fetch tickets');
  return res.json();
};

export const fetchTicketDetail = async (
  requesterId: number,
  ticketId: number
): Promise<Ticket> => {
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

export const softRemoveAttachment = async (
  requesterId: number,
  attachmentId: number,
  removalReason: string
): Promise<Attachment> => {
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

// ---------------- DASHBOARD API ----------------
export interface TicketSummary {
  id: number;
  ticketNumber: string;
  summary: string;
  currentStatus: string;
  itPriority?: string | null;
  requestedPriority?: string;
  updatedAt: string;
}

export interface RequesterDashboard {
  totalOpen: number;
  waitingForRequester: number;
  recentlyUpdated: { count: number; items: TicketSummary[] };
  recentlyResolved: { count: number; items: TicketSummary[] };
}

export interface StaffDashboard {
  unassigned: number;
  ownedByMe: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  recentlyUpdated: { count: number; items: TicketSummary[] };
}

export const fetchRequesterDashboard = async (): Promise<RequesterDashboard> => {
  const res = await fetch(`${API_BASE_URL}/dashboard/requester`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to load requester dashboard');
  }
  return res.json();
};

export const fetchStaffDashboard = async (): Promise<StaffDashboard> => {
  const res = await fetch(`${API_BASE_URL}/dashboard/staff`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to load staff dashboard');
  }
  return res.json();
};
