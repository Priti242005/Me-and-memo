/**
 * Combines calendar date (YYYY-MM-DD) with manual time (HH:MM) and AM/PM into a local Date.
 * Returns null if no scheduling fields are provided (immediate post).
 */
function parseUnlockSchedule({ dateStr, timeStr, amPm }) {
  const d = dateStr != null ? String(dateStr).trim() : '';
  const t = timeStr != null ? String(timeStr).trim() : '';
  const ap = amPm != null ? String(amPm).trim() : '';

  if (!d && !t && !ap) {
    return { unlockDate: null };
  }

  if (!d || !t || !ap) {
    return {
      error: 'Scheduled posts require date, time (HH:MM), and AM or PM.',
    };
  }

  const dateMatch = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) {
    return { error: 'Date must be YYYY-MM-DD.' };
  }

  // Accept HH:MM or HH.MM (colon or dot — many users type 11.28 instead of 11:28)
  const normalizedTime = t.replace(',', '.');
  const timeMatch = normalizedTime.match(/^(\d{1,2})[:.](\d{2})$/);
  if (!timeMatch) {
    return {
      error:
        'Time must look like 9:05 or 11:28 (you can use a dot instead of a colon, e.g. 11.28).',
    };
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  let hour12 = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(hour12) ||
    Number.isNaN(minute)
  ) {
    return { error: 'Invalid date or time values.' };
  }

  if (hour12 < 1 || hour12 > 12 || minute < 0 || minute > 59) {
    return { error: 'Hour must be 1–12 and minutes 0–59.' };
  }

  const apUpper = ap.toUpperCase();
  if (apUpper !== 'AM' && apUpper !== 'PM') {
    return { error: 'Select AM or PM.' };
  }

  let hour24;
  if (apUpper === 'AM') {
    hour24 = hour12 === 12 ? 0 : hour12;
  } else {
    hour24 = hour12 === 12 ? 12 : hour12 + 12;
  }

  const unlockDate = new Date(year, month - 1, day, hour24, minute, 0, 0);
  if (Number.isNaN(unlockDate.getTime())) {
    return { error: 'Invalid calendar date.' };
  }

  return { unlockDate };
}

module.exports = { parseUnlockSchedule };
