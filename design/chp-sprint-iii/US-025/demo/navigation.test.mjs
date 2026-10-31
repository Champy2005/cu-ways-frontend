import assert from 'node:assert/strict';
import test from 'node:test';
import { FIXTURES } from './scenarios.mjs';
import { mockJobRecord, mockJobRecords, mockReadStatus } from './mock-jobs.mjs';
import {
  defaultFilter,
  listPageUrl,
  parseJob,
  parsePage,
  readScreenLocation,
  screenUrl,
  shouldHandleLocalClick,
} from './navigation.mjs';
import { createDemoState, transitionDemo } from './state-machine.mjs';

test('navigation parsing accepts only positive safe integer pages and job IDs', () => {
  assert.equal(parsePage('3'), 3);
  assert.equal(parsePage('0'), 1);
  assert.equal(parsePage('2.5'), 1);
  assert.equal(parsePage('9007199254740992'), 1);
  assert.equal(parseJob('41'), 41);
  assert.equal(parseJob('-1'), null);
  assert.equal(parseJob('4e1'), null);
  assert.equal(defaultFilter('L04'), 'all');
  assert.equal(defaultFilter('L05'), 'Completed');
});

test('confirmation and pending URLs canonicalize to safe detail/read destinations', () => {
  const base = 'https://demo.example/UX%20UI/US-025/demo/screen.html';
  const settings = { fixtureName: 'standard', theme: 'dark', material: 'opaque' };
  const modalUrl = screenUrl(base, settings, { scenarioId: 'C01', jobId: 41 });
  assert.equal(modalUrl.searchParams.get('scenario'), 'D02');
  assert.equal(modalUrl.searchParams.has('read'), false);

  for (const scenarioId of ['C03', 'C04', 'C05']) {
    const safeUrl = screenUrl(base, settings, { scenarioId, jobId: 41, listFilter: 'Accepted', page: 2 });
    assert.equal(safeUrl.searchParams.get('scenario'), 'R13');
    assert.equal(safeUrl.searchParams.get('read'), '1');
    assert.equal(safeUrl.searchParams.get('readMode'), 'configured');
    assert.equal(safeUrl.searchParams.get('job'), '41');
    assert.equal(safeUrl.searchParams.has('confirm'), false);
    assert.equal(safeUrl.searchParams.has('post'), false);
    assert.equal(readScreenLocation(safeUrl.searchParams).readMode, 'configured');
  }
});

test('author-selected D01 remains a static snapshot unless the URL explicitly requests a read', () => {
  const base = 'https://demo.example/UX%20UI/US-025/demo/screen.html';
  const settings = { fixtureName: 'standard' };
  const snapshot = screenUrl(base, settings, { scenarioId: 'D01', jobId: 41 });
  assert.equal(snapshot.searchParams.get('scenario'), 'D01');
  assert.equal(snapshot.searchParams.has('read'), false);
  assert.equal(readScreenLocation(snapshot.searchParams).readOnLoad, false);

  const liveRead = screenUrl(base, settings, { scenarioId: 'D01', jobId: 41, readOnLoad: true });
  assert.equal(liveRead.searchParams.get('read'), '1');
  assert.equal(readScreenLocation(liveRead.searchParams).readOnLoad, true);
});

test('pager URLs are local screen destinations and preserve list filter and page', () => {
  const base = 'https://demo.example/UX%20UI/US-025/demo/screen.html?old=value';
  const url = listPageUrl(base, { fixtureName: 'standard', theme: 'light' }, {
    scenarioId: 'L02', listFilter: 'Accepted', page: 1, jobId: 57,
  }, 2);
  assert.equal(url.pathname, '/UX%20UI/US-025/demo/screen.html');
  assert.equal(url.searchParams.get('scenario'), 'L02');
  assert.equal(url.searchParams.get('filter'), 'Accepted');
  assert.equal(url.searchParams.get('page'), '2');
  assert.equal(url.searchParams.has('job'), false);
  assert.equal(url.searchParams.has('old'), false);
});

test('invalid job IDs are reported without trusting the requested identifier', () => {
  const parsed = readScreenLocation(new URLSearchParams('scenario=D01&job=unknown&page=3'), {
    scenarioId: 'L02', jobId: 41,
  });
  assert.equal(parsed.scenarioId, 'D01');
  assert.equal(parsed.jobId, 41);
  assert.equal(parsed.invalidJob, true);
  assert.equal(parsed.readOnLoad, false);
});

test('only unmodified same-tab primary anchor clicks are intercepted', () => {
  const anchor = { hasAttribute: (name) => name === 'download' ? false : false, target: '_self' };
  const event = (overrides = {}) => ({
    button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false,
    target: { closest: () => anchor }, ...overrides,
  });
  assert.equal(shouldHandleLocalClick(event()), true);
  assert.equal(shouldHandleLocalClick(event({ ctrlKey: true })), false);
  assert.equal(shouldHandleLocalClick(event({ shiftKey: true })), false);
  assert.equal(shouldHandleLocalClick(event({ button: 1 })), false);
  assert.equal(shouldHandleLocalClick(event({ target: { closest: () => null } })), false);
  assert.equal(shouldHandleLocalClick(event({ target: { closest: () => ({ ...anchor, target: '_blank' }) } })), false);
  assert.equal(shouldHandleLocalClick(event({ target: { closest: () => ({ ...anchor, hasAttribute: () => true }) } })), false);
});

test('list and detail use the same fictional job record and per-visit status override', () => {
  const fixture = FIXTURES.standard;
  const records = mockJobRecords(fixture);
  const listedJob = records.find((job) => job.id === 41);
  assert.equal(listedJob.status, 'Accepted');
  assert.deepEqual(mockJobRecord(fixture, 41), listedJob);

  const confirmed = new Map([[41, 'In Progress']]);
  assert.equal(mockJobRecord(fixture, 41, confirmed).status, 'In Progress');
  assert.equal(mockJobRecords(fixture, confirmed).find((job) => job.id === 41).offeredPrice, listedJob.offeredPrice);
  assert.equal(mockReadStatus(listedJob), 'accepted');
  assert.equal(mockReadStatus(listedJob, { useConfiguredOutcome: true, configuredOutcome: 'in-progress' }), 'in-progress');
  assert.equal(mockReadStatus(mockJobRecord(fixture, 999)), 'unavailable');
});

test('an unavailable mock record resolves to generic D06 without exposing fallback fixture details', () => {
  const missing = mockJobRecord(FIXTURES.standard, 999);
  assert.equal(missing, null);
  assert.equal(mockReadStatus(missing), 'unavailable');
  const state = createDemoState({ scenarioId: 'D01', jobId: 999 });
  const unavailable = transitionDemo(state, { type: 'DETAIL_READ_RESULT', status: mockReadStatus(missing) });
  assert.equal(unavailable.state.scenarioId, 'D06');
  assert.equal(unavailable.state.statusKnown, false);
  assert.equal(unavailable.state.jobStatus, null);
  assert.equal(unavailable.state.startPostCount, 0);
  assert.equal(unavailable.effects.some(({ method }) => method === 'POST'), false);
});

test('leaving a pending start retains per-visit counts and a later safe read uses configured status', () => {
  const pending = createDemoState({ scenarioId: 'C03', jobId: 41, startPostCount: 1, requestId: 8 });
  const away = transitionDemo(pending, { type: 'NAVIGATE_AWAY' });
  assert.equal(away.state.scenarioId, 'C06');
  assert.equal(away.state.startPostCount, 1);
  assert.equal(away.state.requestId, 8);

  const open = transitionDemo(away.state, { type: 'OPEN_JOB', jobId: 41 });
  assert.equal(open.state.scenarioId, 'D01');
  assert.equal(open.state.startPostCount, 1);
  assert.deepEqual(open.effects.map(({ method }) => method), ['GET']);
  const read = transitionDemo(open.state, { type: 'DETAIL_READ_RESULT', status: mockReadStatus(mockJobRecord(FIXTURES.standard, 41), { useConfiguredOutcome: true, configuredOutcome: 'in-progress' }) });
  assert.equal(read.state.scenarioId, 'D04');
  assert.equal(read.state.startPostCount, 1);
  assert.equal(read.effects.some(({ method }) => method === 'POST'), false);
});

test('a safe R13 status read reconciles with GET only and cannot repeat a start POST', () => {
  const pendingRead = createDemoState({ scenarioId: 'R13', jobId: 41 });
  const configured = mockReadStatus(mockJobRecord(FIXTURES.standard, 41), {
    useConfiguredOutcome: true, configuredOutcome: 'in-progress',
  });
  const inProgress = transitionDemo(pendingRead, { type: 'DETAIL_READ_RESULT', status: configured });
  assert.equal(inProgress.state.scenarioId, 'R02');
  assert.deepEqual(inProgress.effects.map(({ method }) => method), ['GET']);
  assert.equal(inProgress.state.startPostCount, 0);

  const accepted = transitionDemo(pendingRead, { type: 'DETAIL_READ_RESULT', status: 'accepted' });
  assert.equal(accepted.state.scenarioId, 'R03');
  assert.deepEqual(accepted.effects.map(({ method }) => method), ['GET']);

  const unknown = transitionDemo(pendingRead, { type: 'DETAIL_READ_RESULT', status: 'failed' });
  assert.equal(unknown.state.scenarioId, 'R04');
  assert.deepEqual(unknown.effects.map(({ method }) => method), ['GET']);
  assert.equal(unknown.state.startPostCount, 0);
});

test('filter changes reset pagination and preserve the current job context', () => {
  const initial = createDemoState({ scenarioId: 'L02', listFilter: 'all', page: 3, jobId: 57 });
  const changed = transitionDemo(initial, { type: 'CHANGE_FILTER', filter: 'Accepted' });
  assert.equal(changed.state.listFilter, 'Accepted');
  assert.equal(changed.state.page, 1);
  assert.equal(changed.state.jobId, 57);

  const invalid = transitionDemo(changed.state, { type: 'CHANGE_FILTER', filter: 'admin' });
  assert.equal(invalid.state, changed.state);
  assert.deepEqual(invalid.effects, []);
});
