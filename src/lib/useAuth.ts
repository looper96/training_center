import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { auth, db } from './firebase';
import { nowISO } from './date';
import { buildDefaultPermissions, type SystemUser } from '../types/pipeline';

/**
 * Creates `users/{uid}` on first sign-in. The very first account in a fresh
 * project claims `config/bootstrap` and becomes admin; everyone after that starts
 * as `pending` with no access until an admin activates them. An existing profile
 * is never modified here, so admin-assigned roles survive later sign-ins.
 */
async function ensureProfile(fu: FirebaseUser): Promise<void> {
  const userRef = doc(db, 'users', fu.uid);
  const bootRef = doc(db, 'config', 'bootstrap');
  await runTransaction(db, async tx => {
    const existing = await tx.get(userRef);
    if (existing.exists()) return;
    const boot = await tx.get(bootRef);
    const ts = nowISO();
    const base = {
      userId: fu.uid,
      email: (fu.email || '').toLowerCase(),
      displayName: fu.displayName || fu.email?.split('@')[0] || 'کاربر',
      photoURL: fu.photoURL || '',
      createdAt: ts,
      updatedAt: ts,
    };
    if (!boot.exists()) {
      tx.set(bootRef, { adminUid: fu.uid, createdAt: ts });
      tx.set(userRef, { ...base, role: 'admin', status: 'active', sectionPermissions: buildDefaultPermissions('admin') });
    } else {
      tx.set(userRef, { ...base, role: 'trainer', status: 'pending' });
    }
  });
}

export type AuthState =
  | { phase: 'loading' }
  | { phase: 'signed-out' }
  | { phase: 'error'; firebaseUser: FirebaseUser; message: string }
  | { phase: 'ready'; firebaseUser: FirebaseUser; profile: SystemUser };

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ phase: 'loading' });

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    const unsubAuth = onAuthStateChanged(auth, async fu => {
      unsubProfile?.();
      unsubProfile = undefined;
      if (!fu) {
        setState({ phase: 'signed-out' });
        return;
      }
      setState({ phase: 'loading' });
      try {
        await ensureProfile(fu);
      } catch (err) {
        console.error('[auth] profile creation failed', err);
        setState({ phase: 'error', firebaseUser: fu, message: 'ایجاد پروفایل کاربری با خطا مواجه شد.' });
        return;
      }
      unsubProfile = onSnapshot(
        doc(db, 'users', fu.uid),
        snap => {
          if (snap.exists()) setState({ phase: 'ready', firebaseUser: fu, profile: snap.data() as SystemUser });
          else setState({ phase: 'error', firebaseUser: fu, message: 'پروفایل کاربری شما حذف شده است. با مدیر سامانه تماس بگیرید.' });
        },
        err => {
          console.error('[auth] profile listener failed', err);
          setState({ phase: 'error', firebaseUser: fu, message: 'دریافت پروفایل کاربری ممکن نشد.' });
        }
      );
    });
    return () => {
      unsubProfile?.();
      unsubAuth();
    };
  }, []);

  return state;
}

export const logout = () => signOut(auth);
