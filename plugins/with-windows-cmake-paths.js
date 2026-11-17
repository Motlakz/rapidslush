const { withGradleProperties } = require('expo/config-plugins');

// Local Windows builds only (app.config.js adds this plugin on win32; EAS's Linux builders size themselves).
const PROPS = {
  // Ask CMake to hash long object paths before Ninja reaches Windows' 260-char limit.
  'expo.android.cmakeObjectPathMax': '250',
  // The first full build ran out of JVM metaspace at Expo's default (2 GB heap, 512 MB metaspace),
  // which stops the Gradle daemon and makes the next build start cold.
  'org.gradle.jvmargs': '-Xmx4096m -XX:MaxMetaspaceSize=1024m',
};

module.exports = (config) => withGradleProperties(config, (mod) => {
  mod.modResults = mod.modResults.filter((item) => item.type !== 'property' || !(item.key in PROPS));
  for (const [key, value] of Object.entries(PROPS)) mod.modResults.push({ type: 'property', key, value });
  return mod;
});
