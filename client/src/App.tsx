import { useState } from "react";
import { checkSystem, Category } from "./api.js";

// UI states for Issue 4: idle, loading, success, error.
type UiState = "idle" | "loading" | "success" | "error";

export default function App() {
  const [state, setState] = useState<UiState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  async function handleCheck() {
    setState("loading");
    setErrorMessage(null);

    try {
      // Issue 4: Call checkSystem() which fetches both health and categories
      const result = await checkSystem();
      setCategories(result.categories);
      setState("success");
    } catch (_err) {
      setState("error");
      setErrorMessage("TokTickIT API is currently unavailable");
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
        <div className="mt-3 text-secondary">Checking system health…</div>
      )}

      {/* Success state: Online + Dynamic Categories */}
      {state === "success" && (
        <div className="mt-3">
          <p className="mb-2">
            <strong>System Status: </strong>
            <span className="text-success fw-bold">Online</span>
          </p>

          <h2 className="h5 mt-3 mb-2">Available Categories</h2>
          <ul className="list-group">
            {categories.map((cat) => (
              <li key={cat.id} className="list-group-item">
                {cat.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error state: Offline */}
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
    </div>
  );
}