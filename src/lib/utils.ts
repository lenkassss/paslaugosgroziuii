import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtMoney(n: number, lang = "lt") {
  return new Intl.NumberFormat(lang === "lt" ? "lt-LT" : "en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function fmtDate(d: string | Date, lang = "lt") {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(lang === "lt" ? "lt-LT" : "en-US", {
    year: "numeric", month: "short", day: "numeric",
  }).format(date);
}

export function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}
