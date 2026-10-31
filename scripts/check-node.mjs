/**
 * Runs before dev, build, start and test (see the "pre*" scripts in package.json).
 * Stops with a plain explanation when Node.js is too old, instead of a confusing
 * stack trace from deep inside the build tool.
 */
const version = process.env.INTELYX_FAKE_NODE_VERSION || process.versions.node; // the override is for testing
const [major, minor] = version.split('.').map(Number);
const supported = major > 22 || (major === 22 && minor >= 12) || (major === 20 && minor >= 19);

if (!supported) {
  console.error(`
  This project needs Node.js 20.19 or newer (22.12+ or 24 recommended).
  You are running Node.js ${version}.

  Fix: install the current LTS version from https://nodejs.org (or run "nvm install 24"
  and "nvm use 24"), open a new terminal, check with "node --version", then run the
  command again. If you installed packages with the old version, also run "npm install".
`);
  process.exit(1);
}
