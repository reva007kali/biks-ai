import type { BusinessProfile } from "../App";

interface Props {
  business: BusinessProfile;
  onNext: () => void;
}

export default function DashboardStep({ business, onNext }: Props) {
  return (
    <div style={{ padding: "0 32px 48px", animation: "fadeIn 0.3s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 0 20px" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f0f0f0" }}>{business.companyName}</h1>
          <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{business.website}</p>
        </div>
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
          Next: Add Memory →
        </button>
      </div>

      {/* Bento Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, paddingTop: 8 }}>
        {/* Summary Card */}
        <div style={{ background: "#1c1c1e", border: "1px solid #2a2a2a", borderRadius: 16, padding: "28px 30px 32px" }}>
          <DashIcon type="summary" />
          <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.2, marginBottom: 12 }}>
            Company Summary
          </h3>
          <p style={{ fontSize: 15, color: "#888", lineHeight: 1.75 }}>{business.summary}</p>
        </div>

        {/* Value Proposition Card */}
        <div style={{ background: "#1c1c1e", border: "1px solid #2a2a2a", borderRadius: 16, padding: "28px 30px 32px" }}>
          <DashIcon type="value" />
          <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.2, marginBottom: 12 }}>
            Value Proposition
          </h3>
          <p style={{ fontSize: 15, color: "#888", lineHeight: 1.75 }}>{business.valueProposition}</p>
        </div>

        {/* Products Card */}
        <div style={{ background: "#1c1c1e", border: "1px solid #2a2a2a", borderRadius: 16, padding: "28px 30px 32px" }}>
          <DashIcon type="products" />
          <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.2, marginBottom: 12 }}>
            Products & Services
          </h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {business.products.map((p, i) => (
              <li key={i} style={{
                fontSize: 15, color: "#888", padding: "11px 0",
                borderBottom: i < business.products.length - 1 ? "1px solid #242424" : "none",
                display: "flex", alignItems: "center", gap: 12, lineHeight: 1.4,
              }}>
                <span style={{ color: "#555", fontSize: 20, flexShrink: 0 }}>•</span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Current Segments Card */}
        <div style={{ background: "#1c1c1e", border: "1px solid #2a2a2a", borderRadius: 16, padding: "28px 30px 32px" }}>
          <DashIcon type="segments" />
          <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.2, marginBottom: 12 }}>
            Current Segments
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {business.currentSegments.map((s, i) => (
              <span key={i} style={{
                background: "#1c1c1c",
                border: "1px solid #2a2a2a",
                borderRadius: 6,
                padding: "3px 10px",
                fontSize: 12,
                color: "#666",
              }}>
                {s}
              </span>
            ))}
          </div>
          {/* Proof Points */}
          <h4 style={{ fontSize: 13, fontWeight: 600, color: "#888", marginTop: 20, marginBottom: 8 }}>Proof Points</h4>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {business.proofPoints.map((p, i) => (
              <li key={i} style={{
                fontSize: 14, color: "#777", padding: "8px 0",
                borderBottom: i < business.proofPoints.length - 1 ? "1px solid #242424" : "none",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ color: "#3ecf8e", fontSize: 12 }}>✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Expansion Opportunities */}
      <div style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#f0f0f0", marginBottom: 14 }}>
          Expansion Opportunities
        </h3>
        {business.expansionCategories.map((cat, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px",
            background: "#242424", border: "1px solid #2e2e2e",
            borderRadius: 10, marginBottom: 6,
          }}>
            <div>
              <span style={{ fontSize: 15, color: "#f0f0f0", fontWeight: 400 }}>{cat.name}</span>
              <p style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{cat.salesAngle}</p>
            </div>
            <span style={{ color: "#555", fontSize: 18 }}>→</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashIcon({ type }: { type: string }) {
  return (
    <div style={{
      width: 52, height: 52, borderRadius: 14, background: "#2a2a2a",
      display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
    }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {type === "summary" && <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>}
        {type === "value" && <><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>}
        {type === "products" && <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></>}
        {type === "segments" && <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}
      </svg>
    </div>
  );
}
