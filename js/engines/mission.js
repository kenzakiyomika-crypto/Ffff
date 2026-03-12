/**
 * TACTICAL FITNESS — MISSION ENGINE v1.0
 * ตรวจสอบความคืบหน้าภารกิจ + มอบเหรียญ
 */

'use strict';
if (typeof DEFAULT_MISSIONS === 'undefined') throw new Error('[MissionEngine] DEFAULT_MISSIONS not loaded — check script load order');

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
    return (current ?? 0) >= (condTarget ?? 0); // nullish: 0 is a valid target
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
    // Reload from storage first to prevent race condition / double-award
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
   * ตรวจสอบและอัพเดต missions ทั้งหมดที่ active
   * @returns {Array} newly completed missions
   */
  async function runChecks(context) {
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
      console.warn(`[mission] ${err.message}`);
    }
  }

  /* ─────────────────────────────────────────
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
      console.warn(`[mission] ${err.message}`);
    }
      current:   0,
    };
    await Storage.Missions.save(started);
    try {
      const mission = await Storage.Missions.get(missionId);
      if (!mission) throw new Error(`Mission ${missionId} not found`);

      const abandoned = { ...mission, isActive: false, current: 0 };
      await Storage.Missions.save(abandoned);
      return abandoned;
    } catch (err) {
      console.warn(`[mission] ${err.message}`);
    }

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

/* ── v14 Additions: atomic reward pattern ── */
MissionEngine.processRewards = (oldMissions, newMissions) => {
  const rewardBatch = [];
  const oldMap = new Map(oldMissions.map(m => [m.id, m])); // id-keyed map — safe against reordering
  const updatedMissions = newMissions.map((newM) => {
    const oldM = oldMap.get(newM.id);
    if (newM.isCompleted && !oldM?.isCompleted && !newM.rewardClaimed) {
      rewardBatch.push({ missionId: newM.id, xp: newM.rewardMedal ? 100 : 50, label: newM.name });
      return { ...newM, rewardClaimed: true };
    }
    return newM;
  });
  return { rewardBatch, updatedMissions };
};

MissionEngine.emitRewards = (rewardBatch) => {
  if (typeof GameEventBus === 'undefined') return;
  for (const r of rewardBatch) {
    GameEventBus.emit(GameEventBus.EVENTS.MISSION_COMPLETED, r);
  }
};
