import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { AnnouncementBar } from "@/components/announcement-bar";

/**
 * Fiksuota viršutinė zona (antraštė + skelbimų juosta).
 *
 * Fiksuota pozicija reiškia, kad iOS „rubber band“ traukiant puslapį į viršų
 * nebeatidengia didelio tuščio tarpo — antraštė lieka vietoje. Tikslus zonos
 * aukštis publikuojamas kaip `--app-chrome-top`, todėl visos sticky juostos
 * (profilis, salono profilis, kalendorius) visada lygiuojasi tiksliai.
 */
export function HeaderStack({ showAnnouncement = true }: { showAnnouncement?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      setHeight(h);
      document.documentElement.style.setProperty("--app-chrome-top", `${h}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener("orientationchange", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", apply);
    };
  }, [showAnnouncement]);

  return (
    <>
      <div ref={ref} className="fixed inset-x-0 top-0 z-50 w-full">
        <SiteHeader />
        {showAnnouncement && <AnnouncementBar />}
      </div>
      {/* Vietos rezervavimas po fiksuota zona. */}
      <div aria-hidden="true" style={{ height: height ?? undefined }} className={height === null ? "h-[calc(4rem+env(safe-area-inset-top))]" : undefined} />
    </>
  );
}
