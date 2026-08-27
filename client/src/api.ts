const BASE_URL = "http://localhost:3000/api";

export function getActiveRequesterId(): string | null {
  return localStorage.getItem("active_requester_id");
}

export function setActiveRequesterId(id: string): void {
  localStorage.setItem("active_requester_id", id);
}

export function clearActiveRequester(): void {
  localStorage.removeItem("active_requester_id");
}

function getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const reqId = getActiveRequesterId();
  const headers: Record<string, string> = {
    ...customHeaders,
  };
  if (reqId) {
    headers["x-requester-id"] = reqId;
  }
  return headers;
}

export async function fetchActiveRequesters() {
  const res = await fetch(`${BASE_URL}/requesters/active`);
  if (!res.ok) throw new Error("Failed to fetch requesters");
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${BASE_URL}/categories`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function fetchRelatedSystems() {
  const res = await fetch(`${BASE_URL}/related-systems`);
  if (!res.ok) throw new Error("Failed to fetch systems");
  return res.json();
}

export async function createTicket(data: any) {
  const res = await fetch(`${BASE_URL}/tickets`, {
    method: "POST",
    headers: getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create ticket");
  }
  return res.json();
}

export async function uploadAttachment(ticketId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/tickets/${ticketId}/attachments`, {
    method: "POST",
    headers: getHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to upload file");
  }
  return res.json();
}

export async function fetchMyTickets(params: Record<string, any> = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/tickets?${query}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch tickets");
  return res.json();
}

export async function fetchTicketDetail(id: string | number) {
  const res = await fetch(`${BASE_URL}/tickets/${id}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch ticket detail");
  }
  return res.json();
}

export async function softRemoveAttachment(attachmentId: number, reason: string) {
  const res = await fetch(`${BASE_URL}/attachments/${attachmentId}/soft-remove`, {
    method: "PATCH",
    headers: getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to soft-remove attachment");
  }
  return res.json();
}
export async function checkSystem() {
  try {
    const res = await fetch("http://localhost:3000/api/categories");
    if (!res.ok) throw new Error("API Offline");
    const categories = await res.json();
    return { ok: true, categories };
  } catch (err) {
    return { ok: false, categories: [] };
  }
}