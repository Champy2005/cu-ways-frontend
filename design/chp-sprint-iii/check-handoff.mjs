import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { handoffFiles } from './export-files.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const files = handoffFiles(root);
const missing = [];
let links = 0;
function verify(file, reference) {
  if (!reference || /^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(reference) || reference.includes('${')) return;
  const name = decodeURIComponent(reference.split(/[?#]/)[0]);
  if (!name) return;
  const target = path.resolve(root, path.dirname(file), name);
  const relative = path.relative(root, target).replaceAll('\\', '/');
  links++;
  if (!files.includes(relative)) missing.push(file + ' -> ' + reference);
}
for (const file of files) {
  if (!/\.(md|html|css|mjs)$/.test(file)) continue;
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const patterns = [];
  if (file.endsWith('.md')) patterns.push(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g);
  if (file.endsWith('.html')) patterns.push(/\b(?:href|src)=["']([^"']+)["']/g);
  if (file.endsWith('.css')) patterns.push(/url\(["']?([^"'\s)]+)["']?\)/g, /@import\s+["']([^"']+)["']/g);
  if (file.endsWith('.mjs')) patterns.push(/\bfrom\s*['"](\.[^'"]+)['"]/g, /\bimport\s*\(\s*['"](\.[^'"]+)['"]/g, /\bimport\s*['"](\.[^'"]+)['"]/g, /new URL\(['"](\.[^'"]+)['"],\s*import.meta.url\)/g);
  for (const pattern of patterns) for (const match of source.matchAll(pattern)) verify(file, match[1]);
}
if (missing.length) throw Error('References missing from export:\n' + missing.join('\n'));
console.log(files.length + ' selected files; ' + links + ' local references resolve.');
function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
for (const build of ['theme/build.mjs', 'US-025/demo/build.mjs', 'US-026/demo/build.mjs', 'stories/build.mjs']) run([build, '--check']);
run(['--test', ...files.filter(file => file.endsWith('.test.mjs'))]);
