document.addEventListener('DOMContentLoaded', function() {
    // --- A. STREAM LINK TEST (Enhanced Debugging) ---
    const streamPlayer = document.getElementById('football-stream-player');
    const streamFallback = document.getElementById('stream-fallback');
    
    if (streamPlayer && streamFallback) {
        streamFallback.style.display = 'none';
        streamPlayer.style.display = 'block';

        streamPlayer.addEventListener('load', () => {
            console.log('Stream loaded successfully from:', streamPlayer.src);
        });

        streamPlayer.addEventListener('error', () => {
            console.error('Stream failed to load. URL:', streamPlayer.src);
            streamPlayer.style.display = 'none';
            streamFallback.style.display = 'flex';
            alert('The live stream is currently unavailable. Please try again later or check alternative streams below.');
        });

        setTimeout(() => {
            if (streamPlayer.contentDocument && streamPlayer.contentDocument.body.innerHTML.includes('sandboxed iframe')) {
                console.warn('Sandbox-related issue detected. Ensure no sandbox attribute is present.');
                streamPlayer.style.display = 'none';
                streamFallback.style.display = 'flex';
            }
        }, 2000);
    }

    // --- B. CONTACT MODAL LOGIC (Improved Focus Trap) ---
    const adContactLink = document.getElementById('ad-contact-link');
    const contactModal = document.getElementById('contact-modal');
    const closeButton = document.querySelector('.close-btn');
    
    if (contactModal) {
        const focusableElements = contactModal.querySelectorAll('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])');
        const firstFocusableElement = focusableElements[0];
        const lastFocusableElement = focusableElements[focusableElements.length - 1];

        function showModal(event) {
            event.preventDefault();
            contactModal.style.display = 'flex';
            firstFocusableElement?.focus();
        }

        function hideModal() {
            contactModal.style.display = 'none';
            const lastTrigger = document.activeElement.closest('#ad-contact-link') || adContactLink;
            lastTrigger?.focus();
        }

        function trapFocus(event) {
            if (event.key === 'Tab') {
                if (event.shiftKey) {
                    if (document.activeElement === firstFocusableElement) {
                        event.preventDefault();
                        lastFocusableElement?.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusableElement) {
                        event.preventDefault();
                        firstFocusableElement?.focus();
                    }
                }
            }
        }

        if (adContactLink) adContactLink.addEventListener('click', showModal);
        if (closeButton) closeButton.addEventListener('click', hideModal);

        contactModal.addEventListener('click', (event) => {
            if (event.target === contactModal) hideModal();
        });
        
        contactModal.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') hideModal();
            trapFocus(event);
        });
    }

    // --- C. AD ANIMATION LOGIC (Responsive Links & Rotation with WhatsApp Contact Buttons) ---
    const iframeARight = document.getElementById('animated-ad-iframe-a');
    const iframeBRight = document.getElementById('animated-ad-iframe-b');
    const iframeALeft = document.getElementById('animated-ad-iframe-a-left');
    const iframeBLeft = document.getElementById('animated-ad-iframe-b-left');
    const adContactContainers = document.querySelectorAll('.ad-contact-container');

    const adUrlsDesktop = [
        "https://www.canva.com/design/DAG2aOdfxpw/pxxL0A6I268uJ54awYI4ZQ/view?embed", 
        "https://www.canva.com/design/DAG2bYXTM-M/PL7f8xB-zHQ25oVW4zLugw/view?embed"
    ];
    const adUrlsLeftDesktop = [
        "https://www.canva.com/design/DAG2lrYdFQs/vU8_vmKb1Yw5XNRtsCZLkA/view?embed", 
        "https://www.canva.com/design/DAG2tnAqXks/i5yAdPB6mDgs-MGNUqJE_Q/view?embed"
    ];

    const adUrlsMobile = [
        "https://www.canva.com/design/DAG3aXyz123/mobile-right-a-landscape/view?embed", 
        "https://www.canva.com/design/DAG3bWxy456/mobile-right-b-landscape/view?embed"
    ];
    const adUrlsLeftMobile = [
        "https://www.canva.com/design/DAG3cZab789/mobile-left-a-landscape/view?embed",  
        "https://www.canva.com/design/DAG3dYcd012/mobile-left-b-landscape/view?embed"   
    ];
    
    const adWhatsAppNumbers = {
        'animated-ad-iframe-a': '+2348053056587',
        'animated-ad-iframe-b': '+2349068832016',
        'animated-ad-iframe-a-left': '+2348167833978',
        'animated-ad-iframe-b-left': '+2348146163188'
    };

    if (iframeARight && iframeBRight && iframeALeft && iframeBLeft) {
        const isMobileView = window.innerWidth <= 600;

        const rightUrls = isMobileView ? adUrlsMobile : adUrlsDesktop;
        const leftUrls = isMobileView ? adUrlsLeftMobile : adUrlsLeftDesktop;

        iframeARight.src = rightUrls[0];
        iframeBRight.src = rightUrls[1];
        iframeALeft.src = leftUrls[0];
        iframeBLeft.src = leftUrls[1];

        iframeARight.style.opacity = '1';
        iframeBRight.style.opacity = '0';
        iframeALeft.style.opacity = '1';
        iframeBLeft.style.opacity = '0';

        adContactContainers.forEach(container => {
            const iframeId = container.getAttribute('data-iframe');
            const button = container.querySelector('.ad-contact-button');
            if (button) {
                button.style.opacity = (iframeId === 'animated-ad-iframe-a' || iframeId === 'animated-ad-iframe-a-left') ? '1' : '0';
                button.style.transition = 'opacity 0.5s ease-in-out';
            }
            container.style.opacity = (iframeId === 'animated-ad-iframe-a' || iframeId === 'animated-ad-iframe-a-left') ? '1' : '0';
            container.style.transition = 'opacity 0.5s ease-in-out';
        });

        let isAdACurrentlyVisible = true;
        const adIntervalTime = 15000;

        function cycleAd() {
            const newOpacityA = isAdACurrentlyVisible ? '0' : '1';
            const newOpacityB = isAdACurrentlyVisible ? '1' : '0';

            // Update iframe opacities
            iframeARight.style.opacity = newOpacityA;
            iframeBRight.style.opacity = newOpacityB;
            iframeALeft.style.opacity = newOpacityA;
            iframeBLeft.style.opacity = newOpacityB;

            // Update contact container and button opacities
            adContactContainers.forEach(container => {
                const iframeId = container.getAttribute('data-iframe');
                const button = container.querySelector('.ad-contact-button');
                if (iframeId === 'animated-ad-iframe-a' || iframeId === 'animated-ad-iframe-a-left') {
                    container.style.opacity = newOpacityA;
                    if (button) button.style.opacity = newOpacityA;
                    console.log(`Container ${iframeId} and button opacity set to: ${newOpacityA}`);
                } else if (iframeId === 'animated-ad-iframe-b' || iframeId === 'animated-ad-iframe-b-left') {
                    container.style.opacity = newOpacityB;
                    if (button) button.style.opacity = newOpacityB;
                    console.log(`Container ${iframeId} and button opacity set to: ${newOpacityB}`);
                }
                // Force reflow
                container.offsetHeight;
            });

            // Delayed update to ensure visibility
            setTimeout(() => {
                adContactContainers.forEach(container => {
                    const iframeId = container.getAttribute('data-iframe');
                    const button = container.querySelector('.ad-contact-button');
                    const expectedOpacity = (iframeId === 'animated-ad-iframe-a' || iframeId === 'animated-ad-iframe-a-left') ? newOpacityA : newOpacityB;
                    if (container.style.opacity !== expectedOpacity) {
                        container.style.opacity = expectedOpacity;
                        if (button) button.style.opacity = expectedOpacity;
                        console.warn(`Forced opacity correction for ${iframeId} to ${expectedOpacity}`);
                    }
                });
            }, 100);

            isAdACurrentlyVisible = !isAdACurrentlyVisible;
        }

        setInterval(cycleAd, adIntervalTime);

        adContactContainers.forEach(container => {
            const button = container.querySelector('.ad-contact-button');
            const iframeId = container.getAttribute('data-iframe');
            const whatsappNumber = adWhatsAppNumbers[iframeId];
            if (whatsappNumber && button) {
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    const prefilledMessage = encodeURIComponent("Hello, I'm interested in your ad.");
                    window.open(`https://wa.me/${whatsappNumber}?text=${prefilledMessage}`, '_blank');
                });
            }
        });
    } else {
        console.warn('Warning: One or more ad iframes not found. Ad rotation disabled.');
    }

    // --- D. FULLSCREEN BUTTON LOGIC ---
    const fullscreenButton = document.getElementById('fullscreen-button');
    if (fullscreenButton && streamPlayer) {
        fullscreenButton.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                streamPlayer.requestFullscreen().catch(err => {
                    console.error('Fullscreen request failed:', err);
                });
                fullscreenButton.textContent = 'Exit Fullscreen';
            } else {
                document.exitFullscreen();
                fullscreenButton.textContent = 'Fullscreen';
            }
        });

        document.addEventListener('fullscreenchange', () => {
            fullscreenButton.textContent = document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen';
        });
    }

    // --- E. LATEST NEWS LOGIC (Cleaned Up Links and Accessibility) ---
    const newsList = document.getElementById('news-list');
    
    const latestNews = [
        { headline: "All 10 Serie A games weekend predictions - Week 7.", link: "https://www.livescore.com/en/news/football/serie-a/predictions/serie-a-predictions-week-7/" },
        { headline: "All 10 LaLiga games weekend predictions - Week 9.", link: "https://www.livescore.com/en/news/predictions/laliga-predictions-week-9/" },
        { headline: "All 10 Premier League weekend predictions - Week 8.", link: "https://www.livescore.com/en/news/football/premier-league/predictions/all-10-premier-league-weekend-predictions-week-8/" },
        { headline: "Southampton vs Swansea predictions", link: "https://www.livescore.com/en/news/football/england-championship/predictions/southampton-swansea-predictions-saints-to-suffer-another-setback/" },
        { headline: "Arne Slot under pressure.", link: "https://www.skysports.com/liverpool" }
    ];

    if (newsList) {
        let htmlContent = '';
        latestNews.forEach(item => {
            htmlContent += `
                <li>
                    <a href="${item.link}" title="${item.headline}" target="_blank">
                        <i class="fas fa-bolt"></i> ${item.headline}
                    </a>
                </li>
            `;
        });
        newsList.innerHTML = htmlContent;
    } else {
        console.warn('Warning: News list element not found (ID: news-list).');
    }

    // --- F. CONTACT FORM SUBMISSION (Basic fetch example for robustness) ---
    const contactForm = document.querySelector('#contact-modal form');
    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();
            
            const formData = new FormData(contactForm);
            
            console.log('Form submission intercepted. Sending data to:', contactForm.action);
            
            // Example fetch POST (uncomment and configure for production)
            /*
            fetch(contactForm.action, { method: 'POST', body: formData })
                .then(response => {
                    if (response.ok) {
                        alert('Inquiry sent successfully!');
                        contactForm.reset();
                        hideModal();
                    } else {
                        alert('Submission failed. Server error.');
                    }
                })
                .catch(error => {
                    console.error('Submission error:', error);
                    alert('A network error occurred.');
                });
            */
            
            console.log('Form data:', Object.fromEntries(formData));
            contactForm.reset();
            hideModal();
        });
    }
});