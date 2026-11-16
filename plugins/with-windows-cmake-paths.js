const { withGradleProperties } = require('expo/config-plugins');

// Ask CMake to hash long object paths before Ninja reaches Windows' 260-char limit.
module.exports = (config) => withGradleProperties(config, (mod) => {
  const key = 'expo.android.cmakeObjectPathMax';
  mod.modResults = mod.modResults.filter((item) => item.type !== 'property' || item.key !== key);
  mod.modResults.push({ type: 'property', key, value: '250' });
  return mod;
});
