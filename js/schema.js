/**
 * TACTICAL FITNESS — DATA SCHEMA v1.0
 * Single source of truth for all data structures
 * Used by Storage, Engines, and UI layers
 */

'use strict';

const Schema = {

  /* ─────────────────────────────────────────
     USER PROFILE
  ───────────────────────────────────────── */
  createUserProfile: (data = {}) => ({
    id: 'user_profile',
    version: '1.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),

    // Identity
    callsign: data.callsign || 'OPERATOR',
    gender: data.gender || 'male',           // 'male' | 'female'
    age: data.age || 25,
    weight: data.weight || 70,               // kg
    height: data.height || 170,             // cm

    // Fitness Level
    fitnessLevel: data.fitnessLevel || 'beginner', // 'beginner' | 'intermediate' | 'advanced'
    trainingDaysPerWeek: data.trainingDaysPerWeek || 3,
    preferredTime: data.preferredTime || 'morning', // 'morning' | 'afternoon' | 'evening'

    // Rank System
    currentRank: data.currentRank || 'พลเรือน',
    rankIndex: data.rankIndex ?? 0,          // 0–20
    prestigeStars: data.prestigeStars ?? 0,

    // Career Path (unlocked at ร้อยตรี)
    careerPath: data.careerPath || null,     // 'assault' | 'recon' | 'tactical' | 'instructor'

    // Stats tracking
    totalDaysActive: data.totalDaysActive ?? 0,
    currentStreak: data.currentStreak || 0,
    longestStreak: data.longestStreak || 0,
    lastTrainedDate: data.lastTrainedDate || null,

    // Onboarding
    onboardingComplete: data.onboardingComplete || false,
    onboardingStep: data.onboardingStep || 0,
  }),

  /* ─────────────────────────────────────────
     PERFORMANCE RECORDS (PR)
  ───────────────────────────────────────── */
  createPRRecord: () => ({
    id: 'pr_record',
    updatedAt: Date.now(),

    pushup: { value: 0, date: null, history: [] },
    pullup: { value: 0, date: null, history: [] },
    plank:  { value: 0, date: null, history: [] },   // seconds
    situp:  { value: 0, date: null, history: [] },
    run2km: { value: null, date: null, history: [] }, // seconds (lower = better)
    run3km: { value: null, date: null, history: [] }, // seconds (lower = better)
    run5km: { value: null, date: null, history: [] }, // seconds

    // Calculated scores
    strengthScore:  0,
    enduranceScore: 0,
    coreScore:      0,
    totalScore:     0,
  }),

  /* ─────────────────────────────────────────
     WORKOUT LOG (per session)
  ───────────────────────────────────────── */
  createWorkoutLog: (data = {}) => ({
    id: `log_${Date.now()}`,
    date: data.date || new Date().toISOString().split('T')[0], // YYYY-MM-DD
    dayOfWeek: data.dayOfWeek || new Date().getDay(),
    sessionType: data.sessionType || 'full',  // 'full' | 'quick'
    focus: data.focus || 'Full Body',

    startTime: data.startTime || null,
    endTime: data.endTime || null,
    durationMinutes: data.durationMinutes || 0,

    exercises: data.exercises || [],          // array of ExerciseLog
    completionPct: data.completionPct || 0,
    notes: data.notes || '',

    // Fatigue snapshot at time of session
    fatigueAtStart: data.fatigueAtStart || 0,
    volumeLoad: data.volumeLoad ?? 0,         // Sets × Reps × WeightFactor
  }),

  /* ─────────────────────────────────────────
     EXERCISE LOG (inside WorkoutLog)
  ───────────────────────────────────────── */
  createExerciseLog: (data = {}) => ({
    name: data.name || '',
    type: data.type || 'repetition',         // 'repetition' | 'timed' | 'distance'
    sets: data.sets || 0,
    reps: data.reps || 0,                    // per set (repetition type)
    duration: data.duration || 0,            // seconds (timed type)
    distance: data.distance || 0,            // meters (distance type)
    rest: data.rest || 60,                   // seconds between sets
    completed: data.completed || false,
    actualReps: data.actualReps || [],       // actual reps per set [15,14,13]
    actualDuration: data.actualDuration || 0,
  }),

  /* ─────────────────────────────────────────
     FATIGUE SNAPSHOT (daily)
  ───────────────────────────────────────── */
  createFatigueSnapshot: (data = {}) => ({
    id: `fatigue_${data.date || new Date().toISOString().split('T')[0]}`,
    date: data.date || new Date().toISOString().split('T')[0],
    index: data.index ?? 0,                  // 0–100
    label: data.label || 'fresh',            // 'fresh' | 'moderate' | 'overload'
    weeklyLoad: data.weeklyLoad || 0,
    consecutiveDays: data.consecutiveDays || 0,
    restHours: data.restHours || 8,
  }),

  /* ─────────────────────────────────────────
     MONTHLY PLAN (one month)
  ───────────────────────────────────────── */
  createMonthlyPlan: (data = {}) => ({
    id: `plan_${data.year}_${data.month}`,
    year: data.year || new Date().getFullYear(),
    month: data.month || new Date().getMonth() + 1, // 1–12
    createdAt: Date.now(),

    weeks: data.weeks || [],                 // array of WeekPlan
    totalSessions: data.totalSessions || 0,
    completedSessions: data.completedSessions || 0,
  }),

  /* ─────────────────────────────────────────
     WEEK PLAN (inside MonthlyPlan)
  ───────────────────────────────────────── */
  createWeekPlan: (data = {}) => ({
    weekNumber: data.weekNumber || 1,
    days: {
      0: data.days?.[0] || null, // Sun
      1: data.days?.[1] || null, // Mon
      2: data.days?.[2] || null, // Tue
      3: data.days?.[3] || null, // Wed
      4: data.days?.[4] || null, // Thu
      5: data.days?.[5] || null, // Fri
      6: data.days?.[6] || null, // Sat
    },
  }),

  /* ─────────────────────────────────────────
     DAY SESSION (inside WeekPlan.days)
     null = rest day
  ───────────────────────────────────────── */
  createDaySession: (data = {}) => ({
    focus: data.focus || 'Full Body',
    exercises: data.exercises || [],         // array of Exercise template
    isRest: data.isRest || false,
    isCompleted: data.isCompleted || false,
    volumeMultiplier: data.volumeMultiplier || 1.0, // for progressive overload
  }),

  /* ─────────────────────────────────────────
     EXERCISE TEMPLATE (in plan, not log)
  ───────────────────────────────────────── */
  createExercise: (data = {}) => ({
    name: data.name || '',
    type: data.type || 'repetition',
    sets: data.sets || 3,
    reps: data.reps || 10,
    duration: data.duration || 60,          // seconds
    rest: data.rest || 60,
    muscleGroup: data.muscleGroup || 'full', // 'upper'|'lower'|'core'|'full'|'cardio'
  }),

  /* ─────────────────────────────────────────
     MISSION
  ───────────────────────────────────────── */
  createMission: (data = {}) => ({
    id: data.id || `mission_${Date.now()}`,
    name: data.name || '',
    description: data.description || '',
    type: data.type || 'streak',            // 'streak' | 'performance' | 'volume' | 'test'
    icon: data.icon || '⚔',

    target: data.target || 30,              // depends on type
    current: data.current ?? 0,
    startDate: data.startDate || new Date().toISOString().split('T')[0],
    endDate: data.endDate || null,

    isActive: data.isActive || true,
    isCompleted: data.isCompleted || false,
    completedDate: data.completedDate || null,
    rewardMedal: data.rewardMedal || null,
  }),

  /* ─────────────────────────────────────────
     MEDAL
  ───────────────────────────────────────── */
  createMedal: (data = {}) => ({
    id: data.id || '',
    name: data.name || '',
    description: data.description || '',
    icon: data.icon || '🏅',
    earnedDate: data.earnedDate || null,
    isEarned: data.isEarned || false,
  }),

  /* ─────────────────────────────────────────
     APP STATE (meta, not user data)
  ───────────────────────────────────────── */
  createAppState: () => ({
    id: 'app_state',
    version: '1.0',
    firstLaunch: Date.now(),
    lastOpened: Date.now(),
    activeScreen: 'onboarding',
    theme: 'dark',
  }),

};

/* ─────────────────────────────────────────
   RANK TABLE (21 levels)
───────────────────────────────────────── */
const RANKS = [
  { index: 0,  name: 'พลเรือน',              tier: 'civilian',    pushup: 0,   pullup: 0,  plank: 0,    run2km: null,  run5km: null,  extra: 'เริ่มต้นระบบ' },
  { index: 1,  name: 'พลทหาร',              tier: 'enlisted',    pushup: 15,  pullup: 0,  plank: 60,   run2km: 840,   run5km: null,  extra: 'ฝึกครบ 7 วัน' },
  { index: 2,  name: 'สิบตรี',               tier: 'enlisted',    pushup: 20,  pullup: 3,  plank: 90,   run2km: 780,   run5km: null,  extra: null },
  { index: 3,  name: 'สิบโท',               tier: 'enlisted',    pushup: 30,  pullup: 5,  plank: 120,  run2km: 720,   run5km: null,  extra: null },
  { index: 4,  name: 'สิบเอก',              tier: 'enlisted',    pushup: 40,  pullup: 8,  plank: 150,  run2km: 660,   run5km: null,  extra: null },
  { index: 5,  name: 'จ่าสิบตรี',            tier: 'nco',         pushup: 50,  pullup: 10, plank: 180,  run2km: null,  run5km: 1560,  extra: null },
  { index: 6,  name: 'จ่าสิบโท',            tier: 'nco',         pushup: 55,  pullup: 12, plank: 200,  run2km: null,  run5km: 1440,  extra: null },
  { index: 7,  name: 'จ่าสิบเอก',           tier: 'nco',         pushup: 60,  pullup: 15, plank: 240,  run2km: null,  run5km: 1380,  extra: null },
  { index: 8,  name: 'จ่าสิบเอกพิเศษ',      tier: 'nco',         pushup: 65,  pullup: 18, plank: 260,  run2km: null,  run5km: 1320,  extra: null },
  { index: 9,  name: 'จ่าสิบเอกพิเศษ (อาวุโส)', tier: 'nco',    pushup: 70,  pullup: 20, plank: 300,  run2km: null,  run5km: 1260,  extra: 'ฝึกครบ 180 วัน' },
  { index: 10, name: 'ร้อยตรี',             tier: 'officer',     pushup: 75,  pullup: 22, plank: 320,  run2km: null,  run5km: 1200,  extra: 'ผ่าน Tactical Test' },
  { index: 11, name: 'ร้อยโท',             tier: 'officer',     pushup: 80,  pullup: 25, plank: 350,  run2km: null,  run5km: 1140,  extra: null },
  { index: 12, name: 'ร้อยเอก',            tier: 'officer',     pushup: 85,  pullup: 28, plank: 400,  run2km: null,  run5km: 1080,  extra: null },
  { index: 13, name: 'พันตรี',             tier: 'officer',     pushup: 90,  pullup: 30, plank: 420,  run2km: null,  run5km: 1020,  extra: null },
  { index: 14, name: 'พันโท',             tier: 'officer',     pushup: 95,  pullup: 32, plank: 450,  run2km: null,  run5km: 960,   extra: null },
  { index: 15, name: 'พันเอก',            tier: 'officer',     pushup: 100, pullup: 35, plank: 480,  run2km: null,  run5km: 900,   extra: null },
  { index: 16, name: 'พันเอกพิเศษ',       tier: 'officer',     pushup: 110, pullup: 38, plank: 500,  run2km: null,  run5km: 840,   extra: null },
  { index: 17, name: 'พลตรี',            tier: 'general',     pushup: 120, pullup: 40, plank: 520,  run2km: null,  run5km: 780,   extra: 'Consistency 300 วัน' },
  { index: 18, name: 'พลโท',            tier: 'general',     pushup: 130, pullup: 42, plank: 550,  run2km: null,  run5km: 720,   extra: null },
  { index: 19, name: 'พลเอก',           tier: 'general',     pushup: 140, pullup: 45, plank: 600,  run2km: null,  run5km: 660,   extra: 'Elite Test' },
  { index: 20, name: 'พลเอกพิเศษ',      tier: 'general',     pushup: 150, pullup: 50, plank: 720,  run2km: null,  run5km: 600,   extra: 'Master Evaluation' },
];

/* ─────────────────────────────────────────
   DEFAULT EXERCISE LIBRARY
───────────────────────────────────────── */
const EXERCISE_LIBRARY = {
  upper: [
    { name: 'Push-up',         type: 'repetition', sets: 4, reps: 15, rest: 60,  muscleGroup: 'upper' },
    { name: 'Pike Push-up',    type: 'repetition', sets: 3, reps: 12, rest: 60,  muscleGroup: 'upper' },
    { name: 'Diamond Push-up', type: 'repetition', sets: 3, reps: 10, rest: 60,  muscleGroup: 'upper' },
    { name: 'Dip',             type: 'repetition', sets: 3, reps: 10, rest: 90,  muscleGroup: 'upper' },
  ],
  pull: [
    { name: 'Pull-up',         type: 'repetition', sets: 4, reps: 8,  rest: 90,  muscleGroup: 'upper' },
    { name: 'Chin-up',         type: 'repetition', sets: 3, reps: 8,  rest: 90,  muscleGroup: 'upper' },
    { name: 'Inverted Row',    type: 'repetition', sets: 3, reps: 12, rest: 60,  muscleGroup: 'upper' },
  ],
  core: [
    { name: 'Plank',           type: 'timed',      sets: 3, duration: 60,  rest: 60,  muscleGroup: 'core' },
    { name: 'Sit-up',          type: 'repetition', sets: 3, reps: 20, rest: 45,  muscleGroup: 'core' },
    { name: 'Leg Raise',       type: 'repetition', sets: 3, reps: 15, rest: 45,  muscleGroup: 'core' },
    { name: 'Mountain Climber',type: 'timed',      sets: 3, duration: 30,  rest: 30,  muscleGroup: 'core' },
  ],
  lower: [
    { name: 'Squat',           type: 'repetition', sets: 4, reps: 15, rest: 60,  muscleGroup: 'lower' },
    { name: 'Lunge',           type: 'repetition', sets: 3, reps: 12, rest: 60,  muscleGroup: 'lower' },
    { name: 'Step-up',         type: 'repetition', sets: 3, reps: 12, rest: 45,  muscleGroup: 'lower' },
    { name: 'Calf Raise',      type: 'repetition', sets: 3, reps: 20, rest: 30,  muscleGroup: 'lower' },
  ],
  cardio: [
    { name: 'วิ่ง 2km',         type: 'distance',   sets: 1, distance: 2000, rest: 0, muscleGroup: 'cardio' },
    { name: 'วิ่ง 3km',         type: 'distance',   sets: 1, distance: 3000, rest: 0, muscleGroup: 'cardio' },
    { name: 'วิ่ง 5km',         type: 'distance',   sets: 1, distance: 5000, rest: 0, muscleGroup: 'cardio' },
    { name: 'Burpee',           type: 'repetition', sets: 3, reps: 10, rest: 60,  muscleGroup: 'cardio' },
  ],
};

/* ─────────────────────────────────────────
   DEFAULT MISSIONS
───────────────────────────────────────── */
const DEFAULT_MISSIONS = [
  // ── STREAK MISSIONS ──
  { id: 'iron_discipline_30',  name: '30-Day Iron Discipline',      description: 'ฝึกติดต่อกัน 30 วัน',             type: 'streak',       icon: '⚔',  target: 30,   rewardMedal: 'iron_discipline'      },
  { id: 'ironbound_60',        name: 'Ironbound — 60 Days',         description: 'ฝึกติดต่อกัน 60 วัน',             type: 'streak',       icon: '🔗',  target: 60,   rewardMedal: 'streak_60'            },
  { id: 'century_soldier',     name: 'Century Soldier',             description: 'ฝึกติดต่อกัน 100 วัน',            type: 'streak',       icon: '💯',  target: 100,  rewardMedal: 'streak_100'           },
  { id: 'mission_365',         name: '365 Days Discipline',         description: 'ฝึกรวม 365 วัน',                  type: 'total_days',   icon: '🎀',  target: 365,  rewardMedal: 'ribbon_365'           },
  { id: 'veteran_500',         name: 'Veteran — 500 Days',          description: 'ฝึกรวม 500 วัน',                  type: 'total_days',   icon: '🗓️', target: 500,  rewardMedal: 'badge_500'            },

  // ── PUSH-UP MISSIONS ──
  { id: 'pushup_mission_50',   name: 'Push-up Initiate',            description: 'Push-up PR ≥ 50 ครั้ง',           type: 'pushup_pr',    icon: '💪',  target: 50,   rewardMedal: 'pushup_50'            },
  { id: 'pushup_mission_100',  name: 'Centurion Push-up',           description: 'Push-up PR ≥ 100 ครั้ง',          type: 'pushup_pr',    icon: '🔥',  target: 100,  rewardMedal: 'pushup_100'           },
  { id: 'pushup_mission_150',  name: 'Push-up Master',              description: 'Push-up PR ≥ 150 ครั้ง',          type: 'pushup_pr',    icon: '🦾',  target: 150,  rewardMedal: 'pushup_150'           },

  // ── PULL-UP MISSIONS ──
  { id: 'first_pullup_mission',name: 'First Pull-up',               description: 'ดึงข้อได้ครั้งแรกสำเร็จ',          type: 'pullup_pr',    icon: '🏅',  target: 1,    rewardMedal: 'first_pullup'         },
  { id: 'pullup_mission_10',   name: 'Pull-up Warrior',             description: 'Pull-up PR ≥ 10 ครั้ง',           type: 'pullup_pr',    icon: '💪',  target: 10,   rewardMedal: 'pullup_10'            },
  { id: 'pullup_mission_20',   name: 'Pull-up Elite',               description: 'Pull-up PR ≥ 20 ครั้ง',           type: 'pullup_pr',    icon: '🦅',  target: 20,   rewardMedal: 'pullup_20'            },

  // ── CORE MISSIONS ──
  { id: 'iron_core_3min',      name: 'Iron Core — 3 Min',           description: 'Plank PR ≥ 3 นาที',               type: 'plank_pr',     icon: '🛡',  target: 180,  rewardMedal: 'iron_core_badge'      },
  { id: 'iron_core_5min',      name: 'Iron Core — 5 Min',           description: 'Plank PR ≥ 5 นาที',               type: 'plank_pr',     icon: '🏆',  target: 300,  rewardMedal: 'plank_5min'           },

  // ── RUNNING MISSIONS ──
  { id: 'endurance_5km',       name: '5KM Under 30 Min',            description: 'วิ่ง 5km < 30 นาที',              type: 'run5km_pr',    icon: '🕐',  target: 1800, rewardMedal: 'sub30_5km'            },
  { id: 'endurance_5km_25',    name: '5KM Under 25 Min',            description: 'วิ่ง 5km < 25 นาที',              type: 'run5km_pr',    icon: '🥇',  target: 1500, rewardMedal: 'sub25_5km'            },
  { id: 'endurance_5km_22',    name: '5KM Endurance Push',          description: 'วิ่ง 5km < 22 นาที',              type: 'run5km_pr',    icon: '🏅',  target: 1320, rewardMedal: 'medal_of_endurance'   },
  { id: 'endurance_5km_20',    name: '5KM Sub-20 Elite',            description: 'วิ่ง 5km < 20 นาที',              type: 'run5km_pr',    icon: '⚡',  target: 1200, rewardMedal: 'sub20_5km'            },
];

/* ─────────────────────────────────────────
   DEFAULT MEDALS  (52 medals — Blueprint v3)
   condition types:
     streak        : currentStreak >= target
     total_days    : totalDaysActive >= target
     pushup_pr     : pr.pushup.value >= target
     pullup_pr     : pr.pullup.value >= target
     plank_pr      : pr.plank.value >= target (seconds)
     run5km_pr     : pr.run5km.value <= target (seconds, lower=better)
     run2km_pr     : pr.run2km.value <= target
     rank_index    : rankIndex >= target
     prestige      : prestigeStars >= target
     session_count : totalSessions >= target
───────────────────────────────────────── */
const DEFAULT_MEDALS = [

  // ── STREAK & CONSISTENCY ──────────────────────────────────
  { id: 'iron_discipline',      name: 'Iron Discipline',            icon: '🎖',  category: 'consistency', description: 'ฝึกครบ 30 วัน',          condition: { type: 'streak',      target: 30  } },
  { id: 'streak_60',            name: 'Ironbound — 60 Days',        icon: '🔗',  category: 'consistency', description: 'ฝึกติดต่อกัน 60 วัน',     condition: { type: 'streak',      target: 60  } },
  { id: 'streak_100',           name: 'Century Soldier',            icon: '💯',  category: 'consistency', description: 'ฝึกติดต่อกัน 100 วัน',    condition: { type: 'streak',      target: 100 } },
  { id: 'ribbon_365',           name: '365 Days Discipline',        icon: '🎀',  category: 'consistency', description: 'ฝึกรวม 365 วัน',           condition: { type: 'total_days',  target: 365 } },
  { id: 'badge_500',            name: 'Veteran — 500 Days',         icon: '🗓️', category: 'consistency', description: 'ฝึกรวม 500 วัน',           condition: { type: 'total_days',  target: 500 } },
  { id: 'eternal_1000',         name: 'Eternal Soldier — 1000 Days',icon: '🌟',  category: 'consistency', description: 'ฝึกรวม 1,000 วัน',         condition: { type: 'total_days',  target: 1000} },
  { id: 'death_before_dishonor',name: 'Death Before Dishonor',      icon: '💀',  category: 'consistency', description: 'ฝึกครบ 365 วันไม่ขาดเลย', condition: { type: 'streak',      target: 365 } },
  { id: 'iron_will_365',        name: 'Iron Will — 365 Day Badge',  icon: '⭐',  category: 'consistency', description: 'ฝึกรวม 365 วัน',           condition: { type: 'total_days',  target: 365 } },

  // ── PUSH-UP ───────────────────────────────────────────────
  { id: 'pushup_50',            name: 'Push-up Initiate',           icon: '💪',  category: 'pushup',      description: 'Push-up ≥ 50 ครั้ง',       condition: { type: 'pushup_pr',   target: 50  } },
  { id: 'pushup_75',            name: 'Push-up Specialist',         icon: '🏋️', category: 'pushup',      description: 'Push-up ≥ 75 ครั้ง',       condition: { type: 'pushup_pr',   target: 75  } },
  { id: 'pushup_100',           name: 'Centurion Push-up',          icon: '🔥',  category: 'pushup',      description: 'Push-up ≥ 100 ครั้ง',      condition: { type: 'pushup_pr',   target: 100 } },
  { id: 'pushup_150',           name: 'Push-up Master',             icon: '🦾',  category: 'pushup',      description: 'Push-up ≥ 150 ครั้ง',      condition: { type: 'pushup_pr',   target: 150 } },

  // ── PULL-UP ───────────────────────────────────────────────
  { id: 'first_pullup',         name: 'First Pull-up Badge',        icon: '🏅',  category: 'pullup',      description: 'ดึงข้อได้ครั้งแรก',        condition: { type: 'pullup_pr',   target: 1   } },
  { id: 'pullup_10',            name: 'Pull-up Warrior',            icon: '💪',  category: 'pullup',      description: 'Pull-up ≥ 10 ครั้ง',       condition: { type: 'pullup_pr',   target: 10  } },
  { id: 'pullup_20',            name: 'Pull-up Elite',              icon: '🦅',  category: 'pullup',      description: 'Pull-up ≥ 20 ครั้ง',       condition: { type: 'pullup_pr',   target: 20  } },
  { id: 'pullup_30',            name: 'Iron Grip Master',           icon: '⚙️', category: 'pullup',      description: 'Pull-up ≥ 30 ครั้ง',       condition: { type: 'pullup_pr',   target: 30  } },

  // ── PLANK & CORE ──────────────────────────────────────────
  { id: 'iron_core_badge',      name: 'Iron Core Badge',            icon: '🛡',  category: 'core',        description: 'Plank > 3 นาที',            condition: { type: 'plank_pr',    target: 180 } },
  { id: 'plank_5min',           name: 'Iron Core — 5 Min',          icon: '🏆',  category: 'core',        description: 'Plank ≥ 5 นาที',            condition: { type: 'plank_pr',    target: 300 } },
  { id: 'plank_10min',          name: 'Steel Core',                 icon: '💎',  category: 'core',        description: 'Plank ≥ 10 นาที',           condition: { type: 'plank_pr',    target: 600 } },

  // ── ENDURANCE / RUNNING ───────────────────────────────────
  { id: 'medal_of_endurance',   name: 'Medal of Endurance',         icon: '🏅',  category: 'run',         description: 'วิ่ง 5km < 22 นาที',       condition: { type: 'run5km_pr',   target: 1320} },
  { id: 'sub30_5km',            name: 'Sub-30 5km Medal',           icon: '🕐',  category: 'run',         description: 'วิ่ง 5km < 30 นาที',       condition: { type: 'run5km_pr',   target: 1800} },
  { id: 'sub25_5km',            name: 'Sub-25 5km Medal',           icon: '🥇',  category: 'run',         description: 'วิ่ง 5km < 25 นาที',       condition: { type: 'run5km_pr',   target: 1500} },
  { id: 'sub20_5km',            name: 'Sub-20 5km Elite',           icon: '⚡',  category: 'run',         description: 'วิ่ง 5km < 20 นาที',       condition: { type: 'run5km_pr',   target: 1200} },
  { id: 'cooper_gold',          name: 'Cooper Test Gold',           icon: '⏱️', category: 'run',         description: 'วิ่ง 12 นาที ≥ 2,800m',   condition: { type: 'run5km_pr',   target: 1200} },
  { id: 'army_apft_gold',       name: 'Army APFT Gold',             icon: '🦁',  category: 'run',         description: 'Push-up 77+ & วิ่ง 5km <24m', condition: { type: 'run5km_pr', target: 1440} },
  { id: 'navy_seal_pt',         name: 'Navy SEAL PT Standard',      icon: '⚓',  category: 'run',         description: 'Push-up ≥ 100, Pull-up ≥ 20, วิ่ง 5km <22m', condition: { type: 'run5km_pr', target: 1320} },

  // ── RANK MILESTONES ───────────────────────────────────────
  { id: 'rank_nco',             name: 'Non-Commissioned Officer',   icon: '🪖',  category: 'rank',        description: 'เลื่อนยศถึง จ่าสิบตรี',     condition: { type: 'rank_index',  target: 5   } },
  { id: 'rank_officer',         name: 'Officer Badge',              icon: '🌠',  category: 'rank',        description: 'เลื่อนยศถึง ร้อยตรี',       condition: { type: 'rank_index',  target: 10  } },
  { id: 'rank_colonel',         name: 'Colonel Standard',           icon: '🎗️', category: 'rank',        description: 'เลื่อนยศถึง พันเอก',        condition: { type: 'rank_index',  target: 15  } },
  { id: 'rank_general',         name: 'General Star',               icon: '👑',  category: 'rank',        description: 'เลื่อนยศถึง พลตรี',         condition: { type: 'rank_index',  target: 17  } },
  { id: 'tactical_star',        name: 'Tactical Excellence Star',   icon: '⭐',  category: 'rank',        description: 'เลื่อนยศถึง พลเอก',         condition: { type: 'rank_index',  target: 19  } },

  // ── PRESTIGE ─────────────────────────────────────────────
  { id: 'prestige_1',           name: 'Prestige I Star',            icon: '✦',   category: 'prestige',    description: 'Prestige ครั้งที่ 1',       condition: { type: 'prestige',    target: 1   } },
  { id: 'prestige_3',           name: 'Triple Prestige',            icon: '✦✦✦', category: 'prestige',   description: 'Prestige ครั้งที่ 3',       condition: { type: 'prestige',    target: 3   } },
  { id: 'grand_master',         name: 'Grand Master — Prestige V',  icon: '👑',  category: 'prestige',    description: 'Prestige ครั้งที่ 5',       condition: { type: 'prestige',    target: 5   } },
  { id: 'legend_status',        name: 'LEGEND Status',              icon: '🔮',  category: 'prestige',    description: 'Prestige 5 ดาว + ฝึก 1000 วัน', condition: { type: 'prestige', target: 5 } },

  // ── MILITARY STANDARDS (Thai) ─────────────────────────────
  { id: 'thai_combat_ribbon',   name: 'เหรียญชัยสมรภูมิ (อ้างอิง)',   icon: '🎖️', category: 'military_th', description: 'ฝึกครบ 365 วัน',           condition: { type: 'total_days',  target: 365 } },
  { id: 'thai_border_medal',    name: 'เหรียญราชการชายแดน (อ้างอิง)', icon: '🗺️', category: 'military_th', description: 'ฝึกครบ 500 วัน',           condition: { type: 'total_days',  target: 500 } },
  { id: 'thai_freedom_medal',   name: 'เหรียญพิทักษ์เสรีชน (อ้างอิง)',icon: '🛡️', category: 'military_th', description: 'ผ่านเกณฑ์ระดับ พลตรี+',    condition: { type: 'rank_index',  target: 17  } },
  { id: 'thai_courage_medal',   name: 'เหรียญกล้าหาญ (อ้างอิง)',      icon: '⚔️', category: 'military_th', description: 'ผ่าน Elite Test ระดับ พลเอก', condition: { type: 'rank_index', target: 19  } },
  { id: 'thai_chakkra_mala',    name: 'ตราจักรมาลา (อ้างอิง)',         icon: '🌸',  category: 'military_th', description: 'ผ่าน Master Evaluation (Prestige)', condition: { type: 'prestige', target: 1 } },

  // ── MILITARY STANDARDS (International) ───────────────────
  { id: 'marine_pt_badge',      name: 'Marine Corps PT Badge',      icon: '🦅',  category: 'military_int', description: 'Push-up ≥ 100 & Pull-up ≥ 20 & วิ่ง <18m', condition: { type: 'pullup_pr', target: 20 } },
  { id: 'british_bft',          name: 'British Army BFT Standard',  icon: '🇬🇧', category: 'military_int', description: 'วิ่ง 5km ผ่านมาตรฐาน BFT',  condition: { type: 'run5km_pr', target: 1680} },
  { id: 'sas_selection',        name: 'SAS Selection Badge (อ้างอิง)', icon: '🪂', category: 'military_int', description: 'Push-up ≥ 80 & วิ่ง 5km <20m', condition: { type: 'run5km_pr', target: 1200} },
  { id: 'seal_trident',         name: 'SEAL Trident Badge (อ้างอิง)', icon: '🔱', category: 'military_int', description: 'Navy SEAL Physical Standard สูงสุด', condition: { type: 'pullup_pr', target: 20 } },
  { id: 'green_beret',          name: 'Green Beret Badge (อ้างอิง)', icon: '🟢',  category: 'military_int', description: 'Push-up ≥ 80 & วิ่ง 5km <16m', condition: { type: 'run5km_pr', target: 960 } },
  { id: 'ranger_tab',           name: 'Ranger Tab (อ้างอิง)',        icon: '🏹',  category: 'military_int', description: 'ผ่าน Ranger Physical Assessment', condition: { type: 'rank_index', target: 15 } },
  { id: 'delta_benchmark',      name: 'Delta Force Benchmark (อ้างอิง)', icon: '🔺', category: 'military_int', description: 'Push-up ≥ 100 & Pull-up ≥ 30 & วิ่ง <18m', condition: { type: 'pullup_pr', target: 30 } },
  { id: 'spetsnaz_standard',    name: 'Spetsnaz Standard (อ้างอิง)', icon: '⭐',  category: 'military_int', description: 'Push-up ≥ 90 & Pull-up ≥ 25 & วิ่ง <10:30', condition: { type: 'pullup_pr', target: 25 } },
  { id: 'black_ops',            name: 'Black Ops Badge',             icon: '⬛',  category: 'military_int', description: 'Push-up ≥ 100 & Pull-up ≥ 25 & วิ่ง <20m', condition: { type: 'pullup_pr', target: 25 } },

  // ── CALISTHENICS SKILLS ───────────────────────────────────
  { id: 'muscle_up_master',     name: 'Muscle-up Master',           icon: '🌟',  category: 'calis',       description: 'Pull-up ≥ 15 + Dip ≥ 15',   condition: { type: 'pullup_pr',   target: 15  } },
  { id: 'street_workout',       name: 'Street Workout Medal',       icon: '🤸',  category: 'calis',       description: 'Pull-up ≥ 20 & Push-up ≥ 100', condition: { type: 'pullup_pr', target: 20  } },
  { id: 'calis_blackbelt',      name: 'Calisthenics Black Belt',    icon: '🥋',  category: 'calis',       description: 'Pull-up ≥ 30 & Push-up ≥ 150', condition: { type: 'pullup_pr', target: 30  } },

];

// Export (moved to end of file after all declarations)

/* ─────────────────────────────────────────
   TRACK-SPECIFIC RANK CRITERIA (Blueprint v3)
   Structure per rank index (0–20):
     metric: pushup_pr | pullup_pr | plank_pr | run5km_pr | total_days | streak | always
     target: value to reach (run5km_pr = seconds, lower is better)
───────────────────────────────────────── */
const TRACK_RANKS = {

  strength: [
    { index:0,  metric:'always',    target:0,   label:'เริ่มต้น',          desc:'ไม่มีเงื่อนไข' },
    { index:1,  metric:'pushup_pr', target:15,  label:'Push-up 15',       desc:'Foundational push standard' },
    { index:2,  metric:'pushup_pr', target:20,  label:'Push-up 20',       desc:'Basic strength entry' },
    { index:3,  metric:'pushup_pr', target:30,  label:'Push-up 30',       desc:'Consistent pushing' },
    { index:4,  metric:'pushup_pr', target:40,  label:'Push-up 40',       desc:'Intermediate strength' },
    { index:5,  metric:'pushup_pr', target:50,  label:'Push-up 50',       desc:'Half-century benchmark' },
    { index:6,  metric:'pushup_pr', target:60,  label:'Push-up 60',       desc:'Sustained strength' },
    { index:7,  metric:'pushup_pr', target:70,  label:'Push-up 70',       desc:'NCO upper body standard' },
    { index:8,  metric:'pushup_pr', target:80,  label:'Push-up 80',       desc:'SAS selection entry' },
    { index:9,  metric:'pushup_pr', target:90,  label:'Push-up 90',       desc:'Spetsnaz baseline' },
    { index:10, metric:'pushup_pr', target:100, label:'Push-up 100',      desc:'Centurion benchmark' },
    { index:11, metric:'pushup_pr', target:110, label:'Push-up 110',      desc:'Advanced officer' },
    { index:12, metric:'pushup_pr', target:120, label:'Push-up 120',      desc:'Elite company commander' },
    { index:13, metric:'pushup_pr', target:130, label:'Push-up 130',      desc:'Special Forces entry' },
    { index:14, metric:'pushup_pr', target:140, label:'Push-up 140',      desc:'SF senior operator' },
    { index:15, metric:'pushup_pr', target:150, label:'Push-up 150',      desc:'Marine Corps gold' },
    { index:16, metric:'pullup_pr', target:35,  label:'Pull-up 35',       desc:'Elite grip strength' },
    { index:17, metric:'pullup_pr', target:40,  label:'Pull-up 40',       desc:'General strength standard' },
    { index:18, metric:'pullup_pr', target:45,  label:'Pull-up 45',       desc:'Near maximum relative strength' },
    { index:19, metric:'pullup_pr', target:48,  label:'Pull-up 48',       desc:'Elite Test' },
    { index:20, metric:'pullup_pr', target:50,  label:'Pull-up 50',       desc:'Master Evaluation' },
  ],

  physique: [
    { index:0,  metric:'always',    target:0,   label:'เริ่มต้น',          desc:'ไม่มีเงื่อนไข' },
    { index:1,  metric:'total_days',target:7,   label:'ฝึก 7 วัน',        desc:'Volume training start' },
    { index:2,  metric:'total_days',target:14,  label:'ฝึก 14 วัน',       desc:'2-week commitment' },
    { index:3,  metric:'pushup_pr', target:30,  label:'Push-up 30',       desc:'Hypertrophy baseline' },
    { index:4,  metric:'pushup_pr', target:40,  label:'Push-up 40',       desc:'Moderate hypertrophy' },
    { index:5,  metric:'total_days',target:30,  label:'ฝึก 30 วัน',       desc:'Month of consistency' },
    { index:6,  metric:'pullup_pr', target:8,   label:'Pull-up 8',        desc:'Back hypertrophy threshold' },
    { index:7,  metric:'pullup_pr', target:12,  label:'Pull-up 12',       desc:'Advanced back development' },
    { index:8,  metric:'total_days',target:60,  label:'ฝึก 60 วัน',       desc:'Sustained commitment' },
    { index:9,  metric:'total_days',target:90,  label:'ฝึก 90 วัน',       desc:'Transformation period' },
    { index:10, metric:'pullup_pr', target:15,  label:'Pull-up 15',       desc:'Officer physique standard' },
    { index:11, metric:'pushup_pr', target:80,  label:'Push-up 80',       desc:'Advanced hypertrophy' },
    { index:12, metric:'total_days',target:120, label:'ฝึก 120 วัน',      desc:'4-month dedication' },
    { index:13, metric:'pullup_pr', target:20,  label:'Pull-up 20',       desc:'Elite back musculature' },
    { index:14, metric:'pushup_pr', target:100, label:'Push-up 100',      desc:'Advanced push strength' },
    { index:15, metric:'total_days',target:180, label:'ฝึก 180 วัน',      desc:'6-month training' },
    { index:16, metric:'pullup_pr', target:25,  label:'Pull-up 25',       desc:'Elite physique conditioning' },
    { index:17, metric:'total_days',target:300, label:'ฝึก 300 วัน',      desc:'300-day physique journey' },
    { index:18, metric:'pushup_pr', target:130, label:'Push-up 130',      desc:'Near-elite push endurance' },
    { index:19, metric:'total_days',target:365, label:'ฝึก 365 วัน',      desc:'Full year of dedication' },
    { index:20, metric:'pullup_pr', target:30,  label:'Pull-up 30',       desc:'Master Physique standard' },
  ],

  calisthenics: [
    { index:0,  metric:'always',    target:0,   label:'เริ่มต้น',          desc:'ไม่มีเงื่อนไข' },
    { index:1,  metric:'pushup_pr', target:10,  label:'Push-up 10',       desc:'Foundational pushing' },
    { index:2,  metric:'pushup_pr', target:20,  label:'Push-up 20',       desc:'Basic calisthenics entry' },
    { index:3,  metric:'pullup_pr', target:3,   label:'Pull-up 3',        desc:'ดึงข้อได้ 3 ครั้ง' },
    { index:4,  metric:'pullup_pr', target:5,   label:'Pull-up 5',        desc:'Basic pull-up strength' },
    { index:5,  metric:'pullup_pr', target:8,   label:'Pull-up 8',        desc:'Intermediate calisthenics' },
    { index:6,  metric:'plank_pr',  target:120, label:'Plank 2 นาที',     desc:'Core endurance milestone' },
    { index:7,  metric:'pullup_pr', target:12,  label:'Pull-up 12',       desc:'Advanced pulling' },
    { index:8,  metric:'pullup_pr', target:15,  label:'Pull-up 15',       desc:'Muscle-up preparation' },
    { index:9,  metric:'plank_pr',  target:180, label:'Plank 3 นาที',     desc:'L-sit foundation' },
    { index:10, metric:'pullup_pr', target:18,  label:'Pull-up 18',       desc:'Front lever prep' },
    { index:11, metric:'pushup_pr', target:80,  label:'Push-up 80',       desc:'Planche preparation' },
    { index:12, metric:'pullup_pr', target:20,  label:'Pull-up 20',       desc:'Muscle-up threshold' },
    { index:13, metric:'plank_pr',  target:300, label:'Plank 5 นาที',     desc:'Advanced core mastery' },
    { index:14, metric:'pullup_pr', target:22,  label:'Pull-up 22',       desc:'Front lever progression' },
    { index:15, metric:'pushup_pr', target:100, label:'Push-up 100',      desc:'Planche push-up baseline' },
    { index:16, metric:'pullup_pr', target:25,  label:'Pull-up 25',       desc:'Elite bar skills' },
    { index:17, metric:'pullup_pr', target:28,  label:'Pull-up 28',       desc:'Straddle planche prep' },
    { index:18, metric:'pullup_pr', target:30,  label:'Pull-up 30',       desc:'Black Belt threshold' },
    { index:19, metric:'pullup_pr', target:35,  label:'Pull-up 35',       desc:'Elite Test' },
    { index:20, metric:'pullup_pr', target:40,  label:'Pull-up 40',       desc:'Master — Front lever + planche' },
  ],

  endurance: [
    { index:0,  metric:'always',     target:0,    label:'เริ่มต้น',          desc:'ไม่มีเงื่อนไข' },
    { index:1,  metric:'total_days', target:3,    label:'ฝึก 3 วัน',        desc:'เริ่มวิ่ง' },
    { index:2,  metric:'run5km_pr',  target:2400, label:'5km < 40 นาที',    desc:'จ็อกพื้นฐาน' },
    { index:3,  metric:'run5km_pr',  target:2100, label:'5km < 35 นาที',    desc:'Comfortable distance run' },
    { index:4,  metric:'run5km_pr',  target:1800, label:'5km < 30 นาที',    desc:'Sub-30 standard' },
    { index:5,  metric:'run5km_pr',  target:1680, label:'5km < 28 นาที',    desc:'British BFT standard' },
    { index:6,  metric:'run5km_pr',  target:1560, label:'5km < 26 นาที',    desc:'Sustained aerobic pace' },
    { index:7,  metric:'run5km_pr',  target:1500, label:'5km < 25 นาที',    desc:'NCO endurance standard' },
    { index:8,  metric:'run5km_pr',  target:1440, label:'5km < 24 นาที',    desc:'Army APFT gold pace' },
    { index:9,  metric:'run5km_pr',  target:1380, label:'5km < 23 นาที',    desc:'Advanced endurance' },
    { index:10, metric:'run5km_pr',  target:1320, label:'5km < 22 นาที',    desc:'Officer standard' },
    { index:11, metric:'run5km_pr',  target:1260, label:'5km < 21 นาที',    desc:'High performance' },
    { index:12, metric:'run5km_pr',  target:1200, label:'5km < 20 นาที',    desc:'Sub-20 elite tier' },
    { index:13, metric:'run5km_pr',  target:1140, label:'5km < 19 นาที',    desc:'Competitive runner' },
    { index:14, metric:'run5km_pr',  target:1080, label:'5km < 18 นาที',    desc:'SAS selection pace' },
    { index:15, metric:'run5km_pr',  target:1020, label:'5km < 17 นาที',    desc:'Special Forces threshold' },
    { index:16, metric:'run5km_pr',  target:960,  label:'5km < 16 นาที',    desc:'Green Beret pace' },
    { index:17, metric:'run5km_pr',  target:900,  label:'5km < 15 นาที',    desc:'Elite military runner' },
    { index:18, metric:'run5km_pr',  target:870,  label:'5km < 14:30',      desc:'Near national standard' },
    { index:19, metric:'run5km_pr',  target:840,  label:'5km < 14 นาที',    desc:'Elite Test' },
    { index:20, metric:'run5km_pr',  target:780,  label:'5km < 13 นาที',    desc:'Master — Professional runner' },
  ],

  hybrid: [
    { index:0,  metric:'always',    target:0,    label:'เริ่มต้น',          desc:'ไม่มีเงื่อนไข' },
    { index:1,  metric:'streak',    target:3,    label:'Streak 3 วัน',     desc:'3 วันติดต่อกัน' },
    { index:2,  metric:'pushup_pr', target:20,   label:'Push-up 20',       desc:'Basic WOD capacity' },
    { index:3,  metric:'streak',    target:7,    label:'Streak 7 วัน',     desc:'7 วันติดต่อกัน' },
    { index:4,  metric:'pushup_pr', target:40,   label:'Push-up 40',       desc:'MetCon foundation' },
    { index:5,  metric:'run5km_pr', target:1800, label:'5km < 30 นาที',    desc:'Hybrid cardio base' },
    { index:6,  metric:'pushup_pr', target:60,   label:'Push-up 60',       desc:'Chipper workouts' },
    { index:7,  metric:'streak',    target:21,   label:'Streak 21 วัน',    desc:'21-day challenge' },
    { index:8,  metric:'pullup_pr', target:10,   label:'Pull-up 10',       desc:'Pulling in WODs' },
    { index:9,  metric:'run5km_pr', target:1500, label:'5km < 25 นาที',    desc:'Hybrid cardio advanced' },
    { index:10, metric:'pushup_pr', target:80,   label:'Push-up 80',       desc:'Tactical WOD entry' },
    { index:11, metric:'pullup_pr', target:15,   label:'Pull-up 15',       desc:'Hybrid pulling standard' },
    { index:12, metric:'streak',    target:30,   label:'Streak 30 วัน',    desc:'Iron Discipline' },
    { index:13, metric:'pushup_pr', target:100,  label:'Push-up 100',      desc:'Centurion hybrid' },
    { index:14, metric:'run5km_pr', target:1320, label:'5km < 22 นาที',    desc:'Officer run standard' },
    { index:15, metric:'pullup_pr', target:20,   label:'Pull-up 20',       desc:'Elite hybrid WOD' },
    { index:16, metric:'pushup_pr', target:120,  label:'Push-up 120',      desc:'Advanced hybrid strength' },
    { index:17, metric:'run5km_pr', target:1200, label:'5km < 20 นาที',    desc:'Elite cardio' },
    { index:18, metric:'pullup_pr', target:25,   label:'Pull-up 25',       desc:'Near-elite hybrid' },
    { index:19, metric:'pushup_pr', target:140,  label:'Push-up 140',      desc:'Elite Test' },
    { index:20, metric:'pullup_pr', target:30,   label:'Pull-up 30',       desc:'Master Hybrid' },
  ],

  neuro: [
    { index:0,  metric:'always',    target:0,   label:'เริ่มต้น',          desc:'ไม่มีเงื่อนไข' },
    { index:1,  metric:'total_days',target:3,   label:'ฝึก 3 วัน',        desc:'เริ่มเคลื่อนไหว' },
    { index:2,  metric:'plank_pr',  target:30,  label:'Plank 30 วินาที',  desc:'Core control baseline' },
    { index:3,  metric:'plank_pr',  target:60,  label:'Plank 1 นาที',     desc:'Stability foundation' },
    { index:4,  metric:'streak',    target:7,   label:'Streak 7 วัน',     desc:'Neuromuscular adaptation' },
    { index:5,  metric:'plank_pr',  target:90,  label:'Plank 1:30',       desc:'Agility ladder entry' },
    { index:6,  metric:'plank_pr',  target:120, label:'Plank 2 นาที',     desc:'Coordination baseline' },
    { index:7,  metric:'streak',    target:14,  label:'Streak 14 วัน',    desc:'Consistent neuro training' },
    { index:8,  metric:'plank_pr',  target:180, label:'Plank 3 นาที',     desc:'Tactical movement entry' },
    { index:9,  metric:'total_days',target:60,  label:'ฝึก 60 วัน',       desc:'Motor pattern consolidation' },
    { index:10, metric:'plank_pr',  target:240, label:'Plank 4 นาที',     desc:'Officer neuro standard' },
    { index:11, metric:'pushup_pr', target:50,  label:'Push-up 50',       desc:'Strength-neuro integration' },
    { index:12, metric:'plank_pr',  target:300, label:'Plank 5 นาที',     desc:'Advanced proprioception' },
    { index:13, metric:'streak',    target:30,  label:'Streak 30 วัน',    desc:'Elite consistency' },
    { index:14, metric:'plank_pr',  target:360, label:'Plank 6 นาที',     desc:'Speed-strength complex' },
    { index:15, metric:'total_days',target:120, label:'ฝึก 120 วัน',      desc:'Field assessment ready' },
    { index:16, metric:'plank_pr',  target:420, label:'Plank 7 นาที',     desc:'Near-elite neuro control' },
    { index:17, metric:'streak',    target:60,  label:'Streak 60 วัน',    desc:'Elite movement mastery' },
    { index:18, metric:'plank_pr',  target:480, label:'Plank 8 นาที',     desc:'Extreme core stability' },
    { index:19, metric:'plank_pr',  target:540, label:'Plank 9 นาที',     desc:'Elite Test' },
    { index:20, metric:'plank_pr',  target:600, label:'Plank 10 นาที',    desc:'Master — Steel core & elite agility' },
  ],
};

// Export — placed at end so all consts are initialized before use
if (typeof module !== 'undefined') {
  module.exports = { Schema, RANKS, TRACK_RANKS, EXERCISE_LIBRARY, DEFAULT_MISSIONS, DEFAULT_MEDALS };
}
