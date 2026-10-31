import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
import { artifacts } from './engine.mjs';
export { artifacts, resolveTheme, validateDocument, validateSpecialization, effects, variable } from './engine.mjs';

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const document = JSON.parse(fs.readFileSync(path.join(directory, 'theme.json'), 'utf8'));
  const outputs = artifacts(document);
  const artwork = Object.fromEntries(fs.readdirSync(path.join(directory, 'assets')).filter(n => n.endsWith('.svg')).sort().map(n => [path.basename(n, '.svg'), fs.readFileSync(path.join(directory, 'assets', n), 'utf8')]));
  outputs['artwork.mjs'] = '// GENERATED from assets/*.svg.\nexport default ' + JSON.stringify(artwork) + ';\n';
  const checking = process.argv.includes('--check');
  for (const [name, content] of Object.entries(outputs)) {
    const target = path.join(directory, name);
    if (checking) {
      if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== content) throw Error(`Stale generated artifact: ${name}`);
    } else fs.writeFileSync(target, content);
  }
  function sourceFiles(dir, prefix='') { return fs.readdirSync(dir).flatMap(n => { const file=path.join(dir,n), relative=prefix+n; return fs.statSync(file).isDirectory() ? (n==='assets'?sourceFiles(file, relative+'/'):[]) : (!['manifest.json','verification.json'].includes(n) && !/\.(jpg|png)$/.test(n)?[relative]:[]); }); }
  const files = sourceFiles(directory).sort();
  const manifest = JSON.stringify({ version: document.meta.version, files: Object.fromEntries(files.map(n => [n, crypto.createHash('sha256').update(fs.readFileSync(path.join(directory, n))).digest('hex')])) }, null, 2) + '\n';
  const manifestPath = path.join(directory, 'manifest.json');
  if (checking) {
    if (!fs.existsSync(manifestPath) || fs.readFileSync(manifestPath, 'utf8') !== manifest) throw Error('Stale generated artifact: manifest.json');
  } else fs.writeFileSync(manifestPath, manifest);
  console.log(checking ? 'Canonical source and generated exports agree.' : 'Generated CSS, resolved tokens, reference and manifest.');
}
