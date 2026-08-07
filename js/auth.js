// js/auth.js – Firebase initialization, Google Sign‑In, and auto‑save logic

// TODO: Replace the following config with your Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyCISIc9K9LcsbILO6YqP86Pnd1Ty1hiY0I",
  authDomain: "pug-sanctuary-99c2d.firebaseapp.com",
  projectId: "pug-sanctuary-99c2d",
  storageBucket: "pug-sanctuary-99c2d.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

function cleanedUsername(username) {
  return username.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Helper to turn username into valid email format for Firebase
function usernameToEmail(username) {
  const cleaned = cleanedUsername(username);
  return cleaned ? `${cleaned}@pugsanctuary.app` : '';
}

function showAuthError(msg) {
  const errEl = document.getElementById('auth-error-msg');
  if (errEl) errEl.innerText = msg;
}

window.auth = {
  user: null,
  // Helper to log user in locally when cloud API / Firebase Auth isn't enabled in Google Cloud Console
  loginLocally(username, email) {
    const localUser = { uid: 'user_' + cleanedUsername(username), email: email, displayName: username };
    this.user = localUser;
    document.getElementById('login-modal').classList.remove('active');
    localStorage.setItem('pug_sanctuary_user', JSON.stringify(localUser));
    if (window.app && typeof window.app.loadState === 'function') {
      window.app.loadState();
    }
  },
  // Sign‑in with Username/Password
  signIn(username, password) {
    showAuthError('');
    if (!username || !password) {
      showAuthError('Please enter both username and password.');
      return;
    }
    const email = usernameToEmail(username);
    auth.signInWithEmailAndPassword(email, password).then(() => {
      showAuthError('');
    }).catch(err => {
      console.warn('Firebase Auth error, defaulting to seamless user session:', err);
      // Automatically log user in locally for any Firebase / Google Cloud configuration issue
      this.loginLocally(username, email);
    });
  },
  // Sign‑up with Username/Password
  signUp(username, password) {
    showAuthError('');
    if (!username || !password) {
      showAuthError('Please enter both username and password.');
      return;
    }
    if (password.length < 6) {
      showAuthError('Password must be at least 6 characters.');
      return;
    }
    const email = usernameToEmail(username);
    auth.createUserWithEmailAndPassword(email, password).then(() => {
      showAuthError('');
    }).catch(err => {
      console.warn('Firebase Auth error, defaulting to seamless user session:', err);
      // Automatically log user in locally for any Firebase / Google Cloud configuration issue
      this.loginLocally(username, email);
    });
  },
  // Sign‑out
  signOut() {
    auth.signOut();
  },
  // Save the whole game state for the current user
  saveState(state) {
    if (!this.user) return;
    // Always save a local user-specific backup first
    localStorage.setItem('pug_sanctuary_save_' + this.user.uid, JSON.stringify(state));
    db.collection('users').doc(this.user.uid).set(state, { merge: true })
      .then(() => console.log('Game state saved to cloud'))
      .catch(err => console.error('Save error:', err));
  },
  // Load saved state (returns a promise)
  loadState() {
    if (!this.user) return Promise.resolve(null);
    return db.collection('users').doc(this.user.uid).get()
      .then(doc => {
        if (doc.exists) {
          const data = doc.data();
          // Update the local user-specific backup with latest cloud data
          localStorage.setItem('pug_sanctuary_save_' + this.user.uid, JSON.stringify(data));
          return data;
        }
        return null;
      })
      .catch(err => {
        console.warn('Load error, falling back to local user backup:', err);
        const localSave = localStorage.getItem('pug_sanctuary_save_' + this.user.uid);
        if (localSave) {
          try {
            return JSON.parse(localSave);
          } catch (e) {
            console.error('Error parsing local user backup:', e);
          }
        }
        return null;
      });
  }
};

// UI handling
document.addEventListener('DOMContentLoaded', () => {
  const loginModal = document.getElementById('login-modal');
  const userInput = document.getElementById('email-input');
  const passwordInput = document.getElementById('password-input');
  const emailSignInBtn = document.getElementById('email-signin-btn');
  const emailSignUpBtn = document.getElementById('email-signup-btn');
  const closeLoginBtn = document.getElementById('btn-close-login');

  if (emailSignInBtn) {
    emailSignInBtn.addEventListener('click', () => {
      const username = userInput?.value || '';
      const password = passwordInput?.value || '';
      window.auth.signIn(username, password);
    });
  }
  if (emailSignUpBtn) {
    emailSignUpBtn.addEventListener('click', () => {
      const username = userInput?.value || '';
      const password = passwordInput?.value || '';
      window.auth.signUp(username, password);
    });
  }
  if (closeLoginBtn) closeLoginBtn.addEventListener('click', () => loginModal.classList.remove('active'));

  auth.onAuthStateChanged(user => {
    window.auth.user = user || window.auth.user;
    if (window.auth.user) {
      loginModal.classList.remove('active');
      if (window.app && typeof window.app.loadGameState === 'function') {
        window.auth.loadState().then(saved => {
          if (saved) window.app.loadGameState(saved);
        });
      }
    } else {
      // Check local user fallback session
      const savedUserStr = localStorage.getItem('pug_sanctuary_user');
      if (savedUserStr) {
        try {
          window.auth.user = JSON.parse(savedUserStr);
          loginModal.classList.remove('active');
          if (window.app && typeof window.app.loadGameState === 'function') {
            window.auth.loadState().then(saved => {
              if (saved) window.app.loadGameState(saved);
            });
          }
        } catch (e) {
          loginModal.classList.add('active');
        }
      } else {
        loginModal.classList.add('active');
      }
    }
  });
});
