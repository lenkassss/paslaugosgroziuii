import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "lt.paslaugosgroziui.app",
  appName: "PaslaugosGrožiui",
  webDir: "dist",
  backgroundColor: "#FDFBF7",
  android: {
    allowMixedContent: false,
  },
  ios: {
    // „never“ — WebView nebeįterpia savo viršutinio tarpo, todėl išnyksta
    // baltas tarpas virš antraštės traukiant puslapį į viršų. Saugios zonos
    // paraštes valdo pati programa (env(safe-area-inset-*)).
    contentInset: "never",
  },

  server: {
    androidScheme: "https",
  },
  plugins: {
    // Native HTTP bypasses WebView CORS entirely — fixes "Load failed" on device.
    CapacitorHttp: {
      enabled: true,
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1200,
      backgroundColor: "#FDFBF7",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
  },
};

export default config;
