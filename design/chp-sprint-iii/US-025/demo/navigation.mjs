import { SCENARIO_BY_ID } from './scenarios.mjs';

export const listFilters = new Set(['active', 'Accepted', 'In Progress', 'Completed', 'Cancelled', 'all']);

export function defaultFilter(id) {
  if (id === 'L04') return 'all';
  if (id === 'L05') return 'Completed';
  return 'active';
}

export function parsePage(value) {
  const text = String(value ?? '');
  if (!/^[1-9]\d*$/.test(text)) return 1;
  const page = Number(text);
  return Number.isSafeInteger(page) ? page : 1;
}

export function parseJob(value) {
  const text = String(value ?? '');
  if (!/^[1-9]\d*$/.test(text)) return null;
  const job = Number(text);
  return Number.isSafeInteger(job) ? job : null;
}

const safeScene = new Map([
  ['C01', 'D02'],
  ['C02', 'D02'],
  ['C03', 'R13'],
  ['C04', 'R13'],
  ['C05', 'R13'],
  ['L08', 'L02'],
]);

/* Confirmation and pending states are never restored from a URL. */
export function locationScene(id) {
  return safeScene.get(id) ?? id;
}

export function readScreenLocation(query, { scenarioId = 'L02', jobId = 41 } = {}) {
  const requestedScenario = SCENARIO_BY_ID[query.get('scenario')] ? query.get('scenario') : scenarioId;
  const id = locationScene(requestedScenario);
  const listFilter = listFilters.has(query.get('filter')) ? query.get('filter') : defaultFilter(id);
  const hasJob = query.has('job');
  const parsedJob = hasJob ? parseJob(query.get('job')) : parseJob(jobId);
  const readOnLoad = query.get('read') === '1'
    || ['C03', 'C04', 'C05'].includes(requestedScenario)
    || id === 'R13';
  const readMode = query.get('readMode') === 'configured' || id === 'R13' ? 'configured' : 'record';

  return {
    scenarioId: id,
    listFilter,
    page: parsePage(query.get('page')),
    jobId: parsedJob ?? parseJob(jobId) ?? 41,
    invalidJob: hasJob && parsedJob === null,
    readOnLoad,
    readMode,
  };
}

function validScenario(id) {
  return SCENARIO_BY_ID[id] ? id : 'L02';
}

function validFilter(filter, scenarioId) {
  return listFilters.has(filter) ? filter : defaultFilter(scenarioId);
}

export function screenUrl(base, settings = {}, location = {}) {
  const url = new URL('./screen.html', base);
  for (const [key, name] of Object.entries({
    fixtureName: 'fixture',
    theme: 'theme',
    material: 'material',
    textScale: 'textScale',
    startOutcome: 'startOutcome',
    refreshOutcome: 'refreshOutcome',
    responseMode: 'responseMode',
  })) {
    if (settings[key] !== undefined) url.searchParams.set(name, String(settings[key]));
  }
  url.searchParams.set('reducedMotion', settings.reducedMotion ? '1' : '0');

  const requestedScenario = validScenario(location.scenarioId ?? settings.scenarioId ?? 'L02');
  const scenarioId = locationScene(requestedScenario);
  const filter = validFilter(location.listFilter, scenarioId);
  url.searchParams.set('scenario', scenarioId);
  url.searchParams.set('filter', filter);
  url.searchParams.set('page', String(parsePage(location.page ?? 1)));

  const jobId = parseJob(location.jobId ?? settings.jobId);
  if ((!scenarioId.startsWith('L') || scenarioId === 'C06') && jobId !== null) {
    url.searchParams.set('job', String(jobId));
  } else {
    url.searchParams.delete('job');
  }

  const readOnLoad = location.readOnLoad === true
    || ['C03', 'C04', 'C05'].includes(requestedScenario)
    || scenarioId === 'R13';
  if (readOnLoad) url.searchParams.set('read', '1');
  else url.searchParams.delete('read');
  if ((readOnLoad && location.readMode === 'configured') || scenarioId === 'R13') url.searchParams.set('readMode', 'configured');
  else url.searchParams.delete('readMode');
  return url;
}

export function listPageUrl(base, settings, location, page) {
  return screenUrl(base, settings, {
    ...location,
    scenarioId: 'L02',
    page: parsePage(page),
  });
}

export function shouldHandleLocalClick(event) {
  if (!event || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  const target = event.target?.closest?.('a[href]');
  if (!target || target.hasAttribute('download')) return false;
  return !target.target || target.target === '_self';
}
