// script.js

// Stream switching functionality
document.querySelectorAll('.stream-buttons button[data-stream]').forEach(button => {
    button.addEventListener('click', () => {
        const streamUrl = button.getAttribute('data-stream');
        const streamIframe = document.getElementById('stream-iframe');
        if (streamUrl && streamIframe) {
            // Update iframe src
            streamIframe.src = streamUrl;
            // Remove .active from all buttons
            document.querySelectorAll('.stream-buttons button[data-stream]').forEach(btn => {
                btn.classList.remove('active');
            });
            // Add .active to clicked button
            button.classList.add('active');
        }
    });
});

// Set initial active button (Live Link-1)
const initialButton = document.querySelector('.stream-buttons button[data-stream="https://tgyh.kora1goal.com/albaplayer/sports-1/?autoplay=1&mute=1"]');
if (initialButton) {
    initialButton.classList.add('active');
}

// Fullscreen toggle functionality
const fullscreenBtn = document.getElementById('fullscreen-btn');
const streamIframe = document.getElementById('stream-iframe');

if (fullscreenBtn && streamIframe) {
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            if (streamIframe.requestFullscreen) {
                streamIframe.requestFullscreen();
            } else if (streamIframe.webkitRequestFullscreen) {
                streamIframe.webkitRequestFullscreen();
            } else if (streamIframe.msRequestFullscreen) {
                streamIframe.msRequestFullscreen();
            }
            fullscreenBtn.textContent = 'Exit Fullscreen';
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            fullscreenBtn.textContent = 'Fullscreen';
        }
    });

    // Handle fullscreen change
    document.addEventListener('fullscreenchange', () => {
        fullscreenBtn.textContent = document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen';
    });
    document.addEventListener('webkitfullscreenchange', () => {
        fullscreenBtn.textContent = document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen';
    });
    document.addEventListener('msfullscreenchange', () => {
        fullscreenBtn.textContent = document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen';
    });
}

// Modal functionality (for #contact-btn only)
const contactModal = document.getElementById('contact-modal');
const contactBtn = document.getElementById('contact-btn');
const closeBtn = document.querySelector('.close');

function openModal() {
    if (contactModal) contactModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    if (contactModal) contactModal.style.display = 'none';
    document.body.style.overflow = '';
}

if (contactBtn) contactBtn.addEventListener('click', openModal);
if (closeBtn) closeBtn.addEventListener('click', closeModal);

window.addEventListener('click', (event) => {
    if (event.target === contactModal) closeModal();
});

// WhatsApp contact buttons for ads
const adWhatsAppNumbers = {
    'left': '+2348167833978',
    'a': '+2348053056587',
    'right': '+2348146163188',   
    'b': '+2349068832016'   
};

const contactButtons = {
    'contact-button-left': 'left',
    'contact-button-a': 'a',
    'contact-button-right': 'right',
    'contact-button-b': 'b'
};

Object.entries(contactButtons).forEach(([buttonId, adId]) => {
    const button = document.getElementById(buttonId);
    if (button) {
        button.addEventListener('click', () => {
            const whatsappUrl = `https://wa.me/${adWhatsAppNumbers[adId]}?text=Hello,%20I%20am%20interested%20in%20your%20!`;
            window.open(whatsappUrl, '_blank', 'noopener');
        });
    }
});

// Ad loop animation with synced contact buttons
const adContainers = document.querySelectorAll('.ad-container');
adContainers.forEach(container => {
    const iframes = container.querySelectorAll('.animated-ad-iframe');
    const buttons = container.querySelectorAll('.contact-button');
    let currentIndex = 0;

    // Set initial active iframe and button
    if (iframes.length > 0 && buttons.length > 0) {
        iframes[0].classList.add('ad-active');
        buttons[0].classList.add('button-active');
    }

    // Cycle through iframes and buttons every 5 seconds
    setInterval(() => {
        if (iframes.length > 1 && buttons.length > 1) {
            // Hide current iframe and button
            iframes[currentIndex].classList.remove('ad-active');
            buttons[currentIndex].classList.remove('button-active');
            // Move to next iframe and button
            currentIndex = (currentIndex + 1) % iframes.length;
            // Show next iframe and button
            iframes[currentIndex].classList.add('ad-active');
            buttons[currentIndex].classList.add('button-active');
        }
    }, 5000); // 5 seconds per ad
});

// Contact form submission (Connected to Google Sheets with Email Notification)
const contactForm = document.querySelector('#contact-form');
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzFDZsJGR9yxrvrg9eOCnuvprQZaD6-iMAl1csgv4zZy9HpNKabpjt4k189FC5jdogaGQ/exec';

if (contactForm) {
    contactForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        const formData = new FormData(contactForm);
        // Client-side validation
        if (!formData.get('email') || !formData.get('phone') || !formData.get('message') || !formData.get('Name')) {
            alert('Please fill all fields.');
            console.warn('Form validation failed: Missing fields');
            return;
        }
        
        console.log('Form submission intercepted. Sending data to GAS:', Object.fromEntries(formData));
        
        // Send data to Google Apps Script
        fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.result === 'success') {
                alert('Thank you for your inquiry! We will get back to you soon.');
                console.log('Success! Data added to row:', data.row);
                contactForm.reset();
                closeModal();
            } else {
                alert('Submission failed. Please try again later.');
                console.error('Server error:', data.error);
            }
        })
        .catch(error => {
            console.error('Submission error:', error);
            alert('A network error occurred. Please try again.');
        });
    });
} else {
    console.warn('Contact form not found.');
}

// Responsive iframe resize handler
window.addEventListener('resize', () => {
    if (streamIframe) {
        streamIframe.style.width = '100%';
        // Height handled by CSS clamp
    }
});