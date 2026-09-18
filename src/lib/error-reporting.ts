type ErrorContext = Record<string, unknown>;

/**
 * Bendras kliento pusės klaidų registravimas. Klaida įrašoma į konsolę su
 * papildomu kontekstu (maršrutu, klaidų ribos pavadinimu), kad būtų lengviau
 * atsekti problemą programėlėje.
 */
export function reportClientError(error: unknown, context: ErrorContext = {}) {
  if (typeof window === "undefined") return;
  try {
    console.error("[app-error]", error, {
      route: window.location.pathname,
      ...context,
    });
  } catch {
    // Registravimas niekada neturi nulaužti sąsajos.
  }
}
