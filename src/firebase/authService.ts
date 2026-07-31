import { 
  signInWithPopup, 
  signInAnonymously, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, database, googleProvider, isFirebaseConfigured } from './config';
import { UserProfile } from '../types';

const LOCAL_USER_KEY = 'attendance_local_user';

export async function loginWithGoogle(): Promise<UserProfile> {
  if (auth && isFirebaseConfigured) {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const profile: UserProfile = {
      uid: user.uid,
      name: user.displayName || 'Office User',
      email: user.email,
      photoURL: user.photoURL,
      isAnonymous: user.isAnonymous,
      createdAt: new Date().toISOString(),
    };
    await saveUserProfileToDb(profile);
    return profile;
  } else {
    // Local mode demo login
    const profile: UserProfile = {
      uid: 'local-demo-user-123',
      name: 'Alex Johnson',
      email: 'alex.johnson@example.com',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      isAnonymous: false,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
    return profile;
  }
}

export async function loginAsGuest(): Promise<UserProfile> {
  if (auth && isFirebaseConfigured) {
    const result = await signInAnonymously(auth);
    const user = result.user;
    const profile: UserProfile = {
      uid: user.uid,
      name: `Guest (${user.uid.slice(0, 5)})`,
      email: null,
      photoURL: null,
      isAnonymous: true,
      createdAt: new Date().toISOString(),
    };
    await saveUserProfileToDb(profile);
    return profile;
  } else {
    const profile: UserProfile = {
      uid: `guest-${Date.now()}`,
      name: 'Guest User',
      email: null,
      photoURL: null,
      isAnonymous: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
    return profile;
  }
}

export async function logoutUser(): Promise<void> {
  if (auth && isFirebaseConfigured) {
    await firebaseSignOut(auth);
  }
  localStorage.removeItem(LOCAL_USER_KEY);
}

export async function saveUserProfileToDb(profile: UserProfile): Promise<void> {
  if (database && isFirebaseConfigured) {
    try {
      const userRef = ref(database, `users/${profile.uid}`);
      await set(userRef, {
        name: profile.name,
        email: profile.email || '',
        photoURL: profile.photoURL || '',
        isAnonymous: profile.isAnonymous || false,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Error saving user profile to Realtime Database:', e);
    }
  }
}

export function subscribeToAuth(callback: (user: UserProfile | null) => void) {
  if (auth && isFirebaseConfigured) {
    return onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        let name = user.displayName || (user.isAnonymous ? 'Guest User' : 'Office User');
        let email = user.email;
        let photoURL = user.photoURL;

        // Try reading user profile from Realtime DB
        if (database) {
          try {
            const snapshot = await get(ref(database, `users/${user.uid}`));
            if (snapshot.exists()) {
              const val = snapshot.val();
              name = val.name || name;
              email = val.email || email;
              photoURL = val.photoURL || photoURL;
            }
          } catch (e) {
            console.error('Failed to fetch user profile:', e);
          }
        }

        callback({
          uid: user.uid,
          name,
          email,
          photoURL,
          isAnonymous: user.isAnonymous,
        });
      } else {
        callback(null);
      }
    });
  } else {
    // Local fallback listener
    const saved = localStorage.getItem(LOCAL_USER_KEY);
    if (saved) {
      try {
        callback(JSON.parse(saved));
      } catch (e) {
        callback(null);
      }
    } else {
      // Auto login guest in offline demo mode for quick testing
      const defaultUser: UserProfile = {
        uid: 'demo-user-default',
        name: 'Demo Office User',
        email: 'user@example.com',
        photoURL: '',
        isAnonymous: false,
      };
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(defaultUser));
      callback(defaultUser);
    }
    return () => {};
  }
}
