const { withGradleProperties } = require('expo/config-plugins');

// Applied on every platform, EAS's Linux builders included.
// At Expo's default (2 GB heap, 512 MB metaspace) the release build runs out of JVM metaspace
// in :app:compileReleaseKotlin. The Gradle daemon dies with it: locally on Windows, and on EAS as
// "Gradle build daemon disappeared unexpectedly".
const JVM_ARGS = '-Xmx4096m -XX:MaxMetaspaceSize=1024m';

module.exports = (config) => withGradleProperties(config, (mod) => {
  mod.modResults = mod.modResults.filter((item) => item.type !== 'property' || item.key !== 'org.gradle.jvmargs');
  mod.modResults.push({ type: 'property', key: 'org.gradle.jvmargs', value: JVM_ARGS });
  return mod;
});
