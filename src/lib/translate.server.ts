const LANG_NAMES: Record<string, string> = {
  lt: "Lithuanian",
  en: "English",
  ru: "Russian",
};

export async function translateBatch(texts: string[], lang: string): Promise<string[]> {
  const key = process.env["TRANSLATION_API_KEY"];
  const endpoint = process.env["TRANSLATION_API_URL"];
  const model = process.env["TRANSLATION_MODEL"] || "translation";
  const target = LANG_NAMES[lang];

  if (!key || !endpoint || !target || texts.length === 0) return texts;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              `Translate every string in the JSON array to ${target}. ` +
              'Keep the array order and length identical. Keep brand names, prices, numbers and emoji as-is. ' +
              'Reply with JSON only, in the shape {"items":["...","..."]}.',
          },
          { role: "user", content: JSON.stringify(texts) },
        ],
      }),
    });

    if (!res.ok) return texts;
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return texts;

    const parsed = JSON.parse(match[0]) as { items?: unknown };
    const items = Array.isArray(parsed.items)
      ? parsed.items.map((x) => String(x ?? ""))
      : null;

    if (!items || items.length !== texts.length) return texts;
    return items.map((value, index) => (value.trim() ? value : texts[index]!));
  } catch {
    return texts;
  }
}
