import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const supabaseAnonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;

const isBrowser = typeof window !== "undefined";

/** Null when Supabase env vars aren't configured (e.g. local dev without .env). */
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: isBrowser,
          // Only the browser has localStorage; SSR falls back to the client's default
          // in-memory storage so the module can still be imported on the server.
          ...(isBrowser ? { storage: window.localStorage } : {}),
        },
      })
    : null;
