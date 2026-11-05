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
  // Section 7B: In-Card Multi-Photo Carousel Controller (Bedroom Suite Galleries)
  // =========================================================================
  const roomCarousels = document.querySelectorAll('.room-gallery-carousel');
  roomCarousels.forEach((carousel) => {
    const slides = Array.from(carousel.querySelectorAll('.gallery-slide'));
    const dots = Array.from(carousel.querySelectorAll('.gallery-dot'));
    const prevBtn = carousel.querySelector('.gallery-nav-btn.prev');
    const nextBtn = carousel.querySelector('.gallery-nav-btn.next');
    let currentIdx = 0;

    function goToSlide(idx) {
      if (slides.length <= 1) return;
      currentIdx = (idx + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        slide.classList.toggle('is-active', i === currentIdx);
      });
      dots.forEach((dot, i) => {
        const isActive = i === currentIdx;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        goToSlide(currentIdx - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        goToSlide(currentIdx + 1);
      });
    }

    dots.forEach((dot, i) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        goToSlide(i);
      });
      dot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goToSlide(i);
        }
      });
    });

    // Touch swipe support on each photo
    let startX = 0;
    carousel.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        startX = e.touches[0].clientX;
      }
    }, { passive: true });

    carousel.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        const diffX = e.changedTouches[0].clientX - startX;
        if (Math.abs(diffX) > 40) {
          if (diffX < 0) goToSlide(currentIdx + 1);
          else goToSlide(currentIdx - 1);
        }
      }
    }, { passive: true });
  });

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

  // =========================================================================
  // Section 10: Interactive Floorplan & Spatial Explorer Controller
  // =========================================================================
  const FLOORPLAN_ZONES = {
    'suite-1': {
      id: 'suite-1',
      name: 'Suite 01 · Master Retreat',
      level: 'upper',
      levelBadge: 'Level 2 · Upper Level',
      size: '36m² Private Area',
      bed: '1 King Bed · Ensuite Bath with Soaking Tub',
      amenities: [
        'Private morning balcony overlooking garden & mountains',
        'Deep soaking tub & walk-in rainfall shower',
        'Quiet inverter AC & dedicated hardwood vanity'
      ],
      inquiryTag: 'Suite 01 Master Retreat',
      photos: [
        { src: 'assets/bedroom-1.jpg', alt: 'Suite 01 · Master King Suite primary bedroom' },
        { src: 'assets/suite1-2.jpg', alt: 'Suite 01 · Private morning balcony overlooking garden' },
        { src: 'assets/suite1-3.jpg', alt: 'Suite 01 · Ensuite bathroom & hardwood dressing vanity' }
      ]
    },
    'suite-2': {
      id: 'suite-2',
      name: 'Suite 02 · Poolside Queen',
      level: 'ground',
      levelBadge: 'Level 1 · Ground Level',
      size: '28m² Private Area',
      bed: '1 Queen Bed · Ensuite Bath',
      amenities: [
        'Direct ground-level step-out access to poolside',
        'Quiet inverter AC & royal wardrobe vanity',
        'Walk-in rainfall shower & natural garden view'
      ],
      inquiryTag: 'Suite 02 Poolside Queen',
      photos: [
        { src: 'assets/bedroom-2.jpg', alt: 'Suite 02 · Poolside Queen room with garden window' },
        { src: 'assets/suite2-2.jpg', alt: 'Suite 02 · Royal white wardrobes & dressing vanity' },
        { src: 'assets/suite2-3.jpg', alt: 'Suite 02 · Ground-level step-out patio to poolside' }
      ]
    },
    'suite-3': {
      id: 'suite-3',
      name: 'Suite 03 · Family Twin',
      level: 'upper',
      levelBadge: 'Level 2 · Upper Level',
      size: '24m² Private Area',
      bed: '2 Twin Beds (Joinable to King)',
      amenities: [
        'Adjacent to billiards & entertainment lounge corner',
        'Quiet courtyard patio view & high-ceiling breeze',
        'Flexible bedding ideal for children, friends, or colleagues'
      ],
      inquiryTag: 'Suite 03 Family Twin',
      photos: [
        { src: 'assets/bedroom-3.jpg', alt: 'Suite 03 · Family Twin room with coastal accents' },
        { src: 'assets/suite3-2.jpg', alt: 'Suite 03 · Billiards & entertainment lounge corner' },
        { src: 'assets/suite3-3.jpg', alt: 'Suite 03 · Courtyard patio view' }
      ]
    },
    'pool': {
      id: 'pool',
      name: 'Plunge Pool & Garden Deck',
      level: 'ground',
      levelBadge: 'Level 1 · Outdoor Oasis',
      size: '45m² Pool & Deck',
      bed: 'Loungers & Sun Umbrellas',
      amenities: [
        'Crystal turquoise plunge pool with gentle depth grading',
        'Surrounded by mature frangipani trees and coastal palms',
        'Outdoor rainfall rinse shower and wooden sun loungers'
      ],
      inquiryTag: 'Plunge Pool & Garden',
      photos: [
        { src: 'assets/pool.jpg', alt: 'Plunge Pool surrounded by tropical palms and sun deck' },
        { src: 'assets/garden.jpg', alt: 'Lush private garden path and frangipani flowers' }
      ]
    },
    'living': {
      id: 'living',
      name: 'Open Living & Dining Pavilion',
      level: 'ground',
      levelBadge: 'Level 1 · Common Pavilion',
      size: '85m² Communal Space',
      bed: 'Dining for 8–10 Guests',
      amenities: [
        'Double-height ceiling with floor-to-ceiling sliding glass doors',
        'Fully equipped chef kitchen, espresso bar, and induction island',
        'L-shaped lounge seating with cinematic garden views'
      ],
      inquiryTag: 'Living & Dining Pavilion',
      photos: [
        { src: 'assets/living.jpg', alt: 'Double-height living pavilion with designer sofa and garden view' },
        { src: 'assets/dining.jpg', alt: 'Kitchen island and hardwood dining table set for 8 guests' }
      ]
    },
    'terrace': {
      id: 'terrace',
      name: 'Sea Breeze Upper Terrace',
      level: 'upper',
      levelBadge: 'Level 2 · Sunset Lounge',
      size: '35m² Open Terrace',
      bed: 'Outdoor Lounge Seating',
      amenities: [
        'Panoramic view of Vũng Tàu coastal skyline and green hills',
        'Open-air evening cocktail setting with ambient festoon lighting',
        'Constant natural sea breeze and quiet morning yoga space'
      ],
      inquiryTag: 'Sea Breeze Terrace',
      photos: [
        { src: 'assets/garden.jpg', alt: 'Upper terrace lounge overlooking garden and hills' }
      ]
    }
  };

  const floorplanZones = document.querySelectorAll('.floorplan-zone');
  const roomChips = document.querySelectorAll('.room-chip');
  const levelButtons = document.querySelectorAll('.level-toggle-btn');
  const mapGround = document.getElementById('map-ground-level');
  const mapUpper = document.getElementById('map-upper-level');
  const teaserPill = document.getElementById('floorplan-teaser-pill');
  const teaserDismissBtn = document.getElementById('teaser-dismiss-btn');
  const inspectorImg = document.getElementById('inspector-active-img');
  const inspectorPhotoCounter = document.getElementById('inspector-photo-counter');
  const inspectorPrevBtn = document.getElementById('inspector-prev-btn');
  const inspectorNextBtn = document.getElementById('inspector-next-btn');
  const inspectorDots = document.getElementById('inspector-dots');
  const inspectorBadge = document.getElementById('inspector-badge');
  const inspectorSize = document.getElementById('inspector-size');
  const inspectorTitle = document.getElementById('inspector-title');
  const inspectorBed = document.getElementById('inspector-bed');
  const inspectorAmenities = document.getElementById('inspector-amenities');
  const inspectorInquireBtn = document.getElementById('inspector-inquire-btn');

  const amenityItems = inspectorAmenities ? Array.from(inspectorAmenities.querySelectorAll('.amenity-item')) : [];
  const dotItems = inspectorDots ? Array.from(inspectorDots.querySelectorAll('.inspector-dot')) : [];

  let currentZoneId = 'suite-1';
  let currentPhotoIndex = 0;
  let teaserDismissed = false;

  if (dotItems.length) {
    dotItems.forEach((dot, idx) => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        renderInspectorPhoto(idx);
      });
    });
  }

  function dismissTeaser() {
    if (teaserDismissed || !teaserPill) return;
    teaserDismissed = true;
    teaserPill.classList.add('is-dismissed');
    setTimeout(() => {
      if (teaserPill) teaserPill.style.display = 'none';
    }, 320);
  }

  if (teaserDismissBtn) {
    teaserDismissBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissTeaser();
    });
  }

  function renderInspectorPhoto(photoIdx) {
    const data = FLOORPLAN_ZONES[currentZoneId];
    if (!data || !data.photos.length) return;

    if (photoIdx < 0) photoIdx = data.photos.length - 1;
    if (photoIdx >= data.photos.length) photoIdx = 0;
    currentPhotoIndex = photoIdx;

    const curPhoto = data.photos[currentPhotoIndex];
    if (inspectorImg) {
      inspectorImg.src = curPhoto.src;
      inspectorImg.setAttribute('src', curPhoto.src);
      inspectorImg.alt = curPhoto.alt;
      inspectorImg.setAttribute('alt', curPhoto.alt);
    }

    if (inspectorPhotoCounter) {
      inspectorPhotoCounter.textContent = `Photo ${currentPhotoIndex + 1} of ${data.photos.length}`;
    }

    if (dotItems.length) {
      dotItems.forEach((dot, idx) => {
        if (idx < data.photos.length) {
          dot.style.display = 'inline-block';
          dot.classList.toggle('is-active', idx === currentPhotoIndex);
          dot.setAttribute('aria-selected', idx === currentPhotoIndex ? 'true' : 'false');
        } else {
          dot.style.display = 'none';
        }
      });
    }
  }

  function selectZone(zoneId, photoIdx = 0) {
    const data = FLOORPLAN_ZONES[zoneId];
    if (!data) return;

    currentZoneId = zoneId;
    dismissTeaser();

    // 1. Update SVG Zones
    floorplanZones.forEach(z => {
      const match = z.getAttribute('data-zone-id') === zoneId;
      z.classList.toggle('is-active', match);
      z.setAttribute('aria-selected', match ? 'true' : 'false');
    });

    // 2. Update Quick Chips
    roomChips.forEach(chip => {
      const match = chip.getAttribute('data-zone-id') === zoneId;
      chip.classList.toggle('is-active', match);
      chip.setAttribute('aria-selected', match ? 'true' : 'false');
      if (match && chip.scrollIntoView) {
        try {
          chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        } catch (_) {}
      }
    });

    // 3. Update Text Content
    if (inspectorBadge) inspectorBadge.textContent = data.levelBadge;
    if (inspectorSize) inspectorSize.textContent = data.size;
    if (inspectorTitle) inspectorTitle.textContent = data.name;
    if (inspectorBed) inspectorBed.textContent = data.bed;

    if (amenityItems.length) {
      amenityItems.forEach((li, idx) => {
        if (idx < data.amenities.length) {
          li.textContent = data.amenities[idx];
          li.style.display = 'block';
        } else {
          li.style.display = 'none';
        }
      });
    }

    if (inspectorInquireBtn) {
      const shortName = data.name.split('·')[0].trim();
      const span = inspectorInquireBtn.querySelector('span');
      if (span) span.textContent = `Inquire for ${shortName}`;
    }

    // 4. Render Photo
    renderInspectorPhoto(photoIdx);
  }

  // Prev / Next Arrows
  if (inspectorPrevBtn) {
    inspectorPrevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      renderInspectorPhoto(currentPhotoIndex - 1);
    });
  }

  if (inspectorNextBtn) {
    inspectorNextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      renderInspectorPhoto(currentPhotoIndex + 1);
    });
  }

  // Zone click and keydown handlers
  floorplanZones.forEach(zone => {
    const zid = zone.getAttribute('data-zone-id');
    zone.addEventListener('click', () => {
      selectZone(zid, 0);
    });
    zone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectZone(zid, 0);
      }
    });
  });

  // Room chips click handlers
  roomChips.forEach(chip => {
    const zid = chip.getAttribute('data-zone-id');
    chip.addEventListener('click', () => {
      selectZone(zid, 0);
    });
  });

  // Level Toggle Filter
  levelButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const level = btn.getAttribute('data-level');
      levelButtons.forEach(b => {
        const match = b === btn;
        b.classList.toggle('is-active', match);
        b.setAttribute('aria-selected', match ? 'true' : 'false');
      });

      if (level === 'ground') {
        if (mapGround) mapGround.classList.remove('is-dimmed');
        if (mapUpper) mapUpper.classList.add('is-dimmed');
        if (FLOORPLAN_ZONES[currentZoneId]?.level === 'upper') {
          selectZone('suite-2', 0);
        }
      } else if (level === 'upper') {
        if (mapGround) mapGround.classList.add('is-dimmed');
        if (mapUpper) mapUpper.classList.remove('is-dimmed');
        if (FLOORPLAN_ZONES[currentZoneId]?.level === 'ground') {
          selectZone('suite-1', 0);
        }
      } else {
        if (mapGround) mapGround.classList.remove('is-dimmed');
        if (mapUpper) mapUpper.classList.remove('is-dimmed');
      }
    });
  });

  // Contextual Inquiry Deep-Link
  if (inspectorInquireBtn) {
    inspectorInquireBtn.addEventListener('click', (e) => {
      const data = FLOORPLAN_ZONES[currentZoneId];
      if (data && formNotes) {
        formNotes.value = `Hi The Hiu team, I am particularly interested in staying with focus on: ${data.name} (${data.bed}). Please advise availability.`;
        try {
          formNotes.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (_) {}
      }
      const enquirySection = document.getElementById('enquiry');
      if (enquirySection && enquirySection.scrollIntoView) {
        e.preventDefault();
        enquirySection.scrollIntoView({ behavior: motionQuery.matches ? 'auto' : 'smooth' });
        if (formNotes && formNotes.focus) {
          setTimeout(() => {
            formNotes.focus();
            formNotes.classList.add('form-highlight');
            setTimeout(() => formNotes.classList.remove('form-highlight'), 1200);
          }, 350);
        }
      }
    });
  }

  // Scroll-Triggered First-Look Curiosity Teaser
  const floorplanExplorer = document.getElementById('floorplan-explorer');
  if (floorplanExplorer && typeof IntersectionObserver !== 'undefined' && !teaserDismissed) {
    let teaserShown = false;
    const teaserObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !teaserShown && !teaserDismissed) {
          teaserShown = true;
          // Pulse the primary suite
          const primarySuite = document.querySelector('.floorplan-zone[data-zone-id="suite-1"]');
          if (primarySuite) {
            primarySuite.classList.add('ambient-teaser-pulse');
            setTimeout(() => primarySuite.classList.remove('ambient-teaser-pulse'), 3000);
          }
          // Auto-dismiss teaser after 4.5 seconds if untouched
          setTimeout(() => {
            dismissTeaser();
          }, 4500);
        }
      });
    }, { threshold: 0.25 });
    teaserObserver.observe(floorplanExplorer);
  }

  // Initialize with Suite 01 selected
  selectZone('suite-1', 0);

})();
