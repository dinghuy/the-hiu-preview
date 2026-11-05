/**
 * The Hiu Villa — Preview Prototype Controller
 * Integrates:
 * - Dimensional Hero Parallax (Scroll-Craft)
 * - Stay Price & Per-Person Live Estimator
 * - Hybrid WhatsApp Inquiry Deep-Link Generator
 * - OTA Platform Comparison Dialog
 */

(() => {
  'use strict';

  // Config: Placeholder WhatsApp number (Configured in accordance with TASKS.md)
  const WHATSAPP_PHONE = '84900000000';
  const BASE_WEEKDAY_RATE = 350;
  const BASE_WEEKEND_RATE = 420;

  // ---------------------------------------------------------------------------
  // 1. Scroll-Craft: Dimensional Layering & Restrained Parallax
  // ---------------------------------------------------------------------------
  const heroSection = document.querySelector('.hero-section');
  const heroBaseLayer = document.querySelector('.hero-layer-base img');
  const heroFrameLayer = document.querySelector('.hero-layer-frame');
  const heroLayerBadge = document.querySelector('.hero-layer-badge');
  const scrollProgressEl = document.getElementById('scroll-progress');
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  let isTicking = false;

  if (motionQuery.addEventListener) {
    motionQuery.addEventListener('change', (e) => {
      if (e.matches) {
        if (heroBaseLayer) heroBaseLayer.style.transform = '';
        if (heroFrameLayer) heroFrameLayer.style.transform = '';
        if (heroLayerBadge) { heroLayerBadge.style.transform = ''; heroLayerBadge.style.opacity = ''; }
        if (scrollProgressEl) scrollProgressEl.style.transform = 'scaleX(0)';
        const vVid = document.getElementById('villa-video');
        if (vVid && !vVid.paused) vVid.pause();
      } else {
        updateHeroParallax();
      }
    });
  }

  function updateHeroParallax() {
    isTicking = false;
    if (motionQuery.matches) return;

    const scrollY = window.scrollY;

    // Scroll progress bar (full page)
    if (scrollProgressEl) {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progressRatio = docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0;
      scrollProgressEl.style.transform = `scaleX(${progressRatio})`;
    }

    // Hero parallax (within hero bounds only)
    if (!heroSection) return;
    const heroHeight = heroSection.offsetHeight;

    if (scrollY <= heroHeight) {
      const progress = scrollY / heroHeight;
      if (heroBaseLayer) {
        heroBaseLayer.style.transform = `scale(${1 + progress * 0.06}) translateY(${progress * 30}px)`;
      }
      if (heroFrameLayer) {
        heroFrameLayer.style.transform = `translateY(${progress * -50}px)`;
      }
      if (heroLayerBadge) {
        heroLayerBadge.style.transform = `translateY(${progress * -20}px)`;
        heroLayerBadge.style.opacity = `${Math.max(1 - progress * 1.5, 0)}`;
      }
    }
  }

  const onScroll = () => {
    if (!isTicking) {
      isTicking = true;
      requestAnimationFrame(updateHeroParallax);
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  // ---------------------------------------------------------------------------
  // 2. Interactive Stay Price & Per-Person Estimator
  // ---------------------------------------------------------------------------
  const checkinInput = document.getElementById('calc-checkin');
  const checkoutInput = document.getElementById('calc-checkout');
  const guestsSelect = document.getElementById('calc-guests');

  const durationEl = document.getElementById('calc-duration');
  const totalEl = document.getElementById('calc-total');
  const perPersonEl = document.getElementById('calc-per-person');
  const guestDisplayEl = document.getElementById('calc-guest-display');

  // Inquiry form elements (Act 5) declared ahead for reactive synchronization
  const formCheckin = document.getElementById('form-checkin');
  const formCheckout = document.getElementById('form-checkout');
  const formGuests = document.getElementById('form-guests');
  const formPurpose = document.getElementById('form-purpose');
  const formNotes = document.getElementById('form-notes');
  const sendWhatsAppBtn = document.getElementById('send-whatsapp-draft-btn');

  function formatDateYMD(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function parseDateLocal(dateStr) {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  // Set default dates: check-in = 7 days from now, check-out = 9 days from now (2 nights)
  const today = new Date();
  const defaultIn = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  const defaultOut = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 9);

  if (checkinInput && checkoutInput) {
    checkinInput.value = formatDateYMD(defaultIn);
    checkoutInput.value = formatDateYMD(defaultOut);
    checkinInput.min = formatDateYMD(today);
    checkoutInput.min = formatDateYMD(defaultIn);
  }

  // Initial sync from estimator to inquiry form
  if (formCheckin && checkinInput) formCheckin.value = checkinInput.value;
  if (formCheckout && checkoutInput) formCheckout.value = checkoutInput.value;

  function calculateStayEstimate() {
    if (!checkinInput || !checkoutInput || !guestsSelect) return;

    const inDate = parseDateLocal(checkinInput.value);
    const outDate = parseDateLocal(checkoutInput.value);
    const guests = parseInt(guestsSelect.value, 10) || 8;

    // Keep guestDisplayEl updated even if dates are invalid
    if (guestDisplayEl) guestDisplayEl.textContent = guests.toString();

    // Reactively sync dates to Act 5 inquiry form
    if (formCheckin && checkinInput && formCheckin.value !== checkinInput.value) {
      formCheckin.value = checkinInput.value;
    }
    if (formCheckout && checkoutInput && formCheckout.value !== checkoutInput.value) {
      formCheckout.value = checkoutInput.value;
    }

    if (!inDate || !outDate || outDate <= inDate) {
      if (durationEl) durationEl.textContent = 'Please choose valid dates';
      if (totalEl) totalEl.textContent = '—';
      if (perPersonEl) perPersonEl.textContent = '—';
      return;
    }

    const diffMs = outDate.getTime() - inDate.getTime();
    const nights = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (nights <= 0) return;

    // Calculate weekday vs weekend blended rate safely in local calendar days
    let totalPrice = 0;
    let curr = new Date(inDate);
    for (let i = 0; i < nights; i++) {
      const dayOfWeek = curr.getDay(); // 0 is Sun, 5 is Fri, 6 is Sat
      const isWeekend = (dayOfWeek === 5 || dayOfWeek === 6);
      totalPrice += isWeekend ? BASE_WEEKEND_RATE : BASE_WEEKDAY_RATE;
      curr.setDate(curr.getDate() + 1);
    }

    const perPersonPerNight = Math.round(totalPrice / (nights * guests));

    if (durationEl) durationEl.textContent = `${nights} night${nights > 1 ? 's' : ''}`;
    if (totalEl) totalEl.textContent = `$${totalPrice.toLocaleString('en-US')}`;
    if (perPersonEl) perPersonEl.textContent = `$${perPersonPerNight} / night`;
  }

  if (checkinInput) {
    checkinInput.addEventListener('change', () => {
      const inDate = parseDateLocal(checkinInput.value);
      if (inDate) {
        const nextDay = new Date(inDate);
        nextDay.setDate(inDate.getDate() + 1);
        const nextDayStr = formatDateYMD(nextDay);
        checkoutInput.min = nextDayStr;
        const curOut = parseDateLocal(checkoutInput.value);
        if (!curOut || curOut <= inDate) {
          checkoutInput.value = nextDayStr;
        }
      }
      calculateStayEstimate();
    });
  }

  if (checkoutInput) checkoutInput.addEventListener('change', calculateStayEstimate);
  if (guestsSelect) guestsSelect.addEventListener('change', calculateStayEstimate);

  // Run initial calculation
  calculateStayEstimate();

  // ---------------------------------------------------------------------------
  // 3. Hybrid Enquiry WhatsApp Message Generator
  // ---------------------------------------------------------------------------
  if (sendWhatsAppBtn) {
    sendWhatsAppBtn.addEventListener('click', () => {
      const cIn = formCheckin?.value || 'Flexible';
      const cOut = formCheckout?.value || 'Flexible';
      const guests = formGuests?.value || 'Flexible';
      const purpose = formPurpose?.value || 'Leisure';
      const notes = formNotes?.value?.trim() || 'None';

      let msg = `Hello The Hiu team,\n\nI would like to inquire about whole-villa availability:\n`;
      msg += `• Dates: ${cIn} to ${cOut}\n`;
      msg += `• Group Size: ${guests}\n`;
      msg += `• Purpose: ${purpose}\n`;
      if (notes && notes !== 'None') {
        msg += `• Note / Request: ${notes}\n`;
      }
      msg += `\nCould you please share availability and total confirmed pricing? Thank you!`;

      const encoded = encodeURIComponent(msg);
      const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encoded}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  }

  // ---------------------------------------------------------------------------
  // 4. OTA Comparison Modal Controller
  // ---------------------------------------------------------------------------
  const otaModal = document.getElementById('ota-modal');
  const openOtaBtn = document.getElementById('open-ota-modal-btn');
  const formOtaBtn = document.getElementById('form-ota-btn');
  const closeOtaBtn = document.getElementById('close-ota-modal-btn');

  let lastFocusedElement = null;

  function openModal() {
    if (otaModal) {
      lastFocusedElement = document.activeElement;
      otaModal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      if (closeOtaBtn) closeOtaBtn.focus();
    }
  }

  function closeModal() {
    if (otaModal) {
      otaModal.classList.remove('is-open');
      document.body.style.overflow = '';
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
      }
    }
  }

  if (openOtaBtn) openOtaBtn.addEventListener('click', openModal);
  if (formOtaBtn) formOtaBtn.addEventListener('click', openModal);
  if (closeOtaBtn) closeOtaBtn.addEventListener('click', closeModal);

  if (otaModal) {
    otaModal.addEventListener('click', (e) => {
      if (e.target === otaModal) closeModal();
    });

    otaModal.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const focusable = otaModal.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && otaModal?.classList.contains('is-open')) {
      closeModal();
    }
  });

  // ---------------------------------------------------------------------------
  // 5. Scroll-Driven Reveal System (IntersectionObserver)
  // ---------------------------------------------------------------------------
  const revealElements = document.querySelectorAll('.reveal-on-scroll, .sc-reveal, .space-card');

  if (typeof IntersectionObserver !== 'undefined' && !motionQuery.matches && revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -12% 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // Reduced motion, environment without observer, or no elements: show everything immediately
    revealElements.forEach(el => el.classList.add('is-revealed'));
  }

  // ---------------------------------------------------------------------------
  // 6. Act 2: Cinematic Living Stage & Space Perspective Controller
  // ---------------------------------------------------------------------------
  const villaVideo = document.getElementById('villa-video');
  const videoPlayBtn = document.getElementById('video-play-btn');
  const iconPlay = videoPlayBtn ? videoPlayBtn.querySelector('.icon-play') : null;
  const iconPause = videoPlayBtn ? videoPlayBtn.querySelector('.icon-pause') : null;
  const videoProgressWrap = document.getElementById('video-progress-wrap');
  const videoProgressFill = document.getElementById('video-progress-fill');
  const videoTimeDisplay = document.getElementById('video-time-display');
  const videoFsBtn = document.getElementById('video-fs-btn');
  const chapterPills = document.querySelectorAll('.chapter-pill');
  const anglePills = document.querySelectorAll('.angle-pill');
  const spaceInquiryLinks = document.querySelectorAll('.space-inquiry-link');

  // A. Ambient Autoplay on Scroll (Muted, Loop, IntersectionObserver)
  if (villaVideo && !motionQuery.matches && typeof IntersectionObserver !== 'undefined') {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
          if (villaVideo.paused) {
            villaVideo.play().catch(() => {/* Handle browser autoplay restrictions */});
          }
        } else {
          if (!villaVideo.paused) {
            villaVideo.pause();
          }
        }
      });
    }, { threshold: [0, 0.35] });

    videoObserver.observe(villaVideo);
  }

  // B. Custom Play / Pause Controls
  function updatePlayBtnUI() {
    if (!villaVideo || !iconPlay || !iconPause) return;
    if (villaVideo.paused) {
      iconPlay.style.display = 'block';
      iconPause.style.display = 'none';
      if (videoPlayBtn) videoPlayBtn.setAttribute('aria-label', 'Play video');
    } else {
      iconPlay.style.display = 'none';
      iconPause.style.display = 'block';
      if (videoPlayBtn) videoPlayBtn.setAttribute('aria-label', 'Pause video');
    }
  }

  if (videoPlayBtn && villaVideo) {
    videoPlayBtn.addEventListener('click', () => {
      if (villaVideo.paused) {
        villaVideo.play().catch(() => {});
      } else {
        villaVideo.pause();
      }
      updatePlayBtnUI();
    });

    villaVideo.addEventListener('play', updatePlayBtnUI);
    villaVideo.addEventListener('pause', updatePlayBtnUI);
  }

  // C. Video Progress Scrubber & Chapter Indicator Sync
  if (villaVideo) {
    villaVideo.addEventListener('timeupdate', () => {
      const cur = villaVideo.currentTime || 0;
      const dur = villaVideo.duration || 15;
      const pct = Math.min((cur / dur) * 100, 100);

      if (videoProgressFill) videoProgressFill.style.width = `${pct}%`;
      if (videoProgressWrap) videoProgressWrap.setAttribute('aria-valuenow', cur.toFixed(1));

      const curSec = Math.floor(cur);
      if (videoTimeDisplay) {
        videoTimeDisplay.textContent = `0:${String(curSec).padStart(2, '0')} / 0:15`;
      }

      // Sync active chapter pill
      chapterPills.forEach(pill => {
        const seekTime = parseFloat(pill.getAttribute('data-seek') || '0');
        const isActive = (seekTime === 0 && cur < 5) ||
                         (seekTime === 5 && cur >= 5 && cur < 10) ||
                         (seekTime === 10 && cur >= 10);
        pill.classList.toggle('is-active', isActive);
      });
    });
  }

  // D. Chapter Pill Seeking
  chapterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const seekTime = parseFloat(pill.getAttribute('data-seek') || '0');
      if (villaVideo) {
        villaVideo.currentTime = seekTime;
        if (villaVideo.paused && !motionQuery.matches) {
          villaVideo.play().catch(() => {});
        }
      }
      chapterPills.forEach(p => p.classList.remove('is-active'));
      pill.classList.add('is-active');
    });
  });

  // E. Progress Scrubber Click Seeking
  if (videoProgressWrap && villaVideo) {
    videoProgressWrap.addEventListener('click', (e) => {
      if (!videoProgressWrap.getBoundingClientRect) return;
      const rect = videoProgressWrap.getBoundingClientRect();
      if (!rect || rect.width === 0) return;
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const dur = villaVideo.duration || 15;
      villaVideo.currentTime = pos * dur;
    });
  }

  // F. Fullscreen Toggle
  if (videoFsBtn && villaVideo) {
    videoFsBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        if (villaVideo.requestFullscreen) {
          villaVideo.requestFullscreen().catch(() => {});
        } else if (villaVideo.webkitRequestFullscreen) {
          villaVideo.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    });
  }

  // G. Perspective Angle Switcher (Smooth 240ms Crossfade)
  anglePills.forEach(pill => {
    pill.addEventListener('click', () => {
      const targetId = pill.getAttribute('data-target');
      const newSrc = pill.getAttribute('data-src');
      const targetImg = document.getElementById(targetId);
      if (!targetImg || !newSrc) return;

      const container = pill.parentElement;
      if (container) {
        const siblings = container.querySelectorAll('.angle-pill');
        siblings.forEach(s => {
          s.classList.remove('is-active');
          s.setAttribute('aria-selected', 'false');
        });
      }
      pill.classList.add('is-active');
      pill.setAttribute('aria-selected', 'true');

      // Update image source immediately for instant response
      targetImg.src = newSrc;
      targetImg.setAttribute('src', newSrc);

      if (!motionQuery.matches && typeof setTimeout !== 'undefined') {
        targetImg.style.opacity = '0.35';
        setTimeout(() => {
          targetImg.style.opacity = '1';
        }, 60);
      }
    });
  });

  // H. Contextual Inquiry Micro-Hooks (Act 2 to Act 5 Conversion)
  spaceInquiryLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const purpose = link.getAttribute('data-purpose');
      if (purpose && formPurpose) {
        formPurpose.value = purpose;
        formPurpose.setAttribute('value', purpose);
        try {
          formPurpose.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (_) {
          formPurpose.dispatchEvent({ type: 'change' });
        }
      }
      const enquirySection = document.getElementById('enquiry');
      if (enquirySection && enquirySection.scrollIntoView) {
        e.preventDefault();
        enquirySection.scrollIntoView({ behavior: motionQuery.matches ? 'auto' : 'smooth' });
        if (formPurpose && formPurpose.focus) {
          if (typeof setTimeout !== 'undefined') {
            setTimeout(() => {
              formPurpose.focus();
              formPurpose.classList.add('form-highlight');
              setTimeout(() => formPurpose.classList.remove('form-highlight'), 1200);
            }, 300);
          } else {
            formPurpose.focus();
          }
        }
      }
    });
  });

  // =========================================================================
  // Section 7: Act 3 Bedroom Suites Carousel Controller (<992px)
  // =========================================================================
  const roomsGrid = document.getElementById('rooms-grid');
  const roomsPrevBtn = document.getElementById('rooms-prev-btn');
  const roomsNextBtn = document.getElementById('rooms-next-btn');
  const roomsDots = document.querySelectorAll('#rooms-dots .carousel-dot');
  const roomsCounter = document.getElementById('rooms-counter');
  const roomCards = roomsGrid ? Array.from(roomsGrid.querySelectorAll('.room-card')) : [];

  if (roomsGrid && roomCards.length > 0) {
    let currentSlide = 0;
    const totalSlides = roomCards.length;

    function updateCarouselUI(index) {
      currentSlide = Math.max(0, Math.min(index, totalSlides - 1));
      roomsDots.forEach((dot, idx) => {
        const isActive = idx === currentSlide;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      if (roomsCounter) {
        roomsCounter.textContent = `0${currentSlide + 1} / 0${totalSlides}`;
      }
      if (roomsPrevBtn) {
        roomsPrevBtn.disabled = (currentSlide === 0);
        roomsPrevBtn.setAttribute('aria-disabled', currentSlide === 0 ? 'true' : 'false');
      }
      if (roomsNextBtn) {
        roomsNextBtn.disabled = (currentSlide === totalSlides - 1);
        roomsNextBtn.setAttribute('aria-disabled', currentSlide === totalSlides - 1 ? 'true' : 'false');
      }
    }

    function scrollToSlide(index) {
      const targetIndex = Math.max(0, Math.min(index, totalSlides - 1));
      const targetCard = roomCards[targetIndex];
      if (!targetCard) return;

      const targetLeft = targetCard.offsetLeft - roomsGrid.offsetLeft;
      roomsGrid.scrollTo({
        left: targetLeft,
        behavior: motionQuery.matches ? 'auto' : 'smooth'
      });
      updateCarouselUI(targetIndex);
    }

    if (roomsPrevBtn) {
      roomsPrevBtn.addEventListener('click', () => scrollToSlide(currentSlide - 1));
    }
    if (roomsNextBtn) {
      roomsNextBtn.addEventListener('click', () => scrollToSlide(currentSlide + 1));
    }

    roomsDots.forEach((dot, idx) => {
      dot.addEventListener('click', () => scrollToSlide(idx));
    });

    // Touch / Scroll event sync
    let carouselScrollRaf = null;
    roomsGrid.addEventListener('scroll', () => {
      if (carouselScrollRaf) cancelAnimationFrame(carouselScrollRaf);
      carouselScrollRaf = requestAnimationFrame(() => {
        const scrollPos = roomsGrid.scrollLeft;
        let closestIndex = 0;
        let minDiff = Infinity;
        roomCards.forEach((card, idx) => {
          const cardPos = card.offsetLeft - roomsGrid.offsetLeft;
          const diff = Math.abs(cardPos - scrollPos);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = idx;
          }
        });
        if (closestIndex !== currentSlide) {
          updateCarouselUI(closestIndex);
        }
      });
    }, { passive: true });

    // Initial state
    updateCarouselUI(0);
  }

  // =========================================================================
  // Section 8: Mobile Sticky Bottom Action Bar Controller (<768px)
  // =========================================================================
  const mobileActionBar = document.getElementById('mobile-action-bar');
  const arriveSection = document.getElementById('arrive');

  if (mobileActionBar && arriveSection && typeof IntersectionObserver !== 'undefined') {
    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // While Hero (#arrive) is visible (ratio > 0.05), hide bottom bar
        if (entry.isIntersecting && entry.intersectionRatio > 0.05) {
          mobileActionBar.classList.remove('is-visible');
        } else {
          // Scrolled past Hero fold -> reveal bottom action bar
          mobileActionBar.classList.add('is-visible');
        }
      });
    }, { threshold: [0, 0.05, 0.1] });

    heroObserver.observe(arriveSection);
  }

  // =========================================================================
  // Section 9: Desktop Left Nav Rail & Mobile Breadcrumb Scrollspy Controller
  // =========================================================================
  const CHAPTER_SECTIONS = [
    { id: 'arrive', label: '01 / Arrive' },
    { id: 'space', label: '02 / Space' },
    { id: 'rooms', label: '03 / Suites' },
    { id: 'pricing', label: '04 / Rates' },
    { id: 'enquiry', label: '05 / Reserve' }
  ];

  const sideNavItems = document.querySelectorAll('.side-nav-item');
  const mobileActText = document.getElementById('mobile-act-text');

  function setActiveChapter(sectionId) {
    sideNavItems.forEach(item => {
      const match = item.getAttribute('data-section') === sectionId;
      item.classList.toggle('is-active', match);
      if (match) {
        item.setAttribute('aria-current', 'true');
      } else {
        item.removeAttribute('aria-current');
      }
    });

    const targetChapter = CHAPTER_SECTIONS.find(c => c.id === sectionId);
    if (targetChapter && mobileActText) {
      mobileActText.textContent = targetChapter.label;
    }
  }

  // Click-to-scroll on desktop rail items
  let clickScrollLock = false;
  let clickScrollTimeout = null;

  sideNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const secId = item.getAttribute('data-section');
      const targetEl = document.getElementById(secId);
      if (targetEl) {
        e.preventDefault();
        clickScrollLock = true;
        if (clickScrollTimeout) clearTimeout(clickScrollTimeout);
        setActiveChapter(secId);
        targetEl.scrollIntoView({
          behavior: motionQuery.matches ? 'auto' : 'smooth'
        });
        clickScrollTimeout = setTimeout(() => {
          clickScrollLock = false;
        }, 900);
      }
    });
  });

  // Scrollspy via IntersectionObserver
  if (typeof IntersectionObserver !== 'undefined') {
    const sectionObserver = new IntersectionObserver((entries) => {
      if (clickScrollLock) return;
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveChapter(entry.target.id);
        }
      });
    }, {
      rootMargin: '-20% 0px -55% 0px',
      threshold: 0
    });

    CHAPTER_SECTIONS.forEach(c => {
      const secEl = document.getElementById(c.id);
      if (secEl) {
        sectionObserver.observe(secEl);
      }
    });
  }

})();
