import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Adaptive modal: iOS/Android-style swipe-to-dismiss bottom sheet on mobile,
 * centered dialog on desktop. Same API for both.
 */
export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
  className = "",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
        <DrawerContent
          className={`max-h-[var(--sheet-max-height)] rounded-t-3xl border-border/60 ${className}`}
        >
          <DrawerHeader className={title || description ? "text-left" : "sr-only"}>
            <DrawerTitle className={title ? "font-display text-xl" : "sr-only"}>{title ?? "Dialogas"}</DrawerTitle>
            <DrawerDescription className={description ? "text-sm" : "sr-only"}>{description ?? ""}</DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
          {footer && <DrawerFooter className="pt-0">{footer}</DrawerFooter>}
        </DrawerContent>
      </Drawer>
    );
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-h-[88vh] overflow-y-auto rounded-3xl sm:max-w-lg ${className}`}>
        <DialogHeader className={title || description ? undefined : "sr-only"}>
          <DialogTitle className={title ? "font-display text-xl" : "sr-only"}>{title ?? "Dialogas"}</DialogTitle>
          <DialogDescription className={description ? undefined : "sr-only"}>{description ?? ""}</DialogDescription>
        </DialogHeader>
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
