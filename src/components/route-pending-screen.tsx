/**
 * Luxury route-transition loader — shown while a route resolves.
 * Champagne shimmer skeleton + soft pulsing monogram, no layout jump.
 */
export function RoutePendingScreen() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6">
      <div className="relative grid h-16 w-16 place-items-center">
        <span className="absolute inset-0 rounded-full border border-primary/20" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary" />
        <span className="h-8 w-8 rounded-2xl gradient-gold animate-pulse-gold" />
      </div>
      <div className="w-full max-w-sm space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="skeleton h-3 rounded-full"
            style={{ width: `${100 - i * 18}%` }}
          />
        ))}
      </div>
    </div>
  );
}
