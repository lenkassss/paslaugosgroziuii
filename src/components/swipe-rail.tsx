import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Luxury horizontal rail: snap scrolling, edge fade masks and desktop arrow
 * controls. Keeps cards from being visually "cut off" at the viewport edge.
 */
export function SwipeRail({
  children,
  className = "",
  itemWidth = 340,
  flush = false,
  fade = false,
}: {
  children: ReactNode;
  className?: string;
  itemWidth?: number;
  /** When true the rail keeps its own padding instead of bleeding to the screen edges. */
  flush?: boolean;
  /** Edge fade masks — only safe on plain `background` surfaces. */
  fade?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const nudge = (dir: 1 | -1) => {
    ref.current?.scrollBy({ left: dir * (itemWidth + 16), behavior: "smooth" });
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={ref}
        data-drag-scroll
        className={`no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] ${
          flush ? "px-3" : "-mx-4 px-4 md:-mx-1 md:px-1"
        }`}
      >
        {children}
      </div>


      {/* edge fades (opt-in — they would paint light bands over tinted sections) */}
      {fade && (
        <>
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent transition-opacity duration-300 ${atStart ? "opacity-0" : "opacity-100"}`}
          />
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-background to-transparent transition-opacity duration-300 ${atEnd ? "opacity-0" : "opacity-100"}`}
          />
        </>
      )}

      {/* desktop arrows */}
      <button
        type="button"
        aria-label="Ankstesni"
        onClick={() => nudge(-1)}
        className={`absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border/60 bg-background/90 shadow-elegant backdrop-blur-md transition hover:border-primary/50 md:grid ${atStart ? "pointer-events-none opacity-0" : "opacity-100"}`}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Sekantys"
        onClick={() => nudge(1)}
        className={`absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border/60 bg-background/90 shadow-elegant backdrop-blur-md transition hover:border-primary/50 md:grid ${atEnd ? "pointer-events-none opacity-0" : "opacity-100"}`}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
