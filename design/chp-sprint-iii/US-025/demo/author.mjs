import {mountStaticComponents} from '../../theme/static-components.mjs';
mountStaticComponents();
import { FIXTURES, SCENARIOS, SCENARIO_BY_ID } from './scenarios.mjs';
import { parseHeight } from './author-settings.mjs';
import { defaultFilter, readScreenLocation, screenUrl } from './navigation.mjs';
import { applyDraft, subscribeDraft } from '../../theme/tuning.mjs';

const frame = document.querySelector('#screen-frame');
const controls = document.querySelector('#controls');
const scenarioSelect = document.querySelector('#scenario');
const fixtureSelect = document.querySelector('#fixture');
const widthSelect = document.querySelector('#width');
const heightInput = document.querySelector('#height');
const textScaleSelect = document.querySelector('#text-scale');
const themeSelect = document.querySelector('#theme');
const materialSelect = document.querySelector('#material');
const reducedMotionInput = document.querySelector('#reduced-motion');
const outcomeSelect = document.querySelector('#start-outcome');
const refreshOutcomeSelect = document.querySelector('#refresh-outcome');
const responseModeSelect = document.querySelector('#response-mode');
const resolvePendingButton = document.querySelector('#resolve-pending');
const leavePendingButton = document.querySelector('#leave-pending');
const definition = document.querySelector('#definition');
const screenState = document.querySelector('#screen-state');
const screenLink = document.querySelector('#screen-link');
const requestLog = document.querySelector('#request-log');

const allowed = {
  theme: new Set(['light', 'dark']),
  material: new Set(['opaque', 'glass']),
  textScale: new Set(['100', '150', '200']),
  responseMode: new Set(['immediate', 'slow', 'hold']),
  startOutcome: new Set(['started', 'already_in_progress', 'rejected', 'unknown', 'forbidden', 'session_expired', 'invalid', 'terminal']),
  refreshOutcome: new Set(['in-progress', 'accepted', 'completed', 'cancelled', 'unavailable', 'session_expired', 'invalid', 'failed']),
};

function safeParam(name, values, fallback) {
  const value = new URLSearchParams(location.search).get(name);
  return values.has(value) ? value : fallback;
}

function readSettings() {
  const query = new URLSearchParams(location.search);
  const fixtureName = FIXTURES[query.get('fixture')] ? query.get('fixture') : 'standard';
  const liveLocation = readScreenLocation(query, { scenarioId: 'L02', jobId: FIXTURES[fixtureName].jobId });
  const widthValue = Number(query.get('width'));
  return {
    scenarioId: liveLocation.scenarioId,
    fixtureName,
    width: [320, 390, 768, 1024, 1440].includes(widthValue) ? widthValue : 390,
    height: parseHeight(query.get('height')),
    textScale: safeParam('textScale', allowed.textScale, '100'),
    theme: safeParam('theme', allowed.theme, 'light'),
    material: safeParam('material', allowed.material, 'opaque'),
    reducedMotion: query.get('reducedMotion') === '1',
    startOutcome: safeParam('startOutcome', allowed.startOutcome, 'started'),
    refreshOutcome: safeParam('refreshOutcome', allowed.refreshOutcome, 'in-progress'),
    responseMode: safeParam('responseMode', allowed.responseMode, 'immediate'),
  };
}

let settings = readSettings();
let liveLocation = readScreenLocation(new URLSearchParams(location.search), { scenarioId: settings.scenarioId, jobId: FIXTURES[settings.fixtureName].jobId });
let lastState = { id: settings.scenarioId, pending: false, startPostCount: 0 };
let draftError = null;

function setThemeDraft() {
  document.documentElement.dataset.cuTheme = settings.theme;
  const result = applyDraft(document.documentElement, settings.theme);
  draftError = result.error;
}

function renderScenarioOptions() {
  const groups = [
    ['L', 'My Jobs list'],
    ['D', 'Job details'],
    ['C', 'Confirmation'],
    ['R', 'Recovery'],
  ];
  scenarioSelect.replaceChildren();
  for (const [prefix, label] of groups) {
    const group = document.createElement('optgroup');
    group.label = label;
    for (const scenario of SCENARIOS.filter((item) => item.id.startsWith(prefix))) {
      const option = document.createElement('option');
      option.value = scenario.id;
      option.textContent = `${scenario.id} · ${scenario.title}`;
      group.append(option);
    }
    scenarioSelect.append(group);
  }
}

function renderFixtureOptions() {
  const labels = {
    standard: 'Standard · Job #41',
    long: 'Long Unicode content · zero price',
    optional: 'Optional values missing',
    completed: 'Terminal · Completed',
    cancelled: 'Terminal · Cancelled',
    rateLimit: 'Rate-limited list read · 429',
  };
  fixtureSelect.replaceChildren();
  for (const [value, label] of Object.entries(labels)) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    fixtureSelect.append(option);
  }
}

function applyControls() {
  scenarioSelect.value = settings.scenarioId;
  fixtureSelect.value = settings.fixtureName;
  widthSelect.value = String(settings.width);
  heightInput.value = String(settings.height);
  textScaleSelect.value = settings.textScale;
  themeSelect.value = settings.theme;
  materialSelect.value = settings.material;
  reducedMotionInput.checked = settings.reducedMotion;
  outcomeSelect.value = settings.startOutcome;
  refreshOutcomeSelect.value = settings.refreshOutcome;
  responseModeSelect.value = settings.responseMode;
}

function queryUrl(nextSettings = settings, nextLocation = liveLocation) {
  return screenUrl(location.href, nextSettings, nextLocation);
}

function writeAuthorUrl() {
  const url = new URL(location.href);
  const screen = queryUrl();
  for (const key of ['scenario', 'filter', 'page', 'job', 'read', 'readMode']) {
    if (screen.searchParams.has(key)) url.searchParams.set(key, screen.searchParams.get(key));
    else url.searchParams.delete(key);
  }
  for (const [key, value] of Object.entries({
    fixture: settings.fixtureName,
    width: settings.width,
    height: settings.height,
    textScale: settings.textScale,
    theme: settings.theme,
    material: settings.material,
    reducedMotion: settings.reducedMotion ? '1' : '0',
    startOutcome: settings.startOutcome,
    refreshOutcome: settings.refreshOutcome,
    responseMode: settings.responseMode,
  })) url.searchParams.set(key, String(value));
  history.replaceState(null, '', url);
}

function expectedOrigin() {
  return location.origin;
}

function sendToFrame(message) {
  if (!frame.contentWindow) return;
  const origin = expectedOrigin();
  frame.contentWindow.postMessage(message, origin === 'null' ? '*' : origin);
}

function updateFrameDimensions() {
  frame.style.width = `${settings.width}px`;
  frame.style.height = `${settings.height}px`;
  screenLink.href = queryUrl().href;
}

function updateDefinition(scenarioId) {
  const scenario = SCENARIO_BY_ID[scenarioId] ?? SCENARIO_BY_ID.L02;
  definition.replaceChildren();
  const rows = [
    ['Trigger', scenario.trigger],
    ['Expected behavior', scenario.expected],
    ['Action', scenario.action],
  ];
  for (const [label, value] of rows) {
    const wrap = document.createElement('div');
    const term = document.createElement('dt');
    term.textContent = label;
    const description = document.createElement('dd');
    description.textContent = value;
    wrap.append(term, description);
    definition.append(wrap);
  }
  const nextWrap = document.createElement('div');
  const nextTerm = document.createElement('dt');
  nextTerm.textContent = 'Next states';
  const nextList = document.createElement('dd');
  nextList.className = 'next-states';
  for (const nextId of scenario.next) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.nextState = nextId;
    button.textContent = nextId;
    nextList.append(button);
  }
  nextWrap.append(nextTerm, nextList);
  definition.append(nextWrap);
  if (draftError) {
    const warningWrap = document.createElement('div');
    const warningTerm = document.createElement('dt');
    warningTerm.textContent = 'Shared theme draft';
    const warningBody = document.createElement('dd');
    warningBody.textContent = draftError;
    warningWrap.append(warningTerm, warningBody);
    definition.append(warningWrap);
  }
}

function appendRequest(entry) {
  const empty = requestLog.querySelector('.empty-log');
  empty?.remove();
  const item = document.createElement('li');
  const code = document.createElement('code');
  const method = document.createElement('span');
  method.className = 'log-method';
  method.textContent = entry.method ?? 'MOCK';
  const path = document.createElement('span');
  path.textContent = entry.path ?? 'mock state';
  code.append(method, path);
  const status = document.createElement('span');
  status.className = 'log-result';
  status.textContent = entry.result ?? 'simulated';
  const reason = document.createElement('span');
  reason.textContent = entry.reason ?? '';
  item.append(code, status, reason);
  requestLog.append(item);
  while (requestLog.children.length > 100) requestLog.firstElementChild.remove();
  requestLog.scrollTop = requestLog.scrollHeight;
}

function renderStateSummary(message = {}) {
  const id = SCENARIO_BY_ID[message.id] ? message.id : settings.scenarioId;
  settings.scenarioId = id;
  liveLocation = {
    scenarioId: id,
    listFilter: ['active', 'Accepted', 'In Progress', 'Completed', 'Cancelled', 'all'].includes(message.listFilter) ? message.listFilter : liveLocation.listFilter,
    page: Number.isSafeInteger(Number(message.page)) && Number(message.page) > 0 ? Number(message.page) : liveLocation.page,
    jobId: Number.isSafeInteger(Number(message.jobId)) && Number(message.jobId) > 0 ? Number(message.jobId) : liveLocation.jobId,
    readOnLoad: Boolean(message.readOnLoad || message.pending),
    readMode: message.readMode === 'configured' ? 'configured' : 'record',
  };
  lastState = {
    id,
    pending: Boolean(message.pending),
    startPostCount: Number(message.startPostCount ?? 0),
  };
  const status = message.status ? ` · ${message.status}` : '';
  const privacy = message.privateDataVisible === false ? ' · details cleared' : '';
  screenState.textContent = `${lastState.id}${status}${privacy} · mock writes: ${lastState.startPostCount}`;
  for (const button of [resolvePendingButton, leavePendingButton]) {
    button.disabled = !lastState.pending;
    if (lastState.pending) button.removeAttribute('data-disabled');
    else button.dataset.disabled = 'true';
  }
  scenarioSelect.value = settings.scenarioId;
  updateDefinition(settings.scenarioId);
  updateFrameDimensions();
  writeAuthorUrl();
}

function frameSettings({ includeScenario = false, includeFixture = false } = {}) {
  return {
    theme: settings.theme,
    material: settings.material,
    textScale: settings.textScale,
    reducedMotion: settings.reducedMotion,
    startOutcome: settings.startOutcome,
    refreshOutcome: settings.refreshOutcome,
    responseMode: settings.responseMode,
    ...(includeScenario ? { scenarioId: settings.scenarioId, listFilter: liveLocation.listFilter, page: liveLocation.page, jobId: liveLocation.jobId, readMode: liveLocation.readMode } : {}),
    ...(includeFixture ? { fixtureName: settings.fixtureName, jobId: liveLocation.jobId, readMode: liveLocation.readMode } : {}),
  };
}

function synchronize(options = {}) {
  applyControls();
  updateDefinition(settings.scenarioId);
  updateFrameDimensions();
  writeAuthorUrl();
  sendToFrame({ type: 'cuways-demo-settings', settings: frameSettings(options) });
}

renderScenarioOptions();
renderFixtureOptions();
setThemeDraft();
applyControls();
updateDefinition(settings.scenarioId);
updateFrameDimensions();
requestLog.innerHTML = '<li class="empty-log">No mock requests yet. Start with L02 or open Job #41.</li>';

frame.src = queryUrl().href;
frame.addEventListener('load', () => {
  sendToFrame({ type: 'cuways-demo-settings', settings: frameSettings() });
});

controls.addEventListener('change', (event) => {
  const { name, value, checked } = event.target;
  const selectingScenario = name === 'scenario';
  const selectingFixture = name === 'fixture';
  if (selectingScenario) {
    settings.scenarioId = SCENARIO_BY_ID[value] ? value : 'L02';
    liveLocation = { ...liveLocation, scenarioId: settings.scenarioId, listFilter: defaultFilter(settings.scenarioId), page: 1, readOnLoad: settings.scenarioId === 'R13', readMode: ['R13', 'C03', 'C04', 'C05'].includes(settings.scenarioId) ? 'configured' : 'record' };
  }
  if (selectingFixture) {
    settings.fixtureName = FIXTURES[value] ? value : 'standard';
    liveLocation = { ...liveLocation, jobId: FIXTURES[settings.fixtureName].jobId };
  }
  if (name === 'width') settings.width = Number(value);
  if (name === 'height') settings.height = parseHeight(value);
  if (name === 'text-scale') settings.textScale = allowed.textScale.has(value) ? value : '100';
  if (name === 'theme') settings.theme = allowed.theme.has(value) ? value : 'light';
  if (name === 'material') settings.material = allowed.material.has(value) ? value : 'opaque';
  if (name === 'reduced-motion') settings.reducedMotion = Boolean(checked);
  if (name === 'start-outcome') settings.startOutcome = allowed.startOutcome.has(value) ? value : 'started';
  if (name === 'refresh-outcome') settings.refreshOutcome = allowed.refreshOutcome.has(value) ? value : 'in-progress';
  if (name === 'response-mode') settings.responseMode = allowed.responseMode.has(value) ? value : 'immediate';
  setThemeDraft();
  synchronize({ includeScenario: selectingScenario, includeFixture: selectingFixture });
});

heightInput.addEventListener('input', () => {
  settings.height = parseHeight(heightInput.value);
  updateFrameDimensions();
  writeAuthorUrl();
});

resolvePendingButton.addEventListener('click', () => {
  sendToFrame({
    type: 'cuways-demo-resolve-pending',
    outcome: settings.startOutcome,
    refreshOutcome: settings.refreshOutcome,
  });
});

leavePendingButton.addEventListener('click', () => {
  sendToFrame({ type: 'cuways-demo-navigate-away' });
});

document.querySelector('.flow-links').addEventListener('click', (event) => {
  const link = event.target.closest('[data-state-group]');
  if (!link) return;
  event.preventDefault();
  const firstByGroup = { L: 'L01', D: 'D01', C: 'C01', R: 'R01' };
  settings.scenarioId = firstByGroup[link.dataset.stateGroup] ?? 'L01';
  liveLocation = { ...liveLocation, scenarioId: settings.scenarioId, listFilter: defaultFilter(settings.scenarioId), page: 1, readOnLoad: settings.scenarioId === 'R13', readMode: ['R13', 'C03', 'C04', 'C05'].includes(settings.scenarioId) ? 'configured' : 'record' };
  synchronize({ includeScenario: true });
});

definition.addEventListener('click', (event) => {
  const button = event.target.closest('[data-next-state]');
  if (!button) return;
  settings.scenarioId = SCENARIO_BY_ID[button.dataset.nextState] ? button.dataset.nextState : 'L02';
  liveLocation = { ...liveLocation, scenarioId: settings.scenarioId, listFilter: defaultFilter(settings.scenarioId), page: 1, readOnLoad: settings.scenarioId === 'R13', readMode: ['R13', 'C03', 'C04', 'C05'].includes(settings.scenarioId) ? 'configured' : 'record' };
  synchronize({ includeScenario: true });
});

window.addEventListener('message', (event) => {
  if (event.source !== frame.contentWindow || event.origin !== expectedOrigin()) return;
  const message = event.data;
  if (!message || typeof message !== 'object') return;
  if (message.type === 'cuways-demo-ready') {
    sendToFrame({ type: 'cuways-demo-settings', settings: frameSettings() });
    renderStateSummary(message.state ?? {});
  } else if (message.type === 'cuways-demo-state') {
    renderStateSummary(message);
  } else if (message.type === 'cuways-demo-request') {
    appendRequest(message.entry ?? {});
    if (message.state) renderStateSummary(message.state);
  } else if (message.type === 'cuways-demo-settings-changed') {
    const next = message.settings ?? {};
    if (allowed.theme.has(next.theme)) settings.theme = next.theme;
    if (allowed.material.has(next.material)) settings.material = next.material;
    if (next.reducedMotion === true || next.reducedMotion === false) settings.reducedMotion = next.reducedMotion;
    applyControls();
    setThemeDraft();
    writeAuthorUrl();
  }
});

subscribeDraft(() => {
  setThemeDraft();
  updateDefinition(settings.scenarioId);
  sendToFrame({ type: 'cuways-demo-settings', settings: frameSettings() });
});

renderStateSummary();
