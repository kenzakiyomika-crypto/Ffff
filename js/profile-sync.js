/**
 * TACTICAL FITNESS — PROFILE SYNC v1.0
 * โหลดข้อมูล User Profile + PR จาก IndexedDB แล้วกรอกให้ทุก input field อัตโนมัติ
 * แต่ละหน้าแค่เรียก ProfileSync.init() ใน DOMContentLoaded
 */

'use strict';

const ProfileSync = (() => {

  /* ──────────────────────────────────────
     FIELD MAP
     key = field id บนหน้า
     path = 'user.xxx' หรือ 'pr.xxx.value'
  ────────────────────────────────────── */
  const FIELD_MAP = {
    // ── User profile fields (common IDs used across pages) ──
    'age':             { path: 'user.age',          type: 'number' },
    'f-age':           { path: 'user.age',          type: 'number' },
    'weight':          { path: 'user.weight',       type: 'number' },
    'f-weight':        { path: 'user.weight',       type: 'number' },
    'height':          { path: 'user.height',       type: 'number' },
    'f-height':        { path: 'user.height',       type: 'number' },
    'gender':          { path: 'user.gender',       type: 'select' },
    'f-gender':        { path: 'user.gender',       type: 'select' },
    'callsign':        { path: 'user.callsign',     type: 'text' },
    'f-callsign':      { path: 'user.callsign',     type: 'text' },

    // ── PR / Fitness test fields ──
    'pushup':          { path: 'pr.pushup.value',   type: 'number' },
    'f-pushup':        { path: 'pr.pushup.value',   type: 'number' },
    'pullup':          { path: 'pr.pullup.value',   type: 'number' },
    'f-pullup':        { path: 'pr.pullup.value',   type: 'number' },
    'situp':           { path: 'pr.situp.value',    type: 'number' },
    'f-situp':         { path: 'pr.situp.value',    type: 'number' },
    'plankSec':        { path: 'pr.plank.value',    type: 'number' },
    'f-plank':         { path: 'pr.plank.value',    type: 'number' },

    // ── Run time fields (stored in seconds, shown as mm:ss) ──
    'runTime':         { path: 'pr.run3km.value',   type: 'runtime' },
    'f-run2km':        { path: 'pr.run2km.value',   type: 'runtime' },
    'f-run3km':        { path: 'pr.run3km.value',   type: 'runtime' },
  };

  /* Convert seconds → mm:ss string */
  function secToMmss(sec) {
    if (!sec || sec <= 0) return '';
    const m = Math.floor(sec / 60), s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  /* Convert mm:ss or plain number → seconds */
  function mmssToSec(str) {
    if (!str) return null;
    const parts = String(str).split(':');
    if (parts.length === 2) return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    return parseInt(str, 10) * 60 || null;
  }

  /* Get nested value from object using dot-path */
  function getPath(obj, path) {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
  }

  /* Set nested value using dot-path */
  function setPath(obj, path, value) {
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }

  let _user = null, _pr = null;

  /* ────────────────────────────────────
     FILL: read Storage → fill fields
  ──────────────────────────────────── */
  async function fillFromStorage() {
    try {
      if (typeof Storage === 'undefined') return;
      await Storage.init().catch(() => {});
      [_user, _pr] = await Promise.all([
        Storage.User.get().catch(() => null),
        Storage.PR.get().catch(() => null),
      ]);
      if (!_user) _user = Schema.createUserProfile();
      if (!_pr)   _pr   = Schema.createPRRecord();

      Object.entries(FIELD_MAP).forEach(([id, cfg]) => {
        const el = document.getElementById(id);
        if (!el) return;
        const src = cfg.path.startsWith('user.') ? _user : _pr;
        const key = cfg.path.startsWith('user.') ? cfg.path.slice(5) : cfg.path.slice(3);
        const val = getPath(src, key);
        if (val === null || val === undefined || val === 0) return; // keep placeholder

        if (cfg.type === 'runtime') {
          el.value = secToMmss(val);
        } else {
          el.value = val;
        }
      });
    } catch (e) {
      console.warn('[ProfileSync] fillFromStorage:', e);
    }
  }

  /* ────────────────────────────────────
     SAVE: collect field values → Storage
  ──────────────────────────────────── */
  async function saveToStorage() {
    try {
      if (!_user || !_pr) return;
      const userChanges = {};
      const prUpdates = []; // [{exercise, value}]

      Object.entries(FIELD_MAP).forEach(([id, cfg]) => {
        const el = document.getElementById(id);
        if (!el || el.value === '') return;

        let val;
        if (cfg.type === 'number') val = parseFloat(el.value) || 0;
        else if (cfg.type === 'runtime') val = mmssToSec(el.value);
        else val = el.value;

        if (val === null) return;

        if (cfg.path.startsWith('user.')) {
          const key = cfg.path.slice(5);
          setPath(userChanges, key, val);
        } else {
          // PR path format: 'pr.pushup.value' → exercise='pushup', field='value'
          const parts = cfg.path.slice(3).split('.');
          if (parts[0] && parts[1] === 'value') {
            prUpdates.push({ exercise: parts[0], value: val });
          }
        }
      });

      const promises = [];
      if (Object.keys(userChanges).length) promises.push(Storage.User.update(userChanges));
      // Update each PR field individually using the correct API
      prUpdates.forEach(({ exercise, value }) => {
        if (value > 0) promises.push(Storage.PR.update(exercise, value));
      });
      await Promise.all(promises);
    } catch (e) {
      console.warn('[ProfileSync] saveToStorage:', e);
    }
  }

  /* ────────────────────────────────────
     AUTO-SAVE: attach listeners to synced fields
  ──────────────────────────────────── */
  function attachAutoSave(debounceMs = 1500) {
    let _timer = null;
    const trigger = () => {
      clearTimeout(_timer);
      _timer = setTimeout(saveToStorage, debounceMs);
    };
    Object.keys(FIELD_MAP).forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', trigger);
      el.addEventListener('input', trigger);
    });
  }

  /* ────────────────────────────────────
     PUBLIC: init() = fill + attach
  ──────────────────────────────────── */
  async function init({ autoSave = true } = {}) {
    try {
      await fillFromStorage();
      if (autoSave) attachAutoSave();
    } catch (err) {
      console.warn(`[profile-sync] ${err.message}`);
    }
  }

  /* ────────────────────────────────────
     PUBLIC: getProfile() / getPR()
     ให้หน้าอื่น read ค่าได้โดยไม่ต้อง await Storage อีกรอบ
  ──────────────────────────────────── */
  function getProfile() { return _user; }
  function getPR()      { return _pr;   }

  return { init, fillFromStorage, saveToStorage, getProfile, getPR };

})();
