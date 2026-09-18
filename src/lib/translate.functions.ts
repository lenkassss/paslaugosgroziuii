import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Translates dynamic (database-driven) copy so nothing stays untranslated. */
export const translateTexts = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        lang: z.enum(["lt", "en", "ru"]),
        texts: z.array(z.string()).max(300),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (data.lang === "lt") return { items: data.texts };
    const { translateBatch } = await import("@/lib/translate.server");
    const items = await translateBatch(data.texts, data.lang);
    return { items };
  });
