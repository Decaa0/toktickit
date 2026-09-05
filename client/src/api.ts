const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
  description: string;
  requestedPriority: 'Low' | 'Medium' | 'High' | 'Critical';
  currentStatus: string;
  status?: string;
  requesterId: number;
  categoryId: number;
  relatedSystemId: number;
  createdAt: string;
  category?: Category;
  relatedSystem?: RelatedSystem;
  attachments?: Attachment[];
}

export interface TicketListResponse {
  items: Ticket[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

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
      'x-requester-id': String(requesterId),
    },
  });
  if (!res.ok) {
    if (res.status === 403) throw new Error('Access forbidden: You cannot view tickets belonging to other requesters.');
    if (res.status === 404) throw new Error('Ticket not found');
    throw new Error('Failed to load ticket detail');
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
    },
    body: JSON.stringify({ removalReason }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to remove attachment');
  }
  return res.json();
};