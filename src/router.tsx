import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter, createHashHistory } from "@tanstack/react-router";
import { toast } from "sonner";
import { friendlyError } from "@/lib/error-messages";
import { routeTree } from "./routeTree.gen";
import { RouteErrorScreen, isNetworkError, isAuthError } from "@/components/app-error-boundary";
import { RoutePendingScreen } from "@/components/route-pending-screen";
import {
  ensureNativeRootHash,
  installNativeBackendBridge,
  isNativeRuntime,
} from "@/lib/native-backend";

export const getRouter = () => {
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: (attempt, error) => isNetworkError(error) && attempt < 2,
        retryDelay: (attempt) => Math.min(1200 * 2 ** attempt, 5000),
        staleTime: 30_000,
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Signed-out visitors browsing public content must never see an auth error.
        if (isAuthError(error)) return;
        const network = isNetworkError(error);
        // One single toast, even when several queries fail at once.
        const friendly = friendlyError(error);
        if (!network && friendly.silent) return;
        toast.error(network ? "Nepavyko užkrauti duomenų" : friendly.title, {
          id: network ? "network-error" : "data-error",
          description: network
            ? "Patikrink interneto ryšį ir bandyk dar kartą."
            : friendly.description,
          action: {
            label: "Bandyti vėl",
            onClick: () => {
              toast.dismiss(network ? "network-error" : "data-error");
              void queryClient.refetchQueries({ queryKey: query.queryKey });
            },
          },
        });
      },
    }),

  });

  // Native package: absolute backend URLs + a hash location to boot "/" from.
  installNativeBackendBridge();
  ensureNativeRootHash();


  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPreload: "intent",
    defaultErrorComponent: RouteErrorScreen,
    defaultPendingComponent: RoutePendingScreen,
    defaultPendingMs: 150,
    defaultPendingMinMs: 300,
    ...(isNativeRuntime() ? { history: createHashHistory() } : {}),
  });

  return router;
};

