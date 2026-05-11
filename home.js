/**
 * Livematch.com.ng - Complete JavaScript Bundle
 * Fixed: Firebase initialization + Google Sign-In (popup method)
 */

// ==========================================
// 1. FIREBASE CONFIGURATION & INITIALIZATION
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCGVQc5OP4k9AXlkK6Ld98yvBmODuc0d60",
  authDomain: "chatapp-5afff.firebaseapp.com",
  databaseURL: "https://chatapp-5afff-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "chatapp-5afff",
  storageBucket: "chatapp-5afff.firebasestorage.app",
  messagingSenderId: "835710769608",
  appId: "1:835710769608:web:ae974aeab8745fdea848fd",
  measurementId: "G-V6BH65CXV5"
};

// Initialize Firebase (only once)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
}

// Expose services globally for compatibility
window.firebaseAuth = firebase.auth();
window.firebaseDb = firebase.firestore();

class FirebaseChat {
  constructor() {
    this.currentUser = firebase.auth().currentUser;
  }

  async setUserPresence(isOnline) {
    if (!this.currentUser) return;
    try {
      const presenceRef = firebase.firestore().collection('presence').doc(this.currentUser.uid);
      
      if (isOnline) {
        await presenceRef.set({
          userId: this.currentUser.uid,
          username: this.currentUser.displayName,
          userAvatar: this.currentUser.photoURL,
          lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
          online: true
        }, { merge: true });
      } else {
        await presenceRef.update({
          online: false,
          lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch (error) {
      console.error('❌ Error updating presence:', error);
    }
  }

  getOnlineUserCount(callback) {
    firebase.firestore().collection('presence')
      .where('online', '==', true)
      .onSnapshot((snapshot) => callback(snapshot.size));
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// ==========================================
// 3. MAIN APPLICATION LOGIC
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const elements = {
    playerOverlay: document.getElementById('playerOverlay'),
    refreshBtn: document.getElementById('refreshBtn'),
    // Removed chat-related elements
    googleSigninBtn: document.getElementById('google-signin'),
    logoutBtn: document.getElementById('logout'),
    userProfile: document.getElementById('user-profile'),
    userAvatar: document.getElementById('user-avatar'),
    userName: document.getElementById('user-name'),
    themeToggle: document.getElementById('themeToggle'),
    mobileMenuToggle: document.getElementById('mobileMenuToggle'),
    mobileMenuOverlay: document.getElementById('mobileMenuOverlay'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage'),
    userCount: document.getElementById('userCount'),
    particlesContainer: document.getElementById('particles')
  };

  const state = {
    isDarkMode: true,
    isUserLoggedIn: false,
    isChatAtBottom: true,
  };

  let firebaseChat = new FirebaseChat();

  // Initialize everything
  init();

  function init() {
    createParticles();
    setupEventListeners();
    applySavedTheme();
    setupAuthListener();
    // Online user counter
    firebaseChat.getOnlineUserCount((count) => {
      if (elements.userCount) {
        elements.userCount.textContent = count.toLocaleString();
      }
    });
  }

  // Auth State Listener
  function setupAuthListener() {
    firebase.auth().onAuthStateChanged((user) => {
      firebaseChat.currentUser = user;
      state.isUserLoggedIn = !!user;
      updateAuthUI(user);
      if (user) showToast(`👋 Welcome, ${user.displayName || 'User'}!`);
    });
  }

  // Particle Animation
  function createParticles() {
    if (!elements.particlesContainer) return;
    elements.particlesContainer.innerHTML = '';
    const particleCount = window.innerWidth > 768 ? 30 : 15;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      const size = Math.random() * 4 + 2;
      particle.style.cssText = `
        width: ${size}px; height: ${size}px;
        left: ${Math.random() * 100}%;
        animation-delay: ${Math.random() * 15}s;
        animation-duration: ${Math.random() * 10 + 10}s;
        opacity: ${Math.random() * 0.4 + 0.1};
      `;
      elements.particlesContainer.appendChild(particle);
    }
  }

  // Event Listeners
  function setupEventListeners() {
    elements.refreshBtn?.addEventListener('click', refreshStream);
    
    elements.googleSigninBtn?.addEventListener('click', handleGoogleSignin);
    elements.logoutBtn?.addEventListener('click', handleLogout);
    elements.themeToggle?.addEventListener('click', toggleTheme);
    
    elements.mobileMenuToggle?.addEventListener('click', toggleMobileMenu);
    elements.mobileMenuOverlay?.addEventListener('click', (e) => {
      if (e.target === elements.mobileMenuOverlay) toggleMobileMenu();
    });

    window.addEventListener('resize', debounce(() => {
      if (elements.particlesContainer) {
        elements.particlesContainer.innerHTML = '';
        createParticles();
      }
    }, 250));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && elements.mobileMenuOverlay?.classList.contains('active')) {
        toggleMobileMenu();
      }
      if (e.key === 'Enter' && e.ctrlKey && elements.messageInput?.value.trim()) {
        elements.messageForm?.requestSubmit();
      }
    });
  }

  // Stream Functions
  function refreshStream() {
    showToast('🔄 Refreshing stream...');
    const iframe = document.querySelector('.player-container iframe');
    if (iframe) {
      const src = iframe.src;
      iframe.src = 'about:blank';
      setTimeout(() => {
        iframe.src = src;
        elements.playerOverlay?.classList.remove('active');
        showToast('✅ Stream refreshed successfully!');
      }, 1500);
    }
  }

  // AUTHENTICATION - Fixed Google Sign-In (popup method)
  function handleGoogleSignin(e) {
    e.preventDefault();
    console.log('🔐 Initiating Google Sign-In...');
    
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    
    firebase.auth().signInWithPopup(provider)
      .then((result) => {
        console.log('✅ Sign-in successful:', result.user.displayName);
        showToast(`✅ Signed in as ${result.user.displayName}`);
      })
      .catch((error) => {
        console.error('❌ Sign-in error:', error.code, error.message);
        let msg = 'Sign-in failed. ';
        if (error.code === 'auth/popup-blocked') msg += 'Please allow popups for this site.';
        else if (error.code === 'auth/unauthorized-domain') msg += 'Domain not authorized in Firebase Console.';
        else msg += error.message;
        showToast(msg);
      });
  }

  function handleLogout(e) {
    e.preventDefault();
    firebase.auth().signOut()
      .then(() => showToast('👋 You have been logged out'))
      .catch((error) => {
        console.error('Logout error:', error);
        showToast('❌ Logout failed');
      });
  }

  function updateAuthUI(user) {
    if (user) {
      if (elements.googleSigninBtn) elements.googleSigninBtn.style.display = 'none';
      if (elements.userProfile) {
        elements.userProfile.style.display = 'flex';
        if (elements.userAvatar && user.photoURL) elements.userAvatar.src = user.photoURL;
        if (elements.userName) elements.userName.textContent = user.displayName || user.email;
      }
    } else {
      if (elements.googleSigninBtn) elements.googleSigninBtn.style.display = 'flex';
      if (elements.userProfile) elements.userProfile.style.display = 'none';
    }
  }

  // Theme Functions
  function toggleTheme() {
    state.isDarkMode = !state.isDarkMode;
    document.documentElement.setAttribute('data-theme', state.isDarkMode ? 'dark' : 'light');
    if (elements.themeToggle) {
      const icon = elements.themeToggle.querySelector('i');
      if (icon) icon.className = state.isDarkMode ? 'fas fa-moon' : 'fas fa-sun';
    }
    localStorage.setItem('livematch-theme', state.isDarkMode ? 'dark' : 'light');
    showToast(state.isDarkMode ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
  }

  function applySavedTheme() {
    const savedTheme = localStorage.getItem('livematch-theme');
    if (savedTheme) {
      state.isDarkMode = savedTheme === 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
      if (elements.themeToggle) {
        const icon = elements.themeToggle.querySelector('i');
        if (icon) icon.className = state.isDarkMode ? 'fas fa-moon' : 'fas fa-sun';
      }
    }
  }

  // Mobile Menu
  function toggleMobileMenu() {
    elements.mobileMenuOverlay?.classList.toggle('active');
    document.body.style.overflow = elements.mobileMenuOverlay?.classList.contains('active') ? 'hidden' : '';
  }

  // Toast
  function showToast(message, duration = 3000) {
    if (!elements.toast || !elements.toastMessage) return;
    elements.toastMessage.textContent = message;
    elements.toast.classList.add('show');
    setTimeout(() => elements.toast.classList.remove('show'), duration);
  }

  // Debounce
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
});
