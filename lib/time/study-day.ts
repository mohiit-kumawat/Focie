/**
 * Focusie Personal 24-Hour Study Day & Fair Interval Overlap Engine
 * Spec: FOCUSIE_SPEC.md (FR-05 & FR-06)
 *
 * Provides mathematically exact, timezone-aware personal study-day boundary calculations,
 * continuous segment overlap slicing, and competition-standard leaderboard ranking.
 */

export interface StudyDayWindow {
  windowStart: Date;
  windowEnd: Date;
  timezone: string;
  dayStartTime: string;
  isCurrentDay: boolean;
  label: string;
  remainingSeconds: number;
}

export interface FocusedSegment {
  id?: string;
  startedAt: string | Date;
  endedAt?: string | Date | null;
  durationSeconds?: number;
}

export interface LeaderboardParticipant {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  focusedSeconds: number;
  isStudyingNow?: boolean;
  currentSubject?: string;
  timezone?: string;
  dayStartTime?: string;
  lastActiveAt?: string;
}

export interface RankedLeaderboardEntry extends LeaderboardParticipant {
  rank: number;
  formattedTime: string;
  isCurrentUser?: boolean;
  windowLabel?: string;
}

// ---------------------------------------------------------------------------
// 1. Timezone Parsing Helpers (Zero External Dependencies)
// ---------------------------------------------------------------------------

interface LocalDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/**
 * Extracts local date parts for a UTC Date in an IANA timezone.
 */
export function getLocalDateParts(date: Date, timeZone: string): LocalDateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }

  const hourRaw = parseInt(map.hour || "0", 10);
  return {
    year: parseInt(map.year || "1970", 10),
    month: parseInt(map.month || "1", 10),
    day: parseInt(map.day || "1", 10),
    hour: hourRaw === 24 ? 0 : hourRaw,
    minute: parseInt(map.minute || "0", 10),
    second: parseInt(map.second || "0", 10),
  };
}

/**
 * Converts a target local date/time in an IANA timezone to its exact UTC Date.
 * Uses iterative offset refinement to handle daylight-saving transitions seamlessly.
 */
export function localToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string
): Date {
  const pad = (n: number) => String(n).padStart(2, "0");
  const isoLike = `${pad(year)}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}Z`;
  let candidate = new Date(isoLike);

  for (let i = 0; i < 4; i++) {
    const p = getLocalDateParts(candidate, timeZone);
    const candidateLocalMs = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    const targetLocalMs = Date.UTC(year, month - 1, day, hour, minute, second);
    const diff = targetLocalMs - candidateLocalMs;
    if (diff === 0) break;
    candidate = new Date(candidate.getTime() + diff);
  }

  return candidate;
}

/**
 * Parses a "HH:MM:SS" or "HH:MM" string into hours and minutes.
 */
export function parseDayStartTime(timeStr: string): { hour: number; minute: number } {
  if (!timeStr) return { hour: 6, minute: 0 };
  const parts = timeStr.split(":");
  const hour = Math.min(23, Math.max(0, parseInt(parts[0] || "6", 10)));
  const minute = Math.min(59, Math.max(0, parseInt(parts[1] || "0", 10)));
  return { hour: isNaN(hour) ? 6 : hour, minute: isNaN(minute) ? 0 : minute };
}

// ---------------------------------------------------------------------------
// 2. Personal 24-Hour Study-Day Window Calculations (FR-05)
// ---------------------------------------------------------------------------

/**
 * Computes the active 24-hour personal study-day window for a given instant.
 *
 * Example:
 * If user configured day_start_time = "06:00:00" in "Asia/Kolkata",
 * at 04:30 AM on Oct 20, the active study day started on Oct 19 at 06:00 AM local time,
 * and will conclude on Oct 20 at 06:00 AM local time.
 */
export function getPersonalStudyDayWindow(
  referenceDate: Date = new Date(),
  dayStartTimeStr: string = "06:00:00",
  timezone: string = "Asia/Kolkata"
): StudyDayWindow {
  const safeTz = timezone || "Asia/Kolkata";
  const { hour: startHour, minute: startMinute } = parseDayStartTime(dayStartTimeStr);
  const local = getLocalDateParts(referenceDate, safeTz);

  // Check if current local time is before the day start boundary
  const isBeforeBoundary =
    local.hour < startHour || (local.hour === startHour && local.minute < startMinute);

  let startYear = local.year;
  let startMonth = local.month;
  let startDay = local.day;

  if (isBeforeBoundary) {
    // Falls into the previous local calendar day
    const prevDayDate = new Date(Date.UTC(local.year, local.month - 1, local.day - 1));
    startYear = prevDayDate.getUTCFullYear();
    startMonth = prevDayDate.getUTCMonth() + 1;
    startDay = prevDayDate.getUTCDate();
  }

  const windowStart = localToUtc(
    startYear,
    startMonth,
    startDay,
    startHour,
    startMinute,
    0,
    safeTz
  );

  // Next boundary is exactly the next local calendar day at the same local start time
  const nextDayDate = new Date(Date.UTC(startYear, startMonth - 1, startDay + 1));
  const windowEnd = localToUtc(
    nextDayDate.getUTCFullYear(),
    nextDayDate.getUTCMonth() + 1,
    nextDayDate.getUTCDate(),
    startHour,
    startMinute,
    0,
    safeTz
  );

  const nowMs = referenceDate.getTime();
  const endMs = windowEnd.getTime();
  const remainingSeconds = Math.max(0, Math.floor((endMs - nowMs) / 1000));

  const startFormatted = windowStart.toLocaleDateString("en-US", {
    timeZone: safeTz,
    month: "short",
    day: "numeric",
  });

  const pad = (n: number) => String(n).padStart(2, "0");
  const label = `Today (${startFormatted}, ${pad(startHour)}:${pad(startMinute)} local)`;

  return {
    windowStart,
    windowEnd,
    timezone: safeTz,
    dayStartTime: `${pad(startHour)}:${pad(startMinute)}:00`,
    isCurrentDay: true,
    label,
    remainingSeconds,
  };
}

/**
 * Computes a synchronized Shared Challenge window across all participants (FR-06).
 * All participants compete over the exact same explicit UTC start and end instants.
 */
export function getSharedChallengeWindow(
  referenceDate: Date = new Date(),
  durationHours: number = 24
): StudyDayWindow {
  // Start of current UTC calendar day
  const windowStart = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate(),
      0,
      0,
      0
    )
  );

  const windowEnd = new Date(windowStart.getTime() + durationHours * 3600 * 1000);
  const remainingSeconds = Math.max(0, Math.floor((windowEnd.getTime() - referenceDate.getTime()) / 1000));

  return {
    windowStart,
    windowEnd,
    timezone: "UTC",
    dayStartTime: "00:00:00",
    isCurrentDay: true,
    label: `Global Shared Sprint (${durationHours}h UTC Window)`,
    remainingSeconds,
  };
}

/**
 * Computes a 7-day rolling or calendar weekly study window.
 */
export function getWeeklyStudyWindow(
  referenceDate: Date = new Date(),
  dayStartTimeStr: string = "06:00:00",
  timezone: string = "Asia/Kolkata"
): StudyDayWindow {
  const currentDay = getPersonalStudyDayWindow(referenceDate, dayStartTimeStr, timezone);
  // 6 days before current day start
  const windowStart = new Date(currentDay.windowStart.getTime() - 6 * 24 * 3600 * 1000);
  const windowEnd = currentDay.windowEnd;
  const remainingSeconds = currentDay.remainingSeconds;

  return {
    windowStart,
    windowEnd,
    timezone: currentDay.timezone,
    dayStartTime: currentDay.dayStartTime,
    isCurrentDay: true,
    label: "Past 7 Days (Weekly Focus)",
    remainingSeconds,
  };
}

// ---------------------------------------------------------------------------
// 3. Mathematical Interval Overlap Engine (Anti-Cheat & Cross-Midnight Math)
// ---------------------------------------------------------------------------

/**
 * Calculates the exact overlapping duration (in seconds) between a study segment
 * and a measurement window.
 *
 * Mathematical Formula:
 * overlap = max(0, min(segment_end, window_end) - max(segment_start, window_start))
 */
export function calculateIntervalOverlapSeconds(
  segmentStart: Date | string,
  segmentEnd: Date | string | null | undefined,
  windowStart: Date | string,
  windowEnd: Date | string,
  effectiveNow: Date = new Date()
): number {
  const segStartMs = new Date(segmentStart).getTime();
  // If segment is currently ongoing (ended_at is null), clamp to effectiveNow
  const segEndMs = segmentEnd ? new Date(segmentEnd).getTime() : effectiveNow.getTime();

  const winStartMs = new Date(windowStart).getTime();
  const winEndMs = new Date(windowEnd).getTime();

  if (segEndMs <= segStartMs || winEndMs <= winStartMs) {
    return 0;
  }

  const overlapStart = Math.max(segStartMs, winStartMs);
  const overlapEnd = Math.min(segEndMs, winEndMs);

  if (overlapEnd <= overlapStart) {
    return 0;
  }

  return Math.floor((overlapEnd - overlapStart) / 1000);
}

/**
 * Calculates total valid focused seconds for an array of segments inside a given window.
 */
export function calculateTotalFocusedSecondsInWindow(
  segments: FocusedSegment[],
  window: StudyDayWindow,
  effectiveNow: Date = new Date()
): number {
  let total = 0;
  for (const seg of segments) {
    total += calculateIntervalOverlapSeconds(
      seg.startedAt,
      seg.endedAt,
      window.windowStart,
      window.windowEnd,
      effectiveNow
    );
  }
  return total;
}

// ---------------------------------------------------------------------------
// 4. Fair Competition Leaderboard Ranking & Tie Resolver (FR-06)
// ---------------------------------------------------------------------------

/**
 * Formats focus seconds into a readable string: "2h 15m", "45m", or "0m".
 */
export function formatFocusedTime(seconds: number): string {
  const safeSecs = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSecs / 3600);
  const minutes = Math.floor((safeSecs % 3600) / 60);

  if (hours === 0 && minutes === 0) {
    return "0m";
  }
  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}

/**
 * Assigns competition ranks with standard tie resolution.
 * If Participant A and Participant B have identical focused seconds, both receive the same rank.
 * Subsequent ranks skip accordingly (e.g. 1, 1, 3, 4).
 */
export function rankLeaderboardParticipants(
  participants: LeaderboardParticipant[],
  currentUserId?: string
): RankedLeaderboardEntry[] {
  // Sort descending by focusedSeconds, with tie-break on username for consistency
  const sorted = [...participants].sort((a, b) => {
    if (b.focusedSeconds !== a.focusedSeconds) {
      return b.focusedSeconds - a.focusedSeconds;
    }
    return a.username.localeCompare(b.username);
  });

  const ranked: RankedLeaderboardEntry[] = [];
  let currentRank = 1;

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    if (i > 0 && item.focusedSeconds < sorted[i - 1].focusedSeconds) {
      // Standard competition rank: current index + 1
      currentRank = i + 1;
    }

    ranked.push({
      ...item,
      rank: currentRank,
      formattedTime: formatFocusedTime(item.focusedSeconds),
      isCurrentUser: currentUserId ? item.userId === currentUserId : false,
    });
  }

  return ranked;
}

