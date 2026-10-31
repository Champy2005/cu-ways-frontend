// Browser-safe canonical token resolver and effect projection. No DOM or filesystem.
const statuses = new Set(['approved', 'guidance', 'provisional']);
const types = new Set(['color', 'dimension', 'duration', 'number', 'string']);
export const variable = key => `--cu-${key.replaceAll('.', '-')}`;

export function resolveTheme(document, mode) {
  const tokens = { ...document.shared, ...document.themes[mode] };
  const resolved = {};
  const active = new Set();
  function value(input) {
    if (typeof input === 'string' && /^\{[^{}]+\}$/.test(input)) return resolve(input.slice(1, -1));
    if (input && typeof input === 'object' && input.mix) {
      const { foreground, background, weight } = input.mix;
      const a = value(foreground), b = value(background), w = value(weight);
      if (!/^#[\da-f]{6}$/i.test(a) || !/^#[\da-f]{6}$/i.test(b) || typeof w !== 'number' || w < 0 || w > 1) throw Error('Invalid color mix');
      return '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * w + parseInt(b.slice(i, i + 2), 16) * (1 - w)).toString(16).padStart(2, '0')).join('').toUpperCase();
    }
    return input;
  }
  function resolve(key) {
    if (Object.hasOwn(resolved, key)) return resolved[key];
    if (!Object.hasOwn(tokens, key)) throw Error(`Unknown token: ${key}`);
    if (active.has(key)) throw Error(`Token cycle: ${key}`);
    active.add(key);
    const token = tokens[key];
    if (!types.has(token.$type) || !statuses.has(token.$status)) throw Error(`Invalid token metadata: ${key}`);
    const result = value(token.$value);
    if (token.$type === 'color' && !/^#[\da-f]{6}$/i.test(result)) throw Error(`Invalid color: ${key}`);
    if (token.$type === 'dimension' && (typeof result !== 'string' || !/^\d*\.?\d+(px|rem|em|%)$/.test(result))) throw Error(`Invalid dimension: ${key}`);
    if (['number', 'duration'].includes(token.$type) && (typeof result !== 'number' || !Number.isFinite(result))) throw Error(`Invalid number: ${key}`);
    if ((key.startsWith('opacity.') || key.startsWith('weight.')) && (result < 0 || result > 1)) throw Error(`Invalid weight: ${key}`);
    active.delete(key);
    return resolved[key] = result;
  }
  for (const key of Object.keys(tokens)) resolve(key);
  return resolved;
}

export function validateDocument(document) {
  if (!document.meta?.version || !Array.isArray(document.preferences) || !document.specialization) throw Error('Missing canonical document sections');
  if (Object.keys(document.themes).sort().join() !== 'dark,light') throw Error('Both themes required');
  const modes = Object.values(document.themes).map(Object.keys).map(keys => keys.sort().join());
  if (modes[0] !== modes[1]) throw Error('Theme token keys must agree');
  for (const mode of ['light', 'dark']) resolveTheme(document, mode);
  return true;
}

export function validateSpecialization(specialization, document) {
  for (const key of document.specialization.record) if (!Object.hasOwn(specialization, key)) throw Error(`Missing specialization field: ${key}`);
  if (!specialization.scope || !specialization.reason || !specialization.owner) throw Error('Scope, reason and owner are required');
  if (specialization.validation.status === 'pending' && specialization.validation.publish) throw Error('Pending override cannot be published');
  for (const [key, override] of Object.entries(specialization.overrides)) {
    if (!['layout', 'component', 'semantic'].some(prefix => key.startsWith(prefix + '.'))) throw Error(`Override must use a local alias: ${key}`);
    if (!override.reason || !Object.hasOwn(override, 'value')) throw Error(`Override requires value/reason: ${key}`);
  }
  return true;
}

function rgba(hex, alpha) {
  return `rgb(${[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(' ')} / ${Number(alpha.toFixed(6))})`;
}

export function effects(tokens, dark) {
  const v = key => tokens[key];
  const geometry = `${v('depth.contactX')} ${v('depth.contactY')} ${v('depth.contactBlur')}`;
  const ambient = `${v('depth.ambientX')} ${v('depth.ambientY')} ${v('depth.ambientBlur')}`;
  function shadow(role, alpha, edge = false) {
    const color = v(`color.depth.${['utility', 'secondary', 'tertiaryHover'].includes(role) ? 'secondary' : role}`);
    const inset = edge ? `inset 0 ${v('depth.darkInnerEdge')} ${rgba(v('color.depth.darkEdge'), v('opacity.depth.edge' + (role === 'utility' ? 'Utility' : role === 'secondary' ? 'Secondary' : 'Primary')))},` : '';
    return `${inset}${geometry} ${rgba(color, alpha * v('opacity.contactFactor'))},${ambient} ${rgba(color, alpha)}`;
  }
  const output = {};
  for (const role of ['primary', 'destructive', 'secondary', 'utility']) {
    const alpha = v(`opacity.depth.${role === 'destructive' ? 'primary' : role}`);
    output[`effect.action.${role}.rest`] = shadow(role, alpha, dark);
    output[`effect.action.${role}.hover`] = shadow(role, alpha + (['primary', 'destructive'].includes(role) ? v('opacity.depth.solidHoverBoost') : 0), dark);
  }
  output['effect.action.tertiary.hover'] = shadow('tertiaryHover', v('opacity.depth.tertiaryHover'));
  const seam = rgba(v('color.chrome.seam'), v('opacity.chrome.seam'));
  const headerRim = rgba(v('color.chrome.rim'), v('opacity.chrome.headerRim'));
  const rim = rgba(v('color.chrome.rim'), v('opacity.chrome.rim'));
  const shade = rgba(v('color.chrome.shadow'), v('opacity.chrome.shadow'));
  const headerEdges = `inset 0 calc(-1 * var(${variable('rim.seam')})) ${seam},inset 0 calc(-1 * (var(${variable('rim.highlight')}) + var(${variable('rim.seam')}))) ${headerRim}`;
  output['effect.bar.header'] = `${headerEdges},0 ${v('depth.barY')} ${v('depth.barBlur')} ${shade}`;
  output['effect.bar.headerOpen'] = `${headerEdges},0 ${v('depth.barY')} ${v('depth.menuBlur')} ${shade}`;
  output['effect.bar.bottom'] = `inset 0 var(${variable('rim.seam')}) ${seam},inset 0 calc(var(${variable('rim.highlight')}) + var(${variable('rim.seam')})) ${rim},0 calc(-1 * ${v('depth.barY')}) ${v('depth.barBlur')} ${shade}`;
  output['effect.tray'] = `0 ${v('depth.barY')} ${v('depth.trayBlur')} ${shade}`;
  return output;
}

export function artifacts(document) {
  validateDocument(document);
  let css = '/* GENERATED from theme.json. Do not edit. Opt-in scope; no global body/layout rules. */\n';
  const resolved = {};
  for (const mode of ['light', 'dark']) {
    const tokens = resolveTheme(document, mode);
    const combined = { ...document.shared, ...document.themes[mode] };
    const declarations = Object.entries(tokens).map(([key, val]) => `  ${variable(key)}: ${val}${combined[key].$type === 'duration' ? 'ms' : ''};`);
    declarations.push(...Object.entries(effects(tokens, mode === 'dark')).map(([key, val]) => `  ${variable(key)}: ${val};`));
    css += `[data-cu-theme="${mode}"] {\n${declarations.join('\n')}\n}\n\n`;
    resolved[mode] = tokens;
  }
  let reference = `# Generated theme reference\n\nSource: theme.json · ${document.meta.version}. Edit the source and regenerate. Status: approved = adopted visual default; guidance = adaptable starting point; provisional = needs design/validation.\n\n`;
  reference += '| Token | Light | Dark | Status | Description |\n| --- | --- | --- | --- | --- |\n';
  for (const key of Object.keys(resolved.light)) {
    const token = document.shared[key] || document.themes.light[key];
    reference += `| ${key} | ${resolved.light[key]} | ${resolved.dark[key]} | ${token.$status} | ${(token.$description || "").replaceAll("|", "/")} |\n`;
  }
  reference += '\n## Recorded preferences\n\n' + document.preferences.map(p => `- **${p.id} · ${p.topic}** (${p.status}): ${p.rule}`).join('\n');
  reference += '\n\n## Flexible guidance\n\n' + Object.entries(document.guidance).map(([k, v]) => `- **${k}:** ${v}`).join('\n');
  reference += '\n\n## Open decisions\n\n' + document.openDecisions.map(x => `- ${x}`).join('\n') + '\n';
  return { 'source.mjs': '/* GENERATED from theme.json. */\nexport default ' + JSON.stringify(document, null, 2) + ';\n', 'tokens.css': css, 'resolved-tokens.json': JSON.stringify(resolved, null, 2) + '\n', 'REFERENCE.md': reference };
}

