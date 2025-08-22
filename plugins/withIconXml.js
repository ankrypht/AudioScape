const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const ICON_XML_CONTENT = `<resources>
  <drawable name="media3_notification_small_icon">@drawable/notification_icon</drawable>
</resources>
`;

const withIconXml = (config) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const valuesDir = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
        "values",
      );

      const filePath = path.join(valuesDir, "icon.xml");

      // Ensure directory exists
      if (!fs.existsSync(valuesDir)) {
        fs.mkdirSync(valuesDir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(filePath, ICON_XML_CONTENT, "utf8");

      return config;
    },
  ]);
};

module.exports = withIconXml;
