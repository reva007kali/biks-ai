import { describe, expect, it } from "vitest";

describe("API secrets validation", () => {
  it("EXA_API_KEY is set", () => {
    expect(process.env.EXA_API_KEY).toBeDefined();
    expect(process.env.EXA_API_KEY!.length).toBeGreaterThan(5);
  });

  it("MEM0_API_KEY is set", () => {
    expect(process.env.MEM0_API_KEY).toBeDefined();
    expect(process.env.MEM0_API_KEY!.length).toBeGreaterThan(5);
  });

  it("RESEND_API_KEY is set", () => {
    expect(process.env.RESEND_API_KEY).toBeDefined();
    expect(process.env.RESEND_API_KEY!.length).toBeGreaterThan(5);
  });
});
