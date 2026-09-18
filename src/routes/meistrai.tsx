import { createFileRoute } from "@tanstack/react-router";
import { ProviderDirectory } from "@/components/provider-directory";

export const Route = createFileRoute("/meistrai")({
  component: () => (
    <ProviderDirectory
      kind="specialist"
      title="Individualūs meistrai"
      lead="Visi individualūs grožio meistrai – su kuo dirba, kokias paslaugas teikia. Registruotis galima pas meistrus su PRO naryste."
    />
  ),
  head: () => ({
    meta: [
      { title: "Individualūs grožio meistrai · PaslaugosGrožiui" },
      { name: "description", content: "Individualių grožio meistrų profiliai – paslaugos, kainos, prekės ženklai ir registracija." },
      { property: "og:title", content: "Individualūs grožio meistrai" },
      { property: "og:description", content: "Naršyk meistrų profilius ir registruokis pas PRO narystę turinčius meistrus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
