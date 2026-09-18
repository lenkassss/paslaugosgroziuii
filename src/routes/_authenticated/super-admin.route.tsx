import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/super-admin")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { mode: "signin" } });
    const { data: check } = await supabase.rpc("is_super_admin", { _user_id: data.user.id });
    if (!check) throw redirect({ to: "/" });
  },
  component: () => <Outlet />,
});
