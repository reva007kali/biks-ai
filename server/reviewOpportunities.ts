export type ReviewOpportunityRequest = {
  country: string;
  businessTypes: string[];
  memories?: string[];
};

export type ReviewOpportunityResult = {
  businessName: string;
  location: string;
  sourceUrl: string;
  rating: number | null;
  reviewCount: number | null;
  problemDetected: string;
  painPointCategory: string;
  matchedKeywords: string[];
  reviewEvidence: string[];
  moncolOpportunity: string;
  opportunityScore: number;
  memoriesUsed: string[];
};

export type ReviewOpportunityResponse = {
  sourceMode: "live" | "fallback";
  results: ReviewOpportunityResult[];
  liveFailureReason?: string;
};

const DEFAULT_MANUS_API_BASE_URL = "https://open.manus.ai";

export async function discoverReviewOpportunities(
  request: ReviewOpportunityRequest
): Promise<ReviewOpportunityResponse> {
  if (!process.env.MANUS_API_KEY) {
    return {
      sourceMode: "fallback",
      liveFailureReason: "missing MANUS_API_KEY",
      results: buildFallbackResults(request),
    };
  }

  // Manus v2 hackathon note:
  // Live task-based review discovery is intentionally not wired end-to-end yet.
  // We still resolve config here so the future Manus client uses the correct base URL
  // and auth header shape: x-manus-api-key.
  getManusConfig();

  return {
    sourceMode: "fallback",
    liveFailureReason: "manus live task API not configured",
    results: buildFallbackResults(request),
  };
}

function clampScore(score: number) {
  return Math.max(1, Math.min(5, Math.round(score)));
}

function getManusConfig() {
  return {
    baseUrl: process.env.MANUS_API_BASE_URL || DEFAULT_MANUS_API_BASE_URL,
    headers: {
      "x-manus-api-key": process.env.MANUS_API_KEY || "",
      "Content-Type": "application/json",
    },
  };
}

function buildFallbackResults(
  request: ReviewOpportunityRequest
): ReviewOpportunityResult[] {
  const memories = request.memories ?? [];

  const base = [
    {
      businessName: "Harbor Wellness Spa",
      location: "Singapore",
      sourceUrl: "https://www.google.com/maps/search/?api=1&query=Harbor+Wellness+Spa+Singapore",
      rating: null,
      reviewCount: null,
      reviewEvidence: [
        "Fallback demo data. Live Manus review discovery was unavailable, so this scenario models a complaint about dirty spa water and hygiene concerns.",
      ],
      matchedKeywords: ["water", "dirty", "spa", "hygiene"],
      problemDetected: "Dirty spa water complaint",
      painPointCategory: "Water Quality",
      moncolOpportunity: "Water treatment optimization",
    },
    {
      businessName: "Velocity Recovery Club",
      location: "Singapore",
      sourceUrl: "https://www.google.com/maps/search/?api=1&query=Velocity+Recovery+Club+Singapore",
      rating: null,
      reviewCount: null,
      reviewEvidence: [
        "Fallback demo data. This scenario models customer complaints that a recovery pool filter or circulation system was not working properly.",
      ],
      matchedKeywords: ["filter", "pool", "maintenance", "broken"],
      problemDetected: "Filter issue",
      painPointCategory: "Maintenance",
      moncolOpportunity: "Filtration maintenance service",
    },
    {
      businessName: "Luma Medical Spa",
      location: "Singapore",
      sourceUrl: "https://www.google.com/maps/search/?api=1&query=Luma+Medical+Spa+Singapore",
      rating: null,
      reviewCount: null,
      reviewEvidence: [
        "Fallback demo data. This scenario models reviews describing a strong chlorine smell and concern around water balance in wet treatment areas.",
      ],
      matchedKeywords: ["chlorine", "smell", "water quality", "spa"],
      problemDetected: "Chemical imbalance",
      painPointCategory: "Water Treatment",
      moncolOpportunity: "Water chemistry optimization",
    },
  ];

  return base.map((item) => {
    const memoriesUsed = selectRelevantMemories(memories, item.businessName, item.reviewEvidence.join(" "));
    return {
      ...item,
      memoriesUsed,
      opportunityScore: scoreOpportunity(item.businessName, item.reviewEvidence.join(" "), item.matchedKeywords, memoriesUsed),
    };
  });
}

function selectRelevantMemories(memories: string[], businessName: string, evidenceText: string) {
  const text = `${businessName} ${evidenceText}`.toLowerCase();
  return memories.filter((memory) => {
    const lower = memory.toLowerCase();
    if (lower.includes("avoid small")) return true;
    if (lower.includes("premium hospitality")) return true;
    if (lower.includes("wellness")) return text.includes("wellness") || text.includes("spa") || text.includes("recovery");
    return false;
  }).slice(0, 3);
}

function scoreOpportunity(
  businessName: string,
  evidenceText: string,
  matchedKeywords: string[],
  memoriesUsed: string[]
) {
  let score = 1;
  const text = `${businessName} ${evidenceText}`.toLowerCase();

  if (matchedKeywords.some((keyword) => ["water", "dirty", "filter"].includes(keyword))) score += 2;
  if (matchedKeywords.some((keyword) => ["pool", "spa", "sauna", "jacuzzi"].includes(keyword))) score += 1;
  if (matchedKeywords.some((keyword) => ["maintenance", "broken", "chlorine", "smell", "hygiene"].includes(keyword))) score += 1;
  if (text.includes("recovery") || text.includes("medical spa") || text.includes("wellness")) score += 1;

  for (const memory of memoriesUsed) {
    const lower = memory.toLowerCase();
    if (lower.includes("avoid small")) score -= 1;
    if (lower.includes("premium hospitality")) score += 1;
    if (lower.includes("wellness")) score += 1;
  }

  return clampScore(score);
}
