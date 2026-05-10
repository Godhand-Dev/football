/**
 * Firebase Chat Integration
 * Handles real-time chat with Firestore
 */

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

  /**
   * Initialize Firestore listener
   */
  init() {
    // Listen to auth state changes
    firebase.auth().onAuthStateChanged((user) => {
      this.currentUser = user;
      if (user) {
        console.log('User logged in:', user.displayName);
        this.listenToMessages();
        this.setUserPresence(true);
      } else {
        console.log('User logged out');
        if (this.unsubscribe) {
          this.unsubscribe();
        }
        this.setUserPresence(false);
      }
    });
  }

  /**
   * Set up real-time listener for messages
   */
  listenToMessages() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // Listen to last 50 messages, ordered by timestamp
    this.unsubscribe = this.messagesRef
      .orderBy('timestamp', 'desc')
      .limit(50)
      .onSnapshot(
        (snapshot) => {
          const messages = [];
          snapshot.forEach((doc) => {
            messages.unshift(doc.data()); // Reverse to get chronological order
          });

          // Clear and rebuild message list
          if (this.messagesList) {
            // Only add new messages to avoid duplication
            messages.forEach((msg) => {
              if (!this.loadedMessageIds.has(msg.id)) {
                this.addMessageToUI(msg);
                this.loadedMessageIds.add(msg.id);
              }
            });
          }

          // Scroll to bottom
          this.scrollToBottom();
        },
        (error) => {
          console.error('Error listening to messages:', error);
        }
      );
  }

  /**
   * Send a message to Firestore
   */
  async sendMessage(text) {
    if (!this.currentUser || !text.trim()) {
      console.error('User not logged in or message is empty');
      return;
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

      // Clear input
      if (this.messageInput) {
        this.messageInput.value = '';
      }

      console.log('Message sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  /**
   * Add message to UI
   */
  addMessageToUI(message) {
    if (!this.messagesList) return;

    const messageEl = document.createElement('li');
    messageEl.className = 'message-item';
    messageEl.dataset.messageId = message.id;

    const isCurrentUser = this.currentUser && this.currentUser.uid === message.userId;
    const avatarUrl = message.userAvatar || this.getDefaultAvatar(message.username);
    const timestamp = message.timestamp ? message.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now';

    messageEl.innerHTML = `
      <div class="message-avatar">
        <img src="${avatarUrl}" alt="${message.username}" title="${message.username}"/>
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

    // Limit messages to 100 for performance
    const messages = this.messagesList.children;
    if (messages.length > 100) {
      const oldMsg = messages[0];
      oldMsg.dataset.messageId && this.loadedMessageIds.delete(oldMsg.dataset.messageId);
      oldMsg.remove();
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId) {
    if (!confirm('Delete this message?')) return;

    try {
      const snapshot = await this.messagesRef.where('id', '==', messageId).get();
      snapshot.forEach((doc) => {
        doc.ref.delete();
      });
      console.log('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }

  /**
   * Update user presence
   */
  async setUserPresence(isOnline) {
    if (!this.currentUser) return;

    try {
      const presenceRef = firebase.firestore().collection('presence').doc(this.currentUser.uid);
      
      if (isOnline) {
        await presenceRef.set(
          {
            userId: this.currentUser.uid,
            username: this.currentUser.displayName,
            userAvatar: this.currentUser.photoURL,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            online: true
          },
          { merge: true }
        );
      } else {
        await presenceRef.update({
          online: false,
          lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }

  /**
   * Get online user count
   */
  getOnlineUserCount(callback) {
    firebase.firestore().collection('presence')
      .where('online', '==', true)
      .onSnapshot((snapshot) => {
        callback(snapshot.size);
      });
  }

  /**
   * Get default avatar URL using placeholder service
   */
  getDefaultAvatar(username) {
    const initials = username.substring(0, 2).toUpperCase();
    const bgColor = this.stringToColor(username);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bgColor.substring(1)}&color=fff&size=40`;
  }

  /**
   * Generate color from string
   */
  stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  }

  /**
   * Scroll to bottom
   */
  scrollToBottom() {
    if (this.chatBox) {
      setTimeout(() => {
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
      }, 0);
    }
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export for use
window.FirebaseChat = FirebaseChat;
