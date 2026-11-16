// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Side projects inside the app's folder that the app never imports. Metro would otherwise crawl them (the website's
// design kit alone is ~1,600 files; on Windows that pushes `expo export` / `eas update` into EMFILE).
// Anchored to the project root, with the platform's own path separators.
const SIDE_PROJECTS = ['src/web'];
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const blocked = SIDE_PROJECTS.map(
  (dir) => new RegExp(`^${escapeRegExp(path.join(__dirname, dir) + path.sep)}.*`),
);
config.resolver.blockList = [...[].concat(config.resolver.blockList ?? []), ...blocked];

module.exports = config;
