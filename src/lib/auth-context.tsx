import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Penkios sistemos rolės (+ administratoriai): klientas, meistrė/salonas, tiekėjas, mokykla, skelbikas. */
export type AppRole = "client" | "staff" | "salon" | "supplier" | "school" | "advertiser" | "admin" | "super_admin";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  realRole: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setDemoRole: (r: AppRole | null) => void;
};

const Ctx = createContext<AuthCtx>({
  user: null, session: null, role: null, realRole: null, loading: true,
  signOut: async () => {},
  setDemoRole: () => {},
});

const DEMO_KEY = "ab_demo_role_override";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [demoRole, setDemoRoleState] = useState<AppRole | null>(() => {
    if (typeof window === "undefined") return null;
    const v = window.localStorage.getItem(DEMO_KEY);
    return v ? (v as AppRole) : null;
  });
  const [loading, setLoading] = useState(true);

  const resolveRole = async (uid: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    const roles = (data ?? []).map((r) => r.role as AppRole);
    const priority: AppRole[] = ["super_admin", "admin", "salon", "staff", "school", "supplier", "advertiser", "client"];
    setRole(priority.find((p) => roles.includes(p)) ?? null);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => { resolveRole(s.user.id); }, 0);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) await resolveRole(data.session.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const setDemoRole = (r: AppRole | null) => {
    setDemoRoleState(r);
    if (typeof window !== "undefined") {
      if (r) window.localStorage.setItem(DEMO_KEY, r);
      else window.localStorage.removeItem(DEMO_KEY);
    }
  };

  // Demo role override is allowed only for admin/salon (primary owner check happens in widget).
  const effectiveRole = demoRole && (role === "super_admin" || role === "admin" || role === "salon") ? demoRole : role;

  return (
    <Ctx.Provider value={{
      user: session?.user ?? null,
      session,
      role: effectiveRole,
      realRole: role,
      loading,
      signOut: async () => { setDemoRole(null); await supabase.auth.signOut(); },
      setDemoRole,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
