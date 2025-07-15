const { getDefaultConfig } = require("expo/metro-config");
const exclusionList = require("metro-config/src/defaults/exclusionList");

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;
config.resolver.sourceExts.push("d.ts");

config.resolver.blockList = exclusionList([/\/docs\/.*/]);

module.exports = config;
