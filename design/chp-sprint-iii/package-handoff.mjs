// Portable compressed ZIP; explicit source selection and Node standard library only.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { deflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { handoffFiles } from './export-files.mjs';
import { handoffStories, handoffStateCount } from './stories/scope.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const version = JSON.parse(fs.readFileSync(path.join(root, 'theme/theme.json'), 'utf8')).meta.version;
const entries = handoffFiles(root).map(name => ({ name, data: fs.readFileSync(path.join(root, name)) }));
const manifest = {
  name: 'CU Ways HTML Handoff',
  version,
  stories: handoffStories,
  states: handoffStateCount,
  generated: new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date()),
  entry: 'index.html',
  serve: 'node serve.mjs --port 4188',
  scope: 'Standalone design simulation; human palette and complete-page acceptance remain pending. No API, auth, concurrency or persistence proof.',
  files: Object.fromEntries(entries.map(({ name, data }) => [
    name, crypto.createHash('sha256').update(data).digest('hex')
  ]))
};
const manifestData = Buffer.from(JSON.stringify(manifest, null, 2) + '\n');
entries.push({ name: 'HANDOFF-MANIFEST.json', data: manifestData });

const table = Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) crc = table[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

const local = [], central = [];
let offset = 0;
const [year, month, day] = manifest.generated.split('-').map(Number);
const date = ((year - 1980) << 9) | (month << 5) | day;
for (const entry of entries) {
  const name = Buffer.from(entry.name);
  const data = entry.data, compressed = deflateRawSync(data), crc = crc32(data);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x800, 6); // UTF-8 filenames
  header.writeUInt16LE(8, 8); // raw DEFLATE
  header.writeUInt16LE(date, 12);
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(compressed.length, 18);
  header.writeUInt32LE(data.length, 22);
  header.writeUInt16LE(name.length, 26);

  const dir = Buffer.alloc(46);
  dir.writeUInt32LE(0x02014b50);
  dir.writeUInt16LE(20, 4);
  dir.writeUInt16LE(20, 6);
  dir.writeUInt16LE(0x800, 8);
  dir.writeUInt16LE(8, 10);
  dir.writeUInt16LE(date, 14);
  dir.writeUInt32LE(crc, 16);
  dir.writeUInt32LE(compressed.length, 20);
  dir.writeUInt32LE(data.length, 24);
  dir.writeUInt16LE(name.length, 28);
  dir.writeUInt32LE(offset, 42);

  local.push(header, name, compressed);
  central.push(dir, name);
  offset += header.length + name.length + compressed.length;
}
const directory = Buffer.concat(central), end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50);
end.writeUInt16LE(entries.length, 8);
end.writeUInt16LE(entries.length, 10);
end.writeUInt32LE(directory.length, 12);
end.writeUInt32LE(offset, 16);

const output = path.join(root, '.artifacts/export');
fs.mkdirSync(output, { recursive: true });
const target = path.join(output, `CU-Ways-HTML-Handoff-v${version}.zip`);
fs.writeFileSync(target, Buffer.concat([...local, directory, end]));
fs.writeFileSync(path.join(output, 'HANDOFF-MANIFEST.json'), manifestData);
console.log(JSON.stringify({ archive: target, files: entries.length, bytes: fs.statSync(target).size }));
