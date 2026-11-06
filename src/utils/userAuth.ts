import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { USERS } from '../data/users';

export interface AppUser {
  name: string;
  password: string;
}

const STORAGE_KEY_USERS = 'manualbot_custom_users_v1';

/**
 * Returns the current cached users list (from localStorage or default USERS)
 */
export function getLocalUsers(): AppUser[] {
  if (typeof window === 'undefined') return [...USERS];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[userAuth] Error reading local users:', e);
  }
  return [...USERS];
}

/**
 * Saves users list to localStorage
 */
export function setLocalUsers(users: AppUser[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (e) {
    console.warn('[userAuth] Error saving local users:', e);
  }
}

/**
 * Loads users from Firestore system_meta/users_credentials, seeding defaults if needed
 */
export async function loadUsersFromFirestore(): Promise<AppUser[]> {
  try {
    const ref = doc(db, 'system_meta', 'users_credentials');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.users) && data.users.length > 0) {
        setLocalUsers(data.users);
        return data.users;
      }
    }
    // Seed defaults if empty
    await setDoc(ref, { users: USERS });
    setLocalUsers(USERS);
    return [...USERS];
  } catch (err) {
    console.warn('[userAuth] Error loading users from Firestore, using local fallback:', err);
    return getLocalUsers();
  }
}

/**
 * Updates a user's password in both Firestore and localStorage
 */
export async function updateUserCode(userName: string, newCode: string): Promise<{ success: boolean; error?: string }> {
  const trimmedName = userName.trim();
  const trimmedCode = newCode.trim();

  if (!trimmedName) {
    return { success: false, error: 'Debes seleccionar un perfil de usuario.' };
  }
  if (!trimmedCode || trimmedCode.length < 3) {
    return { success: false, error: 'El código debe tener al menos 3 caracteres o dígitos.' };
  }

  try {
    // 1. Get current list
    const currentUsers = getLocalUsers();
    let updated = false;

    const newUsers = currentUsers.map(u => {
      if (u.name.toLowerCase() === trimmedName.toLowerCase()) {
        updated = true;
        return { ...u, password: trimmedCode };
      }
      return u;
    });

    if (!updated) {
      newUsers.push({ name: trimmedName, password: trimmedCode });
    }

    // 2. Save locally
    setLocalUsers(newUsers);

    // 3. Save to Firestore
    try {
      const ref = doc(db, 'system_meta', 'users_credentials');
      await setDoc(ref, { users: newUsers });
    } catch (fsErr) {
      console.warn('[userAuth] Could not update Firestore immediately:', fsErr);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al actualizar el código.' };
  }
}

/**
 * Finds a user by their code/password from a given users list
 */
export function findUserByCode(code: string, users: AppUser[] = getLocalUsers()): AppUser | undefined {
  if (!code) return undefined;
  const cleanCode = code.trim();
  return users.find(u => u.password === cleanCode);
}

/**
 * Capitalizes names properly for display (e.g. "juan carlos" -> "Juan Carlos")
 */
export function formatUserName(name: string): string {
  if (!name) return '';
  return name
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

