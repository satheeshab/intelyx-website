/**
 * Runs a workspace's tests with Node's built-in test runner:  node ../scripts/run-tests.mjs test
 * The files are listed explicitly because "node --test" only understands glob patterns
 * (like test/*.test.js) from Node 21 on, and Windows shells never expand them.
 */
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dir = resolve(process.cwd(), process.argv[2] || 'test');
const files = readdirSync(dir).filter((f) => f.endsWith('.test.js')).sort().map((f) => join(dir, f));

if (files.length === 0) {
  console.error(`No *.test.js files found in ${dir}`);
  process.exit(1);
}
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(result.status ?? 1);
