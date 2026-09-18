import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Luxury toast surface: deep dark glass panel with a subtle gold hairline,
 * display typography and no harsh red alert boxes.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      gap={10}
      offset={16}
      toastOptions={{
        duration: 4200,
        classNames: {
          toast:
            "group toast !rounded-2xl !border !border-primary/25 !bg-[oklch(0.17_0.015_60_/_0.94)] !text-[oklch(0.97_0.01_80)] !shadow-[0_18px_50px_-18px_rgba(0,0,0,0.65)] !backdrop-blur-xl !px-4 !py-3.5 !gap-3",
          title: "font-display !text-[0.95rem] !font-medium tracking-tight",
          description: "!text-[0.8rem] !text-[oklch(0.97_0.01_80_/_0.66)] !leading-relaxed",
          icon: "!text-primary",
          actionButton:
            "!rounded-full !border !border-primary/40 !bg-primary/15 !px-3 !py-1.5 !text-[0.75rem] !font-medium !text-primary hover:!bg-primary/25 transition",
          cancelButton:
            "!rounded-full !bg-transparent !text-[0.75rem] !text-[oklch(0.97_0.01_80_/_0.55)] hover:!text-[oklch(0.97_0.01_80)]",
          closeButton:
            "!border-primary/25 !bg-[oklch(0.17_0.015_60)] !text-[oklch(0.97_0.01_80_/_0.7)]",
          error: "!border-primary/30",
          success: "!border-primary/30",
          warning: "!border-primary/30",
          info: "!border-primary/25",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
