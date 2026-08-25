import { useState } from "react";
import { checkSystem, Category } from "./api";

export function App() {
  const [status, setStatus] = useState<"idle" | "loading" | "online" | "offline">("idle");
  const [categories, setCategories] = useState<Category[]>([]);

  const handleCheckSystem = async () => {
    setStatus("loading");
    try {
      const data = await checkSystem();
      setCategories(data.categories);
      setStatus("online");
    } catch {
      setStatus("offline");
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-4">TokTickIT IT Service Desk</h1>
      <button 
        className="btn btn-success" 
        onClick={handleCheckSystem}
        disabled={status === "loading"}
      >
        Check System
      </button>

      <div className="mt-3">
        {status === "loading" && <p>Checking system...</p>}
        
        {status === "online" && (
          <div>
            <p>System Status: <span className="text-success fw-bold">Online</span></p>
            <ul>
              {categories.map((cat) => (
                <li key={cat.id}>{cat.name}</li>
              ))}
            </ul>
          </div>
        )}

        {status === "offline" && (
          <div>
            <p>System Status: <span className="text-danger fw-bold">Offline</span></p>
            <div className="alert alert-danger">
              TokTickIT API is currently unavailable
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;