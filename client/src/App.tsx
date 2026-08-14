import { useState } from "react";
import { checkSystem, Category } from "./api.js";

// UI states you must handle for Issue 4: idle, loading, success, error.
type UiState = "idle" | "loading" | "success" | "error";

export default function App() {
  const [state, setState] = useState<UiState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  void categories;
  void setCategories;
  void checkSystem;

  async function handleCheck() {
    setState("loading");
    setErrorMessage(null);

    try {
      // Issue 2: Real API call to the health check endpoint
      const res = await fetch("/api/health");
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.status === "ok") {
        setState("success");
      } else {
        throw new Error("Invalid health check response");
      }
    } catch (_err) {
      setState("error");
      setErrorMessage("Unable to connect to TokTickIT API");
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-4">
        TokTickIT <span className="text-success">IT Service Desk</span>
      </h1>

      <button
        className="btn btn-success"
        onClick={handleCheck}
        disabled={state === "loading"}
      >
        {state === "loading" ? "Loading…" : "Check System"}
      </button>

      {/* Loading state */}
      {state === "loading" && (
        <div className="mt-3 text-secondary">Checking system status…</div>
      )}

      {/* Issue 2: Success state (Online) */}
      {state === "success" && (
        <div className="mt-3">
          <p className="mb-0">
            <strong>System Status: </strong>
            <span className="text-success fw-bold">Online</span>
          </p>
        </div>
      )}

      {/* Issue 2: Error state (Offline + Useful message) */}
      {state === "error" && (
        <div className="mt-3">
          <p className="mb-1">
            <strong>System Status: </strong>
            <span className="text-danger fw-bold">Offline</span>
          </p>
          <div className="alert alert-danger py-2 px-3 mt-2" role="alert">
            {errorMessage || "Unable to reach the server. Please try again later."}
          </div>
        </div>
      )}

      {/* TODO(Issue 4): render loading / success (Online + categories) / error (Offline) states. */}
    </div>
  );
}