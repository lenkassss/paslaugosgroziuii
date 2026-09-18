import { createFileRoute } from "@tanstack/react-router";
import { useSection } from "@/lib/use-site-content";
import { Card } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";
import { SiteBlocks } from "@/components/site-blocks";

export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => ({
    meta: [
      { title: "Kontaktai – PaslaugosGrožiui" },
      { name: "description", content: "Susisiek su Auksinio grožio komanda. Palaikymas, partnerystė, spauda." },
    ],
  }),
});

function Contact() {
  const block = useSection("contact", "intro");
  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-16">
      <h1 className="font-display text-4xl md:text-5xl">{block?.title || "Kontaktai"}</h1>
      <p className="mt-2 text-muted-foreground">{block?.subtitle || "Rašyk, skambink arba užsuk pas mus."}</p>
      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        <Card className="p-6">
          <Mail className="h-6 w-6 text-primary mb-2" />
          <div className="text-sm text-muted-foreground">El. paštas</div>
          <div className="font-medium">labas@auksinis.lt</div>
        </Card>
        <Card className="p-6">
          <Phone className="h-6 w-6 text-primary mb-2" />
          <div className="text-sm text-muted-foreground">Telefonas</div>
          <div className="font-medium">+370 600 00000</div>
        </Card>
        <Card className="p-6">
          <MapPin className="h-6 w-6 text-primary mb-2" />
          <div className="text-sm text-muted-foreground">Adresas</div>
          <div className="font-medium">Vilnius, Lietuva</div>
        </Card>
      </div>
      <SiteBlocks page="contact" />
    </div>
  );
}
