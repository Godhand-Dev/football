// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCGVQc5OP4k9AXlkK6Ld98yvBmODuc0d60",
  authDomain: "chatapp-5afff.firebaseapp.com",
  databaseURL: "https://chatapp-5afff-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "chatapp-5afff",
  storageBucket: "chatapp-5afff.firebasestorage.app",
  messagingSenderId: "835710769608",
  appId: "1:835710769608:web:ae974aeab8745fdea848fd",
  measurementId: "G-V6BH65CXV5"
};

// Modular Functions
function initFirebase() {
  firebase.initializeApp(firebaseConfig);
  return {
    auth: firebase.auth(),
    database: firebase.database()
  };
}

function setupAuth(auth, signInButton, logoutButton, provider) {
  signInButton.addEventListener("click", () => {
    auth.signInWithPopup(provider)
      .then((result) => {
        console.log("Signed in:", result.user.displayName);
      })
      .catch((error) => {
        console.error("Sign-in error:", error);
        alert("Sign-in failed. Please try again.");
      });
  });

  logoutButton.addEventListener("click", () => {
    auth.signOut()
      .then(() => console.log("Signed out"))
      .catch((error) => console.error("Sign-out error:", error));
  });
}

function sendMessage(e, auth, messagesRef, messageInput, showChatAndReset) {
  e.preventDefault();
  const message = messageInput.value.trim();
  if (!message) return;

  const user = auth.currentUser;
  if (!user) return;

  messagesRef.push({
    username: user.displayName || "Anonymous",
    photoURL: user.photoURL || null,
    uid: user.uid,
    message: message,
    timestamp: Date.now()  // Keep timestamp for sorting, but not displayed
  });

  messageInput.value = "";
  showChatAndReset();
}

// Simplified message rendering: no timestamp, no background bubble
function addMessageToUI(snapshot, messagesList, showChatAndReset) {
  const data = snapshot.val();

  const li = document.createElement("li");
  li.style.cssText = `
    padding: 4px 0;
    color: white;
    font-size: 0.9em;
    word-wrap: break-word;
    text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
    line-height: 1.4;
  `;

  if (data.photoURL) {
    const img = document.createElement("img");
    img.src = data.photoURL;
    img.alt = data.username;
    img.style.cssText = `
      width: 20px;
      height: 20px;
      border-radius: 50%;
      margin-right: 15px;
      vertical-align: middle;
      border: 1px solid rgba(255,255,255,0.3);
    `;
    li.appendChild(img);
  }

  const textSpan = document.createElement("span");
  textSpan.textContent = `${data.username}: ${data.message}`;
  li.appendChild(textSpan);

  messagesList.appendChild(li);
  messagesList.scrollTop = messagesList.scrollHeight;

  showChatAndReset();
}

// Chat visibility management
let chatTimer;
let isHiddenByClick = false;
let chatOverlay;

function showChatAndReset() {
  clearTimeout(chatTimer);
  isHiddenByClick = false;
  chatOverlay.classList.add("visible");

  // chatTimer = setTimeout(() => {
  //   if (!isHiddenByClick) {
  //     chatOverlay.classList.remove("visible");
  //   }
  // }, 6000);
}

function setupVideoToggle(videoWrapper, auth, showChatAndReset) {
  videoWrapper.addEventListener("click", (e) => {
    if (!auth.currentUser) return;
    e.stopPropagation();

    if (chatOverlay.classList.contains("visible") && !isHiddenByClick) {
      chatOverlay.classList.remove("visible");
      clearTimeout(chatTimer);
      isHiddenByClick = true;
    } else {
      showChatAndReset();
    }
  });
}

function setupIframeLogging(iframe) {
  iframe.addEventListener("load", () => {
    console.log("Stream loaded");
  });
}

// Main initialization
document.addEventListener("DOMContentLoaded", () => {
  const { auth, database } = initFirebase();
  const messagesRef = database.ref("messages");
  const provider = new firebase.auth.GoogleAuthProvider();

  // DOM Elements
  const signInButton = document.getElementById("google-signin");
  const logoutButton = document.getElementById("logout");
  const messagesList = document.getElementById("messages");
  const messageForm = document.querySelector(".message-form");
  const messageInput = document.querySelector(".message-input");
  chatOverlay = document.getElementById("chat-overlay");
  const chatInput = document.getElementById("chat-input");
  const chatPrompt = document.querySelector(".chat-prompt");
  const iframe = document.getElementById("stream-iframe");
  const videoWrapper = document.querySelector(".video-wrapper");

  setupAuth(auth, signInButton, logoutButton, provider);
  setupVideoToggle(videoWrapper, auth, showChatAndReset);
  setupIframeLogging(iframe);

  // Form submit handler
  function sendMessageHandler(e) {
    sendMessage(e, auth, messagesRef, messageInput, showChatAndReset);
  }

  auth.onAuthStateChanged((user) => {
    if (user) {
      signInButton.style.display = "none";
      logoutButton.style.display = "block";
      chatInput.style.display = "block";
      chatPrompt.style.display = "none";

      // Attach submit listener
      messageForm.removeEventListener("submit", sendMessageHandler);
      messageForm.addEventListener("submit", sendMessageHandler);

      // Load recent messages
      messagesRef.orderByChild("timestamp").limitToLast(50).on("child_added", (snapshot) => {
        addMessageToUI(snapshot, messagesList, showChatAndReset);
      });

      // Interaction triggers
      showChatAndReset();
      chatOverlay.addEventListener("mouseenter", showChatAndReset);
      chatOverlay.addEventListener("touchstart", (e) => {
        e.preventDefault();
        showChatAndReset();
      });
      messageInput.addEventListener("focus", showChatAndReset);

    } else {
      signInButton.style.display = "flex";
      logoutButton.style.display = "none";
      chatInput.style.display = "none";
      chatPrompt.style.display = "block";

      messagesList.innerHTML = "";
      messagesRef.off("child_added");
      messageForm.removeEventListener("submit", sendMessageHandler);

      clearTimeout(chatTimer);
      chatOverlay.classList.remove("visible");
      isHiddenByClick = false;
    }
  });

  // Ensure full transparency for chat overlay
  chatOverlay.style.background = "transparent";
});
