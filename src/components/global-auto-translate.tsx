import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { translateTexts } from "@/lib/translate.functions";
import { useLanguage } from "@/lib/use-language";

const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE"]);
const ATTRS = ["placeholder", "aria-label", "title", "alt"] as const;
const originals = new WeakMap<Node, string>();
const attributeOriginals = new WeakMap<Element, Map<string, string>>();
const cache = new Map<string, string>();

function translatableTextNodes(root: ParentNode): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      const text = node.textContent?.trim();
      if (!parent || !text || SKIP.has(parent.tagName) || parent.closest("[data-no-auto-translate], [contenteditable='true']")) {
        return NodeFilter.FILTER_REJECT;
      }
      return /[A-Za-zĄČĘĖĮŠŲŪŽąčęėįšųūžА-Яа-яЁё]/.test(text) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  let node = walker.nextNode();
  while (node) {
    nodes.push(node as Text);
    node = walker.nextNode();
  }
  return nodes;
}

/** Translates every visible static and database-driven text node after language changes. */
export function GlobalAutoTranslate() {
  const { lang } = useLanguage();
  const call = useServerFn(translateTexts);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const translatePage = async () => {
      const nodes = translatableTextNodes(document.body);
      const attributes: Array<{ element: Element; attr: typeof ATTRS[number]; source: string }> = [];
      document.body.querySelectorAll("[placeholder], [aria-label], [title], img[alt]").forEach((element) => {
        if (element.closest("[data-no-auto-translate]")) return;
        for (const attr of ATTRS) {
          const value = element.getAttribute(attr)?.trim();
          if (!value) continue;
          const saved = attributeOriginals.get(element) ?? new Map<string, string>();
          if (!saved.has(attr)) saved.set(attr, value);
          attributeOriginals.set(element, saved);
          const source = saved.get(attr) ?? value;
          if (/[A-Za-zĄČĘĖĮŠŲŪŽąčęėįšųūžА-Яа-яЁё]/.test(source)) attributes.push({ element, attr, source });
        }
      });

      const textSources = nodes.map((node) => {
        const source = originals.get(node) ?? node.textContent ?? "";
        originals.set(node, source);
        return source;
      });
      if (lang === "lt") {
        observer.disconnect();
        nodes.forEach((node, index) => { node.textContent = textSources[index] ?? ""; });
        attributes.forEach(({ element, attr, source }) => element.setAttribute(attr, source));
        observer.observe(document.body, { childList: true, subtree: true });
        return;
      }

      const sources = [...textSources, ...attributes.map((item) => item.source)];
      const unique = Array.from(new Set(sources.filter((text) => text.trim())));
      for (let index = 0; index < unique.length; index += 300) {
        const batch = unique.slice(index, index + 300);
        const missing = batch.filter((text) => !cache.has(`${lang}:${text}`));
        if (missing.length) {
          const result = await call({ data: { lang: lang as "en" | "ru", texts: missing } });
          missing.forEach((source, itemIndex) => cache.set(`${lang}:${source}`, result.items[itemIndex] ?? source));
        }
      }
      if (stopped) return;
      observer.disconnect();
      nodes.forEach((node, index) => { node.textContent = cache.get(`${lang}:${textSources[index]}`) ?? textSources[index]; });
      attributes.forEach(({ element, attr, source }) => element.setAttribute(attr, cache.get(`${lang}:${source}`) ?? source));
      observer.observe(document.body, { childList: true, subtree: true });
    };

    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void translatePage(), 80);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    schedule();
    return () => {
      stopped = true;
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [call, lang]);

  return null;
}