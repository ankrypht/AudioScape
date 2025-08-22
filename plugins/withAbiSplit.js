const { withAppBuildGradle } = require("expo/config-plugins");

const withAbiSplit = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      config.modResults.contents = addAbiSplit(config.modResults.contents);
    }
    return config;
  });
};

function addAbiSplit(buildGradle) {
  const abiSplitBlock = `    splits {
        abi {
            enable true
            reset()
            include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
            universalApk true
        }
    }`;

  // Avoid duplicating if already present
  if (buildGradle.includes(abiSplitBlock)) {
    return buildGradle;
  }

  // Insert inside the android { ... } block
  return buildGradle.replace(
    /android\s*{/, // matches android { or android{ with optional spaces
    `android {\n${abiSplitBlock}`,
  );
}

module.exports = withAbiSplit;
