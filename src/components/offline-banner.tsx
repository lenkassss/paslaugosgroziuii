import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Elegant offline state notice — fixed under the notch, safe-area aware.
 * Shows only while the device has no connection.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed left-0 right-0 top-0 z-[60] pt-[env(safe-area-inset-top)] animate-fade-in"
    >
      <div className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-b-2xl border border-border/50 bg-background/80 px-4 py-2 text-xs font-medium text-foreground backdrop-blur-2xl shadow-elegant">
        <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
        Nėra interneto ryšio — rodome išsaugotą turinį
      </div>
    </div>
  );
}
