import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { artifacts, resolveTheme, validateDocument, validateSpecialization } from './build.mjs';

const source = JSON.parse(fs.readFileSync(new URL('./theme.json', import.meta.url), 'utf8'));
test('current recovery, chrome and rim decisions survive projection', () => {
  const light = resolveTheme(source, 'light'), dark = resolveTheme(source, 'dark');
  assert.equal(light['color.action.recovery.fill'], '#EEF4FB');
  assert.equal(light['color.action.recovery.border'], '#BACDE0');
  assert.equal(light['color.action.recovery.ink'], '#255D91');
  assert.equal(dark['color.action.recovery.fill'], '#26394D');
  assert.equal(dark['color.error.fill'], '#34262B');
  assert.equal(light['color.surface.header'], '#EEF2F7');
  assert.equal(dark['color.surface.header'], '#1B1E25');
  assert.equal(dark['color.surface.bottom'], '#303945');
  for (const mode of [light, dark]) { assert.equal(mode['rim.highlight'], '2px'); assert.equal(mode['rim.seam'], '1px'); }
  assert.equal(dark['opacity.chrome.bottom'], .92);
});
test('invalid references, cycles, weights and incomplete themes fail', () => {
  const mutate = callback => { const doc = structuredClone(source); callback(doc); return doc; };
  assert.throws(() => validateDocument(mutate(d => d.shared['color.depth.cool'].$value = '{missing}')), /Unknown token/);
  assert.throws(() => validateDocument(mutate(d => d.shared['color.depth.cool'].$value = '{color.depth.cool}')), /cycle/);
  assert.throws(() => validateDocument(mutate(d => d.themes.light['weight.recovery.fill'].$value = 1.5)), /Invalid/);
  assert.throws(() => validateDocument(mutate(d => delete d.themes.dark['color.surface.card'])), /keys must agree/);
});
test('generation is deterministic, nonmutating and declares every recipe variable', () => {
  const before = JSON.stringify(source), first = artifacts(source), second = artifacts(source);
  assert.deepEqual(first, second); assert.equal(JSON.stringify(source), before);
  const css = first['tokens.css'] + fs.readFileSync(new URL('./recipes.css', import.meta.url), 'utf8');
  const declarations = new Set([...css.matchAll(/(--cu-[\w-]+)\s*:/g)].map(m => m[1]));
  for (const match of css.matchAll(/var\((--cu-[\w-]+)/g)) assert.ok(declarations.has(match[1]), match[1]);
  assert.doesNotMatch(css, /#appbody|\.viewport|position:\s*fixed|\b390px|\b760px/);
});
test('story specialization cannot silently replace global foundations', () => {
  const record = JSON.parse(fs.readFileSync(new URL('./specialization.example.json', import.meta.url), 'utf8'));
  assert.equal(validateSpecialization(record, source), true);
  const invalid = structuredClone(record); invalid.overrides = { 'color.action.primary.fill': { value: '#000000', reason: 'Unapproved brand override' } };
  assert.throws(() => validateSpecialization(invalid, source), /local alias/);
  record.validation.publish = true;
  assert.throws(() => validateSpecialization(record, source), /Pending/);
});
function luminance(hex) { return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0); }
function contrast(a, b) { const values = [luminance(a), luminance(b)].sort((a, b) => b - a); return (values[0] + .05) / (values[1] + .05); }
test('reviewed opaque text pairs retain readable contrast in both themes', () => {
  for (const mode of ['light', 'dark']) {
    const t = resolveTheme(source, mode);
    const pairs = [['color.text.body', 'color.surface.card'], ['color.text.muted', 'color.surface.canvas'], ['color.nav.selectedInk', 'color.surface.bottom'], ['color.nav.selectedInk', 'color.nav.desktopFill']];
    pairs.push(['color.warning.ink','color.warning.fill']);
    for (const role of ['primary', 'destructive', 'utility', 'entry', 'recovery', 'tertiary']) pairs.push([`color.action.${role}.ink`, `color.action.${role}.fill`]);
    for (const role of ['info', 'progress', 'success', 'neutral']) pairs.push([`color.status.${role}.ink`, `color.status.${role}.fill`]);
    for (const [ink, fill] of pairs) assert.ok(contrast(t[ink], t[fill]) >= 4.5, `${mode}: ${ink} on ${fill}`);
    for (const surface of ['color.surface.input', 'color.surface.card']) assert.ok(contrast(t['color.border.control'], t[surface]) >= 3, `${mode}: control boundary on ${surface}`);
    assert.ok(contrast(t['color.rating'], t['color.surface.card']) >= 3, `${mode}: rating signal on card`);
    assert.ok(contrast(t['color.rating.bar'],t['color.rating.track'])>=3,`${mode}: distribution bars remain visible on their track`);
    assert.equal(t['color.warning.ink'],t['color.text.body']);
    assert.notEqual(t['color.warning.fill'],t['color.action.recovery.fill']);
    for(const role of ['info','success']){assert.ok(contrast(t['color.text.body'],t[`color.feedback.${role}.fill`])>=4.5);assert.ok(contrast(t[`color.feedback.${role}.signal`],t[`color.feedback.${role}.fill`])>=3);}
    assert.ok(contrast(t['color.warning.signal'],t['color.warning.fill'])>=3,`${mode}: warning signal`);
    for(const role of ['color.error.signal','color.status.info.ink','color.status.success.ink'])assert.notEqual(t['color.warning.signal'],t[role]);
  }
});

test('focus ring contrasts with the principal opaque surfaces', () => {
  for (const mode of ['light', 'dark']) {
    const t = resolveTheme(source, mode);
    for (const surface of ['color.surface.canvas', 'color.surface.card', 'color.surface.field', 'color.surface.bottom', 'color.surface.input']) {
      assert.ok(contrast(t['color.focus'], t[surface]) >= 3, `${mode}: focus on ${surface}`);
    }
  }
});
