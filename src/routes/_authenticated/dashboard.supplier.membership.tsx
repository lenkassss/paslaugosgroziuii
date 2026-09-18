import { createFileRoute } from "@tanstack/react-router";
import { MembershipView } from "./dashboard.salon.membership";

export const Route = createFileRoute("/_authenticated/dashboard/supplier/membership")({
  component: MembershipView,
});
