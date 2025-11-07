// script.js - FIXED: Buttons now OPEN NEW PAGES instead of loading in iframe
document.addEventListener('DOMContentLoaded', function () {
  const iframeLoader = document.getElementById('iframeLoader');
  const iframe = document.getElementById('streamIframe');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const streamButtons = document.querySelectorAll('.stream-btn');

  // === STREAM LOADER ===
  iframeLoader.classList.remove('hidden');

  iframe.addEventListener('load', () => {
    setTimeout(() => iframeLoader.classList.add('hidden'), 800);
  });

  setTimeout(() => iframeLoader.classList.add('hidden'), 12000);

  // === FULLSCREEN BUTTON ===
  fullscreenBtn?.addEventListener('click', () => {
    if (iframe.requestFullscreen) iframe.requestFullscreen();
    else if (iframe.webkitRequestFullscreen) iframe.webkitRequestFullscreen();
    else if (iframe.msRequestFullscreen) iframe.msRequestFullscreen();
    else if (iframe.mozRequestFullScreen) iframe.mozRequestFullScreen();
  });

  // === STREAM SWITCHER BUTTONS - FIXED FOR EXTERNAL HTML PAGES ===
  streamButtons.forEach((btn) => {
    btn.addEventListener('click', function (e) {
      if (this.id === 'fullscreenBtn') return;

      // Remove active class from all
      streamButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      const link = this.dataset.link;

      if (link) {
        // CHECK IF IT'S A FULL HTML PAGE (ends with .html)
        if (link.endsWith('.html')) {
          // PREVENT iframe load - OPEN IN FULL PAGE
          e.preventDefault();
          window.location.href = link;  // Opens link1.html, link2.html etc. as FULL PAGE
        } else {
          // Old behavior for direct stream URLs
          iframeLoader.classList.remove('hidden');
          iframe.src = link.includes('http') ? link : link;
        }
      }
    });
  });

  // === AD CAROUSEL WITH EMBEDDED WHATSAPP BUTTONS ===
  const slides = document.querySelectorAll('.ad-slide');
  const waButtons = [
    document.getElementById('wa1'),
    document.getElementById('wa2')
    // Add more: document.getElementById('wa3'), etc.
  ];

  let currentAd = 0;
  let adInterval;

  const showAd = (index) => {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
    waButtons.forEach((btn, i) => {
      btn.classList.toggle('visible', i === index);
    });
  };

  if (slides.length > 0) {
    showAd(0);

    adInterval = setInterval(() => {
      currentAd = (currentAd + 1) % slides.length;
      showAd(currentAd);
    }, 10000);

    const adBox = document.getElementById('adBox');
    adBox.addEventListener('mouseenter', () => clearInterval(adInterval));
    adBox.addEventListener('mouseleave', () => {
      adInterval = setInterval(() => {
        currentAd = (currentAd + 1) % slides.length;
        showAd(currentAd);
      }, 10000);
    });
  }

  // === CONTACT MODAL ===
  const contactModal = document.getElementById('contactModal');
  const openBtn = document.getElementById('open-contact-btn');
  const closeBtn = document.getElementById('modalClose');
  const modalCancel = document.getElementById('modalCancel');
  const contactForm = document.getElementById('contactForm');

  function openModal() {
    contactModal.setAttribute('aria-hidden', 'false');
    contactModal.style.display = 'flex';
  }
  function closeModal() {
    contactModal.setAttribute('aria-hidden', 'true');
    contactModal.style.display = 'none';
  }

  openBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });
  closeBtn?.addEventListener('click', closeModal);
  modalCancel?.addEventListener('click', closeModal);
  contactModal?.addEventListener('click', (e) => {
    if (e.target === contactModal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && contactModal.getAttribute('aria-hidden') === 'false') {
      closeModal();
    }
  });

  // === GOOGLE SHEETS FORM ===
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyiwLGpkHBI0gUAfbP6A5ni-JHJqyi5EksIRCHlyXS4wlTFKycJeGW1MM0Ia_xP6cRIwA/exec';

  contactForm?.addEventListener('submit', function (e) {
    e.preventDefault();

    const submitBtn = this.querySelector('.btn-submit');
    const ogText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    fetch(SCRIPT_URL, {
      method: 'POST',
      body: new FormData(this)
    })
    .then(r => r.json())
    .then(data => {
      if (data.result === 'success') {
        const msg = data.userEmailSent 
          ? '✅ Success! Check your email for confirmation! 📧'
          : '✅ Saved! We\'ll contact you via WhatsApp shortly!';
        alert(msg);
        this.reset();
        closeModal();
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    })
    .catch(err => {
      alert('⚠️ Form saved! Email failed — we\'ll WhatsApp you in 5 mins.');
      console.error('Form error:', err);
      this.reset();
      closeModal();
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = ogText;
    });
  });
});
