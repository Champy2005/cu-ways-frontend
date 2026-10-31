import {OPERATION_WAIT_MS,SLOW_NOTICE_MS,operationJournal} from '../../theme/operations.mjs';
import { SCENARIO_BY_ID, FIXTURES } from './scenarios.mjs';
import { createDemoState, transitionDemo } from './state-machine.mjs';
import { defaultFilter, listFilters, listPageUrl, readScreenLocation, screenUrl, shouldHandleLocalClick } from './navigation.mjs';
import { mockJobRecord, mockJobRecords, mockReadStatus } from './mock-jobs.mjs';
import { lifecycleBadge, closeControl, action, backLink, badge, banner, feedbackBlock, esc, icon, navItem, headerBar, headerControl, menuItem, bottomBar, positionNavigationTile, observeNavigationTile, observeCompactNavigation, fitCompactNavigation, operationNotice, keepFocusVisible } from '../../theme/components.mjs';
import { applyDraft, subscribeDraft } from '../../theme/tuning.mjs';

const root = document.querySelector('#screen-root');
keepFocusVisible(root);
const overlayRoot = document.querySelector('#overlay-root');
const origin = window.location.origin;
const query = new URLSearchParams(location.search);
const allowed = {
  theme: new Set(['light', 'dark']),
  material: new Set(['opaque', 'glass']),
  textScale: new Set(['100', '150', '200']),
  fixtureName: new Set(Object.keys(FIXTURES)),
  startOutcome: new Set(['started', 'already_in_progress', 'rejected', 'unknown', 'forbidden', 'session_expired', 'invalid', 'terminal']),
  refreshOutcome: new Set(['in-progress', 'accepted', 'completed', 'cancelled', 'unavailable', 'session_expired', 'invalid', 'failed']),
  responseMode: new Set(['immediate', 'slow', 'hold']),
};

function selected(set, value, fallback) { return set.has(value) ? value : fallback; }
const settings = {
  scenarioId: SCENARIO_BY_ID[query.get('scenario')] ? query.get('scenario') : 'L02',
  fixtureName: selected(allowed.fixtureName, query.get('fixture'), 'standard'),
  theme: selected(allowed.theme, query.get('theme'), 'light'),
  material: selected(allowed.material, query.get('material'), 'opaque'),
  textScale: selected(allowed.textScale, query.get('textScale'), '100'),
  reducedMotion: query.get('reducedMotion') === '1',
  startOutcome: selected(allowed.startOutcome, query.get('startOutcome'), 'started'),
  refreshOutcome: selected(allowed.refreshOutcome, query.get('refreshOutcome'), 'in-progress'),
  responseMode: selected(allowed.responseMode, query.get('responseMode'), 'immediate'),
};

const initialLocation = readScreenLocation(query, { scenarioId: settings.scenarioId, jobId: FIXTURES[settings.fixtureName].jobId });
const confirmedStatusByJob = new Map();
const backgroundStarts=new Map();
let backgroundResult=null;
const uncertainStarts=new Set(),journal=operationJournal('US-025');let journalActive=false;
function persistStartJournal(){
 if(backgroundStarts.size||state.unknownOutcome)journalActive=true;
 if(!journalActive)return;
 journal.write({scene:state.scenarioId,fixture:settings.fixtureName,phase:backgroundStarts.size?'pending':uncertainStarts.size||state.unknownOutcome?'unknown':'settled',snapshot:{state,confirmed:[...confirmedStatusByJob],uncertain:[...uncertainStarts],pendingJobs:[...backgroundStarts.keys()]}});
}
function restoreStartJournal(force=false){
 const record=journal.read({fixture:settings.fixtureName,explicitScenario:query.has('scenario'),navigationType:performance.getEntriesByType('navigation')[0]?.type,force});
 if(!record||!SCENARIO_BY_ID[record.snapshot.state?.scenarioId])return;
 resetBackgroundStarts();confirmedStatusByJob.clear();uncertainStarts.clear();
 for(const[id,status]of record.snapshot.confirmed??[])confirmedStatusByJob.set(id,status);
 for(const id of [...record.snapshot.uncertain??[],...record.snapshot.pendingJobs??[]])uncertainStarts.add(id);
 state={...record.snapshot.state,pending:false,confirmationOpen:false,offlineNotice:false,focusTarget:null};
 if(uncertainStarts.has(state.jobId)&&state.privateDataVisible){
  const previous=state;
  state=createDemoState({...previous,scenarioId:previous.route==='list'?'C06':'R04'});
  state.startPostCount=previous.startPostCount;state.requestId=previous.requestId;
  state.safeReturnCheckRequired=previous.route==='list';state.lastConfirmedStatus=previous.lastConfirmedStatus;
 }
 settings.scenarioId=state.scenarioId;readIntentForDetail=false;journalActive=true;
}
function requiresJobRecord(scenarioId) { return !(scenarioId.startsWith('L') || scenarioId === 'C06'); }

function createLocationState(options) {
  const next = createDemoState(options);
  const fixture = FIXTURES[next.fixtureName] ?? FIXTURES.standard;
  if (requiresJobRecord(next.scenarioId) && !mockJobRecord(fixture, next.jobId)) {
    return createDemoState({ ...options, scenarioId: 'D06' });
  }
  return next;
}

let state = createLocationState({
  ...settings,
  ...initialLocation,
  scenarioId: initialLocation.invalidJob ? 'D06' : initialLocation.scenarioId,
});
settings.scenarioId = state.scenarioId;
let readIntentForDetail = ['D01', 'C08', 'R13'].includes(state.scenarioId) && initialLocation.readOnLoad;
let readModeForDetail = initialLocation.readMode ?? 'record';
function rememberKnownSceneStatus({ overwrite = false } = {}) {
  const fixture = FIXTURES[state.fixtureName] ?? FIXTURES.standard;
  if (state.statusKnown && mockJobRecord(fixture, state.jobId)
    && (overwrite || !confirmedStatusByJob.has(state.jobId))) {
    confirmedStatusByJob.set(state.jobId, state.jobStatus);
  }
}

function restoreRememberedStatus() {
  const remembered = confirmedStatusByJob.get(state.jobId);
  if (!remembered || !state.statusKnown || state.jobStatus === remembered) return;
  const scenarioId = remembered === 'Accepted' ? 'D02'
    : remembered === 'In Progress' ? 'D04' : 'D05';
  state = createDemoState({
    scenarioId,
    fixtureName: state.fixtureName,
    jobId: state.jobId,
    listFilter: state.listFilter,
    page: state.page,
    startPostCount: state.startPostCount,
    requestId: state.requestId,
    lastConfirmedStatus: remembered,
    returnFocusToJob: state.returnFocusToJob,
    demoSignInComplete: state.demoSignInComplete,
  });
  state.jobStatus = remembered;
  state.lastConfirmedStatus = remembered;
  state.statusKnown = true;
  state.privateDataVisible = true;
}

rememberKnownSceneStatus();
let menuOpen = false;
let stopTileObservation=()=>{};
let stopCompactObservation=()=>{};
let autoTimer = 0;
let slowTimer = 0;
let deadlineTimer = 0;
let listTimer = 0;
let announcement = '';
let lastAnnouncedScenario = state.scenarioId;

function tuneTheme() {
  document.documentElement.dataset.cuTheme = settings.theme;
  document.documentElement.dataset.material = settings.material;
  document.documentElement.dataset.motion = settings.reducedMotion ? 'reduce' : 'full';
  document.documentElement.dataset.textScale = settings.textScale;
  applyDraft(document.documentElement, settings.theme);
}

function postToParent(message) {
  if (window.parent === window) return;
  const targetOrigin = origin === 'null' ? '*' : origin;
  window.parent.postMessage(message, targetOrigin);
}

function summarizeState() {
  return {
    id: state.scenarioId,
    status: state.statusKnown ? state.jobStatus : null,
    pending: state.pending,
    startPostCount: state.startPostCount,
    privateDataVisible: state.privateDataVisible,
    listFilter: state.listFilter,
    page: state.page,
    jobId: state.jobId,
    readOnLoad: state.pending || state.scenarioId === 'R13' || readIntentForDetail,
    readMode: state.scenarioId === 'R13' || readModeForDetail === 'configured' ? 'configured' : 'record',
  };
}

function sendState() {
  postToParent({ type: 'cuways-demo-state', ...summarizeState() });
}

function emitRequest(entry) {
  postToParent({ type: 'cuways-demo-request', entry, state: summarizeState() });
}

function emitEffects(effects = []) {
  for (const entry of effects) emitRequest(entry);
}

function currentLocation() {
  return {
    scenarioId: state.scenarioId,
    listFilter: state.listFilter,
    page: state.page,
    jobId: state.jobId,
    readOnLoad: state.pending || state.scenarioId === 'R13' || readIntentForDetail,
    readMode: state.scenarioId === 'R13' || readModeForDetail === 'configured' ? 'configured' : 'record',
  };
}

function updateQuery(mode = 'replace', entry = history.state) {
  const next = screenUrl(location.href, settings, currentLocation());
  const metadata = { ...(entry && typeof entry === 'object' ? entry : {}), cuwaysDemoEntry: state.route === 'list' ? 'list' : 'detail' };
  if (mode === 'push') history.pushState(metadata, '', next);
  else history.replaceState(metadata, '', next);
}

function applySettings(nextSettings) {
  const previousScenario = settings.scenarioId;
  const previousFixture = settings.fixtureName;
  for (const key of ['scenarioId', 'fixtureName', 'theme', 'material', 'textScale', 'startOutcome', 'refreshOutcome', 'responseMode']) {
    if (key === 'scenarioId' && SCENARIO_BY_ID[nextSettings[key]]) settings[key] = nextSettings[key];
    else if (key === 'fixtureName' && allowed.fixtureName.has(nextSettings[key])) settings[key] = nextSettings[key];
    else if (allowed[key]?.has(nextSettings[key])) settings[key] = nextSettings[key];
  }
  if (typeof nextSettings.reducedMotion === 'boolean') settings.reducedMotion = nextSettings.reducedMotion;
  tuneTheme();
  updateQuery();
  if (previousScenario !== settings.scenarioId || previousFixture !== settings.fixtureName) {
    journal.clear();journalActive=false;uncertainStarts.clear();
    resetBackgroundStarts();
    clearTimeout(autoTimer);
    clearTimeout(slowTimer);
    clearTimeout(deadlineTimer);
    clearTimeout(listTimer);
    if (previousScenario !== settings.scenarioId) readIntentForDetail = false;
    const fixture = FIXTURES[settings.fixtureName] ?? FIXTURES.standard;
    confirmedStatusByJob.clear();
    const selectedFilter = listFilters.has(nextSettings.listFilter)
      ? nextSettings.listFilter
      : previousScenario !== settings.scenarioId ? defaultFilter(settings.scenarioId) : state.listFilter;
    const selectedPage = Number.isSafeInteger(Number(nextSettings.page)) && Number(nextSettings.page) > 0
      ? Number(nextSettings.page)
      : previousScenario !== settings.scenarioId ? 1 : state.page;
    const selectedJobId = Number.isSafeInteger(Number(nextSettings.jobId)) && Number(nextSettings.jobId) > 0
      ? Number(nextSettings.jobId)
      : previousFixture !== settings.fixtureName ? fixture.jobId : state.jobId;
    const previousState = state;
    state = createLocationState({
      ...settings,
      listFilter: selectedFilter,
      page: selectedPage,
      jobId: selectedJobId,
      startPostCount: previousState.startPostCount,
      requestId: previousState.requestId,
      lastConfirmedStatus: selectedJobId === previousState.jobId
        ? previousState.statusKnown ? previousState.jobStatus : previousState.lastConfirmedStatus
        : null,
    });
    settings.scenarioId = state.scenarioId;
    readModeForDetail = nextSettings.readMode === 'configured' || state.scenarioId === 'R13' ? 'configured' : 'record';
    rememberKnownSceneStatus({ overwrite: true });
    menuOpen = false;
    announcement = '';
    updateQuery();
    render();
    logScenarioRead();
  } else {
    updateQuery();
    render();
  }
  postToParent({ type: 'cuways-demo-settings-changed', settings: { theme: settings.theme, material: settings.material, reducedMotion: settings.reducedMotion } });
}

function formatMoney(value) {
  if (typeof value !== 'string' || !/^\d+(?:\.\d{1,2})?$/.test(value)) return 'Price unavailable';
  const [whole, fraction = ''] = value.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `THB ${grouped}.${fraction.padEnd(2, '0')}`;
}

function formatDate(value, missing = 'Not specified') {
  if (!value || typeof value !== 'string') return missing;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return 'Date unavailable';
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function formatTarget(value) {
  if (value === null || value === undefined) return 'Target not specified';
  if (!Number.isInteger(value) || value < 0) return 'Target unavailable';
  return `${value.toLocaleString('en-US')} responses`;
}

const statusBadge = lifecycleBadge;

function navItems(compact = false) {
  const entries = [
    ['Overview', 'home', '#overview', 'Home'],
    ['Services', 'services', '#services', 'Services'],
    ['My Jobs', 'jobs', listHref(), 'Jobs'],
    ['Invitations', 'invites', '#invitations', 'Invites'],
    ['Profile', 'profile', '#profile', 'Profile'],
  ];
  return entries.map(([label, glyph, href, short]) => navItem(compact ? short : label, glyph, {
    href,
    active: label === 'My Jobs',
    attrs: `aria-label="${label}" data-short="${short}" data-action="nav"${label === 'My Jobs' ? ' data-nav-jobs="true"' : ''}`,
  })).join('');
}

function shellHeader() {
  return `<a class="skip-link" href="#main-content">Skip to content</a>
    ${headerBar({theme:settings.theme,material:settings.material,menuOpen,menuId:'mobile-drawer',className:'product-header',
      brandHref:listHref(),brandAttrs:'data-action="back-to-list"',
      nav:`<nav class="cu-nav--desktop desktop-navigation" data-moving-tile="true" aria-label="Main navigation"><span class="cu-nav-tile" aria-hidden="true"></span>${navItems()}</nav>`,
      roleLabel:'Switch to Creator, current Marketer',themeAttrs:'data-tool="theme" data-action="theme-toggle"',roleAttrs:'data-tool="role" data-action="role-switch"',menuAttrs:'data-tool="menu" data-action="menu-toggle"',
      items:['Workspace','Settings','Sign out'].map(label=>menuItem(label,{attrs:`data-action="outside-demo" data-menu-label="${label}"`})).join('')})}`;
}

function compactNavigation() {
  return bottomBar(navItems(true),{material:settings.material,className:'mobile-bottom-navigation',attrs:'aria-label="My Jobs navigation"'});
}

function topBack(detail = false) {
  if (detail) return `<div class="page-back">${backLink('Back to My Jobs', { inside: false, href: listHref(), attrs: 'data-action="back-to-list"' })}</div>`;
  return `<div class="page-back">${backLink('Back to overview', { inside: false, href: '#overview', attrs: 'data-action="outside-demo" data-menu-label="Overview"' })}</div>`;
}

function pageTitle(title, description = '', { detail = false, eyebrow = '' } = {}) {
  return `${detail ? topBack(true) : ''}<div class="page-title-block">${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}<h1 id="page-heading" class="focus-heading" tabindex="-1">${esc(title)}</h1>${description ? `<p>${esc(description)}</p>` : ''}</div>`;
}

const filterOptions = [
  ['active', 'Active jobs'],
  ['Accepted', 'Accepted'],
  ['In Progress', 'In Progress'],
  ['Completed', 'Completed'],
  ['Cancelled', 'Cancelled'],
  ['all', 'All my jobs'],
];

function listHref() {
  return listPageUrl(location.href, settings, currentLocation(), state.page).href;
}

function filteredJobs() {
  const fixture = FIXTURES[state.fixtureName] ?? FIXTURES.standard;
  const list = mockJobRecords(fixture, confirmedStatusByJob);
  if (state.listFilter === 'active') return list.filter((job) => ['Accepted', 'In Progress'].includes(job.status));
  if (state.listFilter === 'all') return list;
  return list.filter((job) => job.status === state.listFilter);
}

function renderJobCard(job) {
  const href=screenUrl(location.href,settings,{scenarioId:'D01',listFilter:state.listFilter,page:state.page,jobId:job.id,readOnLoad:true});
  return `<article class="job-card"><header class="job-card-heading cu-status-heading"><div class="cu-status-copy"><span class="job-id">Job #${esc(job.id)}</span></div>${statusBadge(job.status)}</header><div class="job-card-copy"><h2 class="result-heading" tabindex="-1"><span class="sr-only">Job #${esc(job.id)} · </span>${job.surveys.map(esc).join(' · ')}</h2><dl class="job-meta"><div><dt>Creator</dt><dd>${esc(job.creator)}</dd></div><div><dt>Agreed price</dt><dd>${esc(formatMoney(job.offeredPrice))}</dd></div><div><dt>Deadline</dt><dd>${esc(formatDate(job.deadline))}</dd></div></dl></div><div class="job-card-actions">${action('View job',{secondary:'entry',href:href.href,attrs:`data-action="view-job" data-job-id="${job.id}"`})}</div></article>`;
}

function listSkeleton() {
  return `<div class="loading-label" role="status">${icon('spinner')}<span>Loading jobs…</span></div>
    <div class="loading-stack" aria-hidden="true">${Array.from({ length: 3 }, () => '<div class="loading-card skeleton-card"><div class="skeleton-line short skeleton-pulse"></div><div class="skeleton-line long skeleton-pulse"></div><div class="skeleton-line skeleton-pulse"></div></div>').join('')}</div>`;
}

function listNotice(id) {
  if (id === 'L06') {
    return `<div class="list-notice">${feedbackBlock({tone:'error', title:SCENARIO_BY_ID.L06.bannerTitle, body:SCENARIO_BY_ID.L06.bannerBody, actions:[{label:'Try again',icon:'refresh',attrs:'data-action="retry-list"'}]})}</div>`;
  }
  if (id === 'L07') return `<div class="list-notice">${feedbackBlock({tone:'warning',title:SCENARIO_BY_ID.L07.bannerTitle,body:SCENARIO_BY_ID.L07.bannerBody,actions:[{label:'Try again',icon:'refresh',attrs:'data-action="retry-list"'}]})}</div>`;
  if (id === 'C06') return `<div class="list-notice">${banner({ tone: 'info', title: 'Start request may still be processing', body: 'Opening a job checks its current status. This page will not repeat the start request.' })}</div>`;
  if (id === 'L08') return `<div class="list-notice loading-label" role="status">${icon('spinner')}<span>Updating your results…</span></div>`;
  if (id === 'L09') return '';
  return '';
}

function listEmptyState(id) {
  const content = {
    L03: ['No active jobs', 'Jobs appear here after a creator accepts your offer.'],
    L04: ['No hired jobs yet', 'Jobs appear here after a creator accepts your offer.'],
    L05: ['No jobs with this status', 'Try a different status or return to Active jobs.'],
  }[id];
  if (!content) return '';
  const actions = id === 'L03'
    ? `<div class="inline-actions">${action('View all my jobs', { emphasis: 'secondary', secondary: 'entry', attrs: 'data-action="show-all"' })}</div>`
    : id === 'L05'
      ? `<div class="inline-actions">${action('Clear filter · Active jobs', { emphasis: 'secondary', secondary: 'recovery', attrs: 'data-action="clear-filter"' })}</div>`
      : '';
  return `<section class="empty-state list-empty"><div class="empty-state-heading"><div class="state-icon" aria-hidden="true">${icon('jobs')}</div><h2>${esc(content[0])}</h2></div><p>${esc(content[1])}</p>${actions}</section>`;
}

function listPagination(totalItems, page, totalPages) {
  if (totalItems === 0 || totalPages <= 1) return '';
  const previousDisabled = page <= 1 || state.scenarioId === 'L08';
  const nextDisabled = page >= totalPages || state.scenarioId === 'L08';
  const previous = action('Previous page', {
    emphasis: 'tertiary', format: 'compact', icon: 'chevron',
    href: previousDisabled ? undefined : listPageUrl(location.href, settings, currentLocation(), page - 1).href,
    disabled: previousDisabled, attrs: 'data-action="previous-page" aria-label="Previous page"',
  });
  const next = action('Next page', {
    emphasis: 'tertiary', format: 'compact', icon: 'chevron',
    href: nextDisabled ? undefined : listPageUrl(location.href, settings, currentLocation(), page + 1).href,
    disabled: nextDisabled, attrs: 'data-action="next-page" aria-label="Next page"',
  });
  return `<nav class="list-pagination" aria-label="Job list pages">
    ${page>1?previous:''}
    <p aria-current="page" aria-label="Page ${page} of ${Math.max(1,totalPages)}">${page}<span aria-hidden="true"> / </span><span class="sr-only"> of </span>${Math.max(1,totalPages)}</p>
    ${page<totalPages?next:''}
  </nav>`;
}

function renderList(id) {
  if (id === 'L09') return `<main id="main-content" class="product-main cu-workspace">${pageTitle('My Jobs')}
    <section class="unavailable-state"><h2>My Jobs isn’t available yet</h2><p>Please return to your overview.</p><div class="inline-actions">${backLink('Back to overview',{inside:true,href:'#overview',attrs:'data-action="outside-demo" data-menu-label="Overview"'})}</div></section></main>`;
  if (id === 'L06') return `<main id="main-content" class="product-main cu-workspace"><div class="list-heading">${pageTitle('My Jobs')}</div>${listNotice('L06')}</main>`;
  if (id === 'L01') return `<main id="main-content" class="product-main cu-workspace" aria-busy="true"><div class="list-heading">${pageTitle('My Jobs')}<label class="filter-control"><span>Status</span><select aria-label="Filter jobs by status" disabled><option>Active jobs</option></select></label></div>${listSkeleton()}</main>`;
  const empty = listEmptyState(id), jobs = filteredJobs(), totalItems = jobs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / 20));
  const page = Math.min(Math.max(1, state.page), totalPages), shown = jobs.slice((page-1)*20,page*20), busy = id==='L08';
  if (page !== state.page) { state.page = page; updateQuery(); }
  const options = filterOptions.map(([value,label])=>`<option value="${esc(value)}"${state.listFilter===value?' selected':''}>${esc(label)}</option>`).join('');
  const noStatusJobs = empty || (totalItems===0?listEmptyState(state.listFilter==='active'?'L03':state.listFilter==='all'?'L04':'L05'):'');
  return `<main id="main-content" class="product-main cu-workspace" ${busy?'aria-busy="true"':''}>
    <div class="list-heading">${pageTitle('My Jobs')}<label class="filter-control" for="job-filter"><span>Status</span><select id="job-filter" name="job-filter" aria-label="Filter jobs by status">${options}</select></label></div>
    ${id==='C06'&&backgroundStarts.size?'':listNotice(id)}
    <p class="list-count sr-only" aria-live="polite">${busy?'Updating…':`${totalItems} ${totalItems===1?'job':'jobs'}`}</p>
    ${noStatusJobs || `<section class="job-grid" aria-label="Hired jobs">${shown.map(renderJobCard).join('')}</section>${listPagination(totalItems,page,totalPages)}`}
  </main>`;
}

function safeBrief(url) {
  if (!url) return '<span>No brief attached</span>';
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '<span>Link unavailable</span>';
    return `<a href="${esc(parsed.href)}" target="_blank" rel="noreferrer">Open brief <span class="sr-only">(opens in new tab)</span></a>`;
  } catch {
    return '<span>Link unavailable</span>';
  }
}


function contextCard(fixture,{hideCreator=false}={}) {
 return `<section class="detail-card context-card" aria-labelledby="context-heading"><header class="context-card-heading"><h2 id="context-heading">${fixture.surveys.length===1?'Survey':'Surveys'}</h2>${fixture.surveys.length>1?`<span class="survey-count">${fixture.surveys.length} total</span>`:''}</header><ul class="survey-list">${fixture.surveys.map(name=>`<li>${esc(name)}</li>`).join('')}</ul><dl class="context-list">${hideCreator?'':`<div><dt>Creator</dt><dd>${esc(fixture.creator)}</dd></div>`}<div><dt>Agreed delivery</dt><dd>${esc(formatDate(fixture.deliveryDate))}</dd></div><div><dt>Deadline</dt><dd>${esc(formatDate(fixture.deadline))}</dd></div><div><dt>Target responses</dt><dd>${esc(formatTarget(fixture.targetResponses))}</dd></div><div><dt>Brief</dt><dd>${safeBrief(fixture.briefUrl)}</dd></div></dl></section>`;
}

function selectedMockJob() {
  const fixture = FIXTURES[state.fixtureName] ?? FIXTURES.standard;
  const record = mockJobRecord(fixture, state.jobId, confirmedStatusByJob);
  return record && state.optionalMissingJobId === state.jobId
    ? {...record, deliveryDate:null, deadline:null, targetResponses:null, briefUrl:null}
    : record;
}

const feedbackRecoveryStates=new Set(['R01','R04','R07','R11','R12','R13','R14','C08','D08','R10']);
function dynamicFeedback(id) {
  const definition = SCENARIO_BY_ID[id];
  if (!definition?.bannerTone) return '';
  const checking=['R01','R13'].includes(id);
  const reading=id==='C08'&&readIntentForDetail;
  return feedbackBlock({tone:definition.bannerTone,title:definition.bannerTitle??'',body:(definition.bannerBody??'').replace('{status}',state.jobStatus??'Unavailable'),pending:checking,actions:feedbackRecoveryStates.has(id)&&!checking?[{label:reading?'Refreshing…':'Refresh job',icon:'refresh',busy:reading,disabled:state.pending,attrs:'data-action="refresh-detail"'}]:[]});
}

function startAction(id) {
  return action('Start job', { emphasis:'primary', disabled:state.pending, attrs:'data-action="start" aria-describedby="action-heading"' });
}

function detailActions(id) {
  const refresh = !['D05','R06'].includes(id)&&!feedbackRecoveryStates.has(id);
  const start = ['D02','D09','C02','R03','R11'].includes(id);
  if(!refresh&&!start)return '';
  return `<div class="panel-actions">${start?`<div class="desktop-start-action">${startAction(id)}</div>`:''}${refresh?action('Refresh job',{secondary:'utility',icon:'refresh',disabled:state.pending,attrs:'data-action="refresh-detail"'}):''}</div>`;
}

function detailStatePanel(id) {
 const fixture=selectedMockJob();if(!fixture)return '';
 const status=state.statusKnown?state.jobStatus:null;
 const lastConfirmed=!status&&state.lastConfirmedStatus;
 return `<section class="detail-card action-panel" aria-labelledby="action-heading"><header class="action-panel-heading cu-status-heading"><div class="cu-status-copy"><h2 id="action-heading">Contract</h2></div>${status?statusBadge(status):''}</header>${id==='R14'?'<p class="status-provenance">Last confirmed information</p>':''}${lastConfirmed?`<p class="last-confirmed">Last confirmed: <strong>${esc(state.lastConfirmedStatus)}</strong></p>`:''}<dl class="agreed-price"><dt>Agreed price</dt><dd>${esc(formatMoney(fixture.offeredPrice))}</dd></dl>${detailActions(id)}</section>`;
}

function actionTray(id) {
  const eligible=['D02','D09','C02','R03'].includes(id)&&state.statusKnown&&state.jobStatus==='Accepted';
  if (!eligible&&id!=='R11') return '';
  return `<div class="cu-action-tray product-action-tray" role="group" aria-label="Job start action">${startAction(id)}</div>`;
}

function unavailableContent(id) {
  if (id==='D06'||id==='R08') return `<section class="unavailable-state"><h2>Job unavailable</h2><p>This job couldn’t be found or you don’t have access to it.</p></section>`;
  if (id==='D07') return `<section class="unavailable-state"><h2>Marketer access required</h2><p>Use an account with marketer access to view hired jobs.</p></section>`;
  if (id==='D10'||id==='R09') return `<section class="unavailable-state"><h2>Session expired</h2><p>Sign in to check this job’s status.</p><div class="inline-actions">${action(state.demoSignInComplete?'Continue':'Sign in',{secondary:'entry',attrs:`data-action="${state.demoSignInComplete?'continue-after-signin':'sign-in'}"`})}</div></section>`;
  if (id==='D03') return `<section class="recovery-state">${feedbackBlock({tone:'error',title:SCENARIO_BY_ID.D03.bannerTitle,body:SCENARIO_BY_ID.D03.bannerBody,actions:[{label:'Try again',icon:'refresh',attrs:'data-action="refresh-detail"'}]})}</section>`;
  return '';
}

function detailSkeleton() {
  return `<section class="loading-stack detail-skeleton" aria-hidden="true"><div class="loading-card skeleton-card"><div class="skeleton-line short skeleton-pulse"></div><div class="skeleton-line long skeleton-pulse"></div><div class="skeleton-line skeleton-pulse"></div></div><div class="loading-card skeleton-card"><div class="skeleton-line short skeleton-pulse"></div><div class="skeleton-line long skeleton-pulse"></div></div></section><p class="loading-label" role="status">${icon('spinner')}<span>Checking job details…</span></p>`;
}

function renderDetail(id) {
  const fixture=selectedMockJob();
  if (!fixture) return `<main id="main-content" class="product-main cu-workspace">${pageTitle('Job details','',{detail:true})}${unavailableContent('D06')}</main>`;
  const simple=['D03','D06','D07','D10','R08','R09'].includes(id);
  const unsafe=['D08','R10'].includes(id);
  const viewId=['C01','C03','C04','C05'].includes(id)?'D02':id;
  const title=simple||id==='D01'?'Job details':`Job #${state.jobId}`;
  const back=!['D07','D10','R09'].includes(id);
  const publicReturn=back?'':`<div class="page-back">${backLink('Back to workspace',{href:'#workspace',attrs:'data-action="outside-demo" data-menu-label="Workspace"'})}</div>`;
  const feedback=['C07','R02','R05','R06'].includes(id)?'':dynamicFeedback(id);
  const content=simple?unavailableContent(id):id==='D01'?detailSkeleton():unsafe?
    `<section class="recovery-state">${feedback}</section>`:
    `${feedback?`<div class="detail-feedback">${feedback}</div>`:''}<div class="detail-layout"><aside class="detail-status">${detailStatePanel(viewId)}</aside><div class="detail-context">${contextCard(fixture)}</div></div>`;
  return `<main id="main-content" class="product-main cu-workspace">${publicReturn}${pageTitle(title,'',{detail:back})}${content}</main>${actionTray(viewId)}`;
}

function renderModal(){
 if(state.offlineNotice)return `<dialog id="confirm-dialog" class="confirmation-dialog cu-content-dialog" aria-labelledby="confirm-title"><div class="dialog-inner"><div class="dialog-topline"><h2 id="confirm-title" tabindex="-1">Connection unavailable</h2>${closeControl('Close',{attrs:'data-action="cancel-confirm"'})}</div><p class="dialog-copy">Reconnect before starting this job.</p><div class="dialog-footer">${action('Close',{emphasis:'tertiary',attrs:'data-action="cancel-confirm"'})}</div></div></dialog>`;
 if(!state.confirmationOpen)return '';
 const fixture=selectedMockJob();if(!fixture)return '';
 const pending=state.pending;
 return `<dialog id="confirm-dialog" class="confirmation-dialog cu-content-dialog" aria-labelledby="confirm-title" ${pending?'aria-busy="true"':''}><div class="dialog-inner"><div class="dialog-topline"><h2 id="confirm-title" tabindex="-1">${pending?'Starting job':'Start job'}</h2>${closeControl('Close confirmation',{attrs:'data-action="cancel-confirm"'})}</div><p class="dialog-reference">Job #${esc(state.jobId)}</p><dl class="dialog-price"><dt>Agreed price</dt><dd>${esc(formatMoney(fixture.offeredPrice))}</dd></dl>${pending?`<div class="cu-dialog-progress" role="status">${icon('spinner')}<span>Submitting…</span></div>`:''}<div class="dialog-footer">${pending?'':action('Cancel',{variant:'outline',attrs:'data-action="cancel-confirm"'})}${pending?'':action('Start job',{emphasis:'primary',attrs:'data-action="confirm-start"'})}</div></div></dialog>`;
}
function operationSummary(){
 if(state.confirmationOpen||state.offlineNotice||!state.privateDataVisible)return '';
 const op=backgroundStarts.get(state.jobId)??[...backgroundStarts.values()][0];
 if(op)return operationNotice({title:`Starting Job #${op.snapshot.jobId}`,actions:[{label:'View progress',attrs:`data-action="view-start-progress" data-operation-job="${op.snapshot.jobId}"`}]});
 if(backgroundResult&&!state.unknownOutcome)return feedbackBlock({title:backgroundResult.title,body:backgroundResult.body??'',tone:backgroundResult.tone,actions:backgroundResult.jobId!==state.jobId||state.route==='list'?[{label:'View job',attrs:`data-action="view-job" data-job-id="${backgroundResult.jobId}"`}]:[]});
 return '';
}
function resetBackgroundStarts(){for(const op of backgroundStarts.values()){clearTimeout(op.timer);clearTimeout(op.deadline);clearTimeout(op.slow);}backgroundStarts.clear();backgroundResult=null;}
function openStartProgress(jobId){
 const op=backgroundStarts.get(Number(jobId));if(!op)return;
 state={...op.snapshot,confirmationOpen:true,listFilter:state.listFilter,page:state.page,focusTarget:'dialog'};settings.scenarioId=state.scenarioId;updateQuery('push');render();
}

function render() {
  if(state.pending&&!backgroundStarts.has(state.jobId))scheduleStartResponse();
  const id = state.scenarioId;
  const isList = id.startsWith('L') || id === 'C06';
  const appContent = isList ? renderList(id) : renderDetail(id);
  const feedback = announcement ? `<p class="sr-only state-announcement" aria-live="polite">${esc(announcement)}</p>` : '';
  root.innerHTML = `<div class="screen-frame">${shellHeader()}${appContent}${compactNavigation()}${feedback}</div>`;
  const progress=operationSummary();if(progress){const anchor=root.querySelector('.list-heading,.page-title-block');anchor?.insertAdjacentHTML('afterend',`<div class="operation-summary">${progress}</div>`);}
  root.inert = state.confirmationOpen||Boolean(state.offlineNotice);
  document.documentElement.dataset.selectedScenario=state.scenarioId;
  document.documentElement.dataset.operation=backgroundStarts.size?'start':'';
  overlayRoot.innerHTML = renderModal();
  const dialog = document.querySelector('#confirm-dialog');
  if (dialog && !dialog.open) {
    try { dialog.showModal(); } catch { dialog.setAttribute('open', ''); }
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const stops=[...dialog.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')]
        .filter(element=>element.getClientRects().length&&element.getAttribute('aria-disabled')!=='true');
      const index=stops.indexOf(document.activeElement);
      if(!stops.length){event.preventDefault();dialog.focus({preventScroll:true});return;}
      if(index<0||(!event.shiftKey&&index===stops.length-1)||(event.shiftKey&&index===0)){
        event.preventDefault();stops[event.shiftKey?stops.length-1:0].focus();
      }
    });
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      commit({ type: 'ESCAPE' });
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        const bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) commit({ type: 'OUTSIDE_PRESS' });
      }
    });
  }
  tuneTheme();
  stopTileObservation();stopCompactObservation();
  stopTileObservation=observeNavigationTile(document.querySelector('.desktop-navigation'));
  stopCompactObservation=observeCompactNavigation(document.querySelector('.mobile-bottom-navigation'));
  measurePersistentChrome();
  chromeResizeObserver.disconnect();
  for (const element of document.querySelectorAll('.product-header, .mobile-bottom-navigation, .product-action-tray')) chromeResizeObserver.observe(element);
  restoreFocus();
  if (state.scenarioId !== lastAnnouncedScenario) {
    lastAnnouncedScenario = state.scenarioId;
    if (['C07', 'R02', 'R05'].includes(state.scenarioId)) announcement = 'Job status is In Progress.';
  }
  sendState();
  persistStartJournal();
}

function restoreFocus() {
  if (state.focusTarget === 'start') [...document.querySelectorAll('[data-action="start"]')].find(button=>button.getClientRects().length)?.focus({preventScroll:true});
  if (state.focusTarget === 'cancel') {
    const dialog = document.querySelector('#confirm-dialog');
    // Tall dialog content starts with its visible title; ordinary confirmations
    // still begin on the safe Cancel action without skipping the explanation.
    if (dialog && dialog.scrollHeight > dialog.clientHeight + 1) {
      dialog.scrollTop = 0;
      const title=dialog.querySelector('#confirm-title');
      title?.focus({ preventScroll: true });
      if(title){
        const top=title.getBoundingClientRect().top-dialog.getBoundingClientRect().top-dialog.clientTop;
        const height=title.getBoundingClientRect().height;
        dialog.scrollTop=height<=dialog.clientHeight?Math.max(0,top+height-dialog.clientHeight):top;
      }
    } else dialog?.querySelector('.dialog-footer [data-action="cancel-confirm"]')?.focus({ preventScroll: true });
  }
  if (state.focusTarget === 'detail-heading') document.querySelector('#page-heading')?.focus({ preventScroll: true });
  if(state.focusTarget==='dialog')document.querySelector('#confirm-title')?.focus({preventScroll:true});
  if(state.focusTarget==='progress')document.querySelector('[data-action="view-start-progress"]')?.focus({preventScroll:true});
  if (state.focusTarget === 'return-job') {
    const originatingLink = document.querySelector(`[data-action="view-job"][data-job-id="${state.jobId}"]`);
    if (originatingLink) originatingLink.focus({ preventScroll: true });
    else document.querySelector('#page-heading')?.focus({ preventScroll: true });
  }
  if (state.focusTarget === 'page-heading') document.querySelector('#page-heading')?.focus({ preventScroll: true });
  if (state.focusTarget === 'results') {
    const result=document.querySelector('.job-card h2')??document.querySelector('#page-heading');
    result?.focus({preventScroll:true});result?.scrollIntoView({block:'start',behavior:'instant'});
  }
  if (state.focusTarget === 'filter') document.querySelector('#job-filter')?.focus({ preventScroll: true });
  if (state.focusTarget === 'previous-page') document.querySelector('[data-action="previous-page"]')?.focus({ preventScroll: true });
  if (state.focusTarget === 'next-page') document.querySelector('[data-action="next-page"]')?.focus({ preventScroll: true });
  state.focusTarget = null;
}

const chromeResizeObserver = new ResizeObserver(measurePersistentChrome);

function measurePersistentChrome() {
  // Always compare the same natural fixed composition, even after a fallback.
  // Synchronous measurement keeps the temporary composition out of painting.
  document.documentElement.dataset.chromeLayout = 'fixed';
  const header = document.querySelector('.product-header');
  const nav = document.querySelector('.mobile-bottom-navigation');
  const tray = document.querySelector('.product-action-tray');
  const navHeight = nav && getComputedStyle(nav).display !== 'none' && getComputedStyle(nav).position === 'fixed' ? nav.getBoundingClientRect().height : 0;
  const fontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const trayHeight = tray && getComputedStyle(tray).display !== 'none' ? tray.getBoundingClientRect().height + fontSize * .75 : 0;
  const chromeHeight = (header?.getBoundingClientRect().height ?? 0) + navHeight + trayHeight;
  const main = document.querySelector('.product-main');
  const contentStart = main?.querySelector('.cu-feedback, .cu-banner, .cu-operation, .job-grid, .empty-state');
  // Reserve reading space after the real heading/filter lead-in as well as the
  // bars. Relative geometry is stable while scrolling and avoids page-ID rules.
  const leadIn = navHeight&&contentStart ? Math.max(0,contentStart.getBoundingClientRect().top-main.getBoundingClientRect().top) : 0;
  const flow = chromeHeight + leadIn + fontSize * 6 > window.innerHeight;
  document.documentElement.dataset.chromeLayout = flow ? 'flow' : 'fixed';
  document.documentElement.style.setProperty('--demo-bottom-nav-height', `${flow ? 0 : Math.ceil(navHeight)}px`);
  document.documentElement.style.setProperty('--demo-tray-height', `${flow ? 0 : Math.ceil(trayHeight)}px`);
}

function logScenarioRead() {
  const id = state.scenarioId;
  const fixture = FIXTURES[state.fixtureName];
  if (id.startsWith('L') || id === 'C06') {
    const result = id === 'L06'
      ? state.fixtureName === 'rateLimit' ? '429 rate limited mock response' : '503 mock error'
      : id === 'L01' || id === 'L08' ? 'pending mock read' : '200 mock list read';
    emitRequest({ method: 'GET', path: `/api/v1/me/marketer-jobs?status=${encodeURIComponent(state.listFilter)}&page=${state.page}&page_size=20`, result, reason: `Selected state ${id}; fixture only, no API call.` });
    return;
  }
  if (id.startsWith('D') || id.startsWith('R') || id.startsWith('C')) {
    if (['D06', 'D07', 'D10', 'R08', 'R09'].includes(id)) {
      emitRequest({ method: 'GET', path: `/api/v1/me/marketer-jobs/${state.jobId}`, result: id === 'D10' || id === 'R09' ? '401 mock response' : '404/403 generic mock response', reason: 'No identifying details are included in the screen.' });
      return;
    }
    emitRequest({ method: 'GET', path: `/api/v1/me/marketer-jobs/${state.jobId}`, result: id === 'D03' ? '503 mock error' : id === 'D01' || id === 'R01' || id === 'R13' ? 'pending mock read' : '200 mock detail read', reason: `Selected state ${id}; selecting a state does not create a start write.` });
  }
  if (fixture.listReadStatus === 429 && id === 'L06') {
    emitRequest({ method: 'MOCK', path: 'Retry-After', result: `${fixture.retryAfterSeconds} seconds`, reason: 'Author-only rate-limit metadata; no such header or token appears in the product screen.' });
  }
}

function scheduleListComplete(focusTarget='filter') {
  clearTimeout(listTimer);
  listTimer = setTimeout(() => {
    if (state.route !== 'list' || state.scenarioId !== 'L08') return;
    state = { ...state, scenarioId: 'L02', route: 'list' };
    settings.scenarioId = state.scenarioId;
    state.focusTarget = focusTarget;
    announcement = focusTarget==='results'?`Page ${state.page} loaded.`:'Job results updated.';
    render();
  }, settings.reducedMotion ? 0 : 350);
}

function scheduleStartResponse(){
 const jobId=state.jobId;if(backgroundStarts.has(jobId))return;
 const op={snapshot:{...state},outcome:settings.startOutcome};backgroundStarts.set(jobId,op);
 if(settings.responseMode==='immediate')op.timer=setTimeout(()=>resolveStart(op.outcome,jobId),settings.reducedMotion?80:700);
 op.slow=setTimeout(()=>{if(backgroundStarts.get(jobId)!==op)return;if(state.jobId===jobId&&state.pending)commit({type:'SHOW_SLOW'});},SLOW_NOTICE_MS);
 op.deadline=setTimeout(()=>{if(backgroundStarts.get(jobId)===op)resolveStart('unknown',jobId);},OPERATION_WAIT_MS);
}

function scheduleReconciliation() {
  clearTimeout(autoTimer);
  autoTimer = setTimeout(() => commit({ type: 'RECONCILE', status: settings.refreshOutcome }), settings.reducedMotion ? 80 : 650);
}

function rememberConfirmedStatus(status) {
  const normalized = ({
    accepted: 'Accepted',
    'in-progress': 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  })[status];
  if (normalized && Number.isSafeInteger(state.jobId)) confirmedStatusByJob.set(state.jobId, normalized);
}

function scheduleDetailRead({ useConfiguredOutcome = false } = {}) {
  clearTimeout(autoTimer);
  autoTimer = setTimeout(() => {
    const fixture = FIXTURES[state.fixtureName] ?? FIXTURES.standard;
    const record = mockJobRecord(fixture, state.jobId, confirmedStatusByJob);
    const status = mockReadStatus(record, { useConfiguredOutcome, configuredOutcome: settings.refreshOutcome });
    commit({ type: 'DETAIL_READ_RESULT', status });
  }, settings.reducedMotion ? 80 : 500);
}

function resolveStart(outcome,jobId=state.jobId){
 const op=backgroundStarts.get(jobId);if(!op)return;
 clearTimeout(op.timer);clearTimeout(op.slow);clearTimeout(op.deadline);backgroundStarts.delete(jobId);
 if(outcome==='unknown')uncertainStarts.add(jobId);else uncertainStarts.delete(jobId);
 const event={type:'RESOLVE_START',outcome,refreshOutcome:settings.refreshOutcome,terminalStatus:FIXTURES[state.fixtureName]?.status};
 if(state.jobId===jobId&&state.route==='detail'){
  const visible={listFilter:state.listFilter,page:state.page,confirmationOpen:state.confirmationOpen};
  state={...op.snapshot,...visible};commit(event);
  if(['started','already_in_progress'].includes(outcome)){backgroundResult={jobId,title:'Job started',tone:'success'};render();}
  return;
 }
 const transition=transitionDemo(op.snapshot,event);emitEffects(transition.effects);
 const resolved=transition.state;if(resolved.statusKnown)confirmedStatusByJob.set(jobId,resolved.jobStatus);
 if(!resolved.privateDataVisible){state=resolved;settings.scenarioId=state.scenarioId;updateQuery();render();return;}
 if(state.route==='list'){state={...state,pending:false,confirmationOpen:false,scenarioId:outcome==='unknown'?'C06':'L02',safeReturnCheckRequired:outcome==='unknown'};settings.scenarioId=state.scenarioId;updateQuery();}
 backgroundResult={jobId,title:['started','already_in_progress'].includes(outcome)?`Job #${jobId} started`:outcome==='unknown'?'Start result not confirmed':'Job could not start',body:['started','already_in_progress'].includes(outcome)?'':'Open the job to check its status.',tone:['started','already_in_progress'].includes(outcome)?'success':'warning'};render();
}

function commit(event, { historyMode } = {}) {
  if (event.type === 'OPEN_JOB') clearTimeout(listTimer);
  const from = state.scenarioId;
  const previousRoute = state.route;
  const selectedJobId = Number(event.jobId);
  if(event.type==='OPEN_JOB'&&uncertainStarts.has(Number(event.jobId)))event={...event,readMode:'configured'};
  const transition = transitionDemo(state, event);
  state = transition.state;
  settings.scenarioId = state.scenarioId;
  if (from!==state.scenarioId) announcement='';
  if (event.type === 'OPEN_JOB') {
    readIntentForDetail = true;
    readModeForDetail = event.readMode === 'configured' ? 'configured' : 'record';
  }
  if (event.type === 'REFRESH_DETAIL' && ['D01', 'C08'].includes(state.scenarioId)) {
    readIntentForDetail = true;
    readModeForDetail = 'configured';
  }
  if (event.type === 'RESOLVE_START' && state.scenarioId === 'C08') {
    readIntentForDetail = true;
    readModeForDetail = 'configured';
  }
  if (event.type === 'DETAIL_READ_RESULT') {
    readIntentForDetail = false;
    readModeForDetail = 'record';
  }
  if (transition.ignored) announcement = transition.ignored;
  if (transition.restoreFocus) state.focusTarget = transition.restoreFocus;
  if (transition.focusTarget) state.focusTarget = transition.focusTarget;
  if (event.type === 'CHANGE_FILTER') state.focusTarget = 'filter';
  if (event.type === 'CHANGE_PAGE') state.focusTarget = null;
  if (event.type === 'RESOLVE_START' && ['started', 'already_in_progress'].includes(event.outcome)) rememberConfirmedStatus('in-progress');
  if (event.type === 'RESOLVE_START' && event.outcome === 'terminal') rememberConfirmedStatus(event.terminalStatus === 'Cancelled' ? 'cancelled' : 'completed');
  if (['DETAIL_READ_RESULT', 'RECONCILE'].includes(event.type)) rememberConfirmedStatus(event.status);
  if(['DETAIL_READ_RESULT','RECONCILE'].includes(event.type)&&['accepted','in-progress','completed','cancelled','unavailable','session_expired','invalid'].includes(event.status))uncertainStarts.delete(state.jobId);
  let nextHistoryMode = historyMode ?? (['OPEN_JOB', 'CHANGE_FILTER', 'CHANGE_PAGE'].includes(event.type) ? 'push' : 'replace');
  let historyEntry = history.state;
  if (event.type === 'OPEN_JOB' && previousRoute === 'list' && Number.isSafeInteger(selectedJobId) && selectedJobId > 0) {
    history.replaceState({ ...(history.state ?? {}), cuwaysDemoEntry: 'list', focusJob: selectedJobId }, '', location.href);
    historyEntry = { cuwaysDemoEntry: 'detail', returnToList: true };
  }
  if (['CHANGE_FILTER', 'CHANGE_PAGE'].includes(event.type)) historyEntry = { cuwaysDemoEntry: 'list' };
  if (event.type === 'BACK_TO_LIST' || event.type === 'NAVIGATE_AWAY') nextHistoryMode = 'replace';
  updateQuery(nextHistoryMode, historyEntry);
  emitEffects(transition.effects);
  if (from !== state.scenarioId && ['C07', 'R02', 'R05'].includes(state.scenarioId)) announcement = 'Job started. Status changed to In Progress.';
  render();

  if (event.type === 'CONFIRM_START' && state.pending) scheduleStartResponse();
  if (event.type === 'RESOLVE_START' && state.scenarioId === 'R01') scheduleReconciliation();
  if (event.type === 'RESOLVE_START' && state.scenarioId === 'C08') scheduleDetailRead({ useConfiguredOutcome: true });
  if (event.type === 'REFRESH_DETAIL' && ['D01', 'C08'].includes(state.scenarioId)) scheduleDetailRead({ useConfiguredOutcome: true });
  if (event.type === 'DETAIL_READ_RESULT' && state.scenarioId === 'D01') scheduleDetailRead();
  if ((event.type === 'CHANGE_FILTER' || event.type === 'CHANGE_PAGE') && state.scenarioId === 'L08') scheduleListComplete(event.type==='CHANGE_PAGE'?'results':'filter');
}

function handleThemeToggle() {
  settings.theme = settings.theme === 'light' ? 'dark' : 'light';
  tuneTheme();
  updateQuery();
  render();
  document.querySelector('[data-tool="theme"]')?.focus({ preventScroll: true });
  postToParent({ type: 'cuways-demo-settings-changed', settings: { theme: settings.theme, material: settings.material, reducedMotion: settings.reducedMotion } });
}

function navigateBackToList() {
  menuOpen = false;
  if (state.pending) {
    commit({ type: 'NAVIGATE_AWAY' });
    return;
  }
  if (history.state?.cuwaysDemoEntry === 'detail' && history.state.returnToList === true) {
    history.back();
    return;
  }
  commit({ type: 'BACK_TO_LIST' });
}

function restoreFromLocation() {
  clearTimeout(autoTimer);
  clearTimeout(slowTimer);
  clearTimeout(deadlineTimer);
  clearTimeout(listTimer);
  menuOpen = false;
  announcement = '';
  const previousState = state;
  const restored = readScreenLocation(new URLSearchParams(location.search), {
    scenarioId: 'L02', jobId: state.jobId,
  });
  const scenarioId = restored.invalidJob ? 'D06' : restored.scenarioId;
  const preserved = {
    startPostCount: previousState.startPostCount,
    requestId: previousState.requestId,
    lastConfirmedStatus: previousState.statusKnown ? previousState.jobStatus : previousState.lastConfirmedStatus,
    returnFocusToJob: previousState.returnFocusToJob,
    demoSignInComplete: previousState.demoSignInComplete,
  };
  let nextState = createLocationState({ ...settings, ...restored, ...preserved, scenarioId });
  if (previousState.pending && nextState.route === 'list') {
    const safeReturn = transitionDemo(previousState, { type: 'NAVIGATE_AWAY' });
    nextState = {
      ...safeReturn.state,
      listFilter: restored.listFilter,
      page: restored.page,
      focusTarget: 'page-heading',
    };
    emitEffects(safeReturn.effects);
    readIntentForDetail = false;
    readModeForDetail = 'configured';
  } else {
    nextState.focusTarget = null;
    state = nextState;
    readIntentForDetail = ['D01', 'C08', 'R13'].includes(state.scenarioId) && restored.readOnLoad;
    readModeForDetail = restored.readMode;
    restoreRememberedStatus();
    rememberKnownSceneStatus();
  }
  state = nextState.route === 'list' && previousState.pending ? nextState : state;
  settings.scenarioId = state.scenarioId;
  const focusJob = Number(history.state?.focusJob);
  if (state.route === 'list' && Number.isSafeInteger(focusJob) && focusJob > 0) {
    state.jobId = focusJob;
    state.returnFocusToJob = true;
    state.focusTarget = 'return-job';
  } else if (state.route === 'list') {
    state.focusTarget = 'page-heading';
  }
  updateQuery('replace', history.state);
  render();
  logScenarioRead();
  if (restored.readOnLoad && ['D01', 'C08', 'R13'].includes(state.scenarioId)) {
    scheduleDetailRead({ useConfiguredOutcome: state.scenarioId === 'R13' || readModeForDetail === 'configured' });
  }
}

function changeFilter(filter) {
  if (!filterOptions.some(([value]) => value === filter)) return;
  commit({ type: 'CHANGE_FILTER', filter });
}

function handleClick(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const actionName = target.dataset.action;
  if (target.tagName === 'A') {
    if (!shouldHandleLocalClick(event)) return;
    event.preventDefault();
  }
  if (actionName === 'nav') {
    menuOpen = false;
    if (target.dataset.navJobs === 'true') navigateBackToList();
    else {
      announcement = `${target.getAttribute('aria-label') ?? 'This destination'} is outside this demo.`;
      render();
    }
    return;
  }
  if (actionName === 'back-to-list') {
    navigateBackToList();
    return;
  }
  if (actionName === 'menu-toggle') { menuOpen = !menuOpen; render(); document.querySelector(menuOpen ? '#mobile-drawer button' : '[data-tool="menu"]')?.focus({ preventScroll: true }); return; }
  if (actionName === 'outside-demo') {
    const fromMenu=Boolean(target.closest('.cu-header-menu'));
    menuOpen=false;
    emitRequest({method:'NAVIGATION',path:target.getAttribute('href')??target.dataset.menuLabel,result:'Outside this story demo',reason:'No application route or API request is performed.'});
    announcement = `${target.dataset.menuLabel} is outside this demo.`;
    render();
    if(fromMenu)document.querySelector('[data-tool="menu"]')?.focus({preventScroll:true});
    return;
  }
  if (actionName === 'role-switch') {
    announcement = 'Role switching is outside this demo. Current role: Marketer.';
    render();
    return;
  }
  if (actionName === 'theme-toggle') { handleThemeToggle(); return; }
  if(actionName==='view-start-progress'){openStartProgress(target.dataset.operationJob);return;}
  if (actionName === 'view-job') {
    const pendingOp=backgroundStarts.get(Number(target.dataset.jobId));if(pendingOp){openStartProgress(target.dataset.jobId);return;}
    backgroundResult=null;
    const useConfiguredOutcome = state.safeReturnCheckRequired || state.demoSignInComplete;
    commit({ type: 'OPEN_JOB', jobId: Number(target.dataset.jobId), readMode: useConfiguredOutcome ? 'configured' : 'record' });
    if (state.scenarioId === 'D01') scheduleDetailRead({ useConfiguredOutcome });
    return;
  }
  if(actionName==='start'){if(backgroundStarts.has(state.jobId)){openStartProgress(state.jobId);return;}backgroundResult=null;commit({type:'OPEN_CONFIRM'});return;}
  if (actionName === 'confirm-start') { commit({ type: 'CONFIRM_START' }); return; }
  if (actionName === 'cancel-confirm') { commit({ type: 'CANCEL_CONFIRM' }); return; }
  if (actionName === 'retry-list') { commit({ type: 'RETRY_LIST' }); return; }
  if (actionName === 'refresh-detail') {
    commit({ type: 'REFRESH_DETAIL', status: settings.refreshOutcome });
    if (state.scenarioId === 'D01') scheduleDetailRead({ useConfiguredOutcome: true });
    return;
  }
  if (actionName === 'show-all') { changeFilter('all'); return; }
  if (actionName === 'clear-filter') { changeFilter('active'); return; }
  if (actionName === 'previous-page') { commit({ type: 'CHANGE_PAGE', page: state.page - 1 }); return; }
  if (actionName === 'next-page') { commit({ type: 'CHANGE_PAGE', page: state.page + 1 }); return; }
  if (actionName === 'sign-in') { commit({ type: 'SIGN_IN' }); return; }
  if (actionName === 'continue-after-signin') {
    commit({ type: 'OPEN_JOB', jobId: state.jobId, readMode: 'configured' });
    scheduleDetailRead({ useConfiguredOutcome: true });
  }
}

root.addEventListener('pointerdown', event => {
  if (!menuOpen || event.target.closest('.cu-header')) return;
  menuOpen=false;
  const header=document.querySelector('.cu-header'),menu=document.querySelector('#mobile-drawer'),trigger=document.querySelector('[data-tool="menu"]');
  if(menu)menu.hidden=true;
  if(header)header.dataset.menuOpen='false';
  if(trigger){trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-label','Menu');trigger.querySelector('.cu-icon').outerHTML=icon('menu');trigger.querySelector('.cu-sr-only').textContent='Menu';}
});
root.addEventListener('click', handleClick);
overlayRoot.addEventListener('click', handleClick);
window.addEventListener('popstate', restoreFromLocation);
root.addEventListener('change', (event) => {
  if (event.target.matches('#job-filter')) changeFilter(event.target.value);
});

window.addEventListener('message', (event) => {
  if (event.source !== window.parent || event.origin !== origin) return;
  const message = event.data;
  if (!message || typeof message !== 'object') return;
  if (message.type === 'cuways-demo-settings' && message.settings && typeof message.settings === 'object') {
    applySettings(message.settings);
  } else if (message.type === 'cuways-demo-resolve-pending' && state.pending) {
    resolveStart(selected(allowed.startOutcome, message.outcome, settings.startOutcome));
  } else if (message.type === 'cuways-demo-navigate-away' && state.pending) {
    commit({ type: 'NAVIGATE_AWAY' });
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !state.confirmationOpen && menuOpen) {
    menuOpen = false;
    render();
    document.querySelector('[data-tool="menu"]')?.focus({ preventScroll: true });
  }
});

window.addEventListener('resize', () => { fitCompactNavigation(document.querySelector('.mobile-bottom-navigation')); measurePersistentChrome(); positionNavigationTile(document.querySelector('.desktop-navigation')); });
document.fonts?.addEventListener('loadingdone', () => { fitCompactNavigation(document.querySelector('.mobile-bottom-navigation')); positionNavigationTile(document.querySelector('.desktop-navigation')); measurePersistentChrome(); });
subscribeDraft(() => { tuneTheme(); render(); });

window.addEventListener('pagehide',persistStartJournal);
window.addEventListener('pageshow',e=>{if(e.persisted){restoreStartJournal(true);updateQuery();render();}});
restoreStartJournal();
tuneTheme();
updateQuery('replace', { cuwaysDemoEntry: state.route === 'list' ? 'list' : 'detail' });
render();
logScenarioRead();
postToParent({ type: 'cuways-demo-ready', state: summarizeState() });
if(state.pending)scheduleStartResponse();
if (initialLocation.readOnLoad && ['D01', 'C08', 'R13'].includes(state.scenarioId)) {
  scheduleDetailRead({ useConfiguredOutcome: state.scenarioId === 'R13' || readModeForDetail === 'configured' });
}
