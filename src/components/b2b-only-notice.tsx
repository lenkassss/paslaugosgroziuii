import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

/** Full-page notice for B2B-only surfaces (shop, forum, rentals). */
export function B2BOnlyNotice({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20">
      <Card className="p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="font-display text-2xl">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to="/auth" search={{ mode: "signup" }}>Registruotis kaip profesionalas</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/auth" search={{ mode: "signin" }}>Prisijungti</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
