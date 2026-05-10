/**
 * Livematch.com.ng - Professional Football Streaming Website
 * Main JavaScript File with Firebase Integration
 */

// Firebase Chat instance
let firebaseChat = null;

document.addEventListener('DOMContentLoaded', () => {
  // ===== DOM ELEMENTS =====
  const elements = {
    // Stream
    playerOverlay: document.getElementById('playerOverlay'),
    refreshBtn: document.getElementById('refreshBtn'),
    altLinksBtn: document.getElementById('altLinksBtn'),
    
    // Chat
    chatBox: document.getElementById('chat-box'),
    messagesList: document.getElementById('messages'),
    messageForm: document.getElementById('message-form'),
    messageInput: document.getElementById('message-input'),
    chatScrollHint: document.getElementById('chatScrollHint'),
    
    // Auth
    googleSigninBtn: document.getElementById('google-signin'),
    logoutBtn: document.getElementById('logout'),
    userProfile: document.getElementById('user-profile'),
    userAvatar: document.getElementById('user-avatar'),
    userName: document.getElementById('user-name'),
    
    // UI
    themeToggle: document.getElementById('themeToggle'),
    mobileMenuToggle: document.getElementById('mobileMenuToggle'),
    mobileMenuOverlay: document.getElementById('mobileMenuOverlay'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage'),
    userCount: document.getElementById('userCount'),
    
    // Particles
    particlesContainer: document.getElementById('particles')
  };

  // ===== STATE =====
  const state = {
    isDarkMode: true,
    isUserLoggedIn: false,
    isChatAtBottom: true,
    currentUser: null
  };

  // ===== INITIALIZATION =====
  init();

  function init() {
    createParticles();
    setupEventListeners();
    applySavedTheme();
    
    // Setup auth state listener first to ensure UI updates regardless of chat status
    setupAuthListener();

    // Initialize Firebase Chat with error handling
    try {
      firebaseChat = new FirebaseChat(
        elements.messagesList,
        elements.chatBox,
        elements.messageInput,
        elements.messageForm
      );
      window.firebaseChat = firebaseChat;
      firebaseChat.init();
    } catch (error) {
      console.error('Failed to initialize Firebase Chat:', error);
    }
    
    // Listen for online user count
    if (firebaseChat) {
      firebaseChat.getOnlineUserCount((count) => {
        if (elements.userCount) {
          elements.userCount.textContent = count.toLocaleString();
        }
      });
    }
  }

  // ===== FIREBASE AUTH LISTENER =====
  function setupAuthListener() {
    firebase.auth().onAuthStateChanged((user) => {
      state.currentUser = user;
      if (user) {
        state.isUserLoggedIn = true;
        updateAuthUI(user);
        showToast(`👋 Welcome, ${user.displayName || 'User'}!`);
      } else {
        state.isUserLoggedIn = false;
        updateAuthUI(null);
      }
    });
  }

  // ===== PARTICLES ANIMATION =====
  function createParticles() {
    if (!elements.particlesContainer) return;
    
    const particleCount = window.innerWidth > 768 ? 30 : 15;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      
      // Random properties
      const size = Math.random() * 4 + 2;
      const posX = Math.random() * 100;
      const delay = Math.random() * 15;
      const duration = Math.random() * 10 + 10;
      
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${posX}%`;
      particle.style.animationDelay = `${delay}s`;
      particle.style.animationDuration = `${duration}s`;
      particle.style.opacity = Math.random() * 0.4 + 0.1;
      
      elements.particlesContainer.appendChild(particle);
    }
  }

  // ===== EVENT LISTENERS =====
  function setupEventListeners() {
    // Stream controls
    elements.refreshBtn?.addEventListener('click', refreshStream);
    elements.altLinksBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('🔗 Alternative links opened in new tab');
    });

    // Chat functionality
    elements.messageForm?.addEventListener('submit', handleSendMessage);
    elements.chatBox?.addEventListener('scroll', handleChatScroll);
    elements.chatScrollHint?.addEventListener('click', scrollToBottom);

    // Auth buttons
    elements.googleSigninBtn?.addEventListener('click', handleGoogleSignin);
    elements.logoutBtn?.addEventListener('click', handleLogout);

    // Theme toggle
    elements.themeToggle?.addEventListener('click', toggleTheme);

    // Mobile menu
    elements.mobileMenuToggle?.addEventListener('click', toggleMobileMenu);
    elements.mobileMenuOverlay?.addEventListener('click', (e) => {
      if (e.target === elements.mobileMenuOverlay) {
        toggleMobileMenu();
      }
    });

    // Responsive: handle window resize
    window.addEventListener('resize', debounce(() => {
      if (elements.particlesContainer) {
        elements.particlesContainer.innerHTML = '';
        createParticles();
      }
    }, 250));

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && elements.mobileMenuOverlay?.classList.contains('active')) {
        toggleMobileMenu();
      }
      // Ctrl+Enter to send message
      if (e.key === 'Enter' && e.ctrlKey && elements.messageInput?.value.trim()) {
        elements.messageForm?.requestSubmit();
      }
    });
  }

  // ===== STREAM FUNCTIONS =====
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

  // ===== CHAT FUNCTIONS =====
  function handleSendMessage(e) {
    e.preventDefault();
    
    if (!state.isUserLoggedIn) {
      showToast('⚠️ Please sign in to send messages');
      return;
    }

    const message = elements.messageInput?.value.trim();
    if (!message) return;

    // Send via Firebase
    if (firebaseChat) {
      firebaseChat.sendMessage(message).then((success) => {
        if (success) {
          showToast('💬 Message sent!');
          scrollToBottom();
        } else {
          showToast('❌ Failed to send message');
        }
      });
    }
  }

  function handleChatScroll() {
    if (!elements.chatBox) return;
    
    const { scrollTop, scrollHeight, clientHeight } = elements.chatBox;
    state.isChatAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    if (state.isChatAtBottom) {
      elements.chatScrollHint?.classList.remove('visible');
    }
  }

  function scrollToBottom() {
    if (elements.chatBox) {
      elements.chatBox.scrollTo({
        top: elements.chatBox.scrollHeight,
        behavior: 'smooth'
      });
      state.isChatAtBottom = true;
      elements.chatScrollHint?.classList.remove('visible');
    }
  }

  // ===== AUTH FUNCTIONS =====
  function handleGoogleSignin(e) {
    if (e) e.preventDefault();
    console.log('Initiating Google Sign-in...');
    
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(() => firebase.auth().signInWithPopup(provider))
      .then((result) => {
        showToast(`✅ Signed in as ${result.user.displayName}`);
      })
      .catch((error) => {
        console.error('Auth Error:', error.code, error.message);
        showToast(`❌ Sign-in failed: ${error.message}`);
      });
  }

  function handleLogout(e) {
    if (e) e.preventDefault();
    
    firebase.auth().signOut()
      .then(() => {
        showToast('👋 You have been logged out');
      })
      .catch((error) => {
        console.error('Logout error:', error);
        showToast('❌ Logout failed');
      });
  }

  function updateAuthUI(user) {
    if (user) {
      // User is logged in
      elements.googleSigninBtn?.style.display = 'none';
      if (elements.userProfile) {
        elements.userProfile.style.display = 'flex';
        if (elements.userAvatar && user.photoURL) {
          elements.userAvatar.src = user.photoURL;
        }
        if (elements.userName) {
          elements.userName.textContent = user.displayName || user.email;
        }
      }
    } else {
      // User is logged out
      elements.googleSigninBtn?.style.display = 'flex';
      if (elements.userProfile) {
        elements.userProfile.style.display = 'none';
      }
    }
  }

  // ===== THEME FUNCTIONS =====
  function toggleTheme() {
    state.isDarkMode = !state.isDarkMode;
    document.documentElement.setAttribute('data-theme', state.isDarkMode ? 'dark' : 'light');
    
    if (elements.themeToggle) {
      const icon = elements.themeToggle.querySelector('i');
      if (icon) {
        icon.className = state.isDarkMode ? 'fas fa-moon' : 'fas fa-sun';
      }
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
        if (icon) {
          icon.className = state.isDarkMode ? 'fas fa-moon' : 'fas fa-sun';
        }
      }
    }
  }

  // ===== MOBILE MENU =====
  function toggleMobileMenu() {
    elements.mobileMenuOverlay?.classList.toggle('active');
    document.body.style.overflow = elements.mobileMenuOverlay?.classList.contains('active') ? 'hidden' : '';
  }

  // ===== TOAST NOTIFICATIONS =====
  function showToast(message, duration = 3000) {
    if (!elements.toast || !elements.toastMessage) return;
    
    elements.toastMessage.textContent = message;
    elements.toast.classList.add('show');
    
    setTimeout(() => {
      elements.toast.classList.remove('show');
    }, duration);
  }

  // ===== UTILITY FUNCTIONS =====
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
});