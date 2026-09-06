import React, { useState, useEffect, useCallback } from 'react';
import {
  RequesterUser,
  Category,
  RelatedSystem,
  Ticket,
  fetchActiveRequesters,
  fetchCategories,
  fetchRelatedSystems,
  createTicket,
  uploadAttachments,
  fetchMyTickets,
  fetchTicketDetail,
  softRemoveAttachment,
} from './api';

export const App: React.FC = () => {
  // -------------------------------------------------------------
  // Requester context state
  // -------------------------------------------------------------
  const [currentRequester, setCurrentRequester] = useState<RequesterUser | null>(() => {
    const saved = localStorage.getItem('toktickit_requester');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeRequesters, setActiveRequesters] = useState<RequesterUser[]>([]);
  const [isSelectingRequester, setIsSelectingRequester] = useState<boolean>(!currentRequester);

  // -------------------------------------------------------------
  // Navigation & View state
  // -------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<'my-tickets' | 'create-ticket'>('my-tickets');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  // Reference data
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);

  // -------------------------------------------------------------
  // Create Ticket Form state
  // -------------------------------------------------------------
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [relatedSystemId, setRelatedSystemId] = useState<number | ''>('');
  const [priority, setPriority] = useState('Medium');
  const [files, setFiles] = useState<File[]>([]);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createSuccessMsg, setCreateSuccessMsg] = useState<string | null>(null);
  const [createErrorMsg, setCreateErrorMsg] = useState<string | null>(null);

  // -------------------------------------------------------------
  // My Tickets List state
  // -------------------------------------------------------------
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<number | ''>('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  // -------------------------------------------------------------
  // Ticket Detail & Attachment state
  // -------------------------------------------------------------
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [softRemoveId, setSoftRemoveId] = useState<number | null>(null);
  const [removalReason, setRemovalReason] = useState('');
  const [softRemoveError, setSoftRemoveError] = useState<string | null>(null);

  // Initial load: active requesters, categories, related systems
  useEffect(() => {
    fetchActiveRequesters().then(setActiveRequesters).catch(() => {});
    fetchCategories().then(setCategories).catch(() => {});
    fetchRelatedSystems().then(setRelatedSystems).catch(() => {});
  }, []);

  const handleSelectRequester = (user: RequesterUser) => {
    setCurrentRequester(user);
    localStorage.setItem('toktickit_requester', JSON.stringify(user));
    setIsSelectingRequester(false);
    setSelectedTicketId(null);
    setPage(1);
  };

  // Load My Tickets
  const loadTickets = useCallback(async () => {
    if (!currentRequester || isSelectingRequester) return;
    setIsLoadingTickets(true);
    try {
      const res = await fetchMyTickets(currentRequester.id, {
        search: search.trim() || undefined,
        categoryId: filterCat || undefined,
        priority: filterPriority || undefined,
        status: filterStatus || undefined,
        page,
        pageSize: 8,
      });
      setTickets(res.items);
      setTotalPages(res.totalPages);
      setTotalTickets(res.total);
    } catch {
      setTickets([]);
    } finally {
      setIsLoadingTickets(false);
    }
  }, [currentRequester, isSelectingRequester, search, filterCat, filterPriority, filterStatus, page]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Load Ticket Detail
  const loadDetail = useCallback(async (ticketId: number) => {
    if (!currentRequester) return;
    setIsLoadingDetail(true);
    setDetailError(null);
    try {
      const data = await fetchTicketDetail(currentRequester.id, ticketId);
      setDetailTicket(data);
    } catch (err: any) {
      setDetailError(err.message || 'Failed to load ticket detail.');
    } finally {
      setIsLoadingDetail(false);
    }
  }, [currentRequester]);

  useEffect(() => {
    if (selectedTicketId) {
      loadDetail(selectedTicketId);
    }
  }, [selectedTicketId, loadDetail]);

  // Create Ticket submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!summary.trim()) errs.summary = 'Summary is required.';
    if (!description.trim()) errs.description = 'Description is required.';
    if (!categoryId) errs.categoryId = 'Category is required.';
    if (!relatedSystemId) errs.relatedSystemId = 'Related System is required.';
    setCreateErrors(errs);
    if (Object.keys(errs).length > 0 || !currentRequester) return;

    setIsSubmitting(true);
    setCreateErrorMsg(null);
    setCreateSuccessMsg(null);

    try {
      const newTicket = await createTicket(currentRequester.id, {
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
      setSummary('');
      setDescription('');
      setCategoryId('');
      setRelatedSystemId('');
      setFiles([]);

      setTimeout(() => {
        setCreateSuccessMsg(null);
        setSelectedTicketId(newTicket.id);
      }, 1200);
    } catch (err: any) {
      setCreateErrorMsg(err.message || 'Failed to submit ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm soft removal
  const handleConfirmSoftRemove = async () => {
    if (!removalReason.trim()) {
      setSoftRemoveError('Removal reason is required.');
      return;
    }
    if (!currentRequester || !softRemoveId || !selectedTicketId) return;

    try {
      await softRemoveAttachment(currentRequester.id, softRemoveId, removalReason.trim());
      setSoftRemoveId(null);
      setRemovalReason('');
      setSoftRemoveError(null);
      loadDetail(selectedTicketId);
    } catch (err: any) {
      setSoftRemoveError(err.message || 'Failed to remove attachment');
    }
  };

  // Badge styler for priority & status
  const getBadgeStyle = (val: string) => {
    switch (val?.toLowerCase()) {
      case 'high':
      case 'critical':
        return { backgroundColor: '#FED7D7', color: '#9B2C2C' };
      case 'medium':
        return { backgroundColor: '#FEEBC8', color: '#7B341E' };
      case 'low':
        return { backgroundColor: '#C6F6D5', color: '#22543D' };
      case 'new':
      case 'open':
        return { backgroundColor: '#BEE3F8', color: '#2A4365' };
      case 'resolved':
      case 'closed':
        return { backgroundColor: '#C6F6D5', color: '#22543D' };
      default:
        return { backgroundColor: '#EDF2F7', color: '#4A5568' };
    }
  };

  // -------------------------------------------------------------
  // VIEW: 1. SELECT DEVELOPMENT REQUESTER
  // -------------------------------------------------------------
  if (!currentRequester || isSelectingRequester) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F7F6', padding: '1rem' }}>
        <div style={{ maxWidth: '500px', width: '100%', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#EAF6EF', color: '#006B3C', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem' }}>
              👤
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1A2E26', marginBottom: '0.5rem' }}>Select Development Requester</h1>
            <p style={{ color: '#4A5568', fontSize: '0.875rem' }}>
              Choose an active requester to test Lab 2 features. (Testing only - not real login)
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {activeRequesters.map((req) => (
              <button
                key={req.id}
                onClick={() => handleSelectRequester(req)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.875rem 1rem',
                  border: '1px solid #CBD5E0',
                  borderRadius: '6px',
                  backgroundColor: currentRequester?.id === req.id ? '#EAF6EF' : '#FFFFFF',
                  borderColor: currentRequester?.id === req.id ? '#006B3C' : '#CBD5E0',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontWeight: '600', color: '#1A2E26' }}>{req.name}</span>
                <span style={{ color: '#718096', fontSize: '0.875rem' }}>{req.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F7F6', display: 'flex', flexDirection: 'column' }}>
      {/* -------------------------------------------------------------
          Zen Green Header Shell
      ------------------------------------------------------------- */}
      <header style={{ backgroundColor: '#006B3C', color: '#FFFFFF', padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>⏱️ TokTickIT</span>
          <nav style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => { setActiveTab('my-tickets'); setSelectedTicketId(null); }}
              style={{ background: activeTab === 'my-tickets' && !selectedTicketId ? '#0B7A46' : 'transparent', border: 'none', color: '#FFFFFF', padding: '0.5rem 0.875rem', borderRadius: '4px', cursor: 'pointer', fontWeight: activeTab === 'my-tickets' ? 'bold' : 'normal' }}
            >
              📋 My Tickets
            </button>
            <button
              onClick={() => { setActiveTab('create-ticket'); setSelectedTicketId(null); }}
              style={{ background: activeTab === 'create-ticket' && !selectedTicketId ? '#0B7A46' : 'transparent', border: 'none', color: '#FFFFFF', padding: '0.5rem 0.875rem', borderRadius: '4px', cursor: 'pointer', fontWeight: activeTab === 'create-ticket' ? 'bold' : 'normal' }}
            >
              ➕ Create Ticket
            </button>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
          <span>👤 {currentRequester.name}</span>
          <button
            onClick={() => setIsSelectingRequester(true)}
            style={{ backgroundColor: '#0B7A46', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer' }}
          >
            Change Requester
          </button>
        </div>
      </header>

      {/* -------------------------------------------------------------
          Main Content Container
      ------------------------------------------------------------- */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        {/* VIEW 1: TICKET DETAIL */}
        {selectedTicketId ? (
          <div style={{ backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <button
              onClick={() => setSelectedTicketId(null)}
              style={{ marginBottom: '1.5rem', background: 'none', border: 'none', color: '#006B3C', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ← Back to My Tickets
            </button>

            {isLoadingDetail ? (
              <p style={{ textAlign: 'center', padding: '2rem' }}>Loading ticket...</p>
            ) : detailError ? (
              <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', color: '#C53030', padding: '1rem', borderRadius: '6px' }}>{detailError}</div>
            ) : detailTicket ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#718096' }}>Ticket Number</span>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#006B3C' }}>{detailTicket.ticketNumber}</h2>
                  </div>
                  <span style={{ padding: '0.25rem 0.75rem', borderRadius: '12px', fontWeight: 'bold', alignSelf: 'center', ...getBadgeStyle(detailTicket.currentStatus || detailTicket.status || 'New') }}>
                    {detailTicket.currentStatus || detailTicket.status || 'New'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ backgroundColor: '#F7FAFC', padding: '0.75rem', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#718096' }}>Category</span>
                    <p style={{ fontWeight: '600', color: '#2D3748' }}>{detailTicket.category?.name || '-'}</p>
                  </div>
                  <div style={{ backgroundColor: '#F7FAFC', padding: '0.75rem', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#718096' }}>Related System</span>
                    <p style={{ fontWeight: '600', color: '#2D3748' }}>{detailTicket.relatedSystem?.name || '-'}</p>
                  </div>
                  <div style={{ backgroundColor: '#F7FAFC', padding: '0.75rem', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#718096' }}>Requested Priority</span>
                    <p style={{ fontWeight: '600', color: '#2D3748' }}>{detailTicket.requestedPriority}</p>
                  </div>
                  <div style={{ backgroundColor: '#F7FAFC', padding: '0.75rem', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#718096' }}>Created Date</span>
                    <p style={{ fontWeight: '600', color: '#2D3748' }}>{new Date(detailTicket.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#4A5568' }}>Summary:</strong>
                  <p style={{ marginTop: '0.25rem', color: '#2D3748', fontSize: '1.1rem', fontWeight: '600' }}>{detailTicket.summary}</p>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <strong style={{ color: '#4A5568' }}>Description:</strong>
                  <p style={{ marginTop: '0.25rem', color: '#2D3748', backgroundColor: '#F7FAFC', padding: '1rem', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
                    {detailTicket.description}
                  </p>
                </div>

                {/* Attachments Section */}
                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#1A2E26' }}>
                    Attachments ({detailTicket.attachments?.length || 0})
                  </h3>
                  {!detailTicket.attachments?.length ? (
                    <p style={{ color: '#718096', fontSize: '0.875rem' }}>No attachments associated with this ticket.</p>
                  ) : (
                    detailTicket.attachments.map((att) => (
                      <div
                        key={att.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          border: '1px solid #E2E8F0',
                          borderRadius: '6px',
                          marginBottom: '0.5rem',
                          backgroundColor: att.isRemoved ? '#FFF5F5' : '#FFFFFF',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: '600', color: att.isRemoved ? '#A0AEC0' : '#2D3748' }}>📎 {att.fileName}</span>
                          <span style={{ fontSize: '0.75rem', color: '#718096', marginLeft: '0.5rem' }}>
                            ({(att.fileSize / 1024).toFixed(1)} KB)
                          </span>
                          {att.isRemoved && (
                            <div style={{ color: '#E53E3E', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                              <em>Removed: {att.removalReason}</em>
                            </div>
                          )}
                        </div>

                        <div>
                          {!att.isRemoved ? (
                            <button
                              onClick={() => { setSoftRemoveId(att.id); setSoftRemoveError(null); }}
                              style={{ color: '#E53E3E', background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                              Remove
                            </button>
                          ) : (
                            <span style={{ color: '#A0AEC0', fontSize: '0.75rem', fontStyle: 'italic' }}>Download Unavailable</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Soft-remove modal */}
                {softRemoveId && (
                  <div style={{ marginTop: '1.5rem', padding: '1.25rem', backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: '6px' }}>
                    <h4 style={{ fontWeight: 'bold', color: '#C53030', marginBottom: '0.5rem' }}>Soft-Remove Attachment</h4>
                    <p style={{ fontSize: '0.875rem', color: '#4A5568', marginBottom: '0.5rem' }}>
                      Please provide a mandatory reason for removing this attachment:
                    </p>
                    <input
                      type="text"
                      placeholder="e.g. Uploaded wrong screenshot..."
                      value={removalReason}
                      onChange={(e) => setRemovalReason(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E0', borderRadius: '4px', marginBottom: '0.5rem' }}
                    />
                    {softRemoveError && <p style={{ color: '#E53E3E', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{softRemoveError}</p>}
                    <button
                      onClick={handleConfirmSoftRemove}
                      style={{ background: '#C53030', color: '#FFFFFF', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginRight: '0.5rem' }}
                    >
                      Confirm Removal
                    </button>
                    <button
                      onClick={() => { setSoftRemoveId(null); setRemovalReason(''); setSoftRemoveError(null); }}
                      style={{ background: '#E2E8F0', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : activeTab === 'create-ticket' ? (
          /* VIEW 2: CREATE TICKET */
          <div style={{ backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1A2E26', marginBottom: '1.5rem' }}>Create Support Ticket</h2>

            {createErrorMsg && <div style={{ color: '#C53030', backgroundColor: '#FFF5F5', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', border: '1px solid #FEB2B2' }}>{createErrorMsg}</div>}
            {createSuccessMsg && <div style={{ color: '#22543D', backgroundColor: '#EAF6EF', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', border: '1px solid #9AE6B4' }}>{createSuccessMsg}</div>}

            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Category *</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: createErrors.categoryId ? '1px solid #E53E3E' : '1px solid #CBD5E0' }}>
                    <option value="">-- Select Category --</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {createErrors.categoryId && <span style={{ color: '#E53E3E', fontSize: '0.75rem' }}>{createErrors.categoryId}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Related System *</label>
                  <select value={relatedSystemId} onChange={(e) => setRelatedSystemId(e.target.value ? Number(e.target.value) : '')} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: createErrors.relatedSystemId ? '1px solid #E53E3E' : '1px solid #CBD5E0' }}>
                    <option value="">-- Select System --</option>
                    {relatedSystems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {createErrors.relatedSystemId && <span style={{ color: '#E53E3E', fontSize: '0.75rem' }}>{createErrors.relatedSystemId}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #CBD5E0' }}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Summary *</label>
                <input type="text" placeholder="Brief summary of issue" value={summary} onChange={(e) => setSummary(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: createErrors.summary ? '1px solid #E53E3E' : '1px solid #CBD5E0' }} />
                {createErrors.summary && <span style={{ color: '#E53E3E', fontSize: '0.75rem' }}>{createErrors.summary}</span>}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Description *</label>
                <textarea rows={4} placeholder="Detailed explanation..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: createErrors.description ? '1px solid #E53E3E' : '1px solid #CBD5E0' }} />
                {createErrors.description && <span style={{ color: '#E53E3E', fontSize: '0.75rem' }}>{createErrors.description}</span>}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Attachments (Max 5, ≤ 5MB, JPG/PNG/WEBP/PDF)</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) setFiles(Array.from(e.target.files).slice(0, 5));
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{ backgroundColor: '#006B3C', color: '#FFFFFF', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>
          </div>
        ) : (
          /* VIEW 3: MY TICKETS */
          <div style={{ backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1A2E26' }}>My Tickets</h2>
                <p style={{ fontSize: '0.875rem', color: '#718096' }}>Showing tickets for <strong>{currentRequester.name}</strong></p>
              </div>
              <button
                onClick={() => setActiveTab('create-ticket')}
                style={{ backgroundColor: '#006B3C', color: '#FFFFFF', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                ➕ Create Ticket
              </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', backgroundColor: '#F7FAFC', padding: '1rem', borderRadius: '6px' }}>
              <input
                type="text"
                placeholder="🔍 Search summary..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ padding: '0.5rem', flex: 1, minWidth: '160px', borderRadius: '4px', border: '1px solid #CBD5E0' }}
              />
              <select value={filterCat} onChange={(e) => { setFilterCat(e.target.value ? Number(e.target.value) : ''); setPage(1); }} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #CBD5E0' }}>
                <option value="">All Categories</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #CBD5E0' }}>
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #CBD5E0' }}>
                <option value="">All Statuses</option>
                <option value="New">New</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {/* Table */}
            {isLoadingTickets ? (
              <p style={{ textAlign: 'center', padding: '2rem' }}>Loading tickets...</p>
            ) : tickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#718096' }}>
                <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>📭 No tickets found</p>
                <p style={{ fontSize: '0.875rem' }}>
                  {search || filterCat || filterPriority || filterStatus
                    ? 'Try clearing or changing your filters.'
                    : 'You have not created any tickets yet.'}
                </p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#4A5568' }}>
                    <th style={{ padding: '0.75rem' }}>Ticket No.</th>
                    <th style={{ padding: '0.75rem' }}>Summary</th>
                    <th style={{ padding: '0.75rem' }}>Category</th>
                    <th style={{ padding: '0.75rem' }}>Priority</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #EDF2F7' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#006B3C' }}>{t.ticketNumber}</td>
                      <td style={{ padding: '0.75rem', color: '#2D3748' }}>{t.summary}</td>
                      <td style={{ padding: '0.75rem', color: '#4A5568' }}>{t.category?.name || '-'}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', ...getBadgeStyle(t.requestedPriority) }}>
                          {t.requestedPriority}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', ...getBadgeStyle(t.currentStatus || t.status || 'New') }}>
                          {t.currentStatus || t.status || 'New'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <button
                          onClick={() => setSelectedTicketId(t.id)}
                          style={{ color: '#006B3C', cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline', fontWeight: 'bold' }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem', fontSize: '0.875rem' }}>
                <span style={{ color: '#718096' }}>Showing {tickets.length} of {totalTickets}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', border: '1px solid #CBD5E0', background: page <= 1 ? '#EDF2F7' : '#FFFFFF', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>
                    Prev
                  </button>
                  <span style={{ padding: '0.25rem 0.5rem', fontWeight: 'bold' }}>{page} / {totalPages}</span>
                  <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', border: '1px solid #CBD5E0', background: page >= totalPages ? '#EDF2F7' : '#FFFFFF', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>
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