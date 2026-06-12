import { beforeEach, describe, expect, it, vi } from "vitest";

describe("review opportunity discovery", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    global.fetch = originalFetch;
    delete process.env.MANUS_API_KEY;
  });

  it("returns live opportunities when Manus returns complaint-driven results", async () => {
    process.env.MANUS_API_KEY = "manus-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                sourceMode: "live",
                results: [
                  {
                    businessName: "Aqua Spa Singapore",
                    location: "Singapore",
                    sourceUrl: "https://maps.example/spa-1",
                    rating: 4.1,
                    reviewCount: 128,
                    problemDetected: "Dirty water",
                    painPointCategory: "Water Quality",
                    matchedKeywords: ["water", "dirty", "filter", "pool"],
                    reviewEvidence: ["The pool water was dirty and the filter looked broken."],
                    moncolOpportunity: "Water treatment optimization",
                    opportunityScore: 5,
                    memoriesUsed: ["Prefer premium hospitality"],
                  },
                ],
              }),
            },
          },
        ],
      }),
    }) as typeof fetch;

    const { discoverReviewOpportunities } = await import("./reviewOpportunities");
    const result = await discoverReviewOpportunities({
      country: "Singapore",
      businessTypes: ["spa"],
      memories: ["Prefer premium hospitality", "Wellness facilities are ideal"],
    });

    expect(result.sourceMode).toBe("live");
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      businessName: "Aqua Spa Singapore",
      problemDetected: "Dirty water",
      painPointCategory: "Water Quality",
      moncolOpportunity: "Water treatment optimization",
    });
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

  it("falls back with manus status reason when Manus request fails", async () => {
    process.env.MANUS_API_KEY = "manus-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    }) as typeof fetch;

    const { discoverReviewOpportunities } = await import("./reviewOpportunities");
    const result = await discoverReviewOpportunities({
      country: "Singapore",
      businessTypes: ["spa", "wellness"],
      memories: ["Avoid small wellness centers"],
    });

    expect(result.sourceMode).toBe("fallback");
    expect(result.liveFailureReason).toBe("manus request failed with status 503");
    expect(result.results.length).toBeGreaterThan(0);
  });

  it("falls back when Manus returns no matching live complaints", async () => {
    process.env.MANUS_API_KEY = "manus-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                sourceMode: "fallback",
                results: [],
              }),
            },
          },
        ],
      }),
    }) as typeof fetch;

    const { discoverReviewOpportunities } = await import("./reviewOpportunities");
    const result = await discoverReviewOpportunities({
      country: "Singapore",
      businessTypes: ["spa"],
      memories: [],
    });

    expect(result.sourceMode).toBe("fallback");
    expect(result.liveFailureReason).toBe("live search returned no matching review complaints");
  });
});
