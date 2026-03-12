/**
 * TACTICAL FITNESS — SHARED UTILS v1.0
 * Helper functions ที่ใช้ร่วมกันทุกหน้า
 */

'use strict';

/**
 * Safe HTML setter — strips <script> and inline event handlers before assigning innerHTML.
 * @param {Element} el  Target element
 * @param {string}  html HTML string to set
 */
function safeSetHTML(el, html) {
  if (!el) return;
  const safe = typeof html === 'string'
    ? html.replace(/<script[\s\S]*?<\/script>/gi, '')
           .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    : '';
  el['innerHTML'] = safe; // safe: content already sanitized above
}


/* ─────────────────────────────────────────
   DATE HELPERS
───────────────────────────────────────── */

const DateUtils = {

  /** วันนี้ YYYY-MM-DD */
  today() {
    return new Date().toISOString().split('T')[0];
  },

  /** แปลง seconds → MM:SS */
  secToMMSS(sec) {
    if (!sec && sec !== 0) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  },

  /** แปลง seconds → M นาที SS วินาที */
  secToThai(sec) {
    if (!sec) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (!m) return `${s} วิ`;
    if (!s) return `${m} นาที`;
    return `${m} นาที ${s} วิ`;
  },

  /** แปลง timestamp → วันที่ไทย DD/MM/YYYY */
  tsThai(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()+543}`;
  },

  /** แปลง YYYY-MM-DD → วันที่ไทย */
  dateThai(dateStr) {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-').map(Number);
    const MONTHS = ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    return `${d} ${MONTHS[m]} ${y + 543}`;
  },

  /** ชื่อวัน */
  dayName(dow) {
    return ['อา','จ','อ','พ','พฤ','ศ','ส'][dow] || '';
  },

  /** วันพรุ่งนี้ YYYY-MM-DD */
  tomorrow() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  },

  /** N วันที่แล้ว */
  daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  },
};

/* ─────────────────────────────────────────
   NUMBER HELPERS
───────────────────────────────────────── */

const NumUtils = {

  /** clamp value between min and max */
  clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  },

  /** แปลง meters → km string */
  metersToKm(m) {
    if (!m) return '0 km';
    return m >= 1000 ? `${(m/1000).toFixed(1)} km` : `${m} m`;
  },

  /** ปัดเลขเป็น k */
  formatNum(n) {
    if (n >= 1000) return `${(n/1000).toFixed(1)}k`;
    return String(Math.round(n));
  },
};

/* ─────────────────────────────────────────
   DOM HELPERS
───────────────────────────────────────── */

const DOM = {

  /** getElementById shortcut */
  id(id) { return document.getElementById(id); },

  /** querySelector shortcut */
  q(sel, root = document) { return root.querySelector(sel); },

  /** querySelectorAll shortcut */
  qa(sel, root = document) { return [...root.querySelectorAll(sel)]; },

  /** set textContent safely */
  setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text ?? '—';
  },

  /** set innerHTML safely */
  setHTML(id, html) {
    const el = document.getElementById(id);
    if (el) {
    const safe = typeof html === 'string'
      ? html.replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
      : '';
    el['innerHTML'] = safe; // sanitized: script/handler tags stripped above
  }
  },

  /** show / hide element */
  show(id) { const el = document.getElementById(id); if (el) el.style.display = ''; },
  hide(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; },

  /** Toast notification */
  toast(msg, type = 'success', duration = 2500) {
    let el = document.getElementById('tf-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'tf-toast';
      el.style.cssText = `
        position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(16px);
        background:var(--bg2,#111);border-radius:4px;padding:10px 22px;
        font-family:var(--mono,'Share Tech Mono',monospace);font-size:11px;
        letter-spacing:1px;z-index:9999;opacity:0;transition:all .3s ease;
        white-space:nowrap;pointer-events:none;
      `;
      document.body.appendChild(el);
    }
    const colors = { success: 'var(--green,#00ff88)', error: 'var(--red,#ff2d2d)', warn: 'var(--amber,#ffaa00)' };
    el.style.color       = colors[type] || colors.success;
    el.style.borderColor = colors[type] || colors.success;
    el.style.border      = `1px solid ${colors[type] || colors.success}`;
    el.textContent = msg;
    el.style.opacity   = '1';
    el.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(el._timer);
    el._timer = setTimeout(() => {
      el.style.opacity   = '0';
      el.style.transform = 'translateX(-50%) translateY(16px)';
    }, duration);
  },
};

/* ─────────────────────────────────────────
   CANVAS CHART HELPERS
───────────────────────────────────────── */

const Charts = {

  /** วาด sparkline บน canvas */
  sparkline(canvas, values, color = '#00ff88') {
    if (!canvas || !values?.length) return;
    const ctx = canvas.getContext('2d');
    const w   = canvas.width;
    const h   = canvas.height;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();

    values.forEach((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // glow
    ctx.shadowBlur  = 6;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur  = 0;
  },

  /** วาด bar chart แนวตั้ง */
  barChart(canvas, data, options = {}) {
    if (!canvas || !data?.length) return;
    const {
      barColor   = '#00ff88',
      labelColor = '#666',
      maxVal     = null,
    } = options;

    const ctx  = canvas.getContext('2d');
    const w    = canvas.width;
    const h    = canvas.height;
    const max  = maxVal || Math.max(...data.map(d => d.value || d), 1);
    const pad  = 4;
    const bw   = (w - pad * (data.length + 1)) / data.length;

    ctx.clearRect(0, 0, w, h);

    data.forEach((item, i) => {
      const val    = item.value ?? item;
      const label  = item.label ?? '';
      const barH   = Math.max(2, ((val / max) * (h - 16)));
      const x      = pad + i * (bw + pad);
      const y      = h - 12 - barH;

      // bar
      ctx.fillStyle = item.highlight ? '#ffaa00' : barColor;
      ctx.fillRect(x, y, bw, barH);

      // label
      if (label) {
        ctx.fillStyle  = labelColor;
        ctx.font       = `9px monospace`;
        ctx.textAlign  = 'center';
        ctx.fillText(label.slice(0, 3), x + bw / 2, h - 2);
      }
    });
  },

  /** วาด progress ring */
  ring(canvas, pct, color = '#00ff88', bgColor = '#1a1a1a') {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx  = canvas.width  / 2;
    const cy  = canvas.height / 2;
    const r   = Math.min(cx, cy) - 6;
    const start = -Math.PI / 2;
    const end   = start + (Math.PI * 2 * (pct / 100));

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // bg ring
    ctx.strokeStyle = bgColor;
    ctx.lineWidth   = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // progress
    ctx.strokeStyle = color;
    ctx.lineWidth   = 6;
    ctx.lineCap     = 'round';
    ctx.shadowBlur  = 8;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, end);
    ctx.stroke();
    ctx.shadowBlur  = 0;
  },
};

/* ─────────────────────────────────────────
   SIDEBAR / NAV HELPERS
───────────────────────────────────────── */

const Nav = {

  /** toggle mobile sidebar */
  toggle() {
    const sb  = document.getElementById('sidebar');
    const ov  = document.getElementById('overlay');
    if (sb) sb.classList.toggle('open');
    if (ov) ov.classList.toggle('show');
  },

  close() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('overlay');
    if (sb) sb.classList.remove('open');
    if (ov) ov.classList.remove('show');
  },

  /** อัพเดต sidebar footer จาก profile */
  updateFooter(profile) {
    if (!profile) return;
    const rank    = (typeof RANKS !== 'undefined') ? RANKS[profile.rankIndex ?? 0] : null;
    const rankEl  = document.getElementById('sb-rank');
    const callEl  = document.getElementById('sb-callsign');
    if (rankEl) rankEl.textContent  = rank?.name || profile.currentRank || '—';
    if (callEl) callEl.textContent  = profile.callsign || 'OPERATOR';
  },
};

/* ─────────────────────────────────────────
   HAPTIC
───────────────────────────────────────── */

function haptic(type = 'light') {
  const prefs = JSON.parse(localStorage.getItem('tf_prefs') || '{}');
  if (!prefs.haptic) return;
  if (!navigator.vibrate) return;
  const patterns = { light: [10], medium: [20], heavy: [40, 10, 40] };
  navigator.vibrate(patterns[type] || patterns.light);
}

/* ─────────────────────────────────────────
   GUARD — redirect if no profile
───────────────────────────────────────── */

async function requireProfile(redirectTo = '../index.html') {
  try {
    await Storage.init();
    const profile = await Storage.User.get();
    if (!profile?.onboardingComplete) {
      window.location.href = redirectTo;
      return null;
    }
    return profile;
  } catch (err) {
    console.error('[Guard] Storage error:', err);
    window.location.href = redirectTo;
    return null;
  }
}

/* ─────────────────────────────────────────
   APPLY SAVED PREFERENCES (accent + font)
   Called at page load from utils.js
───────────────────────────────────────── */
(function applyPrefsOnLoad() {
  try {
    const prefs = JSON.parse(localStorage.getItem('tf_prefs') || '{}');
    if (prefs.accentColor && prefs.accentColor !== '#00FF88') {
      const h = prefs.accentColor;
      document.documentElement.style.setProperty('--green', h);
      document.documentElement.style.setProperty('--green-dim', h + '18');
      document.documentElement.style.setProperty('--green-glow', h + '60');
    }
    const fontMap = { small:'12px', normal:'14px', large:'16px', xlarge:'18px' };
    if (prefs.fontSize && fontMap[prefs.fontSize]) {
      document.body.style.fontSize = fontMap[prefs.fontSize];
    }
  } catch(e) {}
})();
/**
 * TACTICAL FITNESS — FATIGUE ENGINE v1.0
 * คำนวณ Fatigue Index จากข้อมูล workout logs
 * ใช้ ACWR (Acute:Chronic Workload Ratio) แบบง่าย
 */

'use strict';

const FatigueEngine = (() => {

  /* ─────────────────────────────────────────
     CONFIG
  ───────────────────────────────────────── */
  const CONFIG = {
    acuteWindow:  7,   // days (short-term load)
    chronicWindow: 28, // days (long-term baseline)
    maxConsecutive: 3, // วันฝึกต่อเนื่องก่อนแนะนำพัก
    volumePerRep: 1,   // default weight factor
  };

  /* ─────────────────────────────────────────
     LOAD CALCULATION
  ───────────────────────────────────────── */

  /**
   * คำนวณ total volume load ของ session
   * sets × reps × bodyweight_factor
   */
  function calcSessionLoad(log) {
    if (!log?.exercises?.length) return log?.volumeLoad ?? 0;

    return log.exercises.reduce((total, ex) => {
      if (ex.type === 'timed') {
        return total + (ex.sets || 1) * ((ex.actualDuration || ex.duration || 60) / 10);
      }
      if (ex.type === 'distance') {
        return total + ((ex.distance || 0) / 100);
      }
      // repetition
      const reps = ex.actualReps?.length
        ? ex.actualReps.reduce((s, r) => s + (r || 0), 0)
        : (ex.sets || 1) * (ex.reps ?? 0);
      return total + reps * CONFIG.volumePerRep;
    }, 0);
  }

  /**
   * คำนวณ average daily load ของ window ที่กำหนด
   * @param {Array} logs - sorted logs
   * @param {string} endDate - YYYY-MM-DD
   * @param {number} days - window size
   */
  function avgLoad(logs, endDate, days) {
    const end   = new Date(endDate + 'T00:00:00');
    const start = new Date(end);
    start.setDate(end.getDate() - days + 1);
    const startStr = start.toISOString().split('T')[0];

    const windowLogs = logs.filter(l => l.date >= startStr && l.date <= endDate);
    if (!windowLogs.length) return 0;

    const totalLoad = windowLogs.reduce((s, l) => s + calcSessionLoad(l), 0);
    return totalLoad / days; // รวมวันพักด้วย (daily average)
  }

  /* ─────────────────────────────────────────
     ACWR — Acute:Chronic Workload Ratio
  ───────────────────────────────────────── */

  /**
   * คำนวณ ACWR
   * <0.8 = undertraining | 0.8–1.3 = sweet spot | >1.5 = overload risk
   */
  function calcACWR(logs, asOfDate = null) {
    const date = asOfDate || new Date().toISOString().split('T')[0];
    const acute   = avgLoad(logs, date, CONFIG.acuteWindow);
    const chronic = avgLoad(logs, date, CONFIG.chronicWindow);

    if (!chronic) return 1.0; // no baseline yet → neutral
    return Math.round((acute / chronic) * 100) / 100;
  }

  /* ─────────────────────────────────────────
     CONSECUTIVE DAYS
  ───────────────────────────────────────── */

  function calcConsecutiveDays(logs) {
    if (!logs?.length) return 0;

    const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
    const dates  = new Set(sorted.map(l => l.date));

    let count = 0;
    let check = sorted[0].date; // start from latest log, not today
    while (dates.has(check)) {
      count++;
      const d = new Date(check + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      check = d.toISOString().split('T')[0];
    }
    return count;
  }

  /* ─────────────────────────────────────────
     FATIGUE INDEX (0–100)
  ───────────────────────────────────────── */

  /**
   * คำนวณ Fatigue Index รวม
   * ผลรวมของ ACWR + consecutive days + weekly density
   * @returns {object} { index, label, acwr, consecutive, recommendation }
   */
  function calcFatigueIndex(logs, asOfDate = null) {
    if (!logs?.length) {
      return { index: 0, label: 'fresh', acwr: 1.0, consecutive: 0, weeklyLoad: 0, recommendation: 'เริ่มฝึกได้เลย' };
    }

    const acwr        = calcACWR(logs, asOfDate);
    const consecutive = calcConsecutiveDays(logs);
    const date        = asOfDate || new Date().toISOString().split('T')[0];
    const weeklyLoad  = avgLoad(logs, date, 7) * 7;

    // Fatigue score components (0–100)
    let score = 0;

    // ACWR component (weight: 50%)
    if (acwr > 1.5)       score += 50;
    else if (acwr > 1.3)  score += 35;
    else if (acwr > 1.1)  score += 20;
    else if (acwr < 0.6)  score += 5; // undertrained also mild concern
    else                   score += 0;

    // Consecutive days (weight: 30%)
    if (consecutive >= 5)      score += 30;
    else if (consecutive >= 4) score += 20;
    else if (consecutive >= 3) score += 10;
    else                        score += 0;

    // Weekly session count (weight: 20%)
    const weekStart = new Date(date + 'T00:00:00');
    const _wd = weekStart.getDay() || 7;
    weekStart.setDate(weekStart.getDate() - _wd + 1);
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
    const weekCount = logs.filter(l =>
      l.date >= weekStart.toISOString().split('T')[0] &&
      l.date <= weekEnd.toISOString().split('T')[0]
    ).length;

    if (weekCount >= 6)      score += 20;
    else if (weekCount >= 5) score += 10;
    else                      score += 0;

    score = Math.min(100, Math.max(0, score));

    // Label
    let label, recommendation;
    if (score <= 20) {
      label = 'fresh';
      recommendation = 'สภาพร่างกายดีเยี่ยม พร้อมฝึกเต็มที่';
    } else if (score <= 45) {
      label = 'moderate';
      recommendation = 'มีความล้าพอสมควร ฝึกได้แต่ลดความหนักลง 10–20%';
    } else if (score <= 70) {
      label = 'tired';
      recommendation = 'ร่างกายเริ่มล้า แนะนำ active recovery หรือ light session';
    } else {
      label = 'overload';
      recommendation = 'ควรพักอย่างน้อย 1–2 วัน เสี่ยงต่อการบาดเจ็บ';
    }

    return { index: score, label, acwr, consecutive, weeklyLoad, recommendation };
  }

  /* ─────────────────────────────────────────
     RECOVERY PREDICTION
  ───────────────────────────────────────── */

  /**
   * คาดการณ์ว่าต้องพักกี่วันถึงจะ fresh
   */
  function daysToRecovery(fatigueResult) {
    const { index } = fatigueResult;
    if (index <= 20) return 0;
    if (index <= 45) return 1;
    if (index <= 70) return 2;
    return 3;
  }

  /* ─────────────────────────────────────────
     WEEKLY LOAD TREND
  ───────────────────────────────────────── */

  /**
   * คำนวณ load รายสัปดาห์ย้อนหลัง N สัปดาห์
   * @returns {Array} [{ weekLabel, load, sessions }]
   */
  function weeklyLoadTrend(logs, weeks = 8) {
    const today  = new Date();
    const result = [];

    for (let w = weeks - 1; w >= 0; w--) {
      const mon = new Date(today);
      mon.setDate(today.getDate() - today.getDay() + 1 - w * 7);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      const monStr = mon.toISOString().split('T')[0];
      const sunStr = sun.toISOString().split('T')[0];

      const weekLogs = logs.filter(l => l.date >= monStr && l.date <= sunStr);
      const load     = weekLogs.reduce((s, l) => s + calcSessionLoad(l), 0);

      result.push({
        weekLabel: `W${weeks - w}`,
        weekStart: monStr,
        load:      Math.round(load),
        sessions:  weekLogs.length,
      });
    }

    return result;
  }

  /* ─────────────────────────────────────────
     SMART REST DAY SUGGESTION
  ───────────────────────────────────────── */

  /**
   * แนะนำว่าวันนี้ควรฝึกหรือพัก
   * @returns {'train'|'rest'|'light'} recommendation
   */
  function suggestToday(logs) {
    const fatigue = calcFatigueIndex(logs);

    if (fatigue.label === 'overload')  return 'rest';
    if (fatigue.label === 'tired')     return 'light';
    if (fatigue.consecutive >= CONFIG.maxConsecutive) return 'rest';
    return 'train';
  }

  /* ─────────────────────────────────────────
     SAVE SNAPSHOT TO STORAGE
  ───────────────────────────────────────── */

  async function saveSnapshot(logs) {
    try {
      const result   = calcFatigueIndex(logs);
      const snapshot = Schema.createFatigueSnapshot({
        date:            new Date().toISOString().split('T')[0],
        index:           result.index,
        label:           result.label,
        weeklyLoad:      result.weeklyLoad,
        consecutiveDays: result.consecutive,
      });
      await Storage.Fatigue.save(snapshot);
      return snapshot;
    } catch (err) {
      console.warn('[FatigueEngine] Could not save snapshot:', err);
      return null;
    }
  }

  /* ─────────────────────────────────────────
     PUBLIC API
  ───────────────────────────────────────── */
  return {
    calcFatigueIndex,
    calcACWR,
    calcConsecutiveDays,
    calcSessionLoad,
    weeklyLoadTrend,
    daysToRecovery,
    suggestToday,
    saveSnapshot,
  };

})();
/**
 * TACTICAL FITNESS — RANK ENGINE v1.0
 * ประเมินยศ + ตรวจสอบเงื่อนไขเลื่อนขั้น
 */

'use strict';

const RankEngine = (() => {

  /* ─────────────────────────────────────────
     CHECK RANK REQUIREMENTS
  ───────────────────────────────────────── */

  /**
   * ตรวจสอบว่า PR ผ่านเงื่อนไขของยศนั้นหรือไม่
   * @param {object} pr   - PRRecord
   * @param {object} rank - RANKS[n]
   * @returns {object}  { passed, details: [{exercise, required, current, met}] }
   */
  function checkRequirements(pr, rank) {
    if (!pr || !rank) return { passed: false, details: [] };

    const checks = [];

    const req = [
      { key: 'pushup', label: 'Push-up', value: pr.pushup?.value ?? 0 },
      { key: 'pullup', label: 'Pull-up', value: pr.pullup?.value ?? 0 },
      { key: 'plank',  label: 'Plank (วิ)',  value: pr.plank?.value ?? 0 },
    ];

    for (const { key, label, value } of req) {
      const required = rank[key] || 0;
      if (required === 0) continue;
      checks.push({ exercise: label, required, current: value, met: value >= required });
    }

    // Run tests (lower = better)
    if (rank.run2km) {
      const val = pr.run2km?.value;
      checks.push({
        exercise: 'วิ่ง 2km (วิ)',
        required: rank.run2km,
        current:  val || null,
        met:      val !== null && val <= rank.run2km,
      });
    }
    if (rank.run5km) {
      const val = pr.run5km?.value;
      checks.push({
        exercise: 'วิ่ง 5km (วิ)',
        required: rank.run5km,
        current:  val || null,
        met:      val !== null && val <= rank.run5km,
      });
    }

    const passed = checks.every(c => c.met);
    return { passed, details: checks };
  }

  /* ─────────────────────────────────────────
     EVALUATE CURRENT RANK FROM PR
  ───────────────────────────────────────── */

  /**
   * คำนวณยศที่ควรได้จาก PR ปัจจุบัน
   * @returns {number} rankIndex ที่สูงสุดที่ผ่านทุกเงื่อนไข
   */
  function evaluateRankFromPR(pr) {
    if (!pr) return 0;

    let highestPassed = 0;
    for (let i = 0; i < RANKS.length; i++) {
      const { passed } = checkRequirements(pr, RANKS[i]);
      if (passed) highestPassed = i;
      // removed early break — scan full array to find highest passing rank
    }
    return highestPassed;
  }

  /* ─────────────────────────────────────────
     CHECK PROMOTION
  ───────────────────────────────────────── */

  /**
   * ตรวจสอบว่าควรเลื่อนยศหรือไม่
   * @param {object} profile - UserProfile
   * @param {object} pr      - PRRecord
   * @param {object} logs    - all WorkoutLogs
   * @returns {object} { shouldPromote, newRankIndex, reason }
   */
  function checkPromotion(profile, pr, logs = []) {
    const currentIndex = profile?.rankIndex ?? 0;
    const nextIndex    = currentIndex + 1;

    if (nextIndex >= RANKS.length) {
      return { shouldPromote: false, reason: 'ถึงยศสูงสุดแล้ว' };
    }

    const nextRank = RANKS[nextIndex];
    const { passed, details } = checkRequirements(pr, nextRank);

    // Check extra conditions
    if (nextRank.extra) {
      const extraPassed = checkExtraCondition(nextRank.extra, profile, logs);
      if (!extraPassed) {
        return {
          shouldPromote: false,
          reason:        `ต้องผ่าน: ${nextRank.extra}`,
          details,
        };
      }
    }

    if (!passed) {
      const failed = details.filter(d => !d.met);
      return {
        shouldPromote: false,
        reason:        `ยังไม่ผ่านเงื่อนไข: ${failed.map(f => f.exercise).join(', ')}`,
        details,
      };
    }

    return {
      shouldPromote:  true,
      newRankIndex:   nextIndex,
      newRank:        nextRank,
      reason:         `ผ่านเงื่อนไขทั้งหมดของ ${nextRank.name}`,
      details,
    };
  }

  /* ─────────────────────────────────────────
     EXTRA CONDITIONS
  ───────────────────────────────────────── */

  function checkExtraCondition(extra, profile, logs) {
    if (!extra) return true;

    // "ฝึกครบ N วัน"
    const daysMatch = extra.match(/ฝึกครบ\s*(\d+)\s*วัน/);
    if (daysMatch) {
      const required = parseInt(daysMatch[1], 10);
      return (profile?.totalDaysActive ?? 0) >= required;
    }

    // "Consistency N วัน"
    const consistencyMatch = extra.match(/Consistency\s*(\d+)\s*วัน/);
    if (consistencyMatch) {
      const required = parseInt(consistencyMatch[1], 10);
      return (profile?.totalDaysActive ?? 0) >= required;
    }

    // "ผ่าน Tactical Test" — ต้องมี session type tactical
    if (extra.includes('Tactical Test')) {
      return logs.some(l => l.sessionType === 'tactical' || l.notes?.includes('tactical test'));
    }

    // "Elite Test"
    if (extra.includes('Elite Test')) {
      return logs.some(l => l.notes?.toLowerCase().includes('elite test'));
    }

    // "Master Evaluation"
    if (extra.includes('Master Evaluation')) {
      return logs.some(l => l.notes?.toLowerCase().includes('master evaluation'));
    }

    console.warn('[RankEngine] Unknown extra condition:', extra);
    return false; // unknown → fail-safe
  }

  /* ─────────────────────────────────────────
     PROMOTE
  ───────────────────────────────────────── */

  /**
   * เลื่อนยศและบันทึก
   * @returns {object} updated profile
   */
  async function promote(profile, newRankIndex) {
    try {
      const newRank = RANKS[newRankIndex];
      if (!newRank) throw new Error('Invalid rank index');

      const updated = await Storage.User.update({
        rankIndex:   newRankIndex,
        currentRank: newRank.name,
      });

      return updated;
    } catch (err) {
      console.warn(`[engines-common] ${err.message}`);
    }
  }

  /* ─────────────────────────────────────────
     PRESTIGE — reset at max rank
  ───────────────────────────────────────── */

  async function prestige(profile) {
    if ((profile?.rankIndex ?? 0) < RANKS.length - 1) {
      throw new Error('ต้องถึงยศสูงสุดก่อน prestige');
    }

    const stars = (profile.prestigeStars ?? 0) + 1;
    return Storage.User.update({
      rankIndex:     0,
      currentRank:   RANKS[0].name,
      prestigeStars: stars,
    });
  }

  /* ─────────────────────────────────────────
     PROGRESS TO NEXT RANK (%)
  ───────────────────────────────────────── */

  /**
   * คำนวณเปอร์เซ็นต์ความคืบหน้าไปยังยศถัดไป
   */
  function progressToNextRank(pr, currentIndex) {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= RANKS.length) return 100;

    const nextRank = RANKS[nextIndex];
    const { details } = checkRequirements(pr, nextRank);

    if (!details.length) return 100;

    // คำนวณ % เฉลี่ยของทุกเงื่อนไข
    let totalPct = 0;
    let count    = 0;

    for (const d of details) {
      if (!d.required) continue;
      count++;

      if (d.exercise.includes('วิ่ง') || d.exercise.includes('run')) {
        // สำหรับวิ่ง: ต่ำกว่า = ดีกว่า
        if (d.current == null) { totalPct += 0; continue; } // null/undefined only
        if (!d.current) { totalPct += 0; continue; } // guard division by zero
        const pct = Math.min(100, Math.round((d.required / d.current) * 100));
        totalPct += pct;
      } else {
        if (!d.required) { totalPct += 0; continue; } // guard division by zero
        const pct = Math.min(100, Math.round((d.current / d.required) * 100));
        totalPct += pct;
      }
    }

    return count ? Math.round(totalPct / count) : 0;
  }

  /* ─────────────────────────────────────────
     CAPABILITY SCORES
  ───────────────────────────────────────── */

  /**
   * แปลง PR เป็น capability score bars
   */
  function getCapabilityScores(pr) {
    if (!pr) return { strength: 0, endurance: 0, core: 0, total: 0 };
    return {
      strength:  pr.strengthScore  || 0,
      endurance: pr.enduranceScore || 0,
      core:      pr.coreScore      || 0,
      total:     pr.totalScore ?? 0,
    };
  }

  /* ─────────────────────────────────────────
     PUBLIC API
  ───────────────────────────────────────── */
  return {
    checkRequirements,
    evaluateRankFromPR,
    checkPromotion,
    promote,
    prestige,
    progressToNextRank,
    getCapabilityScores,
  };

})();
/**
 * TACTICAL FITNESS — MISSION ENGINE v1.0
 * ตรวจสอบความคืบหน้าภารกิจ + มอบเหรียญ
 */

'use strict';

const MissionEngine = (() => {

  /* ─────────────────────────────────────────
     UPDATE MISSION PROGRESS
  ───────────────────────────────────────── */

  /**
   * อัพเดต progress ของ mission จากข้อมูลล่าสุด
   * @param {object} mission
   * @param {object} context  { profile, pr, logs, medals }
   * @returns {object} updated mission
   */
  function updateProgress(mission, context) {
    if (!mission || mission.isCompleted) return mission;

    const { profile, pr, logs = [] } = context;
    let current = mission.current ?? 0;

    // New condition-based type system (Blueprint v3)
    const condType = mission.condition?.type || mission.type;

    switch (condType) {
      case 'streak':       current = profile?.currentStreak ?? 0; break;
      case 'total_days':   current = profile?.totalDaysActive ?? 0; break;
      case 'pushup_pr':    current = pr?.pushup?.value ?? 0; break;
      case 'pullup_pr':    current = pr?.pullup?.value ?? 0; break;
      case 'plank_pr':     current = pr?.plank?.value ?? 0; break;
      case 'run5km_pr':    current = pr?.run5km?.value || 9999; break;
      case 'run2km_pr':    current = pr?.run2km?.value || 9999; break;
      case 'rank_index':   current = profile?.rankIndex ?? 0; break;
      case 'prestige':     current = profile?.prestigeStars ?? 0; break;
      case 'session_count':current = logs.length; break;
      // Legacy
      case 'performance':  current = _getPerformanceValue(mission, pr); break;
      case 'volume':       current = logs.length; break;
      case 'consistency':  current = profile?.totalDaysActive ?? 0; break;
      case 'rank':         current = profile?.rankIndex ?? 0; break;
      default:             current = mission.current ?? 0;
    }

    return { ...mission, current };
  }

  /* ─────────────────────────────────────────
     GET PERFORMANCE VALUE FOR MISSION
  ───────────────────────────────────────── */

  function _getPerformanceValue(mission, pr) {
    if (!pr) return 0;

    const id = mission.id || '';

    if (id.includes('pushup') || mission.name?.toLowerCase().includes('push'))
      return pr.pushup?.value ?? 0;
    if (id.includes('pullup') || mission.name?.toLowerCase().includes('pull'))
      return pr.pullup?.value ?? 0;
    if (id.includes('plank') || mission.name?.toLowerCase().includes('plank'))
      return pr.plank?.value ?? 0;
    if (id.includes('situp') || mission.name?.toLowerCase().includes('sit'))
      return pr.situp?.value ?? 0;
    if (id.includes('5km') || mission.name?.toLowerCase().includes('5km')) {
      // สำหรับวิ่ง target คือ เวลาที่ต้องต่ำกว่า → ถ้า current <= target = ผ่าน
      // แต่ progress แสดงเป็น % → ใช้ inverted
      return pr.run5km?.value || 9999;
    }
    if (id.includes('2km') || mission.name?.toLowerCase().includes('2km'))
      return pr.run2km?.value || 9999;

    return 0;
  }

  /* ─────────────────────────────────────────
     CHECK COMPLETION
  ───────────────────────────────────────── */

  /**
   * ตรวจสอบว่า mission สำเร็จหรือไม่
   */
  function checkCompletion(mission) {
    if (mission.isCompleted) return true;
    const condType = mission.condition?.type || mission.type;
    const condTarget = mission.condition?.target ?? mission.target;
    const { current } = mission;
    // Running: lower is better
    if (condType === 'run5km_pr' || condType === 'run2km_pr') {
      return current !== null && current !== 9999 && current <= condTarget;
    }
    // Legacy running check
    if (mission.type === 'performance' && (mission.id?.includes('km') || mission.name?.toLowerCase().includes('km'))) {
      return current !== null && current !== 9999 && current <= condTarget;
    }
    return (current ?? 0) >= (condTarget ?? 0);
  }

  function calcProgressPct(mission) {
    const condType   = mission.condition?.type || mission.type;
    const condTarget = mission.condition?.target ?? mission.target;
    const { current } = mission;
    if (!condTarget) return 0;
    if (condType === 'run5km_pr' || condType === 'run2km_pr') {
      if (!current || current === 9999) return 0;
      return Math.min(100, Math.round((condTarget / current) * 100));
    }
    if (mission.type === 'performance' && (mission.id?.includes('km') || mission.name?.toLowerCase().includes('km'))) {
      if (!current || current === 9999) return 0;
      return Math.min(100, Math.round((condTarget / current) * 100));
    }
    return condTarget ? Math.min(100, Math.round(((current ?? 0) / condTarget) * 100)) : 0;
  }

  /* ─────────────────────────────────────────
     COMPLETE MISSION + AWARD MEDAL
  ───────────────────────────────────────── */

  /**
   * mark mission completed + award medal
   * @returns {{ mission, medal }} updated objects
   */
  async function completeMission(mission) {
    const fresh = await Storage.Missions.get(mission.id);
    if (fresh?.isCompleted) return { mission: fresh, medal: null };

    const today     = new Date().toISOString().split('T')[0];
    const completed = {
      ...fresh || mission,
      isCompleted:   true,
      isActive:      false,
      completedDate: today,
    };

    await Storage.Missions.save(completed); // atomic: fresh loaded above, isCompleted checked

    let awardedMedal = null;
    if (mission.rewardMedal) {
      try {
        const existing = await Storage.Medals.get(mission.rewardMedal);
        if (existing && !existing.isEarned) {
          awardedMedal = {
            ...existing,
            isEarned:   true,
            earnedDate: today,
          };
          await Storage.Medals.save(awardedMedal);
        }
      } catch (err) {
        console.warn('[MissionEngine] Medal award failed:', err);
      }
    }

    return { mission: completed, medal: awardedMedal };
  }

  /* ─────────────────────────────────────────
     INIT DEFAULT MISSIONS & MEDALS
  ───────────────────────────────────────── */

  /**
   * ตรวจสอบและสร้าง default missions/medals ถ้ายังไม่มี
   */
  async function initDefaults() {
    try {
      const existing = await Storage.Missions.getAll();
      const existingIds = new Set(existing.map(m => m.id));

      // Add missing default missions
      for (const template of DEFAULT_MISSIONS) {
        if (!existingIds.has(template.id)) {
          await Storage.Missions.save({
            ...Schema.createMission(template),
            isActive: false, // ไม่ start อัตโนมัติ
          });
        }
      }

      // Add missing medals
      const existingMedals   = await Storage.Medals.getAll();
      const existingMedalIds = new Set(existingMedals.map(m => m.id));

      for (const template of DEFAULT_MEDALS) {
        if (!existingMedalIds.has(template.id)) {
          await Storage.Medals.save({
            ...Schema.createMedal(template),
            id: template.id,
          });
        }
      }
    } catch (err) {
      console.warn('[MissionEngine] initDefaults failed:', err);
    }
  }

  /* ─────────────────────────────────────────
     RUN ALL ACTIVE MISSIONS
  ───────────────────────────────────────── */

  /**
    try {
      const activeMissions = await Storage.Missions.getActive();
      const newlyCompleted = [];

      for (const mission of activeMissions) {
        const updated = updateProgress(mission, context);
        const done    = checkCompletion(updated);

        if (done) {
          const { mission: completed, medal } = await completeMission(updated);
          newlyCompleted.push({ mission: completed, medal });
        } else if (updated.current !== mission.current) {
          await Storage.Missions.save(updated);
        }
      }

      return newlyCompleted;
    } catch (err) {
      console.warn(`[engines-common] ${err.message}`);
    }
      }
    }

    try {
      const mission = await Storage.Missions.get(missionId);
      if (!mission) throw new Error(`Mission ${missionId} not found`);
      if (mission.isActive)    throw new Error('Mission already active');
      if (mission.isCompleted) throw new Error('Mission already completed');

      const started = {
        ...mission,
        isActive:  true,
        startDate: new Date().toISOString().split('T')[0],
        current:   0,
      };
      await Storage.Missions.save(started);
      return started;
    } catch (err) {
      console.warn(`[engines-common] ${err.message}`);
    }
    const started = {
      ...mission,
      isActive:  true,
    try {
      const mission = await Storage.Missions.get(missionId);
      if (!mission) throw new Error(`Mission ${missionId} not found`);

      const abandoned = { ...mission, isActive: false, current: 0 };
      await Storage.Missions.save(abandoned);
      return abandoned;
    } catch (err) {
      console.warn(`[engines-common] ${err.message}`);
    }

  /* ─────────────────────────────────────────
     ABANDON MISSION
  ───────────────────────────────────────── */

  async function abandonMission(missionId) {
    try {
      const mission = await Storage.Missions.get(missionId);
      if (!mission) throw new Error(`Mission ${missionId} not found`);

      const abandoned = { ...mission, isActive: false, current: 0 };
      await Storage.Missions.save(abandoned);
      return abandoned;
  
    } catch (err) {
      console.warn(`[abandonMission] ${err.message}`);
    }
  }

  /* ─────────────────────────────────────────
     PUBLIC API
  ───────────────────────────────────────── */
  return {
    updateProgress,
    checkCompletion,
    calcProgressPct,
    completeMission,
    initDefaults,
    runChecks,
    startMission,
    abandonMission,
  };

})();
