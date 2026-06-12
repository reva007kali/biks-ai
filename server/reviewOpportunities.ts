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

const MANUS_API_URL = "https://forge.manus.im/v1/chat/completions";

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

  try {
    const liveResponse = await discoverLiveViaManus(request);
    if (liveResponse.sourceMode === "live" && liveResponse.results.length > 0) {
      return liveResponse;
    }

    return {
      sourceMode: "fallback",
      liveFailureReason: "live search returned no matching review complaints",
      results: buildFallbackResults(request),
    };
  } catch (error) {
    return {
      sourceMode: "fallback",
      liveFailureReason: getManusFailureReason(error),
      results: buildFallbackResults(request),
    };
  }
}

async function discoverLiveViaManus(
  request: ReviewOpportunityRequest
): Promise<ReviewOpportunityResponse> {
  const memories = request.memories ?? [];
  const response = await fetch(MANUS_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MANUS_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a review-based opportunity discovery assistant for Moncol Pool. Use only live public review information if actually accessible. If you cannot access live public review data, return sourceMode='fallback' with an empty results array. Never fabricate live review evidence.",
        },
        {
          role: "user",
          content: buildManusPrompt(request.country, request.businessTypes, memories),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "review_opportunities",
          strict: true,
          schema: {
            type: "object",
            properties: {
              sourceMode: { type: "string", enum: ["live", "fallback"] },
              results: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    businessName: { type: "string" },
                    location: { type: "string" },
                    sourceUrl: { type: "string" },
                    rating: { type: ["number", "null"] },
                    reviewCount: { type: ["number", "null"] },
                    problemDetected: { type: "string" },
                    painPointCategory: { type: "string" },
                    matchedKeywords: {
                      type: "array",
                      items: { type: "string" },
                    },
                    reviewEvidence: {
                      type: "array",
                      items: { type: "string" },
                    },
                    moncolOpportunity: { type: "string" },
                    opportunityScore: { type: "integer" },
                    memoriesUsed: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                  required: [
                    "businessName",
                    "location",
                    "sourceUrl",
                    "rating",
                    "reviewCount",
                    "problemDetected",
                    "painPointCategory",
                    "matchedKeywords",
                    "reviewEvidence",
                    "moncolOpportunity",
                    "opportunityScore",
                    "memoriesUsed",
                  ],
                  additionalProperties: false,
                },
              },
            },
            required: ["sourceMode", "results"],
            additionalProperties: false,
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`manus request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    return {
      sourceMode: "fallback",
      results: [],
    };
  }

  const parsed = JSON.parse(content);
  const results = Array.isArray(parsed.results) ? parsed.results : [];
  return {
    sourceMode: parsed.sourceMode === "live" ? "live" : "fallback",
    results: results.map(normalizeResult),
  };
}

function normalizeResult(result: Record<string, unknown>): ReviewOpportunityResult {
  return {
    businessName: String(result.businessName ?? ""),
    location: String(result.location ?? ""),
    sourceUrl: String(result.sourceUrl ?? ""),
    rating: typeof result.rating === "number" ? result.rating : null,
    reviewCount: typeof result.reviewCount === "number" ? result.reviewCount : null,
    problemDetected: String(result.problemDetected ?? ""),
    painPointCategory: String(result.painPointCategory ?? ""),
    matchedKeywords: Array.isArray(result.matchedKeywords)
      ? result.matchedKeywords.map((item) => String(item))
      : [],
    reviewEvidence: Array.isArray(result.reviewEvidence)
      ? result.reviewEvidence.map((item) => String(item))
      : [],
    moncolOpportunity: String(result.moncolOpportunity ?? ""),
    opportunityScore: clampScore(typeof result.opportunityScore === "number" ? result.opportunityScore : 1),
    memoriesUsed: Array.isArray(result.memoriesUsed)
      ? result.memoriesUsed.map((item) => String(item))
      : [],
  };
}

function clampScore(score: number) {
  return Math.max(1, Math.min(5, Math.round(score)));
}

function getManusFailureReason(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const statusMatch = message.match(/status\s+(\d{3})/i);
  if (statusMatch?.[1]) {
    return `manus request failed with status ${statusMatch[1]}`;
  }
  return "manus request failed with status 0";
}

function buildManusPrompt(country: string, businessTypes: string[], memories: string[]) {
  return `Find Moncol Pool sales opportunities from public review complaints.

Country: ${country}
Business types: ${businessTypes.join(", ")}

Primary keywords:
- water
- dirty
- filter

Secondary keywords:
- pool
- maintenance
- hygiene
- chlorine
- smell
- clean
- unclean
- jacuzzi
- spa
- sauna
- broken
- water quality

Memories for ranking context:
${memories.length > 0 ? memories.map((memory, idx) => `${idx + 1}. ${memory}`).join("\n") : "None"}

Return live opportunities only if you actually have access to public review evidence and source URLs.
If you cannot access live public review data, return:
{
  "sourceMode": "fallback",
  "results": []
}

If you do return live results:
- focus on Singapore spa / wellness / recovery businesses
- identify complaint-driven sales signals
- include only relevant review snippets
- map each complaint to a Moncol opportunity
- use memories as ranking context
- keep opportunityScore between 1 and 5`;
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
