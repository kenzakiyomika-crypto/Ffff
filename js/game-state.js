'use strict';

/* ══════════════════════════════════════════════════════════════
   TACTICAL FITNESS — GameState v1.0
   Fix #1  : Pure immutable state — ไม่ mutate object โดยตรง
   Fix #7  : STATE_VERSION + migration map + JSON.parse fallback
   Fix #12 : Checksum + dual save slot (primary + backup)
══════════════════════════════════════════════════════════════ */

const GameState = (() => {

  /* ── Version & Migration ── */
  const STATE_VERSION = 14;

  const MIGRATIONS = {
    // v12 → v13: เพิ่ม fatigueScore, saveVersion
    12: (state) => ({
      ...state,
      fatigueScore:  state.fatigueScore  ?? 0,
      overtrained:   state.overtrained   ?? false,
      saveVersion:   13,
    }),
    // v13 → v14: storage split (schema.js + storage.js), no data change needed
    13: (state) => ({
      ...state,
      saveVersion: 14,
    }),
    // v11 → v12: เพิ่ม xp เป็น integer (เดิมอาจเป็น float)
    11: (state) => ({
      ...state,
      xp: Math.round(state.xp ?? 0),
      saveVersion: 12,
    }),
  };

  /* ── Checksum (FNV-1a 32-bit) ── */
  function checksum(obj) {
    const str = JSON.stringify(obj);
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = (hash * 16777619) >>> 0;
    }
    return hash.toString(16);
  }

  /* ── Deep clone (pure — ไม่แชร์ reference) ── */
  function clone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(clone);
    const result = {};
    for (const key of Object.keys(obj)) result[key] = clone(obj[key]);
    return result;
  }

  /* ── Freeze (dev mode guard) ── */
  const IS_DEV = typeof location !== 'undefined' &&
                 (location.hostname === 'localhost' || location.hostname === '127.0.0.1');

  function freeze(obj) {
    if (!IS_DEV || obj === null || typeof obj !== 'object') return obj;
    Object.keys(obj).forEach(k => freeze(obj[k]));
    return Object.freeze(obj);
  }

  /* ── Default state shape ── */
  function createDefault() {
    return {
      saveVersion:   STATE_VERSION,
      profile: {
        callsign: 'OPERATOR', gender: 'male', age: 25,
        fitnessLevel: 'beginner', weight: 70, height: 170,
        trainingDaysPerWeek: 3, preferredTime: 'morning',
        rankIndex: 0,
        xp: 0,                // always integer (fix #4)
        experienceMonths: 0,
        injuries: [], restingHR: 0,
      },
      fatigueScore:  0,       // 0–100 clamped (fix #2)
      overtrained:   false,
      lastReset:     _utcDateStr(),   // UTC date string (fix #5)
      prefs: {
        lang: 'th', units: 'kg/cm',
        weekStart: 0, defaultRest: 60,
      },
    };
  }

  /* ── UTC date string helper (fix #5) ── */
  function _utcDateStr(date = new Date()) {
    return date.toISOString().split('T')[0];
  }

  /* ── Migration runner ── */
  function migrate(raw) {
    let state  = raw;
    let ver    = state.saveVersion ?? 0;
    const keys = Object.keys(MIGRATIONS).map(Number).sort((a,b) => a - b);
    for (const v of keys) {
      if (ver <= v) {
        state = MIGRATIONS[v](state);
        ver = state.saveVersion;
      }
    }
    return state;
  }

  /* ══════════════════════════════════
     STORAGE KEYS
  ══════════════════════════════════ */
  const KEY_PRIMARY = 'tf_state_v13';
  const KEY_BACKUP  = 'tf_state_v13_bak';
  const KEY_PREFS   = 'tf_prefs';

  /* ── Safe JSON parse (fix #7) ── */
  function safeParse(str, fallback = null) {
    try {
      if (!str) return fallback;
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  }

  /* ── Save with checksum + dual slot (fix #12) ── */
  function persist(state) {
    const payload = { data: state, checksum: checksum(state), savedAt: new Date().toISOString() };
    const str = JSON.stringify(payload);
    try {
      // สำรอง primary ก่อนเขียนทับ
      const prev = localStorage.getItem(KEY_PRIMARY);
      if (prev) localStorage.setItem(KEY_BACKUP, prev);
      localStorage.setItem(KEY_PRIMARY, str);
    } catch (e) {
      // Storage full — เขียน backup slot อย่างน้อย
      try { localStorage.setItem(KEY_BACKUP, str); } catch {}
    }
  }

  /* ── Load: ตรวจ checksum, fallback to backup, then default (fix #7, #12) ── */
  function load() {
    const slots = [KEY_PRIMARY, KEY_BACKUP];
    for (const key of slots) {
      const raw = safeParse(localStorage.getItem(key));
      if (!raw?.data) continue;

      const expected = checksum(raw.data);
      if (raw.checksum !== expected) {
        // Checksum mismatch — ลอง slot ถัดไป
        continue;
      }

      // Run migrations
      try {
        const migrated = migrate(raw.data);
        return freeze(migrated);
      } catch {
        continue;
      }
    }
    // ทุก slot เสีย — สร้าง default ใหม่
    const fresh = createDefault();
    persist(fresh);
    return freeze(fresh);
  }

  /* ══════════════════════════════════
     PURE STATE TRANSITIONS
     รับ state เก่า → return state ใหม่ (ไม่แตะ original)
  ══════════════════════════════════ */
  const transitions = {

    /* อัปเดต profile field */
    updateProfile(state, partial) {
      return { ...state, profile: { ...state.profile, ...partial } };
    },

    /* เพิ่ม XP แบบ integer + clamp rank (fix #4) */
    addXP(state, amount, RANKS) {
      const newXP = (state.profile.xp ?? 0) + Math.round(amount);
      const maxRank = RANKS.length - 1;

      // หา rank ใหม่จาก threshold table
      let rankIndex = 0;
      for (let i = maxRank; i >= 0; i--) {
        if (newXP >= (RANKS[i].minXP ?? 0)) { rankIndex = i; break; }
      }
      rankIndex = Math.min(rankIndex, maxRank); // clamp (fix #4)

      return {
        ...state,
        profile: { ...state.profile, xp: newXP, rankIndex },
      };
    },

    /* อัปเดต fatigueScore แบบ clamped (fix #2) */
    setFatigue(state, score) {
      const clamped = Math.min(100, Math.max(0, Math.round(score)));
      return {
        ...state,
        fatigueScore: clamped,
        overtrained:  clamped >= 85,
      };
    },

    /* อัปเดต prefs */
    updatePrefs(state, partial) {
      return { ...state, prefs: { ...state.prefs, ...partial } };
    },

    /* reset lastReset ด้วย UTC date (fix #5) */
    resetDaily(state) {
      return { ...state, lastReset: _utcDateStr() };
    },
  };

  /* ══════════════════════════════════
     PUBLIC API
  ══════════════════════════════════ */
  let _current = load();

  return {
    /* อ่าน state (clone ป้องกัน mutation ภายนอก) */
    get:    ()        => clone(_current),

    /* apply transition แล้ว persist */
    apply:  (fn, ...args) => {
      const next = fn(_current, ...args);
      _current   = freeze(next);
      persist(next);
      return clone(_current);
    },

    /* transitions */
    tx: transitions,

    /* utils */
    clone,
    checksum,
    utcDateStr: _utcDateStr,
    isStaleDay: () => _current.lastReset !== _utcDateStr(),
  };

})();
