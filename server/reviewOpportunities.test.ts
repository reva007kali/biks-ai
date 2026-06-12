import { beforeEach, describe, expect, it, vi } from "vitest";

describe("review opportunity discovery", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    delete process.env.MANUS_API_KEY;
    delete process.env.MANUS_API_BASE_URL;
  });

  it("falls back with hackathon reason when MANUS_API_KEY exists", async () => {
    process.env.MANUS_API_KEY = "manus-key";

    const { discoverReviewOpportunities } = await import("./reviewOpportunities");
    const result = await discoverReviewOpportunities({
      country: "Singapore",
      businessTypes: ["spa"],
      memories: ["Prefer premium hospitality", "Wellness facilities are ideal"],
    });

    expect(result.sourceMode).toBe("fallback");
    expect(result.liveFailureReason).toBe("manus live task API not configured");
    expect(result.results.length).toBeGreaterThan(0);
  });

  it("falls back with missing MANUS_API_KEY reason", async () => {
    const { discoverReviewOpportunities } = await import("./reviewOpportunities");
    const result = await discoverReviewOpportunities({
      country: "Singapore",
      businessTypes: ["spa"],
      memories: [],
    });

    expect(result.sourceMode).toBe("fallback");
    expect(result.liveFailureReason).toBe("missing MANUS_API_KEY");
  });

  it("uses MANUS_API_BASE_URL when provided but still returns hackathon fallback", async () => {
    process.env.MANUS_API_KEY = "manus-key";
    process.env.MANUS_API_BASE_URL = "https://open.manus.ai";

    const { discoverReviewOpportunities } = await import("./reviewOpportunities");
    const result = await discoverReviewOpportunities({
      country: "Singapore",
      businessTypes: ["spa", "wellness"],
      memories: ["Avoid small wellness centers"],
    });

    expect(result.sourceMode).toBe("fallback");
    expect(result.liveFailureReason).toBe("manus live task API not configured");
    expect(result.results.length).toBeGreaterThan(0);
  });
});
