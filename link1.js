/**
 * Livematch.com.ng - Complete JavaScript Bundle
 * Updated & Debugged Version
 */

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

window.firebaseAuth = firebase.auth();
window.firebaseDb = firebase.firestore();

// ==========================================
// FIREBASE CHAT CLASS
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
    this.messageElements = new Map();
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

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.message-actions')) {
        this.closeOpenMenus();
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
          snapshot.docChanges().forEach((change) => {
            const msg = change.doc.data();
            if (change.type === 'added' && !this.loadedMessageIds.has(msg.id)) {
              this.addMessageToUI(msg);
              this.loadedMessageIds.add(msg.id);
            } else if (change.type === 'modified' && this.messageElements.has(msg.id)) {
              this.updateMessageInUI(msg);
            } else if (change.type === 'removed' && this.messageElements.has(msg.id)) {
              this.removeMessageFromUI(msg.id);
            }
          });
          this.scrollToBottom();
        },
        (error) => console.error('🔥 Error listening to messages:', error)
      );
  }

  async sendMessage(text) {
    if (!this.currentUser || !text.trim()) return false;

    try {
      const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const messageData = {
        id: messageId,
        userId: this.currentUser.uid,
        username: this.currentUser.displayName || 'Anonymous',
        userEmail: this.currentUser.email,
        userAvatar: this.currentUser.photoURL || null,
        text: text.trim(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        likes: 0,
        edited: false
      };

      await this.messagesRef.add(messageData);

      // Clear input immediately
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
          <div>
            <span class="message-username">${this.escapeHtml(message.username)}</span>
            ${isCurrentUser ? '<span class="message-badge">You</span>' : ''}
          </div>
          <div>
            <span class="message-time">${timestamp}</span>
            ${message.edited ? '<span class="message-edited">(edited)</span>' : ''}
          </div>
        </div>
        <p class="message-text">${this.escapeHtml(message.text)}</p>
      </div>
      ${isCurrentUser ? `
        <div class="message-actions">
          <button class="message-menu-btn" type="button" data-id="${message.id}" title="Message options">
            <i class="fas fa-ellipsis-v"></i>
          </button>
        </div>
      ` : ''}
    `;

    if (isCurrentUser) {
      const menuBtn = messageEl.querySelector('.message-menu-btn');
      if (menuBtn) {
        menuBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          this.toggleMessageMenu(messageEl, message.id, message.text);
        });
      }
    }

    this.messagesList.appendChild(messageEl);
    this.messageElements.set(message.id, messageEl);

    // Limit messages
    if (this.messagesList.children.length > 100) {
      const oldMsg = this.messagesList.children[0];
      if (oldMsg.dataset.messageId) {
        this.loadedMessageIds.delete(oldMsg.dataset.messageId);
        this.messageElements.delete(oldMsg.dataset.messageId);
      }
      oldMsg.remove();
    }
  }

  updateMessageInUI(message) {
    const existing = this.messageElements.get(message.id);
    if (!existing) return;

    const timeEl = existing.querySelector('.message-time');
    const editedEl = existing.querySelector('.message-edited');
    const textEl = existing.querySelector('.message-text');
    const usernameEl = existing.querySelector('.message-username');
    const avatarImg = existing.querySelector('.message-avatar img');

    if (usernameEl) usernameEl.textContent = this.escapeHtml(message.username);
    if (avatarImg) avatarImg.src = message.userAvatar || this.getDefaultAvatar(message.username);
    if (textEl) textEl.innerHTML = this.escapeHtml(message.text);
    if (timeEl) timeEl.textContent = message.timestamp ? message.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now';

    if (message.edited) {
      if (!editedEl) {
        const header = existing.querySelector('.message-header');
        if (header) {
          const span = document.createElement('span');
          span.className = 'message-edited';
          span.textContent = '(edited)';
          header.appendChild(span);
        }
      }
    } else if (editedEl) {
      editedEl.remove();
    }
  }

  removeMessageFromUI(messageId) {
    const existing = this.messageElements.get(messageId);
    if (!existing) return;
    existing.remove();
    this.messageElements.delete(messageId);
    this.loadedMessageIds.delete(messageId);
  }

  closeOpenMenus() {
    this.messagesList.querySelectorAll('.message-menu').forEach((menu) => menu.remove());
  }

  toggleMessageMenu(messageEl, messageId, messageText) {
    const actions = messageEl.querySelector('.message-actions');
    if (!actions) return;

    const existingMenu = actions.querySelector('.message-menu');
    if (existingMenu) {
      existingMenu.remove();
      return;
    }

    this.closeOpenMenus();

    const menu = document.createElement('div');
    menu.className = 'message-menu';
    menu.innerHTML = `
      <button type="button" class="message-menu-item message-edit" data-id="${messageId}">
        <i class="fas fa-edit"></i> Edit
      </button>
      <button type="button" class="message-menu-item message-delete" data-id="${messageId}">
        <i class="fas fa-trash-alt"></i> Delete
      </button>
    `;

    actions.appendChild(menu);

    menu.querySelector('.message-edit')?.addEventListener('click', (event) => {
      event.stopPropagation();
      this.editMessage(messageId, messageText);
      menu.remove();
    });

    menu.querySelector('.message-delete')?.addEventListener('click', (event) => {
      event.stopPropagation();
      this.deleteMessage(messageId);
      menu.remove();
    });
  }

  async editMessage(messageId, currentText) {
    const newText = prompt('Edit your message:', currentText);
    if (newText === null || !newText.trim()) return;

    try {
      const snapshot = await this.messagesRef.where('id', '==', messageId).get();
      snapshot.forEach((doc) => {
        doc.ref.update({ text: newText.trim(), edited: true });
      });
      console.log('✏️ Message updated');
    } catch (error) {
      console.error('❌ Error editing message:', error);
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
        await presenceRef.update({ online: false, lastSeen: firebase.firestore.FieldValue.serverTimestamp() });
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
      }, 10);
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
// MAIN APPLICATION LOGIC
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    playerOverlay: document.getElementById('playerOverlay'),
    refreshBtn: document.getElementById('refreshBtn'),
    bottomRefreshBtn: document.getElementById('bottomRefreshBtn'),
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

  init();

  function init() {
    createParticles();
    setupEventListeners();
    applySavedTheme();
    setupAuthListener();

    try {
      firebaseChatInstance = new FirebaseChat(
        elements.messagesList,
        elements.chatBox,
        elements.messageInput,
        elements.messageForm
      );
      window.firebaseChat = firebaseChatInstance;
      firebaseChatInstance.init();
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Chat:', error);
    }

    if (firebaseChatInstance) {
      firebaseChatInstance.getOnlineUserCount((count) => {
        if (elements.userCount) {
          const countSpan = elements.userCount.querySelector('span');
          if (countSpan) countSpan.textContent = count.toLocaleString();
        }
      });
    }
  }

  function setupAuthListener() {
    firebase.auth().onAuthStateChanged((user) => {
      state.currentUser = user;
      state.isUserLoggedIn = !!user;
      updateAuthUI(user);
      if (user) showToast(`👋 Welcome, ${user.displayName || 'User'}!`);
    });
  }

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

  function setupEventListeners() {
    elements.refreshBtn?.addEventListener('click', refreshStream);
    elements.bottomRefreshBtn?.addEventListener('click', refreshStream);
    
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
      if (e.key === 'Escape' && elements.mobileMenuOverlay?.classList.contains('active')) toggleMobileMenu();
      if (e.key === 'Enter' && e.ctrlKey && elements.messageInput?.value.trim()) {
        elements.messageForm?.requestSubmit();
      }
    });
  }

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
          // scrollToBottom() is now handled in onSnapshot
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

  function handleGoogleSignin(e) {
    if (e) e.preventDefault();
    console.log('🔐 Google Sign-In triggered');

    if (!firebase || !firebase.auth) {
      showToast('❌ Firebase not loaded. Please refresh the page.');
      return;
    }

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
        if (error.code === 'auth/popup-blocked') msg += 'Please allow popups.';
        else if (error.code === 'auth/unauthorized-domain') msg += 'Domain not authorized.';
        else msg += error.message;
        showToast(msg);
      });
  }

  function handleLogout(e) {
    if (e) e.preventDefault();
    firebase.auth().signOut()
      .then(() => showToast('👋 Logged out successfully'))
      .catch(() => showToast('❌ Logout failed'));
  }

  function updateAuthUI(user) {
    if (user) {
      elements.googleSigninBtn.style.display = 'none';
      if (elements.userProfile) {
        elements.userProfile.style.display = 'flex';
        
        // FIXED: Profile Picture
        if (elements.userAvatar) {
          elements.userAvatar.src = user.photoURL || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=00d4aa&color=fff&size=40`;
          elements.userAvatar.alt = user.displayName || 'User';
        }
        if (elements.userName) {
          elements.userName.textContent = user.displayName || user.email || 'User';
        }
      }
    } else {
      elements.googleSigninBtn.style.display = 'flex';
      if (elements.userProfile) elements.userProfile.style.display = 'none';
    }
  }

  function toggleTheme() { /* ... unchanged ... */ 
    state.isDarkMode = !state.isDarkMode;
    document.documentElement.setAttribute('data-theme', state.isDarkMode ? 'dark' : 'light');
    if (elements.themeToggle) {
      const icon = elements.themeToggle.querySelector('i');
      if (icon) icon.className = state.isDarkMode ? 'fas fa-moon' : 'fas fa-sun';
    }
    localStorage.setItem('livematch-theme', state.isDarkMode ? 'dark' : 'light');
    showToast(state.isDarkMode ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
  }

  function applySavedTheme() { /* ... unchanged ... */ 
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

  function toggleMobileMenu() {
    elements.mobileMenuOverlay?.classList.toggle('active');
    document.body.style.overflow = elements.mobileMenuOverlay?.classList.contains('active') ? 'hidden' : '';
  }

  function showToast(message, duration = 3000) {
    if (!elements.toast || !elements.toastMessage) return;
    elements.toastMessage.textContent = message;
    elements.toast.classList.add('show');
    setTimeout(() => elements.toast.classList.remove('show'), duration);
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
});
