import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type Props = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  label?: string;
};

export function InfiniteSentinel({ hasNextPage, isFetchingNextPage, fetchNextPage, label = "Rodyti daugiau" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            fetchNextPage();
            break;
          }
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!hasNextPage) {
    return (
      <div className="py-10 text-center text-xs text-muted-foreground">
        Pasiekei srauto pabaigą · ačiū, kad skaitai ✨
      </div>
    );
  }

  return (
    <div ref={ref} className="py-8 flex justify-center">
      {isFetchingNextPage ? (
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Kraunama…
        </div>
      ) : (
        <Button variant="outline" className="border-primary/30" onClick={() => fetchNextPage()}>
          {label}
        </Button>
      )}
    </div>
  );
}
