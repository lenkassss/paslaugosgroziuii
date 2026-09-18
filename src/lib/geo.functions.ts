import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type AddressSuggestion = {
  label: string;
  street: string;
  houseNumber: string;
  city: string;
  postcode: string;
  lat: number;
  lng: number;
};

// Lithuania-only address lookup, proxied server-side so no key/UA leaks to the browser.
export const suggestAddress = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ q: z.string().trim().min(3).max(120), city: z.string().trim().max(80).optional() }).parse(d))
  .handler(async ({ data }) => {
    const query = [data.q, data.city].filter(Boolean).join(", ");
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("countrycodes", "lt");
    url.searchParams.set("limit", "7");
    url.searchParams.set("accept-language", "lt");

    try {
      const res = await fetch(url.toString(), {
        headers: { "User-Agent": "PaslaugosGrožiui/1.0 (address autocomplete)", Accept: "application/json" },
      });
      if (!res.ok) return { suggestions: [] as AddressSuggestion[] };
      const json = (await res.json()) as Array<{
        display_name?: string;
        lat: string;
        lon: string;
        address?: Record<string, string>;
      }>;
      const suggestions: AddressSuggestion[] = (json ?? []).map((r) => {
        const a = r.address ?? {};
        const street = a["road"] ?? a["pedestrian"] ?? a["neighbourhood"] ?? "";
        const houseNumber = a["house_number"] ?? "";
        const city = a["city"] ?? a["town"] ?? a["village"] ?? a["municipality"] ?? "";
        const postcode = a["postcode"] ?? "";
        const short = [street && houseNumber ? `${street} ${houseNumber}` : street, city].filter(Boolean).join(", ");
        return {
          label: short || (r.display_name ?? ""),
          street,
          houseNumber,
          city,
          postcode,
          lat: Number(r.lat),
          lng: Number(r.lon),
        };
      }).filter((sg) => !!sg.label);
      // de-duplicate identical labels
      const seen = new Set<string>();
      return { suggestions: suggestions.filter((sg) => (seen.has(sg.label) ? false : (seen.add(sg.label), true))) };
    } catch {
      return { suggestions: [] as AddressSuggestion[] };
    }
  });
