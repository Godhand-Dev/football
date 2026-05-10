// script.js
document.addEventListener('DOMContentLoaded', () => {
    // Sample live matches
    const matches = [
        { id: 1, league: "Premier League", teams: "Arsenal vs Chelsea", icon: "⚽", time: "LIVE" },
        { id: 2, league: "La Liga", teams: "Real Madrid vs Barcelona", icon: "🏟️", time: "LIVE" },
        { id: 3, league: "Serie A", teams: "Juventus vs Inter", icon: "🇮🇹", time: "LIVE" },
        { id: 4, league: "Bundesliga", teams: "Bayern vs Dortmund", icon: "🇩🇪", time: "LIVE" },
        { id: 5, league: "Champions League", teams: "Man City vs PSG", icon: "🌍", time: "LIVE" },
        { id: 6, league: "EPL", teams: "Liverpool vs Tottenham", icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", time: "45'" },
        { id: 7, league: "Ligue 1", teams: "PSG vs Marseille", icon: "🇫🇷", time: "LIVE" },
        { id: 8, league: "Africa Cup", teams: "Nigeria vs Ghana", icon: "🇳🇬", time: "LIVE" },
        { id: 9, league: "MLS", teams: "LAFC vs Inter Miami", icon: "🇺🇸", time: "22'" },
        { id: 10, league: "Saudi Pro", teams: "Al Hilal vs Al Nassr", icon: "🇸🇦", time: "LIVE" }
    ];

    const grid = document.getElementById('streams-grid');
    
    matches.forEach(match => {
        const card = document.createElement('div');
        card.className = 'stream-card glass';
        card.style.cursor = 'pointer';
        card.innerHTML = `
            <div class="stream-icon">
                <span style="font-size: 5rem;">${match.icon}</span>
                <span style="position:absolute; top:16px; left:16px; background:#ff3333; color:white; padding:3px 12px; border-radius:20px; font-size:0.75rem; font-weight:700;">${match.time}</span>
            </div>
            <div class="stream-info">
                <h4>${match.teams}</h4>
                <p>${match.league}</p>
            </div>
        `;
        card.addEventListener('click', () => {
            window.location.href = `match.html?id=${match.id}`;
        });
        grid.appendChild(card);
    });

    // Modal functionality
    const modal = document.getElementById('stream-modal');
    const closeModal = document.getElementById('close-modal');
    const modalVideo = document.querySelector('.modal-video');
    
    function openStreamModal(match) {
        document.getElementById('modal-match-title').textContent = `${match.teams} - ${match.league}`;
        
        // Insert iframe for first match (Arsenal vs Chelsea)
        if (match.id === 1) {
            modalVideo.innerHTML = `
                <iframe
                  src="https://eyj0exaioijkv1qilcjhbgcioijiuzi1nij99ds.zliymordanex.sbs/playerv5.php?match=4445127&key=c0ae1abba6eebd7e6cc5b88b1d2B71547"
                  width="100%"
                  height="550"
                  frameborder="0"
                  allowfullscreen
                  allow="autoplay; fullscreen">
                </iframe>
            `;
        } else {
            // Show fake player for other matches
            modalVideo.innerHTML = `
                <div class="fake-player">
                    <i class="fas fa-play-circle fa-5x"></i>
                    <p>High Quality Stream (1080p60)</p>
                    <div class="fake-progress"></div>
                </div>
            `;
        }
        
        modal.style.display = 'flex';
    }
    
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', () => {
        const btn = document.getElementById('refresh-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Re-syncing...';
        btn.disabled = true;
        
        setTimeout(() => {
            btn.textContent = '✅ Re-synced!';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
            }, 2000);
        }, 1200);
    });

    // Bookmark buttons
    const bookmarkBtns = document.querySelectorAll('#bookmark-btn, #bookmark-large');
    bookmarkBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if ('requestStorageAccess' in document) {
                alert("✅ Site bookmarked! You'll never miss a match.");
            } else {
                alert("Press Ctrl+D (Windows) or Cmd+D (Mac) to bookmark livematch.com.ng");
            }
        });
    });

    // Fake chat
    const chatMessages = document.getElementById('chat-messages');
    const sampleMessages = [
        { text: "What a goal by Salah!!! 🔥", user: "LiverpoolFanNG" },
        { text: "VAR robbed us again 😤", user: "Gooner4Life" },
        { text: "Who else is watching from Lagos?", user: "NaijaBall" }
    ];
    
    sampleMessages.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'chat-msg';
        div.innerHTML = `<strong>${msg.user}:</strong> ${msg.text}`;
        chatMessages.appendChild(div);
    });
    
    // Send chat
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-chat');
    
    function sendMessage() {
        if (!chatInput.value.trim()) return;
        
        const div = document.createElement('div');
        div.className = 'chat-msg self';
        div.textContent = chatInput.value;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        chatInput.value = '';
    }
    
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Notify button
    document.getElementById('notify-btn').addEventListener('click', () => {
        const email = document.getElementById('email-input').value;
        if (email) {
            alert(`✅ Notification list joined! We'll ping you before every big match, ${email.split('@')[0]}!`);
            document.getElementById('email-input').value = '';
        } else {
            alert("Please enter your email");
        }
    });

    // Watch now button
    document.getElementById('watch-now').addEventListener('click', () => {
        document.getElementById('streams').scrollIntoView({ behavior: 'smooth' });
    });

    // Keyboard shortcut hint
    console.log('%c👟 livematch.com.ng ready. Press "R" to simulate refresh.', 'color:#f1c40f; font-family:monospace');
    
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'r') {
            document.getElementById('refresh-btn').click();
        }
    });
});