document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - Starting script initialization');

    // --- A. STREAM LINK TEST (Optimized for sports-2, No Fallback) ---
    const streamPlayer = document.getElementById('football-stream-player');
    const streamLoading = document.getElementById('stream-loading');

    if (streamPlayer && streamLoading) {
        streamPlayer.style.display = 'block'; // Show immediately for faster loading
        streamLoading.style.display = 'none'; // Hide loading indicator
        console.log('Initial state: Stream player visible, loading hidden');

        streamPlayer.addEventListener('load', () => {
            console.log('Stream loaded successfully from:', streamPlayer.src);
            streamPlayer.style.display = 'block';
            streamLoading.style.display = 'none';
        });

        streamPlayer.addEventListener('error', () => {
            console.error('Stream failed to load. URL:', streamPlayer.src);
            streamPlayer.style.display = 'block'; // Keep stream visible despite error
            streamLoading.style.display = 'none';
        });

        // Check for content issues after 3s
        setTimeout(() => {
            try {
                if (!streamPlayer.contentDocument || streamPlayer.contentDocument.body.innerHTML === '') {
                    console.warn('Stream content empty or inaccessible');
                    streamPlayer.style.display = 'block'; // Keep stream visible
                    streamLoading.style.display = 'none';
                }
            } catch (err) {
                console.warn('Stream content check failed:', err);
                streamPlayer.style.display = 'block'; // Keep stream visible
                streamLoading.style.display = 'none';
            }
        }, 3000);
    } else {
        console.warn('Stream player or loading element not found.', {
            streamPlayer: !!streamPlayer,
            streamLoading: !!streamLoading
        });
    }

    // --- B. CONTACT MODAL LOGIC ---
    const adContactLink = document.getElementById('ad-contact-link');
    const contactButton = document.querySelector('#ad-contact-link .contact-button');
    const contactModal = document.getElementById('contact-modal');
    const closeButton = document.getElementById('close-button');
    
    console.log('Modal elements - adContactLink:', adContactLink, 'contactButton:', contactButton, 'contactModal:', contactModal, 'closeButton:', closeButton);
    
    if (contactModal && contactButton) {
        const focusableElements = contactModal.querySelectorAll('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])');
        const firstFocusableElement = focusableElements[0];
        const lastFocusableElement = focusableElements[focusableElements.length - 1];

        function showModal(event) {
            event.preventDefault();
            console.log('Show modal triggered');
            contactModal.style.display = 'flex';
            setTimeout(() => firstFocusableElement?.focus(), 100);
        }

        function hideModal() {
            console.log('Hide modal triggered');
            contactModal.style.display = 'none';
            contactButton?.focus();
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

        contactButton.addEventListener('click', showModal);
        console.log('Click listener added to contactButton');

        if (closeButton) {
            closeButton.addEventListener('click', hideModal);
            closeButton.addEventListener('touchstart', (event) => {
                event.preventDefault();
                hideModal();
            });
            console.log('Click and touch listeners added to closeButton');
        }

        contactModal.addEventListener('click', (event) => {
            if (event.target === contactModal) hideModal();
        });
        
        contactModal.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') hideModal();
            trapFocus(event);
        });
    } else {
        console.warn('Contact modal or contact button not found.');
    }

    // --- C. AD ANIMATION AND PLACEMENT LOGIC ---
    const iframeARight = document.getElementById('animated-ad-iframe-a');
    const iframeBRight = document.getElementById('animated-ad-iframe-b');
    const iframeALeft = document.getElementById('animated-ad-iframe-a-left');
    const iframeBLeft = document.getElementById('animated-ad-iframe-b-left');
    const adContactContainers = document.querySelectorAll('.ad-contact-container');
    const leftAdContainer = document.getElementById('image-ad-container-left');
    const topAdContainer = document.getElementById('top-ad-container');
    const leftSidebar = document.getElementById('left-sidebar');

    const adUrlsDesktop = [
        "https://www.canva.com/design/DAG21Q2maKM/6zKUXyaUDK78RuJng04Lrg/view?embed",
        "https://www.canva.com/design/DAG2vc67Jng/fLz6xAzQSdhDIrZnqo22bQ/view?embed"
    ];
    const adUrlsLeftDesktop = [
        "https://www.canva.com/design/DAG21mtHsH0/WPl8TBsRzsa-PxjAD0EfvQ/view?embed",
        "https://www.canva.com/design/DAG21sHvz1o/IV0WlUD4OjoZRKcf5MwM4Q/view?embed"
    ];

    const adWhatsAppNumbers = {
        'animated-ad-iframe-a': '+2348146163188',
        'animated-ad-iframe-b': '+2348053056587',
        'animated-ad-iframe-a-left': '+2348167833978',
        'animated-ad-iframe-b-left': '+2349068832016'
    };

    if (iframeARight && iframeBRight && iframeALeft && iframeBLeft && leftAdContainer && topAdContainer && leftSidebar) {
        let isMobileView = window.innerWidth <= 600;

        function updateAdPlacement() {
            if (isMobileView) {
                if (leftAdContainer.parentNode !== topAdContainer) {
                    topAdContainer.appendChild(leftAdContainer);
                    console.log('Moved left ad to top-ad-container for mobile');
                }
            } else {
                if (leftAdContainer.parentNode !== leftSidebar) {
                    leftSidebar.appendChild(leftAdContainer);
                    console.log('Moved left ad to left-sidebar for tablet/desktop');
                }
            }
            leftAdContainer.style.display = 'block';
            leftAdContainer.style.visibility = 'visible';
            leftSidebar.style.display = isMobileView ? 'none' : 'block';
            leftSidebar.style.visibility = isMobileView ? 'hidden' : 'visible';
            console.log('Ad placement updated. Left ad parent:', leftAdContainer.parentNode.id);
        }

        function updateAdUrls() {
            iframeARight.src = adUrlsDesktop[0];
            iframeBRight.src = adUrlsDesktop[1];
            iframeALeft.src = adUrlsLeftDesktop[0];
            iframeBLeft.src = adUrlsLeftDesktop[1];
            console.log('Updated ad URLs:', { right: adUrlsDesktop, left: adUrlsLeftDesktop });
        }

        updateAdPlacement();
        updateAdUrls();

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

            iframeARight.style.opacity = newOpacityA;
            iframeBRight.style.opacity = newOpacityB;
            iframeALeft.style.opacity = newOpacityA;
            iframeBLeft.style.opacity = newOpacityB;

            adContactContainers.forEach(container => {
                const iframeId = container.getAttribute('data-iframe');
                const button = container.querySelector('.ad-contact-button');
                const expectedOpacity = (iframeId === 'animated-ad-iframe-a' || iframeId === 'animated-ad-iframe-a-left') ? newOpacityA : newOpacityB;
                container.style.opacity = expectedOpacity;
                if (button) button.style.opacity = expectedOpacity;
                container.offsetHeight;
            });

            isAdACurrentlyVisible = !isAdACurrentlyVisible;
            console.log('Ad rotation cycle completed. A visible:', isAdACurrentlyVisible);
        }

        let adInterval = setInterval(cycleAd, adIntervalTime);

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const newIsMobileView = window.innerWidth <= 600;
                if (newIsMobileView !== isMobileView) {
                    isMobileView = newIsMobileView;
                    clearInterval(adInterval);
                    updateAdPlacement();
                    updateAdUrls();
                    adInterval = setInterval(cycleAd, adIntervalTime);
                    console.log('Resize detected. isMobileView:', isMobileView);
                }
            }, 100);
        });

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
                button.addEventListener('touchstart', (event) => {
                    event.preventDefault();
                    const prefilledMessage = encodeURIComponent("Hello, I'm interested in your ad.");
                    window.open(`https://wa.me/${whatsappNumber}?text=${prefilledMessage}`, '_blank');
                });
            }
        });
    } else {
        console.warn('Warning: One or more ad iframes or containers not found. Ad rotation disabled.', {
            iframeARight: !!iframeARight,
            iframeBRight: !!iframeBRight,
            iframeALeft: !!iframeALeft,
            iframeBLeft: !!iframeBLeft,
            leftAdContainer: !!leftAdContainer,
            topAdContainer: !!topAdContainer,
            leftSidebar: !!leftSidebar
        });
    }

    // --- D. FULLSCREEN BUTTON LOGIC ---
    const fullscreenButton = document.getElementById('fullscreen-button');
    if (fullscreenButton && streamPlayer) {
        function toggleFullscreen() {
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                if (streamPlayer.requestFullscreen) {
                    streamPlayer.requestFullscreen().catch(err => {
                        console.error('Fullscreen request failed:', err);
                        alert('Fullscreen mode is not supported on this device.');
                    });
                } else if (streamPlayer.webkitRequestFullscreen) {
                    streamPlayer.webkitRequestFullscreen().catch(err => {
                        console.error('Webkit fullscreen request failed:', err);
                        alert('Fullscreen mode is not supported on this device.');
                    });
                }
                fullscreenButton.textContent = 'Exit Fullscreen';
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
                fullscreenButton.textContent = 'Fullscreen';
            }
        }

        fullscreenButton.addEventListener('click', toggleFullscreen);
        fullscreenButton.addEventListener('touchstart', (event) => {
            event.preventDefault();
            toggleFullscreen();
        });

        document.addEventListener('fullscreenchange', () => {
            fullscreenButton.textContent = document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen';
        });
        document.addEventListener('webkitfullscreenchange', () => {
            fullscreenButton.textContent = document.webkitFullscreenElement ? 'Exit Fullscreen' : 'Fullscreen';
        });

        console.log('Fullscreen listeners added');
    } else {
        console.warn('Fullscreen button or stream player not found.');
    }

    // --- E. CONTACT FORM SUBMISSION (Connected to Google Sheets with Email Notification) ---
    const contactForm = document.querySelector('#contact-modal form');
    const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzFDZsJGR9yxrvrg9eOCnuvprQZaD6-iMAl1csgv4zZy9HpNKabpjt4k189FC5jdogaGQ/exec'; // Replace with your deployed web app URL

    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();
            
            const formData = new FormData(contactForm);
            // Client-side validation
            if (!formData.get('email') || !formData.get('phone') || !formData.get('message')) {
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
                    contactModal.style.display = 'none';
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
});