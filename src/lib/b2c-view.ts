/**
 * Verslo paskyra pagal nutylėjimą nukreipiama į Verslo centrą (`/verslas`).
 * Paspaudus „Klientų vaizdas“ šis žymuo išsaugomas sesijoje ir nukreipimas
 * nebevykdomas iki naršyklės skirtuko uždarymo.
 */
export const B2C_VIEW_KEY = "pg:b2c-view";

export function keepClientView() {
  try {
    sessionStorage.setItem(B2C_VIEW_KEY, "1");
  } catch {
    /* privatus režimas – ignoruojame */
  }
}
