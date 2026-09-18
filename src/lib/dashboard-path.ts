/**
 * Vienas tiesos šaltinis, kur nukreipti naudotoją į jo valdymo skiltį.
 * Verslo centro nebėra – visa verslo navigacija gyvena šoninėje juostoje.
 */
export function dashboardPathFor(role?: string | null): string {
  switch (role) {
    case "admin":
    case "super_admin":
      return "/admin";
    case "salon":
    case "staff":
      return "/dashboard/salon/overview";
    case "supplier":
      return "/dashboard/supplier/profile";
    case "school":
      return "/dashboard/school/courses";
    case "advertiser":
      return "/skelbimai";
    default:
      return "/dashboard/customer";
  }
}
