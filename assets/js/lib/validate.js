/**
 * Validation rules as PURE functions: value in -> error message out
 * ('' means valid). No DOM, so they're easy to unit test (see tests/).
 */
export const required = (value, label = 'This field') =>
  (value === undefined || value === null || String(value).trim() === '' || (Array.isArray(value) && value.length === 0)
    ? `${label} is required`
    : '');

export function email(value) {
  if (!value) return '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) ? '' : 'Enter an email address in the correct format, like name@example.com';
}

export function ukPhone(value) {
  if (!value) return '';
  const digits = value.replace(/[\s()-]/g, '');
  return /^(?:\+44|0044|0)\d{9,10}$/.test(digits) ? '' : 'Enter a UK phone number, like 07700 900 982 or 020 3441 3026';
}

export function ukPostcode(value) {
  if (!value) return '';
  return /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(value.trim()) ? '' : 'Enter a real UK postcode, like AL2 1RE';
}

/**
 * Date of birth from three separate fields (the GOV.UK pattern — easier to
 * type than a date picker, especially for dates decades ago).
 */
export function dateOfBirth({ day, month, year }, today = new Date()) {
  if (!day && !month && !year) return 'Enter your date of birth';
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!d || !m || !y || String(year).length !== 4) return 'Date of birth must be a real date, like 27 3 1985';
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return 'Date of birth must be a real date';
  if (date > today) return 'Date of birth must be in the past';

  let age = today.getFullYear() - y;
  const hadBirthday = today.getMonth() > m - 1 || (today.getMonth() === m - 1 && today.getDate() >= d);
  if (!hadBirthday) age -= 1;
  if (age < 18) return 'You must be 18 or over to use this service';
  if (age > 120) return 'Check the year of your date of birth';
  return '';
}

export const rules = { email, ukPhone, ukPostcode };
