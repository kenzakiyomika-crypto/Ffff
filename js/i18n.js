'use strict';
const I18n = (() => {
  let _lang = (() => {
    try { return JSON.parse(localStorage.getItem('tf_prefs')||'{}').lang || 'th'; } catch(e){ return 'th'; }
  })();

  const DICT = {
    th: {
      'nav.system':'// ระบบ','nav.dashboard':'ศูนย์บัญชาการ','nav.training':'ฝึกวันนี้',
      'nav.planner':'ตารางรายเดือน','nav.analyze':'// วิเคราะห์','nav.intel':'ศูนย์วิเคราะห์',
      'nav.progress':'// ความก้าวหน้า','nav.performance':'บันทึกผลการฝึก','nav.rank':'ยศ & ความสามารถ',
      'nav.missions':'ภารกิจ & เหรียญ','nav.skilltree':'ต้นไม้ทักษะ','nav.settings':'ตั้งค่า',
      'nav.importexport':'นำเข้า / ส่งออก',
      'bnav.overview':'หน้าหลัก','bnav.today':'ฝึก','bnav.progress':'ผล','bnav.goals':'เป้าหมาย','bnav.me':'ฉัน',
      'plan.title':'ตาราง รายเดือน','plan.save':'💾 บันทึก','plan.save_day':'✓ SAVE DAY',
      'plan.training_days':'// TRAINING DAYS PER WEEK','plan.program_type':'// PROGRAM TYPE',
      'plan.prog_fullbody':'Full Body 3x/week','plan.prog_ul':'Upper / Lower Split',
      'plan.prog_ppl':'Push / Pull / Legs','plan.prog_cs':'Strength + Cardio',
      'set.save_btn':'💾 บันทึก','set.display':'// การแสดงผล','set.language':'ภาษาของ interface',
      'set.lang_th':'ภาษาไทย','set.lang_en':'English',
    },
    en: {
      'nav.system':'// SYSTEM','nav.dashboard':'Command Center','nav.training':'Train Today',
      'nav.planner':'Monthly Planner','nav.analyze':'// ANALYZE','nav.intel':'Intel Center',
      'nav.progress':'// PROGRESS','nav.performance':'Performance Log','nav.rank':'Rank & Abilities',
      'nav.missions':'Missions & Medals','nav.skilltree':'Skill Tree','nav.settings':'Settings',
      'nav.importexport':'Import / Export',
      'bnav.overview':'Home','bnav.today':'Train','bnav.progress':'Results','bnav.goals':'Goals','bnav.me':'Me',
      'plan.title':'Monthly Planner','plan.save':'💾 Save','plan.save_day':'✓ SAVE DAY',
      'plan.training_days':'// TRAINING DAYS PER WEEK','plan.program_type':'// PROGRAM TYPE',
      'plan.prog_fullbody':'Full Body 3x/week','plan.prog_ul':'Upper / Lower Split',
      'plan.prog_ppl':'Push / Pull / Legs','plan.prog_cs':'Strength + Cardio',
      'set.save_btn':'💾 Save','set.display':'// DISPLAY','set.language':'Interface Language',
      'set.lang_th':'Thai','set.lang_en':'English',
    }
  };

  function apply() {
    const d = DICT[_lang] || DICT.th;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (d[key] !== undefined) el.textContent = d[key];
    });
    document.documentElement.lang = _lang;
    // Update lang toggle buttons
    document.querySelectorAll('[data-lang-btn]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.langBtn === _lang);
    });
    // Dispatch event for pages listening
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: _lang } }));
  }

  function setLang(lang) {
    _lang = lang;
    try {
      const prefs = JSON.parse(localStorage.getItem('tf_prefs') || '{}');
      prefs.lang = lang;
      localStorage.setItem('tf_prefs', JSON.stringify(prefs));
    } catch(e) {}
  }

  function getLang() { return _lang; }
  function t(key, fallback) { return (DICT[_lang]||{})[key] || (DICT.th||{})[key] || fallback || key; }

  // Auto-apply on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }

  return { apply, setLang, getLang, t };
})();
