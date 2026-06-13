import { useState } from "react";
import type { BusinessProfile } from "../App";

interface Props {
  onComplete: (data: BusinessProfile) => void;
}

export default function HeroStep({ onComplete }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ pct: 0, message: "", detail: "" });
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setProgress({ pct: 0, message: "Starting analysis...", detail: "" });

    try {
      const res = await fetch("/api/analyze-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}` }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "progress") {
              setProgress({ pct: evt.pct, message: evt.message, detail: evt.detail || "" });
            }
            if (evt.type === "complete") {
              onComplete(evt.result);
              return;
            }
            if (evt.type === "error") {
              setError(evt.message);
              setLoading(false);
              return;
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setError(e.message || "Analysis failed");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg)",
    }}>
      {/* Navbar */}
      <div style={{ padding: "28px 36px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, width: 18, height: 18 }}>
          <span style={{ background: "var(--ink)", borderRadius: 1, display: "block" }} />
          <span style={{ background: "var(--ink)", borderRadius: 1, display: "block" }} />
          <span style={{ background: "var(--ink)", borderRadius: 1, display: "block" }} />
          <span style={{ background: "var(--ink)", borderRadius: 1, display: "block" }} />
        </div>
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>
          Biks.ai
        </span>
      </div>

      {/* Center content */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 80,
      }}>
        <div style={{
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--sage-strong)",
          marginBottom: 16,
          textAlign: "center",
          fontFamily: "var(--font-sans)",
        }}>
          Biks.AI Sales Agent
        </div>
        <h1 style={{
          fontSize: "clamp(28px, 4vw, 52px)",
          fontWeight: 400,
          color: "var(--ink)",
          textAlign: "center",
          marginBottom: 12,
          letterSpacing: "-0.02em",
        }}>
          Unlock new business opportunity
        </h1>
        <p style={{ fontSize: 15, color: "var(--ink-3)", marginBottom: 40, textAlign: "center" }}>
          Biks turns your existing site into market opportunities, leads, and outreach-ready sales kits.
        </p>

        {/* Input */}
        <div style={{ maxWidth: 640, width: "100%", position: "relative" }}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !loading) handleAnalyze(); }}
            placeholder="Enter your website URL"
            disabled={loading}
            style={{
              width: "100%",
              background: "var(--surface-2)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-md)",
              padding: "18px 130px 18px 24px",
              fontSize: 15,
              color: "var(--ink)",
              outline: "none",
              fontFamily: "var(--font-sans)",
            }}
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !url.trim()}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "var(--action)",
              color: "var(--action-fg)",
              border: "none",
              borderRadius: "var(--radius-md)",
              padding: "12px 22px",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading || !url.trim() ? 0.4 : 1,
              fontFamily: "var(--font-sans)",
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {/* Progress */}
        {loading && (
          <div style={{ maxWidth: 640, width: "100%", marginTop: 24, animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "var(--ink)" }}>{progress.message}</span>
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{progress.pct}%</span>
            </div>
            <div style={{ height: 2, background: "var(--surface-sunk)", borderRadius: 2 }}>
              <div style={{
                height: "100%",
                background: "var(--action)",
                borderRadius: 2,
                width: `${progress.pct}%`,
                transition: "width 0.6s ease",
              }} />
            </div>
            {progress.detail && (
              <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 8 }}>{progress.detail}</p>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ maxWidth: 640, width: "100%", marginTop: 16, padding: "12px 16px", background: "var(--danger-wash)", border: "1px solid var(--danger)", borderRadius: "var(--radius-md)" }}>
            <span style={{ fontSize: 13, color: "var(--danger-text)" }}>{error}</span>
          </div>
        )}
      </div>

      {/* Footer credit — always visible, not gated by loading state */}
      <div style={{
        textAlign: "center",
        paddingBottom: 24,
        fontSize: 12,
        color: "var(--ink-3)",
        fontFamily: "var(--font-sans)",
      }}>
        Powered by Manus, Exa and Mem0
      </div>
    </div>
  );
}
