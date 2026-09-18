/**
 * System notification sender used by the admin push tester.
 *
 * - Native (Capacitor): schedules a real local notification that lands in the
 *   device notification centre.
 * - Web: uses the Notification API as a simulator so the same panel can be
 *   demoed from a browser.
 */

export type LocalPushResult = "native" | "web" | "denied" | "unsupported";

export type LocalPushPayload = {
  title: string;
  body: string;
  /** Optional deep-link path opened when the notification is tapped. */
  path?: string;
};

async function nativeSend(payload: LocalPushPayload): Promise<LocalPushResult | null> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return null;
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") perm = await LocalNotifications.requestPermissions();
    if (perm.display !== "granted") return "denied";
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Math.random() * 100000),
          title: payload.title,
          body: payload.body,
          schedule: { at: new Date(Date.now() + 1200) },
          extra: payload.path ? { path: payload.path } : undefined,
        },
      ],
    });
    return "native";
  } catch {
    return null;
  }
}

export async function sendLocalPush(payload: LocalPushPayload): Promise<LocalPushResult> {
  const native = await nativeSend(payload);
  if (native) return native;

  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  let permission = Notification.permission;
  if (permission === "default") permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";
  try {
    const n = new Notification(payload.title, { body: payload.body, icon: "/favicon.ico" });
    if (payload.path) {
      n.onclick = () => {
        window.focus();
        window.location.hash = `#${payload.path}`;
      };
    }
    return "web";
  } catch {
    return "unsupported";
  }
}
