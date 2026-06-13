/**
 * Manus Public API v2 helper.
 *
 * Pattern: POST /task.create → poll GET /task.listMessages until agent_status=stopped.
 * Auth: x-manus-api-key header (NOT Bearer).
 *
 * Reference: /var/www/hackathon-singapore/MANUS_BUILD_GUIDE.md
 */

const BASE = "https://api.manus.ai/v2";

function extractJson(text: string): unknown {
  // Strip markdown code fences
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  // Try direct parse
  try { return JSON.parse(cleaned); } catch {}

  // Find the outermost JSON object in the text
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch {}
  }

  return null;
}

export type ManusProgressFn = (message: string, detail: string, pct: number) => void;

export type ManusTaskOptions = {
  timeoutMs?: number;
  pollMs?: number;
  onProgress?: ManusProgressFn;
};

export async function manusTask<T>(
  prompt: string,
  schema: Record<string, unknown>,
  options: ManusTaskOptions = {}
): Promise<T> {
  const { timeoutMs = 180_000, pollMs = 3_000, onProgress } = options;

  const apiKey = process.env.MANUS_API_KEY;
  if (!apiKey) throw new Error("MANUS_API_KEY is not configured");

  const hdrs: Record<string, string> = {
    "Content-Type": "application/json",
    "x-manus-api-key": apiKey,
  };

  onProgress?.("Creating Manus task...", "Initializing AI agent", 22);

  const createRes = await fetch(`${BASE}/task.create`, {
    method: "POST",
    headers: hdrs,
    body: JSON.stringify({
      message: { content: prompt },
      structured_output_schema: schema,
    }),
  });

  if (!createRes.ok) {
    const txt = await createRes.text().catch(() => "");
    throw new Error(`Manus task.create failed (${createRes.status}): ${txt}`);
  }

  const created: any = await createRes.json();
  if (!created.ok) throw new Error(`Manus: ${created.error?.message ?? "task.create error"}`);

  const taskId: string = created.task_id;
  onProgress?.("Agent started", "Manus is processing your request", 30);

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, pollMs));

    const pollRes = await fetch(
      `${BASE}/task.listMessages?task_id=${encodeURIComponent(taskId)}&order=desc&limit=20`,
      { headers: hdrs }
    );

    // Task not registered yet — retry silently
    if (pollRes.status === 404) continue;

    if (!pollRes.ok) {
      const txt = await pollRes.text().catch(() => "");
      throw new Error(`Manus poll failed (${pollRes.status}): ${txt}`);
    }

    const poll: any = await pollRes.json();
    if (!poll.ok) throw new Error(`Manus poll error: ${poll.error?.message}`);

    const msgs: any[] = poll.messages ?? [];
    const statusEvent = msgs.find(m => m.type === "status_update");
    const agentStatus = statusEvent?.status_update?.agent_status;

    if (agentStatus === "running" || agentStatus === "waiting") {
      const brief = statusEvent?.status_update?.brief ?? "Manus is working...";
      const detail = statusEvent?.status_update?.description ?? "Processing";
      const elapsed = Date.now() - (deadline - timeoutMs);
      const pct = Math.min(82, 30 + Math.floor((elapsed / timeoutMs) * 60));
      onProgress?.(brief, detail, pct);
      continue;
    }

    if (agentStatus === "error") throw new Error("Manus agent reported an error");

    if (agentStatus !== "stopped") continue;

    onProgress?.("Agent finished", "Extracting structured output", 88);

    const assistantMsg = msgs.find(m => m.type === "assistant_message");
    const structured = assistantMsg?.assistant_message?.structured_output_result;

    // Priority 1: structured output (most reliable)
    if (structured?.success && structured.value != null) return structured.value as T;

    // Priority 2: structured output value even if success=false
    if (structured?.value != null) {
      try {
        const v = typeof structured.value === "string" ? JSON.parse(structured.value) : structured.value;
        return v as T;
      } catch {}
    }

    // Priority 3: extract JSON from raw text content
    const content = assistantMsg?.assistant_message?.content;
    if (content) {
      const extracted = extractJson(content);
      if (extracted != null) return extracted as T;
    }

    // Log raw messages for debugging
    console.error("[Manus] Could not extract output. Raw messages:", JSON.stringify(msgs.slice(0, 3), null, 2));
    throw new Error("Manus: agent stopped but returned no parseable output");
  }

  throw new Error(`Manus: timed out after ${Math.round(timeoutMs / 1000)}s`);
}
