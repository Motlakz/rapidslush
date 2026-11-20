const { withGradleProperties } = require('expo/config-plugins');

// Local Windows builds only (app.config.js adds this plugin on win32).
// Gradle memory is set for every platform in with-gradle-memory.js.
const PROPS = {
  // Ask CMake to hash long object paths before Ninja reaches Windows' 260-char limit.
  'expo.android.cmakeObjectPathMax': '250',
};

module.exports = (config) => withGradleProperties(config, (mod) => {
  mod.modResults = mod.modResults.filter((item) => item.type !== 'property' || !(item.key in PROPS));
  for (const [key, value] of Object.entries(PROPS)) mod.modResults.push({ type: 'property', key, value });
  return mod;
});
