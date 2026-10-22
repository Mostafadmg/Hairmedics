import { test } from 'node:test';
import assert from 'node:assert/strict';
import { required, email, ukPhone, ukPostcode, dateOfBirth } from '../src/js/lib/validate.js';

test('required', () => {
  assert.equal(required('Sam', 'Name'), '');
  assert.equal(required('   ', 'Name'), 'Name is required');
  assert.equal(required([], 'Treatment'), 'Treatment is required');
  assert.equal(required(['x'], 'Treatment'), '');
});

test('email', () => {
  assert.equal(email('info@hairmedicsuk.com'), '');
  assert.notEqual(email('info@hairmedicsuk'), '');
  assert.notEqual(email('not an email'), '');
  assert.equal(email(''), '', 'empty is handled by required(), not here');
});

test('UK phone numbers', () => {
  for (const ok of ['020 3441 3026', '02034413026', '07700 900982', '+44 7700 900982', '(020) 3441-3026']) assert.equal(ukPhone(ok), '', ok);
  // Deliberately lenient: a few UK areas (e.g. 016977) have 10-digit numbers.
  assert.equal(ukPhone('016977 2345'), '');
  for (const bad of ['12345', '+1 202 555 0143', '020 3441']) assert.notEqual(ukPhone(bad), '', bad);
});

test('UK postcodes', () => {
  for (const ok of ['AL2 1RE', 'al21re', 'SW1A 1AA', 'M1 1AE', 'B33 8TH']) assert.equal(ukPostcode(ok), '', ok);
  for (const bad of ['12345', 'AL2', 'ABC 123']) assert.notEqual(ukPostcode(bad), '', bad);
});

test('date of birth: real dates, 18 or over', () => {
  const today = new Date(2026, 9, 22); // 22 Oct 2026
  assert.equal(dateOfBirth({ day: '27', month: '3', year: '1985' }, today), '');
  assert.match(dateOfBirth({ day: '31', month: '2', year: '1990' }, today), /real date/);
  assert.match(dateOfBirth({ day: '23', month: '10', year: '2008' }, today), /18 or over/); // 18th birthday tomorrow
  assert.equal(dateOfBirth({ day: '22', month: '10', year: '2008' }, today), ''); // 18 today
  assert.match(dateOfBirth({ day: '1', month: '1', year: '85' }, today), /real date/);
  assert.match(dateOfBirth({}, today), /Enter your date of birth/);
});
