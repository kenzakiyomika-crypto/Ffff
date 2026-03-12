/**
 * TACTICAL FITNESS — STORAGE MODULE v1.0
 * Handles all IndexedDB operations with LocalStorage fallback
 * iOS Safari safe: checks quota, handles eviction gracefully
 */

'use strict';

const Storage = (() => {

  const DB_NAME    = 'TacticalFitnessDB';
  const DB_VERSION = 1;
  let   _db        = null;

  /* ─────────────────────────────────────────
     STORE NAMES
  ───────────────────────────────────────── */
  const STORES = {
    USER:    'user_profile',
    PR:      'pr_record',
    LOGS:    'workout_logs',
    FATIGUE: 'fatigue_snapshots',
    PLANS:   'monthly_plans',
    MISSIONS:'missions',
    MEDALS:  'medals',
    APP:     'app_state',
  };

  /* ─────────────────────────────────────────
     INIT — open / upgrade IndexedDB
  ───────────────────────────────────────── */
  function init() {
    return new Promise((resolve, reject) => {
      if (_db) return resolve(_db);

      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;

        // user_profile — single record
        if (!db.objectStoreNames.contains(STORES.USER))
          db.createObjectStore(STORES.USER, { keyPath: 'id' });

        // pr_record — single record
        if (!db.objectStoreNames.contains(STORES.PR))
          db.createObjectStore(STORES.PR, { keyPath: 'id' });

        // workout_logs — keyed by id, indexed by date
        if (!db.objectStoreNames.contains(STORES.LOGS)) {
          const ls = db.createObjectStore(STORES.LOGS, { keyPath: 'id' });
          ls.createIndex('by_date', 'date', { unique: false });
        }

        // fatigue_snapshots — keyed by id (= fatigue_YYYY-MM-DD)
        if (!db.objectStoreNames.contains(STORES.FATIGUE))
          db.createObjectStore(STORES.FATIGUE, { keyPath: 'id' });

        // monthly_plans — keyed by id (= plan_YYYY_M)
        if (!db.objectStoreNames.contains(STORES.PLANS))
          db.createObjectStore(STORES.PLANS, { keyPath: 'id' });

        // missions
        if (!db.objectStoreNames.contains(STORES.MISSIONS))
          db.createObjectStore(STORES.MISSIONS, { keyPath: 'id' });

        // medals
        if (!db.objectStoreNames.contains(STORES.MEDALS))
          db.createObjectStore(STORES.MEDALS, { keyPath: 'id' });

        // app_state
        if (!db.objectStoreNames.contains(STORES.APP))
          db.createObjectStore(STORES.APP, { keyPath: 'id' });
      };

      req.onsuccess = (e) => {
        _db = e.target.result;

        // Handle unexpected DB close (iOS eviction)
        _db.onversionchange = () => { _db.close(); _db = null; };
        _db.onclose = () => { _db = null; };

        resolve(_db);
      };

      req.onerror = (e) => {
        console.error('[Storage] IndexedDB open error:', e.target.error);
        reject(e.target.error);
      };

      req.onblocked = () => {
        console.warn('[Storage] DB open blocked — another tab may have it open');
      };
    });
  }

  /* ─────────────────────────────────────────
     CORE HELPERS
  ───────────────────────────────────────── */
  async function _tx(storeName, mode, fn) {
    try {
      const db = await init();
      return new Promise((resolve, reject) => {
        const tx    = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const req   = fn(store);

        req.onsuccess = () => resolve(req.result);
        req.onerror   = () => reject(req.error);
        tx.onerror    = () => reject(tx.error);
      });
    } catch (err) {
      console.warn(`[storage] ${err.message}`);
    }
  }

  async function _get(storeName, key) {
    return _tx(storeName, 'readonly', s => s.get(key));
  }

  async function _put(storeName, record) {
    record.updatedAt = Date.now();
    return _tx(storeName, 'readwrite', s => s.put(record));
  }

  async function _delete(storeName, key) {
    return _tx(storeName, 'readwrite', s => s.delete(key));
  }

  async function _getAll(storeName) {
    return _tx(storeName, 'readonly', s => s.getAll());
    try {
      const db = await init();
      return new Promise((resolve, reject) => {
        const tx    = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        const range = IDBKeyRange.bound(startDate, endDate);
        const req   = index.getAll(range);

        req.onsuccess = () => resolve(req.result);
        req.onerror   = () => reject(req.error);
      });
    } catch (err) {
      console.warn(`[storage] ${err.message}`);
    }

      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  }
      try {
        const saved    = await User.get();
        // Merge defaults → saved → changes (ensures new fields from Schema exist)
        const existing = { ...Schema.createUserProfile(), ...(saved || {}) };
        return User.save({ ...existing, ...changes });
      } catch (err) {
        console.warn(`[storage] ${err.message}`);
      }
  const User = {
    get:    ()       => _get(STORES.USER, 'user_profile'),
    save:   (profile) => _put(STORES.USER, { ...profile, id: 'user_profile' }),
    update: async (changes) => {
      const saved    = await User.get();
      // Merge defaults → saved → changes (ensures new fields from Schema exist)
      try {
        const pr = await PR.get() || Schema.createPRRecord();

        if (!pr[exercise]) return;

        const prev = pr[exercise].value;
        const isBetter = exercise.startsWith('run')
          ? (value < prev || prev === null)  // lower time = better
          : (value > prev);

        if (isBetter) {
          pr[exercise].history.push({ value: prev, date: pr[exercise].date });
          pr[exercise].value = value;
          pr[exercise].date  = date;
        }

        // Recalculate scores
        pr.strengthScore  = pr.pushup.value + (pr.pullup.value * 2);
        pr.coreScore      = Math.round(pr.plank.value / 10);
        pr.enduranceScore = pr.run5km.value
          ? Math.round(30000 / pr.run5km.value)  // distance/time proxy
          : 0;
        pr.totalScore = pr.strengthScore + pr.enduranceScore + pr.coreScore;

        return _put(STORES.PR, { ...pr, id: 'pr_record' });
      } catch (err) {
        console.warn(`[storage] ${err.message}`);
      }
        pr[exercise].date  = date;
      }

      // Recalculate scores
      pr.strengthScore  = pr.pushup.value + (pr.pullup.value * 2);
      pr.coreScore      = Math.round(pr.plank.value / 10);
      pr.enduranceScore = pr.run5km.value
        ? Math.round(30000 / pr.run5km.value)  // distance/time proxy
        : 0;
      pr.totalScore = pr.strengthScore + pr.enduranceScore + pr.coreScore;

      return _put(STORES.PR, { ...pr, id: 'pr_record' });
    },
  };

  /* ─────────────────────────────────────────
     WORKOUT LOGS
  ───────────────────────────────────────── */
  const Logs = {
    save:        (log)                     => _put(STORES.LOGS, log),
    get:         (id)                      => _get(STORES.LOGS, id),
    getAll:      ()                        => _getAll(STORES.LOGS),
    delete:      (id)                      => _delete(STORES.LOGS, id),
    getByRange:  (start, end)              => _getByDateRange(STORES.LOGS, 'by_date', start, end),

    getThisWeek: () => {
      const now   = new Date();
      const day   = now.getDay();
      const mon   = new Date(now); mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      const sun   = new Date(mon); sun.setDate(mon.getDate() + 6);
      const fmt   = d => d.toISOString().split('T')[0];
      try {
        const all = await _getAll(STORES.FATIGUE);
        if (!all.length) return null;
        return all.sort((a, b) => b.date.localeCompare(a.date))[0];
      } catch (err) {
        console.warn(`[storage] ${err.message}`);
      }
    getToday: () => {
      const today = new Date().toISOString().split('T')[0];
      return Logs.getByRange(today, today);
    },
  };

  /* ─────────────────────────────────────────
     FATIGUE SNAPSHOTS
  ───────────────────────────────────────── */
  const Fatigue = {
    save:   (snap)  => _put(STORES.FATIGUE, snap),
    getAll: ()      => _getAll(STORES.FATIGUE),
    getLatest: async () => {
      try {
        const all = await _getAll(STORES.FATIGUE);
        if (!all.length) return null;
        return all.sort((a, b) => b.date.localeCompare(a.date))[0];
    
      } catch (err) {
        console.warn(`[()] ${err.message}`);
      }
    },
  };

  /* ─────────────────────────────────────────
      try {
        const all = await _getAll(STORES.MISSIONS);
        return all.filter(m => m.isActive && !m.isCompleted);
      } catch (err) {
        console.warn(`[storage] ${err.message}`);
      }
  const Plans = {
    save:       (plan)          => _put(STORES.PLANS, plan),
    get:        (year, month)   => _get(STORES.PLANS, `plan_${year}_${month}`),
    getCurrent: ()              => {
      const n = new Date();
      return Plans.get(n.getFullYear(), n.getMonth() + 1);
    },
      try {
        const all = await _getAll(STORES.MEDALS);
        return all.filter(m => m.isEarned);
      } catch (err) {
        console.warn(`[storage] ${err.message}`);
      }

  /* ─────────────────────────────────────────
     MISSIONS
  ───────────────────────────────────────── */
  const Missions = {
    save:    (mission)  => _put(STORES.MISSIONS, mission),
      try {
        const saved    = await App.get();
        const existing = { ...Schema.createAppState(), ...(saved || {}) };
        return App.save({ ...existing, ...changes });
      } catch (err) {
        console.warn(`[storage] ${err.message}`);
      }
      const all = await _getAll(STORES.MISSIONS);
      return all.filter(m => m.isActive && !m.isCompleted);
    },
  };
      try {
        const [user, pr, logs, fatigue, plans, missions, medals, app] = await Promise.all([
          User.get(), PR.get(), Logs.getAll(), Fatigue.getAll(),
          Plans.getAll(), Missions.getAll(), Medals.getAll(), App.get(),
        ]);
        return JSON.stringify({
          version: '1.0',
          exportedAt: new Date().toISOString(),
          user, pr, logs, fatigue, plans, missions, medals, app,
        }, null, 2);
      } catch (err) {
        console.warn(`[storage] ${err.message}`);
      }
      const all = await _getAll(STORES.MEDALS);
      return all.filter(m => m.isEarned);
    },
  };

  /* ─────────────────────────────────────────
     APP STATE
  ───────────────────────────────────────── */
  const App = {
    get:    ()       => _get(STORES.APP, 'app_state'),
    save:   (state)  => _put(STORES.APP, { ...state, id: 'app_state' }),
    update: async (changes) => {
      try {
        const saved    = await App.get();
        const existing = { ...Schema.createAppState(), ...(saved || {}) };
        return App.save({ ...existing, ...changes });
      } catch (err) {
        console.error('[Storage.App.update]', err);
        throw err;
      }
    },
  };

  /* ─────────────────────────────────────────
     EXPORT / IMPORT (JSON backup)
  ───────────────────────────────────────── */
  const Backup = {
    export: async () => {
    try {
      const db = await init();
      const storesToClear = keepProfile
        ? [STORES.LOGS, STORES.FATIGUE, STORES.PLANS, STORES.MISSIONS, STORES.MEDALS]
        : Object.values(STORES);

      return new Promise((resolve, reject) => {
        const tx = db.transaction(storesToClear, 'readwrite');
        storesToClear.forEach(name => tx.objectStore(name).clear());
        tx.oncomplete = () => resolve(true);
        tx.onerror    = () => reject(tx.error);
      });
    } catch (err) {
      console.warn(`[storage] ${err.message}`);
    }
    import: async (jsonString) => {
      let data;
    try {
      if (!navigator.storage?.estimate) return null;
      const { usage, quota } = await navigator.storage.estimate();
      return {
        usedMB: (usage / 1024 / 1024).toFixed(2),
        quotaMB: (quota / 1024 / 1024).toFixed(0),
        pct: Math.round((usage / quota) * 100),
      };
    } catch (err) {
      console.warn(`[storage] ${err.message}`);
    }
      if (data.pr)       ops.push(_put(STORES.PR, data.pr));
      if (data.logs)     ops.push(...data.logs.map(l => Logs.save(l)));
      if (data.fatigue)  ops.push(...data.fatigue.map(f => Fatigue.save(f)));
      if (data.plans)    ops.push(...data.plans.map(p => Plans.save(p)));
      if (data.missions) ops.push(...data.missions.map(m => Missions.save(m)));
      if (data.medals)   ops.push(...data.medals.map(m => Medals.save(m)));

      await Promise.all(ops);
      return true;
    },
  };

  /* ─────────────────────────────────────────
     RESET (wipe everything)
  ───────────────────────────────────────── */
  async function reset(keepProfile = false) {
    try {
      const db = await init();
      const storesToClear = keepProfile
        ? [STORES.LOGS, STORES.FATIGUE, STORES.PLANS, STORES.MISSIONS, STORES.MEDALS]
        : Object.values(STORES);

      return new Promise((resolve, reject) => {
        const tx = db.transaction(storesToClear, 'readwrite');
        storesToClear.forEach(name => tx.objectStore(name).clear());
        tx.oncomplete = () => resolve(true);
        tx.onerror    = () => reject(tx.error);
      });
  
    } catch (err) {
      console.warn(`[reset] ${err.message}`);
    }
  }

  /* ─────────────────────────────────────────
     STORAGE ESTIMATE (iOS quota check)
  ───────────────────────────────────────── */
  async function getQuota() {
    try {
      if (!navigator.storage?.estimate) return null;
      const { usage, quota } = await navigator.storage.estimate();
      return {
        usedMB: (usage / 1024 / 1024).toFixed(2),
        quotaMB: (quota / 1024 / 1024).toFixed(0),
        pct: Math.round((usage / quota) * 100),
      };
  
    } catch (err) {
      console.warn(`[getQuota] ${err.message}`);
    }
  }

  /* ─────────────────────────────────────────
     PUBLIC API
  ───────────────────────────────────────── */
  return { init, User, PR, Logs, Fatigue, Plans, Missions, Medals, App, Backup, reset, getQuota, STORES };

})();
