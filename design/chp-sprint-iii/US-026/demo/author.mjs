import { brand, roleBirds } from '../../theme/components.mjs';
import { CRITERIA, FIXTURES, SCENARIOS, SCENARIO_BY_ID } from './scenarios.mjs';

const $ = (selector) => document.querySelector(selector);
const frame = $('#screen-frame');
const scenarioSelect = $('#scenario');
const resolveButton = $('#resolve-pending');
const logList = $('#request-log');
const allowed = {
  scenarioId: new Set(Object.keys(SCENARIO_BY_ID)),
  fixtureId: new Set(Object.keys(FIXTURES)),
  theme: new Set(['light', 'dark']),
  material: new Set(['glass', 'opaque']),
  width: new Set([320, 390, 430, 768, 1024, 1280]),
  textScale: new Set(['100', '150', '200']),
  responseMode: new Set(['automatic', 'manual']),
  saveOutcome: new Set(['confirmed', 'type-rejected', 'unknown-saved', 'unknown-miss', 'job-completed', 'access-revoked']),
  loadOutcome: new Set(['loaded', 'failed']),
  checkOutcome: new Set(['available', 'unavailable']),
  reconciliationResult: new Set(['found', 'miss', 'unavailable']),
};

function readSetting(name, choices, fallback) {
  const value = new URL(location.href).searchParams.get(name);
  if (choices.has(value)) return value;
  const numeric = Number(value);
  return choices.has(numeric) ? numeric : fallback;
}

function readHeight() {
  const height = Number(new URL(location.href).searchParams.get('height'));
  return Number.isInteger(height) && height >= 320 && height <= 1200 ? height : 844;
}

const settings = {
  scenarioId: readSetting('scenario', allowed.scenarioId, 'A01'),
  fixtureId: readSetting('fixture', allowed.fixtureId, 'standard'),
  theme: readSetting('theme', allowed.theme, 'light'),
  material: readSetting('material', allowed.material, 'glass'),
  width: readSetting('width', allowed.width, 390),
  height: readHeight(),
  textScale: readSetting('textScale', allowed.textScale, '100'),
  responseMode: readSetting('responseMode', allowed.responseMode, 'automatic'),
  saveOutcome: readSetting('saveOutcome', allowed.saveOutcome, 'confirmed'),
  loadOutcome: readSetting('loadOutcome', allowed.loadOutcome, 'loaded'),
  checkOutcome: readSetting('checkOutcome', allowed.checkOutcome, 'available'),
  reconciliationResult: readSetting('reconciliationResult', allowed.reconciliationResult, 'miss'),
  reducedMotion: new URL(location.href).searchParams.get('reducedMotion') === '1',
  reducedTransparency: new URL(location.href).searchParams.get('reducedTransparency') === '1',
};
let pending = null;
let logItems = [];

function renderHeader() {
  $('#studio-header').innerHTML = `<div class="studio-header-inner">
    <a class="studio-brand" href="../../index.html" aria-label="CU Ways design workbench">${brand('light')}</a>
    <div class="studio-header-copy"><strong>US-026 · Proof of delivery</strong><span>HTML story handoff · source boards stay read-only</span></div>
    ${roleBirds('light')}
  </div>`;
}

function renderScenarioOptions() {
  const labels = {
    main: 'Everyday flow',
    validation: 'Validation',
    recovery: 'Save recovery',
    availability: 'Loading, status and access',
  };
  scenarioSelect.replaceChildren();
  for (const group of Object.keys(labels)) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = labels[group];
    for (const scenario of SCENARIOS.filter((item) => item.group === group)) {
      const option = document.createElement('option');
      option.value = scenario.id;
      option.textContent = `${scenario.id} · ${scenario.title}`;
      optgroup.append(option);
    }
    scenarioSelect.append(optgroup);
  }
  scenarioSelect.value = settings.scenarioId;
}

function renderCriteria() {
  const list = $('#criteria-list');
  list.replaceChildren();
  for (const criterion of CRITERIA) {
    const item = document.createElement('li');
    const title = document.createElement('strong');
    const detail = document.createElement('span');
    title.textContent = criterion.source;
    detail.textContent = criterion.requirement;
    item.append(title, detail);
    list.append(item);
  }
}

function renderDefinition(scenarioId = settings.scenarioId) {
  const scenario = SCENARIO_BY_ID[scenarioId] ?? SCENARIO_BY_ID.A01;
  const definition = $('#scenario-definition');
  definition.replaceChildren();
  const values = [
    ['When', scenario.trigger],
    ['Expected', scenario.expected],
    ['Next action', scenario.action],
    ['Next states', scenario.next.length ? scenario.next.join(' · ') : 'No further job access'],
  ];
  for (const [label, value] of values) {
    const row = document.createElement('div');
    const term = document.createElement('dt');
    const detail = document.createElement('dd');
    term.textContent = label;
    detail.textContent = value;
    if (label === 'Next states') detail.className = 'scenario-next';
    row.append(term, detail);
    definition.append(row);
  }
}

function applyControls() {
  $('#theme').value = settings.theme;
  $('#material').value = settings.material;
  $('#width').value = String(settings.width);
  $('#height').value = String(settings.height);
  $('#text-scale').value = settings.textScale;
  $('#reduced-motion').checked = settings.reducedMotion;
  $('#reduced-transparency').checked = settings.reducedTransparency;
  $('#fixture').value = settings.fixtureId;
  $('#save-outcome').value = settings.saveOutcome;
  $('#reconciliation-result').value = settings.reconciliationResult;
  $('#check-outcome').value = settings.checkOutcome;
  $('#load-outcome').value = settings.loadOutcome;
  $('#response-mode').value = settings.responseMode;
}

function screenUrl() {
  const url = new URL('./screen.html', location.href);
  const params = {
    scenario: settings.scenarioId,
    fixture: settings.fixtureId,
    theme: settings.theme,
    material: settings.material,
    width: settings.width,
    height: settings.height,
    textScale: settings.textScale,
    responseMode: settings.responseMode,
    saveOutcome: settings.saveOutcome,
    loadOutcome: settings.loadOutcome,
    checkOutcome: settings.checkOutcome,
    reconciliationResult: settings.reconciliationResult,
    reducedMotion: settings.reducedMotion ? '1' : '0',
    reducedTransparency: settings.reducedTransparency ? '1' : '0',
  };
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  return url;
}

function syncUrl() {
  const url = new URL(location.href);
  for (const [key, value] of Object.entries({
    scenario: settings.scenarioId,
    fixture: settings.fixtureId,
    theme: settings.theme,
    material: settings.material,
    width: settings.width,
    height: settings.height,
    textScale: settings.textScale,
    responseMode: settings.responseMode,
    saveOutcome: settings.saveOutcome,
    loadOutcome: settings.loadOutcome,
    checkOutcome: settings.checkOutcome,
    reconciliationResult: settings.reconciliationResult,
    reducedMotion: settings.reducedMotion ? '1' : '0',
    reducedTransparency: settings.reducedTransparency ? '1' : '0',
  })) url.searchParams.set(key, String(value));
  history.replaceState(null, '', url);
}

function applyViewport() {
  frame.style.inlineSize = `${settings.width}px`;
  frame.style.blockSize = `${settings.height}px`;
  $('#viewport-label').textContent = `${settings.width} × ${settings.height}`;
  $('#open-screen').href = screenUrl().href;
}

function send(type, payload = {}) {
  if (!frame.contentWindow || location.origin === 'null') return;
  frame.contentWindow.postMessage({ namespace: 'us026-demo', type, ...payload }, location.origin);
}

function configPayload() {
  const { scenarioId, height, width, ...config } = settings;
  return config;
}

function applyScenario(scenarioId, { sendToFrame = true } = {}) {
  if (!allowed.scenarioId.has(scenarioId)) return;
  settings.scenarioId = scenarioId;
  scenarioSelect.value = scenarioId;
  renderDefinition(scenarioId);
  syncUrl();
  applyViewport();
  if (sendToFrame) send('select-scenario', { scenarioId });
}

function readValue(key, value) {
  if (key === 'height') {
    const height = Math.max(320, Math.min(1200, Math.round(Number(value) || 844)));
    settings.height = height;
    $('#height').value = String(height);
    return;
  }
  if (key === 'width') {
    const width = Number(value);
    if (allowed.width.has(width)) settings.width = width;
    return;
  }
  if (key === 'reducedMotion' || key === 'reducedTransparency') {
    settings[key] = Boolean(value);
    return;
  }
  if (allowed[key]?.has(value)) settings[key] = value;
}

function updateSettings(key, value) {
  const previousFixture = settings.fixtureId;
  const previousReconciliation = settings.reconciliationResult;
  readValue(key, value);
  applyControls();
  syncUrl();
  applyViewport();
  send('configure', { config: configPayload() });
  if (previousFixture !== settings.fixtureId || (settings.scenarioId === 'B03' && previousReconciliation !== settings.reconciliationResult)) {
    send('select-scenario', { scenarioId: settings.scenarioId });
  }
}

function formatTime() {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date());
}

const operationText = {
  read: {
    started: 'Read saved-proof list · started', staged: 'Read saved-proof list · pending snapshot', available: 'Read saved-proof list · completed', failed: 'Read saved-proof list · unavailable',
  },
  submit: {
    started: 'Submit Proof URL · started', staged: 'Submit Proof URL · pending snapshot', confirmed: 'Submit Proof URL · confirmed', 'type-rejected': 'Submit Proof URL · rejected attachment type', 'unknown-saved': 'Submit Proof URL · response lost after save', 'unknown-miss': 'Submit Proof URL · response lost before save', 'job-completed': 'Submit Proof URL · job status changed', 'access-revoked': 'Submit Proof URL · access denied',
  },
  reconcile: {
    started: 'Re-read saved-proof list · started', available: 'Re-read saved-proof list · completed', unavailable: 'Re-read saved-proof list · still unavailable',
  },
  status: { started: 'Refresh job status · started', refreshed: 'Refresh job status · completed' },
};

function renderLog() {
  logList.replaceChildren();
  if (!logItems.length) {
    const item = document.createElement('li');
    item.className = 'log-empty';
    item.textContent = 'Interact with the preview to record a simulated operation.';
    logList.append(item);
    return;
  }
  for (const entry of logItems) {
    const item = document.createElement('li');
    const time = document.createElement('span');
    time.textContent = `${entry.time} · `;
    item.append(time, document.createTextNode(entry.text));
    logList.append(item);
  }
}

function addLog(operation, phase) {
  const text = operationText[operation]?.[phase];
  if (!text) return;
  logItems = [{ time: formatTime(), text }, ...logItems].slice(0, 12);
  renderLog();
}

function showState(message) {
  const state = message;
  const scenario = SCENARIO_BY_ID[state.scenarioId];
  const summary = state.view === 'jobs'
    ? (state.jobStatus ? 'My Jobs · job details available in the local fixture' : 'My Jobs · private job details cleared')
    : `${state.scenarioId} · ${scenario?.title ?? 'Story state'}${state.jobStatus ? ` · ${state.jobStatus}` : ''} · ${state.proofCount} saved proof${state.proofCount === 1 ? '' : 's'}`;
  $('#state-summary').textContent = state.pending ? `${summary} · waiting for a simulated response` : summary;
  pending = state.pending;
  resolveButton.hidden = !(pending && settings.responseMode === 'manual');
  if (allowed.scenarioId.has(state.scenarioId)) applyScenario(state.scenarioId, { sendToFrame: false });
}

renderHeader();
renderScenarioOptions();
renderCriteria();
renderDefinition();
applyControls();
applyViewport();
renderLog();
frame.src = screenUrl().href;

frame.addEventListener('load', () => {
  send('configure', { config: configPayload() });
  send('select-scenario', { scenarioId: settings.scenarioId });
});

window.addEventListener('message', (event) => {
  if (event.origin !== location.origin || event.source !== frame.contentWindow || event.data?.namespace !== 'us026-demo') return;
  if (event.data.type === 'state') showState(event.data);
  else if (event.data.type === 'operation') addLog(event.data.operation, event.data.phase);
  else if (event.data.type === 'config-change' && event.data.key === 'theme' && allowed.theme.has(event.data.value)) {
    settings.theme = event.data.value;
    applyControls();
    syncUrl();
    applyViewport();
    send('configure', { config: configPayload() });
  }
});

scenarioSelect.addEventListener('change', () => applyScenario(scenarioSelect.value));
$('#theme').addEventListener('change', (event) => updateSettings('theme', event.target.value));
$('#material').addEventListener('change', (event) => updateSettings('material', event.target.value));
$('#width').addEventListener('change', (event) => updateSettings('width', event.target.value));
$('#height').addEventListener('change', (event) => updateSettings('height', event.target.value));
$('#text-scale').addEventListener('change', (event) => updateSettings('textScale', event.target.value));
$('#reduced-motion').addEventListener('change', (event) => updateSettings('reducedMotion', event.target.checked));
$('#reduced-transparency').addEventListener('change', (event) => updateSettings('reducedTransparency', event.target.checked));
$('#fixture').addEventListener('change', (event) => updateSettings('fixtureId', event.target.value));
$('#save-outcome').addEventListener('change', (event) => updateSettings('saveOutcome', event.target.value));
$('#reconciliation-result').addEventListener('change', (event) => updateSettings('reconciliationResult', event.target.value));
$('#check-outcome').addEventListener('change', (event) => updateSettings('checkOutcome', event.target.value));
$('#load-outcome').addEventListener('change', (event) => updateSettings('loadOutcome', event.target.value));
$('#response-mode').addEventListener('change', (event) => updateSettings('responseMode', event.target.value));
resolveButton.addEventListener('click', () => send('resolve'));
$('#reset-demo').addEventListener('click', () => {
  logItems = [];
  renderLog();
  applyScenario('A01');
});
$('#clear-log').addEventListener('click', () => {
  logItems = [];
  renderLog();
});
