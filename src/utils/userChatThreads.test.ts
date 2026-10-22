import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_USER_THREADS,
  getUserThread,
  appendUserMessage,
  searchUserThreads
} from '../data/userChatThreads';
import { ChatMessage } from '../types/manual';

test('DEFAULT_USER_THREADS provides persistent threads for distinct coworkers and current user', () => {
  assert.ok(DEFAULT_USER_THREADS.length >= 5);
  const currentUserThread = DEFAULT_USER_THREADS.find(t => t.isCurrentUser);
  assert.ok(currentUserThread, 'Current user thread must exist');
  assert.strictEqual(currentUserThread?.userId, 'current-user');

  const coworkerMarianne = DEFAULT_USER_THREADS.find(t => t.userId === 'user-marianne');
  assert.ok(coworkerMarianne, 'Coworker Marianne thread must exist');
  assert.ok(coworkerMarianne.messages.length > 0, 'Coworker should have previous consultations');
});

test('getUserThread retrieves exact thread by userId', () => {
  const thread = getUserThread(DEFAULT_USER_THREADS, 'user-tommy');
  assert.ok(thread);
  assert.strictEqual(thread?.userName, 'Tommy Chen');
  assert.strictEqual(thread?.department, 'Sistemas & Ciberseguridad');
});

test('appendUserMessage updates only the target thread without mutating others', () => {
  const newMsg: ChatMessage = {
    id: 'test-1',
    role: 'user',
    content: '¿Cuánto tiempo de lactancia tengo?',
    timestamp: Date.now()
  };

  const updated = appendUserMessage(DEFAULT_USER_THREADS, 'current-user', newMsg);
  const userThread = updated.find(t => t.userId === 'current-user');
  assert.ok(userThread?.messages.some(m => m.id === 'test-1'));

  const marianneThread = updated.find(t => t.userId === 'user-marianne');
  assert.strictEqual(marianneThread?.messages.length, DEFAULT_USER_THREADS.find(t => t.userId === 'user-marianne')?.messages.length);
});

test('searchUserThreads finds colleague chat by topic keyword or name', () => {
  // Search by keyword "viáticos"
  const viaticosResults = searchUserThreads(DEFAULT_USER_THREADS, 'viáticos');
  assert.ok(viaticosResults.some(t => t.userId === 'user-frances'));

  // Search by coworker name "Eliza"
  const elizaResults = searchUserThreads(DEFAULT_USER_THREADS, 'Eliza');
  assert.ok(elizaResults.some(t => t.userId === 'user-eliza'));

  // Search by keyword "contraseñas"
  const passResults = searchUserThreads(DEFAULT_USER_THREADS, 'contraseñas');
  assert.ok(passResults.some(t => t.userId === 'user-tommy'));
});
