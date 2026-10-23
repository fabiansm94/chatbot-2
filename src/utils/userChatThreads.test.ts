import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_USER_THREADS,
  getUserThread,
  appendUserMessage,
  searchUserThreads
} from '../data/userChatThreads';
import { ChatMessage, UserChatThread } from '../types/manual';

test('DEFAULT_USER_THREADS provides default current-user thread', () => {
  assert.ok(DEFAULT_USER_THREADS.length >= 1);
  const currentUserThread = DEFAULT_USER_THREADS.find(t => t.isCurrentUser);
  assert.ok(currentUserThread, 'Current user thread must exist');
  assert.strictEqual(currentUserThread?.userId, 'current-user');
});

test('getUserThread retrieves exact thread by userId', () => {
  const thread = getUserThread(DEFAULT_USER_THREADS, 'current-user');
  assert.ok(thread);
  assert.strictEqual(thread?.userId, 'current-user');
});

test('appendUserMessage updates only the target thread without mutating others', () => {
  const newMsg: ChatMessage = {
    id: 'test-1',
    role: 'user',
    content: '¿Cómo se hace el relevo de turno?',
    timestamp: Date.now()
  };

  const updated = appendUserMessage(DEFAULT_USER_THREADS, 'current-user', newMsg);
  const userThread = updated.find(t => t.userId === 'current-user');
  assert.ok(userThread?.messages.some(m => m.id === 'test-1'));
});

test('searchUserThreads finds chat by query keyword or name', () => {
  const sampleThreads: UserChatThread[] = [
    {
      userId: 'user-jeremy',
      userName: 'Jeremy',
      userRole: 'Operador de Monitoreo',
      department: 'Centro de Control',
      initials: 'JE',
      bgGradient: 'from-blue-500 to-indigo-600',
      isCurrentUser: false,
      lastActive: 'Hace 5m',
      messages: [{ id: 'm1', role: 'user', content: 'Consulta de bitácora', timestamp: Date.now() }]
    }
  ];

  const results = searchUserThreads(sampleThreads, 'bitácora');
  assert.equal(results.length, 1);
  assert.equal(results[0].userId, 'user-jeremy');
});
