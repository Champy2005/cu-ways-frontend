import {OPERATION_WAIT_MS,operationJournal} from '../../theme/operations.mjs';
import {
  action, lifecycleBadge, closeControl, loadingScaffold,
  attachmentTag, evidenceLink, operationNotice,
  backLink,
  badge,
  banner,
  bottomBar,
  esc,
  feedbackBlock,
  headerBar,
  icon,
  menuItem,
  navItem,
  observeCompactNavigation,
  observeNavigationTile,
  keepFocusVisible,
} from '../../theme/components.mjs';
import { FIXTURES, SCENARIO_BY_ID } from './scenarios.mjs';
import { canShowProofForm, canSubmitProof, createDemoState, isValidProofUrl, reduceDemoState } from './state-machine.mjs';

const root = document.querySelector('#screen-root');
keepFocusVisible(root);
const rootUrl = new URL(location.href);
const allowed = {
  scenario: new Set(Object.keys(SCENARIO_BY_ID)),
  theme: new Set(['light', 'dark']),
  material: new Set(['glass', 'opaque']),
  textScale: new Set(['100', '150', '200']),
  responseMode: new Set(['automatic', 'manual']),
  fixtureId: new Set(Object.keys(FIXTURES)),
  saveOutcome: new Set(['confirmed', 'type-rejected', 'unknown-saved', 'unknown-miss', 'job-completed', 'access-revoked']),
  loadOutcome: new Set(['loaded', 'failed']),
  checkOutcome: new Set(['available', 'unavailable']),
  reconciliationResult: new Set(['found', 'miss', 'unavailable']),
};

function readParam(name, choices, fallback) {
  const value = rootUrl.searchParams.get(name);
  return choices.has(value) ? value : fallback;
}

let config = {
  scenarioId: readParam('scenario', allowed.scenario, 'A01'),
  fixtureId: readParam('fixture', allowed.fixtureId, 'standard'),
  theme: readParam('theme', allowed.theme, 'light'),
  material: readParam('material', allowed.material, 'glass'),
  textScale: readParam('textScale', allowed.textScale, '100'),
  responseMode: readParam('responseMode', allowed.responseMode, 'automatic'),
  saveOutcome: readParam('saveOutcome', allowed.saveOutcome, 'confirmed'),
  loadOutcome: readParam('loadOutcome', allowed.loadOutcome, 'loaded'),
  checkOutcome: readParam('checkOutcome', allowed.checkOutcome, 'available'),
  reconciliationResult: readParam('reconciliationResult', allowed.reconciliationResult, 'miss'),
  reducedMotion: rootUrl.searchParams.get('reducedMotion') === '1',
  reducedTransparency: rootUrl.searchParams.get('reducedTransparency') === '1',
};

let state = createDemoState(config.scenarioId, config);
let menuOpen = false;
let formOpen = !['A01','A04','A06','B02','B03','C01','C02','C03','C04'].includes(state.scenarioId);
let scheduledPending=null, deadlineTimer=null, backgroundMessage=null;
let timer = null;
let pendingRevision = 0;
let stopCompactObservation = () => {};
let stopTileObservation = () => {};
const journal=operationJournal('US-026');let journalActive=false;
function restoreJournal(force=false){
 const record=journal.read({fixture:config.fixtureId,explicitScenario:rootUrl.searchParams.has('scenario'),navigationType:performance.getEntriesByType('navigation')[0]?.type,force});
 if(!record||!allowed.scenario.has(record.snapshot.scenarioId)||!Array.isArray(record.snapshot.rows))return;
 clearTimeout(timer);clearTimeout(deadlineTimer);scheduledPending=null;pendingRevision++;
 state=record.phase==='pending'?reduceDemoState({...record.snapshot,pending:'save'},{type:'timeout'}):{...record.snapshot,pending:null};
 state.view='job';formOpen=false;journalActive=true;
}
function persistJournal(){
 if(state.pending==='save')journalActive=true;
 if(journalActive)journal.write({scene:config.scenarioId,fixture:config.fixtureId,phase:state.pending==='save'?'pending':state.scenarioId==='B03'?'unknown':'settled',snapshot:state});
}
restoreJournal();

function parentMessage(type, payload = {}) {
  if (window.parent === window) return;
  window.parent.postMessage({ namespace: 'us026-demo', type, ...payload }, location.origin);
}

function announceState() {
  parentMessage('state', {
    scenarioId: state.scenarioId,
    pending: state.pending,
    jobStatus: state.job?.status ?? null,
    proofCount: state.rows.length,
    view: state.view,
  });
}

function announceOperation(operation, phase) {
  parentMessage('operation', { operation, phase });
}

function setAppearance() {
  const html = document.documentElement;
  html.dataset.cuTheme = config.theme;
  html.dataset.textScale = config.textScale;
  html.dataset.motion = config.reducedMotion ? 'reduce' : 'full';
  html.dataset.transparency = config.reducedTransparency ? 'reduce' : 'full';
}

function safeProofUrl(value) {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

function timestampLabel(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Timestamp unavailable';
  const formatted = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  }).format(date);
  return `${formatted} ICT`;
}

function desktopNavigation() {
  const items = [
    navItem('Overview', 'home', { href: '#home', attrs: 'aria-disabled="true" tabindex="-1"' }),
    navItem('Services', 'services', { href: '#services', attrs: 'aria-disabled="true" tabindex="-1"' }),
    navItem('My Jobs', 'jobs', { href: '#my-jobs', active: true, attrs: 'data-screen-action="my-jobs"' }),
    navItem('Invitations', 'invites', { href: '#invites', attrs: 'aria-disabled="true" tabindex="-1"' }),
    navItem('Profile', 'profile', { href: '#profile', attrs: 'aria-disabled="true" tabindex="-1"' }),
  ].join('');
  return `<nav class="cu-nav cu-nav--desktop" aria-label="Marketer navigation"><span class="cu-nav-tile" aria-hidden="true"></span>${items}</nav>`;
}

function renderHeader() {
  const items = menuItem('My Jobs', { href: '#my-jobs', attrs: 'data-screen-action="my-jobs"' });
  return headerBar({
    theme: config.theme,
    material: config.material,
    menuOpen,
    menuId: 'us026-workspace-menu',
    brandHref: '#my-jobs',
    brandAttrs: 'data-screen-action="my-jobs"',
    nav: desktopNavigation(),
    themeAttrs: 'data-screen-action="theme"',
    roleLabel: 'Survey Marketer role, fixed for this story',
    roleAttrs: 'disabled',
    menuAttrs: 'data-screen-action="menu"',
    items,
    className: 'story-header',
  });
}

function renderProofRows(rows) {
 if(!rows.length)return `<div class="empty-state"><div class="empty-mark" aria-hidden="true">${icon('jobs')}</div><div><h3>No proof added yet</h3>${state.scenarioId==='A01'?'<p>Add your first delivery link.</p>':''}</div></div>`;
 return rows.map(row=>`<article class="proof-row">${attachmentTag()}${evidenceLink(row.url)}<time datetime="${esc(row.upload_at)}">${esc(timestampLabel(row.upload_at))}</time></article>`).join('');
}
function renderForm(){
 const pending=state.pending==='save',disabled=!canSubmitProof(state)||!state.draft.trim();
 return `<dialog class="proof-dialog cu-content-dialog" aria-labelledby="proof-dialog-title" aria-busy="${pending}"><div class="cu-dialog-topline"><h2 id="proof-dialog-title" tabindex="-1">${pending?'Saving proof':'Add proof'}</h2>${closeControl('Close proof form',{attrs:'data-screen-action="close-form"'})}</div>${state.scenarioId==='B04'?`<div class="proof-feedback">${renderFeedback()}</div>`:''}<form id="proof-form" class="proof-form" novalidate aria-busy="${pending}"><div class="proof-field"><label for="proof-url">Delivery link</label><input id="proof-url" name="proof-url" type="url" inputmode="url" autocomplete="url" required placeholder="https://…" value="${esc(state.draft)}" aria-invalid="${Boolean(state.fieldError)}" ${state.fieldError?'aria-describedby="proof-url-error"':''} ${pending?'readonly':''}>${state.fieldError?`<p class="field-error" id="proof-url-error">${icon('warning')}<span>${esc(state.fieldError)}</span></p>`:''}</div><div class="form-actions">${action(pending?'Saving proof…':'Save proof',{emphasis:'primary',busy:pending,disabled:disabled&&!pending,type:'submit',attrs:'data-screen-action="submit"'})}</div></form></dialog>`;
}
function renderRetainedDraft(){
 if(!['B02','B03'].includes(state.scenarioId))return '';
 return `<div class="retained-draft"><p>${state.scenarioId==='B03'?'Unconfirmed link':'Draft link'}</p>${evidenceLink(state.draft)}</div>`;
}
function operationSummary(){
 if(!state.pending)return backgroundMessage?banner({...backgroundMessage,id:'background-result'}):'';
 return operationNotice({title:state.pending==='save'?'Saving proof':'Loading delivery evidence',actions:[{label:state.pending==='save'?'View progress':'Stop waiting',attrs:state.pending==='save'?'data-screen-action="open-form"':'data-screen-action="stop-waiting"'}]});
}
function proofHeading(){
 const status=state.job?.status??'In Progress',fixture=FIXTURES[state.fixtureId];
 return `<header class="story-heading"><div class="proof-title-row cu-status-heading"><div class="cu-status-copy"><h1>Proof of delivery</h1></div>${lifecycleBadge(status)}</div><p class="job-identity"><span>Job #${esc(state.job?.id??fixture.jobId)}</span><span>${esc(state.job?.title??fixture.jobTitle)}</span></p></header>`;
}

function renderFeedback() {
  switch (state.scenarioId) {
    case 'A04':
      return banner({ tone: 'success', title: 'Proof saved', body: '', id: 'proof-feedback', focusable: true });
    case 'A06':
      return ['save-confirmed','proof-confirmed'].includes(state.feedback)
        ? banner({ tone: 'success', title: 'Proof saved', body: '', id: 'proof-feedback', focusable: true }) : '';
    case 'B02':
      return feedbackBlock({ tone: 'error', title: 'Proof wasn’t saved', body: 'The attachment type was rejected.', id: 'proof-feedback', focusable: true, actions: [{ label: 'Reopen proof form', attrs: 'data-screen-action="reopen"' }] });
    case 'B03':
      if(state.pending==='check')return '';
      if (state.feedback === 'check-unavailable') return feedbackBlock({ tone: 'error', title: 'Couldn’t check saved proof', body: 'The result is still unknown. Keep this link and check again before trying another save.', id: 'proof-feedback', focusable: true, actions: [{ label: 'Check saved proof again', icon: 'refresh', attrs: 'data-screen-action="check"' }] });
      return feedbackBlock({ tone: 'warning', title: 'We couldn’t confirm the save', body: 'Check the saved list before trying again.', id: 'proof-feedback', focusable: true, actions: [{ label: 'Check saved proof', icon: 'refresh', attrs: 'data-screen-action="check"' }] });
    case 'B04':
      return banner({ tone: 'info', title: formOpen ? 'Link not saved' : 'This link wasn’t saved', body: formOpen ? '' : 'You can try saving it again.', id: 'proof-feedback', focusable: true });
    case 'C01':
      return feedbackBlock({ tone: 'error', title: 'Couldn’t load saved proof', body: 'Try again to load your saved links.', id: 'proof-feedback', focusable: true, actions: [{ label: 'Try again', icon: 'refresh', attrs: 'data-screen-action="retry-list"' }] });
    case 'C02':
      if(state.pending==='refresh')return '';
      return feedbackBlock({ tone: 'warning', title: 'This job may have changed', body: 'Refresh the job before adding proof.', id: 'proof-feedback', focusable: true, actions: [{ label: 'Refresh job', icon: 'refresh', attrs: 'data-screen-action="refresh-status"' }] });
    default: return '';
  }
}

function renderJobView(){
 const feedback=renderFeedback(),canAdd=state.job.status==='In Progress'&&!['C02','B02','B03'].includes(state.scenarioId);
 const add=canAdd?action('Add proof',{secondary:'entry',disabled:!!state.pending,attrs:'data-screen-action="open-form"'}):'';
 return `<main class="story-main cu-workspace" id="story-main" tabindex="-1"><div class="page-return">${backLink('Back to My Jobs',{href:'#my-jobs',attrs:'data-screen-action="my-jobs"'})}</div>${proofHeading()}${state.pending&&!formOpen?operationSummary():''}${feedback&&!formOpen?`<div class="proof-feedback">${feedback}</div>`:''}<section class="proof-card proof-workspace" aria-labelledby="saved-proof-title"><header class="proof-list-head"><h2 id="saved-proof-title">Saved proof <span class="proof-count">(${state.rows.length})</span></h2>${add}</header>${renderRetainedDraft()}<div class="proof-list">${renderProofRows(state.rows)}</div></section>${canShowProofForm(state)&&formOpen?renderForm():''}</main>`;
}

function renderLoading(){
 return `<main class="story-main cu-workspace" id="story-main" tabindex="-1"><div class="page-return">${backLink('Back to My Jobs',{href:'#my-jobs',attrs:'data-screen-action="my-jobs"'})}</div>${proofHeading()}${loadingScaffold('proof','Loading saved proof',[{label:'Stop waiting',attrs:'data-screen-action="stop-waiting"'}])}</main>`;
}
function renderLoadFailure(){
 return `<main class="story-main cu-workspace" id="story-main" tabindex="-1"><div class="page-return">${backLink('Back to My Jobs',{href:'#my-jobs',attrs:'data-screen-action="my-jobs"'})}</div>${proofHeading()}<div class="proof-feedback">${renderFeedback()}</div></main>`;
}
function renderUnavailable(){
 return `<main class="story-main cu-workspace" id="story-main" tabindex="-1"><div class="page-return">${backLink('Back to My Jobs',{href:'#my-jobs',attrs:'data-screen-action="go-to-jobs"'})}</div><section class="proof-card unavailable-state"><div class="empty-mark" aria-hidden="true">${icon('jobs')}</div><h1>Job unavailable</h1><p>Your access has changed.</p></section></main>`;
}
function renderJobs(){
 const job=state.job?`<section class="jobs-placeholder"><header class="cu-status-heading"><div class="cu-status-copy"><span class="job-reference">Job #${esc(state.job.id)}</span></div>${lifecycleBadge(state.job.status)}</header><h2>${esc(state.job.title)}</h2><div class="job-entry-actions">${action('Open delivery evidence',{secondary:'entry',attrs:'data-screen-action="open-job"'})}</div></section>`:'<section class="jobs-placeholder"><h2>No job selected</h2></section>';
 return `<main class="story-main cu-workspace" id="story-main" tabindex="-1"><div class="page-return">${backLink('Story library',{href:'../../index.html'})}</div><header class="story-heading"><h1 id="jobs-title" tabindex="-1">My Jobs</h1></header>${operationSummary()}${job}</main>`;
}

function renderFooter() {
  const items = [
    navItem('Home', 'home', { href: '#home', attrs: 'aria-label="Overview" aria-disabled="true" tabindex="-1"' }),
    navItem('Services', 'services', { href: '#services', attrs: 'aria-disabled="true" tabindex="-1"' }),
    navItem('Jobs', 'jobs', { href: '#my-jobs', active: true, attrs: 'data-screen-action="my-jobs" aria-label="My Jobs"' }),
    navItem('Invites', 'invites', { href: '#invites', attrs: 'aria-label="Invitations" aria-disabled="true" tabindex="-1"' }),
    navItem('Profile', 'profile', { href: '#profile', attrs: 'aria-disabled="true" tabindex="-1"' }),
  ].join('');
  return bottomBar(items, { material: config.material, attrs: 'aria-label="Marketer navigation"', className: 'story-bottom-nav' });
}

function setNavLayout() {
  const nav = root.querySelector('.cu-bottom-nav');
  if (!nav) return;
  stopCompactObservation();
  stopTileObservation();
  stopCompactObservation = observeCompactNavigation(nav);
  const desktop = root.querySelector('.cu-nav--desktop');
  if (desktop) stopTileObservation = observeNavigationTile(desktop);
  const short = window.innerHeight < 500 || (Number(config.textScale) >= 150 && window.innerHeight < 640);
  document.documentElement.dataset.navFlow = String(short);
  const height = nav.getBoundingClientRect().height;
  document.documentElement.style.setProperty('--proof-nav-clearance', short ? '0px' : `${height}px`);
}

function render({ focusId = null, preserveInput = false } = {}) {
  const activeInput = preserveInput && document.activeElement?.id === 'proof-url';
  const selection = activeInput ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null;
  setAppearance();
  document.documentElement.dataset.selectedScenario=state.scenarioId;
  document.documentElement.dataset.operation=state.pending??'';
  let main;
  if (state.view === 'jobs') main = renderJobs();
  else if (!state.job) main = renderUnavailable();
  else if (state.pending === 'read' || state.listStatus === 'loading') main = renderLoading();
  else if (state.listStatus === 'failed') main = renderLoadFailure();
  else main = renderJobView();
  root.innerHTML = `${renderHeader()}${main}${renderFooter()}`;
  root.querySelector('[data-screen-action="theme"]')?.addEventListener('click', () => {
    config = { ...config, theme: config.theme === 'light' ? 'dark' : 'light' };
    render();
    root.querySelector('[data-screen-action="theme"]')?.focus();
    parentMessage('config-change', { key: 'theme', value: config.theme });
  });
  root.querySelector('[data-screen-action="menu"]')?.addEventListener('click', () => {
    menuOpen = !menuOpen;
    render();
    root.querySelector('[data-screen-action="menu"]')?.focus();
  });
  root.querySelectorAll('[data-screen-action="my-jobs"]').forEach((el) => el.addEventListener('click', (event) => {
    event.preventDefault();
    menuOpen = false;
    dispatch({ type: 'go-to-jobs' }, 'jobs-title');
    location.hash = '#my-jobs';
    parentMessage('navigation', { destination: 'my-jobs' });
  }));
  root.querySelector('#proof-form')?.addEventListener('input', (event) => {
    if (event.target.id !== 'proof-url') return;
    state = reduceDemoState(state, { type: 'draft', value: event.target.value });
    render({ preserveInput: true });
    announceState();
  });
  root.querySelector('#proof-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = root.querySelector('#proof-url');
    state = reduceDemoState(state, { type: 'draft', value: input.value });
    if (isValidProofUrl(state.draft) && canSubmitProof(state)) announceOperation('submit', 'started');
    dispatch({ type: 'submit', outcome: config.saveOutcome }, isValidProofUrl(state.draft) ? null : 'proof-url');
  });
  root.querySelectorAll('[data-screen-action]').forEach((el) => {
    if (['theme', 'menu', 'my-jobs','submit'].includes(el.dataset.screenAction)) return;
    el.addEventListener('click', (event) => {
      event.preventDefault();
      runAction(el.dataset.screenAction);
    });
  });
  setNavLayout();
  const modal=root.querySelector('.proof-dialog');let modalOverflow=false;
  if(modal){
    modal.showModal();
    modalOverflow=modal.scrollHeight>modal.clientHeight+1;
    modal.addEventListener('cancel',event=>{event.preventDefault();runAction('close-form');});
    modal.addEventListener('click',event=>{const r=modal.getBoundingClientRect();if(event.target===modal&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))runAction('close-form');});
    modal.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const stops=[...modal.querySelectorAll('button:not(:disabled),input:not(:disabled),a[href]')],first=stops[0],last=stops.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}});
    if(!focusId&&!activeInput){modal.querySelector(state.pending||modalOverflow?'h2':'input')?.focus({preventScroll:true});if(modalOverflow)modal.scrollTop=0;}
  }
  if (focusId) { const target=root.querySelector(`#${CSS.escape(focusId)}`);if(modal&&modalOverflow&&focusId!=='proof-url'){modal.querySelector('h2')?.focus({preventScroll:true});modal.scrollTop=0;}else if(!modal||modal.contains(target))target?.focus();else modal.querySelector('input,h2')?.focus(); }
  else if (activeInput) {
    const input = root.querySelector('#proof-url');
    input?.focus();
    if(input&&selection&&selection[0]!==null)try{input.setSelectionRange(selection[0],selection[1]);}catch{};
  }
  announceState();
  persistJournal();
}

function dispatch(event, focusId = null) {
  // A confirmed reconciliation miss permits an explicit retry of the retained
  // draft. Keep its form visible, matching the directly selected B04 state.
  const before = state;
  state = reduceDemoState(state, event);
  if (state === before) return;
  menuOpen = false;
  if(['add-another','reopen-form'].includes(event.type))formOpen=true;
  if(event.type==='resolve-save'&&!state.pending){formOpen=['B01','B04'].includes(state.scenarioId);if(state.view==='jobs')backgroundMessage={tone:state.scenarioId==='A04'||state.scenarioId==='A06'?'success':'warning',title:state.scenarioId==='A04'||state.scenarioId==='A06'?'Proof saved':'Check the proof result'};}
  if(event.type==='resolve-check'&&state.scenarioId==='B04')formOpen=true;
  render({ focusId, preserveInput: !focusId });
  schedulePending();
}

function resolvePending() {
  switch (state.pending) {
    case 'save': {
      const outcome = state.pendingSaveOutcome ?? config.saveOutcome;
      dispatch({ type: 'resolve-save', outcome }, outcome === 'confirmed' ? 'proof-feedback' : 'proof-feedback');
      announceOperation('submit', outcome);
      break;
    }
    case 'read': {
      const outcome = config.loadOutcome === 'loaded' ? 'available' : 'failed';
      dispatch({ type: 'resolve-list', outcome }, outcome === 'failed' ? 'proof-feedback' : 'story-main');
      announceOperation('read', outcome);
      break;
    }
    case 'check': {
      dispatch({ type: 'resolve-check', outcome: config.checkOutcome }, 'proof-feedback');
      announceOperation('reconcile', config.checkOutcome);
      break;
    }
    case 'refresh':
      dispatch({ type: 'resolve-status' }, 'story-main');
      announceOperation('status', 'refreshed');
      break;
    default: break;
  }
}

function runAction(name) {
  if(name==='open-form'){formOpen=true;if(state.view==='jobs')return dispatch({type:'open-job'},'proof-url');if(['A04','A06'].includes(state.scenarioId))return dispatch({type:'add-another'},'proof-url');render({focusId:'proof-url'});return;}
  if(name==='close-form'){formOpen=false;render();root.querySelector('[data-screen-action="open-form"]')?.focus();return;}
  if(name==='stop-waiting')return dispatch({type:'timeout'},'proof-feedback');
  if(name==='submit'){root.querySelector('#proof-form')?.requestSubmit();return;}
  if (name === 'reopen') return dispatch({ type: 'reopen-form' }, 'proof-url');
  if (name === 'add-another') return dispatch({ type: 'add-another' }, 'proof-url');
  if (name === 'check') {
    announceOperation('reconcile', 'started');
    return dispatch({ type: 'check-saved' });
  }
  if (name === 'retry-list') {
    announceOperation('read', 'started');
    return dispatch({ type: 'retry-list' });
  }
  if (name === 'refresh-status') {
    announceOperation('status', 'started');
    return dispatch({ type: 'refresh-status' });
  }
  if (name === 'go-to-jobs') return dispatch({ type: 'go-to-jobs' }, 'jobs-title');
  if (name === 'open-job') return dispatch({ type: 'open-job' }, 'story-main');
}

function schedulePending(){
 if(!state.pending){clearTimeout(timer);clearTimeout(deadlineTimer);scheduledPending=null;pendingRevision++;return;}
 if(scheduledPending===state.pending)return;
 clearTimeout(timer);clearTimeout(deadlineTimer);scheduledPending=state.pending;const revision=++pendingRevision;
 if(config.responseMode!=='manual')timer=setTimeout(()=>{if(revision===pendingRevision&&state.pending)resolvePending();},650);
 deadlineTimer=setTimeout(()=>{if(revision===pendingRevision&&state.pending)dispatch({type:'timeout'},'proof-feedback');},OPERATION_WAIT_MS);
}

function selectScenario(scenarioId) {
  if (!allowed.scenario.has(scenarioId)) return;
  journal.clear();journalActive=false;config.scenarioId=scenarioId;
  clearTimeout(timer);
  pendingRevision += 1;
  state = createDemoState(scenarioId, config);
  scheduledPending=null;clearTimeout(deadlineTimer);backgroundMessage=null;formOpen=!['A01','A04','A06','B02','B03','C01','C02','C03','C04'].includes(scenarioId);
  menuOpen = false;
  if (scenarioId === 'C04') announceOperation('read', 'staged');
  if (scenarioId === 'A03') announceOperation('submit', 'staged');
  render();
  schedulePending();
}

function updateConfig(next) {
  if (!next || typeof next !== 'object') return;
  const previous = config;
  for (const [key, value] of Object.entries(next)) {
    if (key === 'reducedMotion' || key === 'reducedTransparency') {
      if (typeof value === 'boolean') config = { ...config, [key]: value };
    } else if (allowed[key]?.has(value)) config = { ...config, [key]: value };
  }
  setAppearance();
  if (previous.fixtureId !== config.fixtureId || (state.scenarioId === 'B03' && previous.reconciliationResult !== config.reconciliationResult)) {
    selectScenario(state.scenarioId);
  } else {
    render({ preserveInput: true });
    schedulePending();
  }
}

window.addEventListener('message', (event) => {
  if (event.source !== window.parent || event.origin !== location.origin || event.data?.namespace !== 'us026-demo') return;
  if (event.data.type === 'configure') updateConfig(event.data.config);
  else if (event.data.type === 'select-scenario') selectScenario(event.data.scenarioId);
  else if (event.data.type === 'resolve') resolvePending();
});

root.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !menuOpen) return;
  menuOpen = false;
  render();
  root.querySelector('[data-screen-action="menu"]')?.focus();
});
window.addEventListener('resize', setNavLayout, { passive: true });
window.addEventListener('load', setNavLayout, { once: true });
window.addEventListener('pagehide',persistJournal);
window.addEventListener('pageshow',e=>{if(e.persisted){restoreJournal(true);render();}});
render();
if (state.pending) schedulePending();
