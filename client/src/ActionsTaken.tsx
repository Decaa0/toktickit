import React, { useState, useEffect, useCallback } from "react";
import {
  ActionTaken,
  fetchTicketActions,
  createTicketAction,
  updateTicketAction,
} from "./api";

interface ActionsTakenProps {
  ticketId: number;
  canEdit: boolean;
}

const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem",
  border: "1px solid #CBD5E0",
  borderRadius: "4px",
  marginBottom: "0.75rem",
};
const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.75rem", color: "#4A5568", fontWeight: "bold", marginBottom: "0.25rem" };
const cellStyle: React.CSSProperties = { padding: "0.75rem", verticalAlign: "top" };

export const ActionsTaken: React.FC<ActionsTakenProps> = ({ ticketId, canEdit }) => {
  const [actions, setActions] = useState<ActionTaken[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [actionDateTime, setActionDateTime] = useState(toLocalInput(new Date()));
  const [description, setDescription] = useState("");
  const [result, setResult] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpNote, setFollowUpNote] = useState("");
  const [attachmentNotes, setAttachmentNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadActions = useCallback(async () => {
    try {
      const items = await fetchTicketActions(ticketId);
      const sorted = [...(items || [])].sort(
        (a, b) => new Date(a.actionDateTime).getTime() - new Date(b.actionDateTime).getTime()
      );
      setActions(sorted);
      setLoadError(null);
    } catch (err: any) {
      setLoadError(err.message || "Failed to load actions taken");
    }
  }, [ticketId]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  const resetForm = () => {
    setEditingId(null);
    setActionDateTime(toLocalInput(new Date()));
    setDescription("");
    setResult("");
    setFollowUpRequired(false);
    setFollowUpNote("");
    setAttachmentNotes("");
    setFormError(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (a: ActionTaken) => {
    setEditingId(a.id);
    setActionDateTime(toLocalInput(new Date(a.actionDateTime)));
    setDescription(a.description || "");
    setResult(a.result || "");
    setFollowUpRequired(!!a.followUpRequired);
    setFollowUpNote(a.followUpNote || "");
    setAttachmentNotes(a.attachmentNotes || "");
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!description.trim()) {
      setFormError("Description is required");
      return;
    }
    if (followUpRequired && !followUpNote.trim()) {
      setFormError("Follow-up note is required when follow-up is required");
      return;
    }
    setFormError(null);
    setIsSubmitting(true);
    const payload = {
      actionDateTime: actionDateTime ? new Date(actionDateTime).toISOString() : undefined,
      description: description.trim(),
      result: result.trim(),
      followUpRequired,
      followUpNote: followUpRequired ? followUpNote.trim() : "",
      attachmentNotes: attachmentNotes.trim(),
    };
    try {
      if (editingId !== null) {
        await updateTicketAction(ticketId, editingId, payload);
      } else {
        await createTicketAction(ticketId, payload);
      }
      await loadActions();
      setShowForm(false);
      resetForm();
    } catch (err: any) {
      setFormError(err.message || "Failed to save action");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "1.5rem", marginTop: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", color: "#1A2E26" }}>Actions Taken ({actions.length})</h3>
        {canEdit && !showForm && (
          <button
            onClick={openCreate}
            style={{ backgroundColor: "#0B7A46", color: "#FFFFFF", border: "none", borderRadius: "4px", padding: "0.5rem 1rem", cursor: "pointer", fontWeight: "bold" }}
          >
            Add Action
          </button>
        )}
      </div>

      {loadError && <p style={{ color: "#E53E3E", fontSize: "0.875rem", marginBottom: "0.5rem" }}>{loadError}</p>}

      {canEdit && showForm && (
        <form
          onSubmit={handleSubmit}
          aria-label="Action form"
          style={{ padding: "1.25rem", backgroundColor: "#F7FAFC", border: "1px solid #E2E8F0", borderRadius: "6px", marginBottom: "1rem" }}
        >
          <label htmlFor="action-datetime" style={labelStyle}>Action Date/Time</label>
          <input id="action-datetime" type="datetime-local" value={actionDateTime} onChange={(e) => setActionDateTime(e.target.value)} style={inputStyle} />

          <label htmlFor="action-description" style={labelStyle}>Description *</label>
          <textarea id="action-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle} />

          <label htmlFor="action-result" style={labelStyle}>Result</label>
          <input id="action-result" type="text" value={result} onChange={(e) => setResult(e.target.value)} style={inputStyle} />

          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
            <input type="checkbox" checked={followUpRequired} onChange={(e) => setFollowUpRequired(e.target.checked)} />
            Follow-Up Required?
          </label>

          {followUpRequired && (
            <>
              <label htmlFor="action-followup-note" style={labelStyle}>Follow-up Note *</label>
              <textarea id="action-followup-note" rows={2} value={followUpNote} onChange={(e) => setFollowUpNote(e.target.value)} style={inputStyle} />
            </>
          )}

          <label htmlFor="action-attachment-notes" style={labelStyle}>Attachment Notes</label>
          <input id="action-attachment-notes" type="text" value={attachmentNotes} onChange={(e) => setAttachmentNotes(e.target.value)} style={inputStyle} />

          {formError && <p role="alert" style={{ color: "#E53E3E", fontSize: "0.875rem", marginBottom: "0.5rem" }}>{formError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{ background: "#0B7A46", color: "#FFFFFF", padding: "0.5rem 1rem", border: "none", borderRadius: "4px", cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.6 : 1, fontWeight: "bold", marginRight: "0.5rem" }}
          >
            {isSubmitting ? "Saving..." : editingId !== null ? "Save Changes" : "Save Action"}
          </button>
          <button
            type="button"
            onClick={() => { setShowForm(false); resetForm(); }}
            style={{ background: "#E2E8F0", padding: "0.5rem 1rem", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            Cancel
          </button>
        </form>
      )}

      {actions.length === 0 ? (
        <p style={{ color: "#718096", fontSize: "0.875rem" }}>No actions have been recorded for this ticket.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#F7FAFC", textAlign: "left", color: "#4A5568" }}>
                <th style={cellStyle}>Date/Time</th>
                <th style={cellStyle}>Description</th>
                <th style={cellStyle}>Result</th>
                <th style={cellStyle}>Performed By</th>
                <th style={cellStyle}>Follow-Up</th>
                <th style={cellStyle}>Attachment Notes</th>
                {canEdit && <th style={cellStyle}></th>}
              </tr>
            </thead>
            <tbody>
              {actions.map((a) => (
                <tr key={a.id} style={{ borderTop: "1px solid #E2E8F0" }}>
                  <td style={cellStyle}>{new Date(a.actionDateTime).toLocaleString()}</td>
                  <td style={{ ...cellStyle, whiteSpace: "pre-wrap" }}>{a.description}</td>
                  <td style={cellStyle}>{a.result || "-"}</td>
                  <td style={cellStyle}>{a.performedByName}</td>
                  <td style={cellStyle}>{a.followUpRequired ? `Yes - ${a.followUpNote || ""}` : "No"}</td>
                  <td style={cellStyle}>{a.attachmentNotes || "-"}</td>
                  {canEdit && (
                    <td style={cellStyle}>
                      <button
                        onClick={() => openEdit(a)}
                        style={{ color: "#0B7A46", background: "#FFFFFF", border: "1px solid #0B7A46", borderRadius: "4px", padding: "0.25rem 0.5rem", fontSize: "0.75rem", cursor: "pointer" }}
                      >
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ActionsTaken;
