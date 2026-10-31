// Presentation waiting budget for local handoff demos. This is not a server
// cancellation or transaction timeout: expired writes become unknown outcomes.
export const OPERATION_WAIT_MS = 12_000;
export const SLOW_NOTICE_MS = 6_000;

// A same-tab journal for the fictional handoff only. It never dispatches or
// replays a request. A document that leaves during a write cannot know its
// outcome when it returns, so the host must restore an explicit read/check.
export function operationJournal(story, {storage, now = Date.now} = {}) {
  const key = `cuways.design-operation.v1.${story}`;
  const getStorage = () => storage ?? globalThis.sessionStorage;
  return {
    read({fixture, explicitScenario = false, navigationType = 'navigate', force = false} = {}) {
      if (!force && explicitScenario && !['back_forward', 'reload'].includes(navigationType)) return null;
      try {
        const record = JSON.parse(getStorage().getItem(key));
        if (record?.version !== 1 || record.fixture !== fixture || !['pending', 'unknown', 'settled'].includes(record.phase) || !record.snapshot || typeof record.snapshot !== 'object') return null;
        return record;
      } catch { return null; }
    },
    write({scene, fixture, phase, snapshot}) {
      try { getStorage().setItem(key, JSON.stringify({version:1, scene, fixture, phase, snapshot, at:now()})); } catch { /* Storage denial must not block navigation or recovery. */ }
    },
    clear() { try { getStorage().removeItem(key); } catch {} },
  };
}

export function restoreMutation(record) {
  if (!record) return null;
  return {...record.snapshot, pending:null, modal:null, ...(record.phase === 'pending' ? {message:'unknown'} : {})};
}
