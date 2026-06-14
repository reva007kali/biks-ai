import { supabase, isSupabaseConfigured } from "./supabase";

/**
 * Drop-in replacement for `fetch` when calling our own `/api/*` endpoints.
 * Attaches the current Supabase access token as a Bearer header so the backend
 * can authenticate the request. Falls back to a plain fetch when Supabase isn't
 * configured (local dev without keys).
 */
export async function apiFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);

  if (isSupabaseConfigured) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
}
