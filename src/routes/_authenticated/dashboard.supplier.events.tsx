import { createFileRoute } from "@tanstack/react-router";
import { MyEvents } from "./dashboard.salon.events";

export const Route = createFileRoute("/_authenticated/dashboard/supplier/events")({
  component: MyEvents,
});
