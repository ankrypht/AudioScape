const IS_DEV = process.env.APP_VARIANT === "development";
const packageJson = require("./package.json");

const [major, minor, patch] = packageJson.version.split(".").map(Number);
const versionCode = major * 100000 + minor * 1000 + patch * 10;

export default {
  name: IS_DEV ? "AudioScape (Dev)" : "AudioScape",
  owner: "ankushsarkar",
  slug: "AudioScape",
  version: packageJson.version,
  platforms: ["android"],
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: IS_DEV ? "audioscape-dev" : "audioscape",
  userInterfaceStyle: "automatic",
  newArchEnabled: false,
  android: {
    softwareKeyboardLayoutMode: "pan",
    permissions: [
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.MANAGE_EXTERNAL_STORAGE",
      "android.permission.FOREGROUND_SERVICE",
    ],
    icon: "./assets/images/icon.png",
    package: IS_DEV
      ? "com.ankushsarkar.audioscape.dev"
      : "com.ankushsarkar.audioscape",
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon-foreground.png",
      backgroundImage: "./assets/images/adaptive-icon-background.png",
    },
    backgroundColor: "#000",
    edgeToEdgeEnabled: true,
    versionCode: versionCode,
  },
  plugins: [
    "expo-router",
    "expo-font",
    [
      "expo-notifications",
      {
        icon: "./assets/images/notification-icon.png",
        color: "#d17603",
      },
    ],
    "react-native-edge-to-edge",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#000",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: "5b2ff856-818a-42fc-b589-5287fa676098",
    },
  },
};
