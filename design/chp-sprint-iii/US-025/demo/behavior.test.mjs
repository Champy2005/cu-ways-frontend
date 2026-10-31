import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';
import { FIXTURES, SCENARIOS, SCENARIO_IDS, SCENARIO_BY_ID } from './scenarios.mjs';
import { parseHeight } from './author-settings.mjs';
import { createDemoState, transitionDemo } from './state-machine.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const parent = (...segments) => path.join(here, ...segments);

function move(state, type, values = {}) {
  return transitionDemo(state, { type, ...values });
}

function startReadyJob() {
  let state = createDemoState({ scenarioId: 'L02' });
  state = move(state, 'OPEN_JOB', { jobId: 68 }).state;
  assert.equal(state.scenarioId, 'D01');
  state = move(state, 'DETAIL_READ_RESULT', { status: 'accepted' }).state;
  assert.equal(state.scenarioId, 'D02');
  state = move(state, 'OPEN_CONFIRM').state;
  assert.equal(state.scenarioId, 'C01');
  return state;
}

test('canonical model keeps all 41 source states and six named content fixtures', async () => {
  const model = JSON.parse(await readFile(parent('..', 'model', 'scenarios.json'), 'utf8'));
  assert.equal(model.canonical, true);
  assert.deepEqual(SCENARIO_IDS, [
    ...Array.from({ length: 9 }, (_, i) => `L${String(i + 1).padStart(2, '0')}`),
    ...Array.from({ length: 10 }, (_, i) => `D${String(i + 1).padStart(2, '0')}`),
    ...Array.from({ length: 8 }, (_, i) => `C${String(i + 1).padStart(2, '0')}`),
    ...Array.from({ length: 14 }, (_, i) => `R${String(i + 1).padStart(2, '0')}`),
  ]);
  assert.deepEqual(SCENARIO_IDS, model.scenarios.map(({ id }) => id));
  assert.equal(SCENARIOS.length, 41);
  assert.deepEqual(Object.keys(FIXTURES), ['standard', 'long', 'optional', 'completed', 'cancelled', 'rateLimit']);
  assert.match(FIXTURES.long.surveys[0], /[฀-๿]/u);
  assert.equal(FIXTURES.optional.briefUrl, null);
  assert.equal(FIXTURES.completed.status, 'Completed');
  assert.equal(FIXTURES.cancelled.status, 'Cancelled');
  assert.equal(FIXTURES.rateLimit.listReadStatus, 429);
  assert.equal(Object.keys(SCENARIO_BY_ID).length, 41);
});

test('D09 optional context belongs to the selected job and survives confirmation', () => {
  const ready=createDemoState({scenarioId:'D09',fixtureName:'standard'});
  assert.equal(ready.optionalMissingJobId,ready.jobId);
  const confirming=move(ready,'OPEN_CONFIRM').state;
  assert.equal(confirming.scenarioId,'C01');
  assert.equal(confirming.optionalMissingJobId,ready.jobId);
  const ordinary=createDemoState({scenarioId:'D02',fixtureName:'standard'});
  assert.equal(ordinary.optionalMissingJobId,null);
});

test('viewport height defaults only for missing or invalid input and clamps explicit values', () => {
  assert.equal(parseHeight(null), 844);
  assert.equal(parseHeight(''), 844);
  assert.equal(parseHeight('   '), 844);
  assert.equal(parseHeight('invalid'), 844);
  assert.equal(parseHeight('844'), 844);
  assert.equal(parseHeight('0'), 225);
  assert.equal(parseHeight('225.4'), 225);
  assert.equal(parseHeight('2000'), 1440);
});

test('generated scenario module is reproducible from the canonical JSON model', () => {
  const result = spawnSync(process.execPath, [parent('build.mjs'), '--check'], { encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /41 states, 6 fixtures/);
});

test('Cancel restores the start action and does not create a start write', () => {
  const initial = startReadyJob();
  const transition = move(initial, 'CANCEL_CONFIRM');
  assert.equal(transition.state.scenarioId, 'C02');
  assert.equal(transition.state.focusTarget, 'start');
  assert.equal(transition.state.startPostCount, 0);
  assert.deepEqual(transition.effects, []);
});

test('one explicit confirmation creates one POST; dismissal preserves the background request', () => {
  let state = startReadyJob();
  const submitted = move(state, 'CONFIRM_START');
  state = submitted.state;
  assert.equal(state.scenarioId, 'C03');
  assert.equal(state.pending, true);
  assert.equal(state.startPostCount, 1);
  assert.deepEqual(submitted.effects.map(({ method }) => method), ['POST']);

  const duplicate = move(state, 'CONFIRM_START');
  assert.equal(duplicate.state.startPostCount, 1);
  assert.deepEqual(duplicate.effects, []);

  state = move(state, 'ESCAPE').state;
  assert.equal(state.scenarioId, 'C03');
  assert.equal(state.pending, true);
  assert.equal(state.confirmationOpen, false);
  assert.equal(move(state, 'OUTSIDE_PRESS').state.confirmationOpen, false);
  assert.deepEqual(move(state, 'OUTSIDE_PRESS').effects, []);
  assert.deepEqual(move(state, 'CONFIRM_START').effects, []);
});

test('an unknown outcome only reconciles by GET; Accepted requires a fresh confirmation before another POST', () => {
  let state = startReadyJob();
  state = move(state, 'CONFIRM_START').state;
  const unknown = move(state, 'RESOLVE_START', { outcome: 'unknown' });
  state = unknown.state;
  assert.equal(state.scenarioId, 'R01');
  assert.equal(state.startPostCount, 1);
  assert.equal(unknown.effects.filter(({ method }) => method === 'POST').length, 0);

  const checked = move(state, 'RECONCILE', { status: 'accepted' });
  state = checked.state;
  assert.equal(state.scenarioId, 'R03');
  assert.equal(checked.effects.filter(({ method }) => method === 'GET').length, 1);
  assert.equal(checked.effects.some(({ method }) => method === 'POST'), false);
  assert.equal(state.startPostCount, 1);

  state = move(state, 'OPEN_CONFIRM').state;
  const secondStart = move(state, 'CONFIRM_START');
  assert.equal(secondStart.state.startPostCount, 2);
  assert.deepEqual(secondStart.effects.map(({ method }) => method), ['POST']);
});

test('sign-in return clears private details, performs a fresh read, and never replays a start', () => {
  let state = createDemoState({ scenarioId: 'R09', fixtureName: 'long' });
  const signIn = move(state, 'SIGN_IN');
  state = signIn.state;
  assert.equal(state.scenarioId, 'D10');
  assert.equal(state.privateDataVisible, false);
  assert.equal(state.jobStatus, null);
  assert.equal(signIn.effects.some(({ method }) => method === 'POST'), false);

  const returnRead = move(state, 'OPEN_JOB', { jobId: 73 });
  assert.equal(returnRead.state.scenarioId, 'D01');
  assert.equal(returnRead.state.jobId, 73);
  assert.equal(returnRead.effects.some(({ method }) => method === 'POST'), false);
  assert.equal(returnRead.effects.filter(({ method }) => method === 'GET').length, 1);

  const readResult = move(returnRead.state, 'DETAIL_READ_RESULT', { status: 'accepted' });
  assert.equal(readResult.state.scenarioId, 'D02');
  assert.equal(readResult.state.jobId, 73);
  assert.equal(readResult.state.startPostCount, 0);
});

test('safe return from a pending request preserves the no-resend rule and re-reads details', () => {
  let state = startReadyJob();
  state = move(state, 'CONFIRM_START').state;
  const leave = move(state, 'NAVIGATE_AWAY');
  state = leave.state;
  assert.equal(state.scenarioId, 'C06');
  assert.equal(state.pending, false);
  assert.equal(state.safeReturnCheckRequired, true);
  assert.equal(leave.effects.some(({ method }) => method === 'POST'), false);

  const returnRead = move(state, 'OPEN_JOB', { jobId: 68 });
  assert.equal(returnRead.state.scenarioId, 'D01');
  assert.equal(returnRead.state.safeReturnCheckRequired, false);
  assert.equal(returnRead.state.startPostCount, 1);
  assert.equal(returnRead.effects.filter(({ method }) => method === 'GET').length, 1);
  assert.equal(returnRead.effects.some(({ method }) => method === 'POST'), false);
});

test('unavailable outcomes clear private fixture data and retain no current status', () => {
  const state = createDemoState({ scenarioId: 'R01', fixtureName: 'long' });
  const unavailable = move(state, 'RECONCILE', { status: 'unavailable' }).state;
  assert.equal(unavailable.scenarioId, 'R08');
  assert.equal(unavailable.privateDataVisible, false);
  assert.equal(unavailable.statusKnown, false);
  assert.equal(unavailable.jobStatus, null);
  assert.equal(unavailable.lastConfirmedStatus, null);
});

test('offline R11 retains last-confirmed context and permits no write before a fresh read', async () => {
  const offline = createDemoState({ scenarioId: 'R11' });
  assert.equal(offline.statusKnown, false);
  assert.equal(offline.jobStatus, null);
  assert.equal(offline.lastConfirmedStatus, 'Accepted');

  const refresh = move(offline, 'REFRESH_DETAIL');
  assert.equal(refresh.state.scenarioId, 'D01');
  assert.equal(refresh.state.statusKnown, false);
  assert.equal(refresh.state.startPostCount, 0);
  const read = move(refresh.state, 'DETAIL_READ_RESULT', { status: 'accepted' });
  assert.equal(read.state.scenarioId, 'D02');
  assert.equal(read.state.statusKnown, true);
  assert.equal(read.state.jobStatus, 'Accepted');
  assert.equal(read.state.startPostCount, 0);


});

test('a confirmed start survives a failed background read as last-confirmed In Progress', () => {
  let state = startReadyJob();
  state = move(state, 'CONFIRM_START').state;
  const result = move(state, 'RESOLVE_START', { outcome: 'started', refreshOutcome: 'failed' });
  assert.equal(result.state.scenarioId, 'R14');
  assert.equal(result.state.jobStatus, 'In Progress');
  assert.equal(result.state.lastConfirmedStatus, 'In Progress');
  assert.equal(result.state.startPostCount, 1);
  assert.equal(result.effects.filter(({ method }) => method === 'POST').length, 0);
});

test('failed or unrecognized detail reads never make a job eligible', () => {
  for (const status of ['failed', 'unexpected', undefined]) {
    const loading = createDemoState({ scenarioId: 'D01' });
    const read = move(loading, 'DETAIL_READ_RESULT', { status });
    assert.equal(read.state.scenarioId, status === 'failed' ? 'D03' : 'D08');
    assert.equal(read.state.statusKnown, false);
    assert.equal(read.state.jobStatus, null);
    assert.equal(move(read.state, 'OPEN_CONFIRM').state.confirmationOpen, false);
    assert.equal(read.state.startPostCount, 0);
  }
});

test('failed refresh preserves confirmed progress or terminal history without enabling Start', () => {
  for (const scenarioId of ['D04', 'D05']) {
    const initial = createDemoState({ scenarioId });
    const loading = move(initial, 'REFRESH_DETAIL').state;
    assert.equal(loading.lastConfirmedStatus, initial.jobStatus);
    const failed = move(loading, 'DETAIL_READ_RESULT', { status: 'failed' }).state;
    assert.equal(failed.lastConfirmedStatus, initial.jobStatus);
    assert.notEqual(failed.jobStatus, 'Accepted');
    assert.equal(move(failed, 'OPEN_CONFIRM').state.confirmationOpen, false);
    assert.equal(failed.startPostCount, 0);
  }
});

test('optional missing data remains startable and a rejected request waits for its fresh read', () => {
  const optional = createDemoState({ scenarioId: 'D09', fixtureName: 'optional' });
  assert.equal(move(optional, 'OPEN_CONFIRM').state.scenarioId, 'C01');
  const submitted = move(startReadyJob(), 'CONFIRM_START').state;
  const rejected = move(submitted, 'RESOLVE_START', { outcome: 'rejected', refreshOutcome: 'in-progress' });
  assert.equal(rejected.state.scenarioId, 'C08');
  assert.equal(rejected.state.statusKnown, false);
  assert.equal(move(rejected.state, 'OPEN_CONFIRM').state.confirmationOpen, false);
  const read = move(rejected.state, 'DETAIL_READ_RESULT', { status: 'in-progress' });
  assert.equal(read.state.scenarioId, 'D04');
  assert.equal(read.state.startPostCount, 1);
  assert.equal(read.effects.some(e => e.method === 'POST'), false);
});

test('session-expired navigation cannot reveal the private list before mock sign-in', () => {
  const expired = createDemoState({ scenarioId: 'R09' });
  const nav = move(expired, 'BACK_TO_LIST');
  assert.equal(nav.state.scenarioId, 'R09');
  assert.equal(nav.state.privateDataVisible, false);
});

test('missing marketer access cannot reveal the private list through navigation', () => {
  const restricted = createDemoState({ scenarioId: 'D07' });
  const nav = move(restricted, 'BACK_TO_LIST');
  assert.equal(nav.state.scenarioId, 'D07');
  assert.equal(nav.state.privateDataVisible, false);
  assert.equal(nav.effects.length, 0);
});

test('known rejected start remains distinct from an ambiguous outcome across repeated failed reads', () => {
  let state = createDemoState({scenarioId:'R12'});
  for (let attempt=0;attempt<2;attempt++) {
    const refresh=move(state,'REFRESH_DETAIL');
    assert.equal(refresh.state.scenarioId,'C08');
    assert.equal(refresh.effects.filter(e=>e.method==='GET').length,1);
    state=move(refresh.state,'DETAIL_READ_RESULT',{status:'failed'}).state;
    assert.equal(state.scenarioId,'R12');
    assert.equal(state.unknownOutcome,false);
    assert.equal(state.startPostCount,0);
  }
  state=move(state,'REFRESH_DETAIL').state;
  state=move(state,'DETAIL_READ_RESULT',{status:'accepted'}).state;
  assert.equal(state.scenarioId,'D02');
  assert.equal(state.unknownOutcome,false);
});

test('safe re-read preserves a return target for the originating job card', () => {
  const submitted=move(startReadyJob(),'CONFIRM_START').state;
  const away=move(submitted,'NAVIGATE_AWAY').state;
  const read=move(away,'OPEN_JOB',{jobId:68}).state;
  assert.equal(read.returnFocusToJob,true);
  const ready=move(read,'DETAIL_READ_RESULT',{status:'in-progress'}).state;
  const list=move(ready,'BACK_TO_LIST').state;
  assert.equal(list.focusTarget,'return-job');
  assert.equal(list.jobId,68);
});
