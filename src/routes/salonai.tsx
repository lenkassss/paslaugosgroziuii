import { createFileRoute } from "@tanstack/react-router";
import { ProviderDirectory } from "@/components/provider-directory";

export const Route = createFileRoute("/salonai")({
  component: () => (
    <ProviderDirectory
      kind="salon"
      title="Grožio salonai"
      lead="Naršyk visus salonus – paslaugas, prekės ženklus su kuriais dirba ir darbus. Registruotis galima pas salonus su PRO naryste."
    />
  ),
  head: () => ({
    meta: [
      { title: "Grožio salonai Lietuvoje · PaslaugosGrožiui" },
      { name: "description", content: "Visi grožio salonai vienoje vietoje – paslaugos, kainos, prekės ženklai ir laisvi laikai." },
      { property: "og:title", content: "Grožio salonai Lietuvoje" },
      { property: "og:description", content: "Naršyk salonų profilius ir registruokis pas PRO narystę turinčius salonus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
