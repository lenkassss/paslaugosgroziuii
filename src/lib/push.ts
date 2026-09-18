/**
 * Push notification bootstrap for the Capacitor (iOS/Android) build.
 * On the web it degrades gracefully: no permission prompts, no errors —
 * users keep receiving in-app + email notifications instead.
 */
export type PushStatus = "unsupported" | "denied" | "granted" | "error";

export async function isNativeApp(): Promise<boolean> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Requests permission, registers the device and waits for the real
 * FCM/APNs token. Grąžina „granted“ tik tada, kai žetonas tikrai gautas ir
 * perduotas `onToken` — todėl perjungiklis nebeįsijungia „tuščiai“.
 */
export async function enablePush(
  onToken: (token: string, platform: "ios" | "android") => void | Promise<void>,
): Promise<PushStatus> {
  if (!(await isNativeApp())) return "unsupported";

  try {
    const { Capacitor } = await import("@capacitor/core");
    const { PushNotifications } = await import("@capacitor/push-notifications");

    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== "granted") return "denied";

    const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";

    await PushNotifications.removeAllListeners();

    const token = await new Promise<string | null>((resolve) => {
      let settled = false;
      const done = (value: string | null) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      void PushNotifications.addListener("registration", (t) => done(t.value));
      void PushNotifications.addListener("registrationError", (e) => {
        console.error("[push] registration error", e);
        done(null);
      });
      void PushNotifications.register();
      // Jei operatorius/tinklas neatsako — nelaikom vartotojo amžinai.
      setTimeout(() => done(null), 12000);
    });

    if (!token) return "error";
    await onToken(token, platform);
    return "granted";
  } catch (e) {
    console.error("[push] enable failed", e);
    return "error";
  }
}

/** Opens a received push: returns the deep-link path from the payload, if any. */
export async function listenPushOpened(onOpen: (path: string) => void): Promise<() => void> {
  if (!(await isNativeApp())) return () => {};
  const { PushNotifications } = await import("@capacitor/push-notifications");
  const handle = await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const path = (action.notification.data as { path?: string } | undefined)?.path;
    if (path && path.startsWith("/")) onOpen(path);
  });
  return () => void handle.remove();
}

export async function disablePush() {
  if (!(await isNativeApp())) return;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    await PushNotifications.removeAllListeners();
    await PushNotifications.unregister();
  } catch (e) {
    console.error("[push] disable failed", e);
  }
}
