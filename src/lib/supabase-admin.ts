import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env["VITE_SUPABASE_URL"];
const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

/**
 * Server-only Supabase client using the service role key — bypasses RLS.
 * Never import this from client code; it only works inside server functions
 * and server routes, where `process.env` holds real secrets.
 * Null when the service role key isn't configured yet.
 */
export const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;
