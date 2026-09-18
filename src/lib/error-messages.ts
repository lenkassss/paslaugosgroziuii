import { toast } from "sonner";

/**
 * Verčia technines duomenų bazės / serverio klaidas į suprantamus lietuviškus
 * paaiškinimus. Vartotojas niekada neturi matyti angliško PostgreSQL teksto.
 */
export type FriendlyError = {
  title: string;
  description?: string;
  /** Kur nukreipti vartotoją, jei klaidą galima išspręsti veiksmu. */
  action?: { label: string; to: string };
  /** 401 / nėra sesijos — pranešimo geriau nerodyti. */
  silent?: boolean;
};

const MEMBERSHIP_ACTION = { label: "Įsigyti narystę", to: "/dashboard/salon/membership" };

function raw(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message ?? "";
  const maybe = error as { message?: string; error?: string; statusText?: string };
  return maybe.message ?? maybe.error ?? maybe.statusText ?? "";
}

export function friendlyError(error: unknown): FriendlyError {
  const msg = raw(error);
  const m = msg.toLowerCase();

  if (!msg) return { title: "Nepavyko atlikti veiksmo", description: "Pabandykite dar kartą po kelių sekundžių." };

  // --- Prisijungimas / sesija ---
  if (
    m.includes("no authorization header") ||
    m.includes("unauthorized") ||
    m.includes("jwt expired") ||
    m.includes("invalid claim") ||
    m.includes("401")
  ) {
    return { title: "Sesija pasibaigė", description: "Prisijunkite dar kartą, kad galėtumėte tęsti.", action: { label: "Prisijungti", to: "/auth" }, silent: true };
  }
  if (m.includes("invalid login credentials")) {
    return { title: "Neteisingas el. paštas arba slaptažodis", description: "Patikrinkite duomenis ir bandykite dar kartą." };
  }
  if (m.includes("email not confirmed")) {
    return { title: "El. paštas nepatvirtintas", description: "Atidarykite laišką ir patvirtinkite savo el. pašto adresą." };
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return { title: "Ši paskyra jau egzistuoja", description: "Prisijunkite su savo el. paštu arba atkurkite slaptažodį." };
  }
  if (m.includes("password should be at least")) {
    return { title: "Per trumpas slaptažodis", description: "Slaptažodį sudarykite bent iš 6 simbolių." };
  }

  // --- Teisės / narystė ---
  if (m.includes("row-level security") || m.includes("permission denied") || m.includes("not allowed") || m.includes("insufficient")) {
    if (m.includes("b2b")) {
      return {
        title: "B2B tinklas dar neaktyvus",
        description: "Rašyti ir skaityti B2B srautą gali salonai, meistrės ir tiekėjai su aktyvia naryste. Pirmiausia įsigykite narystę.",
        action: MEMBERSHIP_ACTION,
      };
    }
    if (m.includes("product") || m.includes("order")) {
      return { title: "Parduotuvė prieinama tik profesionalams", description: "Ši skiltis skirta salonams, meistrėms ir tiekėjams su aktyvia naryste.", action: MEMBERSHIP_ACTION };
    }
    return {
      title: "Neturite teisių šiam veiksmui",
      description: "Šią funkciją atveria aktyvi narystė arba patvirtintas profilis. Pirmiausia užpildykite profilį ir įsigykite narystę.",
      action: MEMBERSHIP_ACTION,
    };
  }
  if (m.includes("administratoriaus teisi") || m.includes("admin")) {
    if (m.includes("reikia")) return { title: msg };
  }

  // --- Duomenų bazės apribojimai ---
  if (m.includes("plan_type_check") || m.includes("netinkamas planas")) {
    return { title: "Pasirinktas planas nebegalioja", description: "Pasirinkite kitą reklamos trukmę arba perkraukite puslapį." };
  }
  if (m.includes("payment_status_check")) {
    return { title: "Mokėjimo būsena netinkama", description: "Pradėkite mokėjimą iš naujo." };
  }
  if (m.includes("duplicate key") || m.includes("already exists") || m.includes("unique constraint")) {
    return { title: "Toks įrašas jau yra", description: "Pakeiskite pavadinimą arba raskite esamą įrašą sąraše." };
  }
  if (m.includes("violates foreign key")) {
    return { title: "Susijęs įrašas nerastas", description: "Perkraukite puslapį ir pabandykite dar kartą." };
  }
  if (m.includes("violates not-null") || m.includes("null value in column")) {
    return { title: "Užpildykite visus privalomus laukus" };
  }
  if (m.includes("check constraint")) {
    return { title: "Netinkamos reikšmės", description: "Patikrinkite įvestus duomenis ir bandykite dar kartą." };
  }
  if (m.includes("value too long")) {
    return { title: "Tekstas per ilgas", description: "Sutrumpinkite įvestą tekstą." };
  }

  // --- Tinklas ---
  if (m.includes("load failed") || m.includes("failed to fetch") || m.includes("networkerror") || m.includes("network request failed")) {
    return { title: "Nėra interneto ryšio", description: "Patikrinkite ryšį ir bandykite dar kartą." };
  }
  if (m.includes("timeout") || m.includes("aborted")) {
    return { title: "Užklausa užtruko per ilgai", description: "Bandykite dar kartą." };
  }
  if (m.includes("rate limit") || m.includes("too many requests")) {
    return { title: "Per daug bandymų", description: "Trumpai palaukite ir pabandykite vėliau." };
  }

  // --- Zod / validacija ---
  if (m.includes("expected") && m.includes("received")) {
    return { title: "Netinkamai užpildyta forma", description: "Patikrinkite laukus ir bandykite dar kartą." };
  }

  // Lietuviškas serverio tekstas — rodome kaip yra.
  if (/[ąčęėįšųūž]/i.test(msg)) return { title: msg };

  return { title: "Nepavyko atlikti veiksmo", description: "Pabandykite dar kartą arba perkraukite puslapį." };
}

/** Trumpas lietuviškas klaidos tekstas (vienoje eilutėje). */
export function errorText(error: unknown): string {
  const f = friendlyError(error);
  return f.description ? `${f.title} — ${f.description}` : f.title;
}

/** Parodo lietuvišką klaidos pranešimą. 401 klaidos tyliai ignoruojamos. */
export function toastError(error: unknown, fallbackTitle?: string) {
  const f = friendlyError(error);
  if (f.silent) return;
  toast.error(fallbackTitle ?? f.title, f.description ? { description: f.description } : undefined);
}
