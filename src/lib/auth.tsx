import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

export interface CustomerProfile {
  id: string;
  full_name: string;
  phone: string | null;
  has_ordered: boolean;
  first_purchase_coupon: string | null;
  created_at: string;
  address_zip: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
}

interface SignUpInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface AuthResult {
  error: string | null;
  /** True when Supabase requires email confirmation before a session is issued. */
  needsEmailConfirmation?: boolean;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: CustomerProfile | null;
  /** True until the first auth state (from localStorage) has been resolved. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (input: SignUpInput) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    if (!supabase) return;
    const { data } = await supabase.from("customers").select("*").eq("id", userId).maybeSingle();
    setProfile((data as CustomerProfile | null) ?? null);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        void loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback<AuthState["signIn"]>(async (email, password) => {
    if (!supabase) return { error: "Login indisponível no momento. Tente novamente mais tarde." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback<AuthState["signUp"]>(async ({ name, email, password, phone }) => {
    if (!supabase)
      return { error: "Cadastro indisponível no momento. Tente novamente mais tarde." };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, phone: phone ?? null } },
    });
    if (error) return { error: error.message };
    // Email confirmation is disabled for this project, so signUp should return a
    // session immediately. If it doesn't (e.g. confirmation gets re-enabled later),
    // surface that instead of pretending the user is logged in.
    return { error: null, needsEmailConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session) return;
    await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [session, profile, loading, signIn, signUp, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
