import test from 'node:test';
import assert from 'node:assert/strict';
import { getLocalUsers, updateUserCode, findUserByCode, formatUserName, AppUser } from './userAuth';
import { USERS } from '../data/users';

test('getLocalUsers returns initial users list from USERS', () => {
  const users = getLocalUsers();
  assert.ok(users.length >= 10);
  const fabian = users.find(u => u.name.toLowerCase() === 'fabian');
  assert.ok(fabian);
  assert.equal(fabian.password, '2594');
});

test('updateUserCode rejects invalid codes less than 3 chars', async () => {
  const res = await updateUserCode('angelo', '12');
  assert.equal(res.success, false);
  assert.ok(res.error?.includes('al menos 3'));
});

test('updateUserCode rejects empty user name', async () => {
  const res = await updateUserCode('', '1234');
  assert.equal(res.success, false);
});

test('findUserByCode locates users by passcode', () => {
  const users = getLocalUsers();
  const user = findUserByCode('2594', users);
  assert.ok(user);
  assert.equal(user.name.toLowerCase(), 'fabian');

  const invalid = findUserByCode('999999999', users);
  assert.equal(invalid, undefined);
});

test('formatUserName formats names with clean capitalization', () => {
  assert.equal(formatUserName('juan carlos'), 'Juan Carlos');
  assert.equal(formatUserName('angelo'), 'Angelo');
  assert.equal(formatUserName('FABIAN'), 'Fabian');
});

