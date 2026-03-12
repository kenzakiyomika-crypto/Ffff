'use strict';

/* ══════════════════════════════════════════════════════════════
   TACTICAL FITNESS — GameEventBus v1.0
   Fix #10 : ทุก engine ไม่เรียกกันโดยตรง — ส่งผ่าน EventBus
   Fix #3  : มี Rule Queue + execution phase
══════════════════════════════════════════════════════════════ */

const GameEventBus = (() => {

  /* ── Event Registry ── */
  const _listeners  = new Map();  // eventName → Set<handler>
  const _once       = new Map();  // eventName → Set<handler>
  const _history    = [];         // audit log (capped 200)
  const MAX_HISTORY = 200;

  /* ── Event names (centralized constants) ── */
  const EVENTS = Object.freeze({
    // Workout lifecycle
    WORKOUT_STARTED:    'workout:started',
    WORKOUT_COMPLETED:  'workout:completed',
    SET_LOGGED:         'set:logged',

    // Fatigue
    FATIGUE_UPDATED:    'fatigue:updated',
    OVERTRAINING_ALERT: 'fatigue:overtraining',

    // Rank / XP
    XP_EARNED:          'xp:earned',
    RANK_UP:            'rank:up',

    // Mission
    MISSION_PROGRESS:   'mission:progress',
    MISSION_COMPLETED:  'mission:completed',   // fired AFTER mark

    // Planner
    PLAN_DAY_SAVED:     'plan:daySaved',
    PLAN_GENERATED:     'plan:generated',

    // System
    STATE_SAVED:        'state:saved',
    STATE_LOADED:       'state:loaded',
    DAILY_RESET:        'system:dailyReset',
  });

  /* ── Subscribe ── */
  function on(event, handler) {
    if (!_listeners.has(event)) _listeners.set(event, new Set());
    _listeners.get(event).add(handler);
    return () => off(event, handler); // return unsubscribe fn
  }

  /* ── Subscribe once ── */
  function once(event, handler) {
    if (!_once.has(event)) _once.set(event, new Set());
    _once.get(event).add(handler);
  }

  /* ── Unsubscribe ── */
  function off(event, handler) {
    _listeners.get(event)?.delete(handler);
    _once.get(event)?.delete(handler);
  }

  /* ── Emit (synchronous — predictable execution order) ── */
  function emit(event, payload = {}) {
    const entry = {
      event,
      payload,
      ts: new Date().toISOString(),
    };

    // Audit log (cap)
    _history.push(entry);
    if (_history.length > MAX_HISTORY) _history.shift();

    // Persistent listeners
    const handlers = _listeners.get(event);
    if (handlers) {
      for (const h of handlers) {
        try { h(payload, event); }
        catch (err) {
          // Silent in production — surfaces in dev
          if (typeof location !== 'undefined' &&
             (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
            console.error(`[EventBus] Handler error for "${event}":`, err);
          }
        }
      }
    }

    // Once listeners
    const oneHandlers = _once.get(event);
    if (oneHandlers) {
      for (const h of oneHandlers) {
        try { h(payload, event); } catch {}
      }
      _once.delete(event);
    }
  }

  /* ── Emit async (ไม่บล็อก — ใช้สำหรับ heavy handler) ── */
  function emitAsync(event, payload = {}) {
    return Promise.resolve().then(() => emit(event, payload));
  }

  /* ── History ── */
  function getHistory(filterEvent) {
    if (!filterEvent) return [..._history];
    return _history.filter(e => e.event === filterEvent);
  }

  /* ── Clear (สำหรับ testing) ── */
  function clear() {
    _listeners.clear();
    _once.clear();
    _history.length = 0;
  }

  return { on, once, off, emit, emitAsync, getHistory, clear, EVENTS };

})();

/* ══════════════════════════════════════════════════════════════
   RULE QUEUE — Fix #3: execution phase แก้ Rule Conflict
   Phase: PRE_CALC → MODIFY → RESOLVE → COMMIT
══════════════════════════════════════════════════════════════ */

const RuleQueue = (() => {

  const PHASES = Object.freeze(['PRE_CALC', 'MODIFY', 'RESOLVE', 'COMMIT']);

  // Rules: { phase, priority, name, fn(context) → context }
  const _rules = [];

  function register(phase, priority, name, fn) {
    if (!PHASES.includes(phase)) throw new Error(`Unknown phase: ${phase}`);
    _rules.push({ phase, priority: priority ?? 50, name, fn });
    _rules.sort((a, b) => a.priority - b.priority); // low number = runs first
  }

  /* ── Execute all rules for an action ── */
  function execute(initialContext) {
    let ctx = { ...initialContext, _log: [] };

    for (const phase of PHASES) {
      const phaseRules = _rules.filter(r => r.phase === phase);
      for (const rule of phaseRules) {
        try {
          const result = rule.fn(ctx);
          if (result && typeof result === 'object') {
            ctx = { ...ctx, ...result };
          }
          ctx._log.push({ phase, rule: rule.name, ok: true });
        } catch (err) {
          ctx._log.push({ phase, rule: rule.name, ok: false, err: err.message });
        }
      }
    }

    return ctx;
  }

  function clear() { _rules.length = 0; }

  return { PHASES, register, execute, clear };

})();
