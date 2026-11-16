// The Android SDK's default Ninja cannot compile this project from its Windows path.
// Keep the newer CMake local: Expo's Linux builders do not have this SDK package.
// Local Play bundles (scripts/build-android-local.ps1 -Bundle) pass their versionCode here,
// so prebuild writes it into build.gradle. EAS builds don't set it: EAS manages the
// version code itself (appVersionSource remote + autoIncrement).
const localVersionCode = Number(process.env.RS_ANDROID_VERSION_CODE) || undefined;

module.exports = ({ config }) => ({
  ...config,
  ...(localVersionCode ? { android: { ...config.android, versionCode: localVersionCode } } : {}),
  plugins: [
    ...(config.plugins ?? []),
    ...(process.platform === 'win32'
      ? [
          ['expo-build-properties', { android: { cmakeVersion: '3.31.6' } }],
          './plugins/with-windows-cmake-paths',
        ]
      : []),
  ],
});
