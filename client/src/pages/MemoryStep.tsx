import { useState, useEffect } from "react";
import type { MemoryItem } from "../App";
import { apiFetch } from "../lib/api";

interface Props {
  memories: MemoryItem[];
  setMemories: (m: MemoryItem[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function MemoryStep({ memories, setMemories, onNext, onBack }: Props) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [mem0Available, setMem0Available] = useState(false);

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    setFetching(true);
    try {
      const res = await apiFetch("/api/mem0");
      const data = await res.json();
      if (data.available && Array.isArray(data.items)) {
        setMem0Available(true);
        setMemories(data.items);
      }
    } catch {}
    setFetching(false);
  };

  const addMemory = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await apiFetch("/api/mem0", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setMemories([...memories, { id: data.id, text: input.trim() }]);
        setInput("");
      }
    } catch {}
    setLoading(false);
  };

  const deleteMemory = async (id: string) => {
    try {
      await apiFetch(`/api/mem0?id=${id}`, { method: "DELETE" });
      setMemories(memories.filter(m => m.id !== id));
    } catch {}
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 57px)", overflow: "hidden" }}>
      {/* Sidebar */}
      <div style={{
        width: 264, flexShrink: 0, background: "#111",
        borderRight: "1px solid #1e1e1e", height: "100%",
        overflowY: "auto", padding: "28px 20px",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#444", marginBottom: 8 }}>
          STEP 3
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#f0f0f0", marginBottom: 20 }}>
          Business Memory
        </div>

        <div style={{
          background: "#1a1a1a", border: "1px solid #2a2a2a",
          borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#777",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: mem0Available ? "#3ecf8e" : "#666" }} />
          {mem0Available ? "Mem0 connected" : "Mem0 offline"}
        </div>

        <div style={{ height: 1, background: "#1e1e1e", margin: "24px 0" }} />

        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#444", marginBottom: 8 }}>
          MEMORIES ({memories.length})
        </div>

        {memories.map(m => (
          <div key={m.id} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#0e1e16", border: "1px solid #2a4a37",
            borderRadius: 20, padding: "4px 12px", marginBottom: 6, fontSize: 12, color: "#3ecf8e",
          }}>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.text}</span>
            <button onClick={() => deleteMemory(m.id)} style={{
              background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 14, padding: 0,
            }}>×</button>
          </div>
        ))}

        <div style={{ marginTop: "auto", paddingTop: 20, borderTop: "1px solid #1e1e1e" }}>
          <button onClick={onBack} style={{
            background: "none", border: "none", color: "#3a3a3a", fontSize: 13, cursor: "pointer",
          }}>← Back to Analysis</button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, height: "100%", overflowY: "auto", padding: "32px 40px" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#f0f0f0", marginBottom: 8 }}>
          Add Business Memory
        </h2>
        <p style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>
          Add preferences and facts about your business. These memories will personalize lead scoring and sales materials.
        </p>

        {/* Input area */}
        <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !loading) addMemory(); }}
            placeholder="e.g., Prefer premium hospitality and wellness clients"
            style={{
              flex: 1,
              background: "#1c1c1c",
              border: "1px solid #2a2a2a",
              borderRadius: 8,
              padding: "11px 14px",
              fontSize: 14,
              color: "#f0f0f0",
              outline: "none",
              fontFamily: "'Inter', sans-serif",
            }}
          />
          <button
            onClick={addMemory}
            disabled={loading || !input.trim()}
            style={{
              background: "#3ecf8e",
              color: "#0a0d14",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading || !input.trim() ? 0.4 : 1,
              fontFamily: "'Inter', sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "Saving..." : "Save to Mem0"}
          </button>
        </div>

        {/* Memory chips display */}
        {fetching ? (
          <p style={{ color: "#555", fontSize: 13 }}>Loading memories...</p>
        ) : memories.length === 0 ? (
          <div style={{
            background: "#161616", border: "1px solid #2a2a2a", borderRadius: 12, padding: 32,
            textAlign: "center",
          }}>
            <p style={{ color: "#555", fontSize: 14 }}>No memories yet. Add your first business preference above.</p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#444", marginBottom: 12 }}>
              SAVED MEMORIES
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {memories.map(m => (
                <div key={m.id} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  borderRadius: 20, padding: "4px 12px",
                  fontSize: 12, fontWeight: 500,
                  background: "#1a2e24", border: "1px solid #2a4a37", color: "#3ecf8e",
                }}>
                  {m.text}
                  <button onClick={() => deleteMemory(m.id)} style={{
                    background: "none", border: "none", color: "#3ecf8e", cursor: "pointer", fontSize: 14, padding: 0, opacity: 0.6,
                  }}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next button */}
        <div style={{ marginTop: 40, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onNext}
            style={{
              background: "#f0f0f0",
              color: "#0f0f0f",
              border: "none",
              borderRadius: 8,
              padding: "12px 22px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Next: Find Accounts →
          </button>
        </div>
      </div>
    </div>
  );
}
