/**
 * Livematch.com.ng - Complete JavaScript Bundle
 * Combines: Firebase Config, Firebase Chat Class, and Main App Logic
 * Usage: Replace existing script tags with this single file (e.g., main.js)
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

try {
  firebase.initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

// Expose services globally for compat usage
window.firebaseAuth = firebase.auth();
window.firebaseDb = firebase.firestore();

// ==========================================
// 2. FIREBASE CHAT CLASS
// ==========================================
class FirebaseChat {
  constructor(messagesList, chatBox, messageInput, messageForm) {
    this.messagesList = messagesList;
    this.chatBox = chatBox;
    this.messageInput = messageInput;
    this.messageForm = messageForm;
    this.currentUser = null;
    this.messagesRef = firebase.firestore().collection('matches').doc('live-match').collection('messages');
    this.unsubscribe = null;
    this.loadedMessageIds = new Set();
  }

  init() {
    firebase.auth().onAuthStateChanged((user) => {
      this.currentUser = user;
      if (user) {
        console.log('👤 User logged in:', user.displayName);
        this.listenToMessages();
        this.setUserPresence(true);
      } else {
        console.log('🚪 User logged out');
        if (this.unsubscribe) this.unsubscribe();
        this.setUserPresence(false);
      }
    });
  }

  listenToMessages() {
    if (this.unsubscribe) this.unsubscribe();
    
    this.unsubscribe = this.messagesRef
      .orderBy('timestamp', 'desc')
      .limit(50)
      .onSnapshot(
        (snapshot) => {
          const messages = [];
          snapshot.forEach((doc) => messages.unshift(doc.data()));
          
          if (this.messagesList) {
            messages.forEach((msg) => {
              if (!this.loadedMessageIds.has(msg.id)) {
                this.addMessageToUI(msg);
                this.loadedMessageIds.add(msg.id);
              }
            });
          }
          this.scrollToBottom();
        },
        (error) => console.error('🔥 Error listening to messages:', error)
      );
  }

  async sendMessage(text) {
    if (!this.currentUser || !text.trim()) {
      console.warn('⚠️ User not logged in or message is empty');
      return false;
    }
    try {
      const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await this.messagesRef.add({
        id: messageId,
        userId: this.currentUser.uid,
        username: this.currentUser.displayName || 'Anonymous',
        userEmail: this.currentUser.email,
        userAvatar: this.currentUser.photoURL || null,
        text: text.trim(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        likes: 0,
        edited: false
      });

      if (this.messageInput) this.messageInput.value = '';
      console.log('✅ Message sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return false;
    }
  }

  addMessageToUI(message) {
    if (!this.messagesList) return;
    
    const messageEl = document.createElement('li');
    messageEl.className = 'message-item';
    messageEl.dataset.messageId = message.id;

    const isCurrentUser = this.currentUser && this.currentUser.uid === message.userId;
    const avatarUrl = message.userAvatar || this.getDefaultAvatar(message.username);
    const timestamp = message.timestamp 
      ? message.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : 'now';

    messageEl.innerHTML = `
      <div class="message-avatar">
        <img src="${avatarUrl}" alt="${message.username}" title="${message.username}">
      </div>
      <div class="message-content">
        <div class="message-header">
          <span class="message-username">${this.escapeHtml(message.username)}</span>
          ${isCurrentUser ? '<span class="message-badge">You</span>' : ''}
          <span class="message-time">${timestamp}</span>
          ${message.edited ? '<span class="message-edited">(edited)</span>' : ''}
        </div>
        <p class="message-text">${this.escapeHtml(message.text)}</p>
      </div>
      ${isCurrentUser ? `
        <div class="message-actions">
          <button class="msg-delete" onclick="window.firebaseChat.deleteMessage('${message.id}')" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      ` : ''}
    `;
    
    this.messagesList.appendChild(messageEl);

    // DOM Performance: Limit rendered messages to 100
    if (this.messagesList.children.length > 100) {
      const oldMsg = this.messagesList.children[0];
      if (oldMsg.dataset.messageId) this.loadedMessageIds.delete(oldMsg.dataset.messageId);
      oldMsg.remove();
    }
  }

  async deleteMessage(messageId) {
    if (!confirm('Delete this message?')) return;
    try {
      const snapshot = await this.messagesRef.where('id', '==', messageId).get();
      snapshot.forEach((doc) => doc.ref.delete());
      console.log('🗑️ Message deleted');
    } catch (error) {
      console.error('❌ Error deleting message:', error);
    }
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

  getDefaultAvatar(username) {
    const initials = username.substring(0, 2).toUpperCase();
    const bgColor = this.stringToColor(username);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bgColor.substring(1)}&color=fff&size=40`;
  }

  stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  }

  scrollToBottom() {
    if (this.chatBox) {
      setTimeout(() => {
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
      }, 0);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

window.FirebaseChat = FirebaseChat;

// ==========================================
// 3. MAIN APPLICATION LOGIC
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    playerOverlay: document.getElementById('playerOverlay'),
    refreshBtn: document.getElementById('refreshBtn'),
    altLinksBtn: document.getElementById('altLinksBtn'),
    chatBox: document.getElementById('chat-box'),
    messagesList: document.getElementById('messages'),
    messageForm: document.getElementById('message-form'),
    messageInput: document.getElementById('message-input'),
    chatScrollHint: document.getElementById('chatScrollHint'),
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
    currentUser: null
  };

  let firebaseChatInstance = null;

  // Initialize App
  init();

  function init() {
    createParticles();
    setupEventListeners();
    applySavedTheme();
    setupAuthListener();

    // Initialize Firebase Chat
    try {
      firebaseChatInstance = new FirebaseChat(
        elements.messagesList,
        elements.chatBox,
        elements.messageInput,
        elements.messageForm
      );
      window.firebaseChat = firebaseChatInstance; // Expose for inline onclick handlers
      firebaseChatInstance.init();
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Chat:', error);
    }

    // Online user counter
    if (firebaseChatInstance) {
      firebaseChatInstance.getOnlineUserCount((count) => {
        if (elements.userCount) {
          const countSpan = elements.userCount.querySelector('span');
          if (countSpan) countSpan.textContent = count.toLocaleString();
        }
      });
    }
  }

  // Auth State Listener
  function setupAuthListener() {
    firebase.auth().onAuthStateChanged((user) => {
      state.currentUser = user;
      state.isUserLoggedIn = !!user;
      updateAuthUI(user);
      if (user) showToast(`👋 Welcome, ${user.displayName || 'User'}!`);
    });
  }

  // Particle Animation
  function createParticles() {
    if (!elements.particlesContainer) return;
    const particleCount = window.innerWidth > 768 ? 30 : 15;
    elements.particlesContainer.innerHTML = '';
    
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

  // Event Listeners Setup
  function setupEventListeners() {
    elements.refreshBtn?.addEventListener('click', refreshStream);
    elements.altLinksBtn?.addEventListener('click', (e) => { 
      e.preventDefault(); 
      showToast('🔗 Alternative links opened in new tab'); 
    });
    
    elements.messageForm?.addEventListener('submit', handleSendMessage);
    elements.chatBox?.addEventListener('scroll', handleChatScroll);
    elements.chatScrollHint?.addEventListener('click', scrollToBottom);
    elements.googleSigninBtn?.addEventListener('click', handleGoogleSignin);
    
    elements.logoutBtn?.addEventListener('click', handleLogout);
    elements.themeToggle?.addEventListener('click', toggleTheme);
    
    elements.mobileMenuToggle?.addEventListener('click', toggleMobileMenu);
    elements.mobileMenuOverlay?.addEventListener('click', (e) => {
      if (e.target === elements.mobileMenuOverlay) toggleMobileMenu();
    });

    window.addEventListener('resize', debounce(() => createParticles(), 250));

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

  // Chat Functions
  function handleSendMessage(e) {
    e.preventDefault();
    if (!state.isUserLoggedIn) {
      showToast('⚠️ Please sign in to send messages');
      return;
    }
    const message = elements.messageInput?.value.trim();
    if (!message) return;

    if (firebaseChatInstance) {
      firebaseChatInstance.sendMessage(message).then((success) => {
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
    if (state.isChatAtBottom) elements.chatScrollHint?.classList.remove('visible');
  }

  function scrollToBottom() {
    if (elements.chatBox) {
      elements.chatBox.scrollTo({ top: elements.chatBox.scrollHeight, behavior: 'smooth' });
      state.isChatAtBottom = true;
      elements.chatScrollHint?.classList.remove('visible');
    }
  }

  // Auth Functions
  function handleGoogleSignin(e) {
    if (e) e.preventDefault();
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
    if (e) e.preventDefault();
    firebase.auth().signOut()
      .catch((error) => showToast('❌ Logout failed'));
  }

  function updateAuthUI(user) {
    if (user) {
      elements.googleSigninBtn?.style.display = 'none';
      if (elements.userProfile) {
        elements.userProfile.style.display = 'flex';
        if (elements.userAvatar && user.photoURL) elements.userAvatar.src = user.photoURL;
        if (elements.userName) elements.userName.textContent = user.displayName || user.email;
      }
    } else {
      elements.googleSigninBtn?.style.display = 'flex';
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

  // Toast Notifications
  function showToast(message, duration = 3000) {
    if (!elements.toast || !elements.toastMessage) return;
    elements.toastMessage.textContent = message;
    elements.toast.classList.add('show');
    setTimeout(() => elements.toast.classList.remove('show'), duration);
  }

  // Utility: Debounce
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
});
