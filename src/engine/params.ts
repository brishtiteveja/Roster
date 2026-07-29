// Season 0 parameters (Mechanism Spec v5.2.2 §1). Frozen by judgment.
// K_ACTIVE is the one parameter with a pre-registered mechanical veto (§6).

export const PARAMS = {
  BOARD_DEGREE_TARGET: 6, // d — "target six"
  BOARD_DEGREE_FLOOR: 3, //  m — "minimum three", where feasible
  PICKS_MAX: 3, //           ≤3, unranked
  OPENINGS_PER_WEEK: 1, //   one new connection per person per week
  K_ACTIVE: 2, //            frozen; veto → 3 (§6)
  CHECK_INTERVAL_DAYS: 7, // or 2 after a mutually acknowledged date
  CHECK_INTERVAL_AFTER_DATE_DAYS: 2,
  MORE_TIME_INTERVAL_DAYS: 4,
  MORE_TIME_MAX_CONSECUTIVE: 2,
  CHECK_DEADLINE_HOURS: 48,
  SEASON_WEEKS: 6,
  COHORT_MIN: 30,
  COHORT_MAX: 40,
  AFFINITY_ALPHA: 1, //      weight on shared interests in a(u,v)
  FAIRNESS_EPSILON: 0.01,
  RECURRENCE_COOLDOWN_WEEKS: 1, // after 2 consecutive co-appearances
} as const;

export type Params = typeof PARAMS;
