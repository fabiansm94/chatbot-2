import { ChatMessage, UserChatThread } from '../types/manual';

export const DEFAULT_USER_THREADS: UserChatThread[] = [
  {
    userId: 'current-user',
    userName: 'Tú',
    userRole: 'Mi Perfil de Empleado',
    department: 'Mi Cuenta',
    initials: 'TU',
    bgGradient: 'from-amber-400 via-rose-500 to-red-500',
    isCurrentUser: true,
    lastActive: 'Ahora',
    messages: []
  }
];

export function getUserThread(threads: UserChatThread[], userId: string): UserChatThread | undefined {
  return threads.find(t => t.userId === userId);
}

export function appendUserMessage(
  threads: UserChatThread[],
  userId: string,
  message: ChatMessage
): UserChatThread[] {
  return threads.map(thread => {
    if (thread.userId === userId) {
      return {
        ...thread,
        messages: [...thread.messages, message],
        lastActive: 'Ahora'
      };
    }
    return thread;
  });
}

export function searchUserThreads(threads: UserChatThread[], query: string): UserChatThread[] {
  if (!query || !query.trim()) return threads;
  const q = query.toLowerCase().trim();

  return threads.filter(thread => {
    if (thread.userName.toLowerCase().includes(q)) return true;
    if (thread.department.toLowerCase().includes(q)) return true;
    if (thread.userRole.toLowerCase().includes(q)) return true;
    return thread.messages.some(
      m => m.content.toLowerCase().includes(q)
    );
  });
}
