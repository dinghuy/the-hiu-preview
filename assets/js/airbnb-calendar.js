/**
 * The Hiu — Airbnb-Style Interactive Calendar Component
 * Faithful implementation of Airbnb's date picker modal/popover:
 * - Segmented tabs: [ Dates ] / [ Flexible ]
 * - Direct keyboard entry (pencil/typing tool)
 * - Dual month side-by-side view with left/right positioned chevrons (Desktop)
 * - Native Airbnb Mobile Bottom-Sheet Modal with drag handle, close button, and sticky footer (Mobile)
 * - Monday-start calendar grid (Mo Tu We Th Fr Sa Su / T2 T3 T4 T5 T6 T7 CN)
 * - Circle start/end highlights, range fill, hover preview
 * - Bottom flexibility pills: [ Exact dates ] [ ± 1 day ] [ ± 2 days ] [ ± 3 days ] [ ± 7 days ] [ ± 14 days ]
 * - Dual input sync: typing directly into input updates calendar; clicking calendar updates inputs.
 */

export function initAirbnbCalendar(options = {}) {
  const pickers = document.querySelectorAll('[data-calendar-picker]');
  if (!pickers.length) return;

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Monday-first weekday headers matching Airbnb Vietnam / International standard
  const DAY_NAMES = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const now = new Date();
  const todayStr = formatDate(now.getFullYear(), now.getMonth(), now.getDate());

  // Shared backdrop for mobile bottom sheet
  let backdrop = document.querySelector('.cal-modal-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'cal-modal-backdrop';
    backdrop.hidden = true;
    document.body.appendChild(backdrop);
  }

  pickers.forEach(picker => {
    setupPicker(picker);
  });

  function setupPicker(container) {
    const checkinInput = container.querySelector('input[name="checkin"]');
    const checkoutInput = container.querySelector('input[name="checkout"]');
    if (!checkinInput || !checkoutInput) return;

    let popover = container.querySelector('[data-calendar-popover]');
    if (!popover) {
      popover = document.createElement('div');
      popover.className = 'airbnb-calendar-popover';
      popover.setAttribute('data-calendar-popover', '');
      popover.hidden = true;
      container.appendChild(popover);
    }

    let activeMonthDate = parseDate(checkinInput.value) || new Date();
    activeMonthDate.setDate(1); // First of month

    let activeTarget = 'in'; // 'in' or 'out'
    let hoverDateStr = null;
    let selectedFlexDays = 0; // 0 = exact dates, 1, 2, 3, 7, 14
    let activeTab = 'dates'; // 'dates' or 'flexible'

    // Render skeleton matching Airbnb screenshot
    popover.innerHTML = `
      <div class="cal-drag-handle" aria-hidden="true"></div>

      <div class="cal-top-bar">
        <div class="cal-tab-track" role="tablist">
          <button type="button" class="cal-tab-btn is-active" data-cal-tab="dates" role="tab" aria-selected="true">Dates</button>
          <button type="button" class="cal-tab-btn" data-cal-tab="flexible" role="tab" aria-selected="false">Anytime</button>
        </div>
        <div class="cal-top-tools">
          <button type="button" class="cal-tool-btn" data-cal-focus-keyboard title="Type dates manually" aria-label="Type dates manually">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </button>
          <button type="button" class="cal-tool-btn cal-close-btn-mobile" data-cal-close-icon title="Close calendar" aria-label="Close calendar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <div class="cal-status-row">
        <div class="cal-status-wrap">
          <span class="cal-status-title" data-cal-title>Select dates</span>
          <span class="cal-status-sub" data-cal-sub>Minimum 1 night stay</span>
        </div>
      </div>

      <!-- Scrollable body for smooth mobile and desktop experience -->
      <div class="cal-body-scroll">
        <!-- Dates Calendar View -->
        <div class="cal-dates-view" data-cal-dates-view>
          <div class="cal-months-wrapper" data-cal-months-wrapper>
            <!-- Left Month -->
            <div class="cal-month-column" data-month-col="0">
              <div class="cal-month-header">
                <button type="button" class="cal-month-nav-btn cal-nav-prev" data-cal-prev aria-label="Previous month">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div class="cal-month-heading" data-month-heading="0"></div>
                <button type="button" class="cal-month-nav-btn cal-nav-next cal-nav-next-mobile" data-cal-next-mobile aria-label="Next month">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
                <div class="cal-nav-spacer cal-nav-spacer-desktop" aria-hidden="true"></div>
              </div>
              <div class="cal-weekdays-row">
                ${DAY_NAMES.map(d => `<span>${d}</span>`).join('')}
              </div>
              <div class="cal-days-grid" data-month-grid="0"></div>
            </div>

            <!-- Right Month (Desktop) -->
            <div class="cal-month-column" data-month-col="1">
              <div class="cal-month-header">
                <div class="cal-nav-spacer" aria-hidden="true"></div>
                <div class="cal-month-heading" data-month-heading="1"></div>
                <button type="button" class="cal-month-nav-btn cal-nav-next" data-cal-next aria-label="Next month">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
              <div class="cal-weekdays-row">
                ${DAY_NAMES.map(d => `<span>${d}</span>`).join('')}
              </div>
              <div class="cal-days-grid" data-month-grid="1"></div>
            </div>
          </div>

          <!-- Flexibility Pills Row -->
          <div class="cal-flexibility-section">
            <div class="cal-flex-pills-row" role="radiogroup" aria-label="Date flexibility">
              <button type="button" class="cal-flex-pill is-active" data-flex-days="0">Exact dates</button>
              <button type="button" class="cal-flex-pill" data-flex-days="1">± 1 day</button>
              <button type="button" class="cal-flex-pill" data-flex-days="2">± 2 days</button>
              <button type="button" class="cal-flex-pill" data-flex-days="3">± 3 days</button>
              <button type="button" class="cal-flex-pill" data-flex-days="7">± 7 days</button>
              <button type="button" class="cal-flex-pill" data-flex-days="14">± 14 days</button>
            </div>
          </div>
        </div>

        <!-- Flexible Tab Alternative View -->
        <div class="cal-flexible-view" data-cal-flexible-view hidden>
          <div class="cal-flex-prompt">
            <p class="cal-flex-heading">Stay for any duration</p>
            <div class="cal-duration-pills">
              <button type="button" class="cal-duration-pill is-active" data-duration="weekend">Weekend</button>
              <button type="button" class="cal-duration-pill" data-duration="week">1 week</button>
              <button type="button" class="cal-duration-pill" data-duration="month">1 month</button>
            </div>
            <p class="cal-flex-heading" style="margin-top:16px">When would you like to go?</p>
            <div class="cal-upcoming-months" data-upcoming-months></div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="cal-popover-footer">
        <button type="button" class="cal-footer-btn cal-clear-btn" data-cal-clear>Clear dates</button>
        <button type="button" class="button button-dark cal-footer-btn cal-done-btn" data-cal-close>Done</button>
      </div>
    `;

    const titleEl = popover.querySelector('[data-cal-title]');
    const subEl = popover.querySelector('[data-cal-sub]');
    const prevBtn = popover.querySelector('[data-cal-prev]');
    const nextBtn = popover.querySelector('[data-cal-next]');
    const nextMobileBtn = popover.querySelector('[data-cal-next-mobile]');
    const clearBtn = popover.querySelector('[data-cal-clear]');
    const closeBtns = popover.querySelectorAll('[data-cal-close], [data-cal-close-icon]');
    const focusKbBtn = popover.querySelector('[data-cal-focus-keyboard]');
    const datesView = popover.querySelector('[data-cal-dates-view]');
    const flexibleView = popover.querySelector('[data-cal-flexible-view]');
    const flexPills = popover.querySelectorAll('[data-flex-days]');
    const tabBtns = popover.querySelectorAll('[data-cal-tab]');

    function renderCalendar() {
      const isMobile = window.innerWidth < 680;
      const rightCol = popover.querySelector('[data-month-col="1"]');

      if (isMobile) {
        if (rightCol) rightCol.style.display = 'none';
      } else {
        if (rightCol) rightCol.style.display = 'flex';
      }

      // Populate Month 0 (Current)
      populateMonthColumn(0, activeMonthDate.getFullYear(), activeMonthDate.getMonth());

      // Populate Month 1 (Next)
      if (!isMobile) {
        const nextMonthDate = new Date(activeMonthDate.getFullYear(), activeMonthDate.getMonth() + 1, 1);
        populateMonthColumn(1, nextMonthDate.getFullYear(), nextMonthDate.getMonth());
      }

      updateStatusText();
    }

    function populateMonthColumn(colIndex, year, month) {
      const headingEl = popover.querySelector(`[data-month-heading="${colIndex}"]`);
      const gridEl = popover.querySelector(`[data-month-grid="${colIndex}"]`);
      if (!headingEl || !gridEl) return;

      headingEl.textContent = `${MONTH_NAMES[month]} ${year}`;
      gridEl.innerHTML = '';

      // Monday-first offset: (day + 6) % 7 (Sunday = 0 -> 6, Monday = 1 -> 0)
      const firstDay = new Date(year, month, 1);
      const mondayOffset = (firstDay.getDay() + 6) % 7;
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // Empty leading slots before the 1st
      for (let i = 0; i < mondayOffset; i++) {
        const empty = document.createElement('div');
        empty.className = 'cal-day-cell is-empty';
        gridEl.appendChild(empty);
      }

      const inVal = checkinInput.value;
      const outVal = checkoutInput.value;

      // Actual days
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = formatDate(year, month, d);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cal-day-cell cal-day-btn';
        btn.textContent = String(d);
        btn.setAttribute('data-date', dateStr);

        // Check if date is in the past
        if (dateStr < todayStr) {
          btn.classList.add('is-past');
          btn.disabled = true;
          btn.setAttribute('aria-disabled', 'true');
        } else {
          // Check-in highlight
          if (inVal && dateStr === inVal) {
            btn.classList.add('is-start');
            btn.setAttribute('aria-selected', 'true');
          }

          // Check-out highlight
          if (outVal && dateStr === outVal) {
            btn.classList.add('is-end');
            btn.setAttribute('aria-selected', 'true');
          }

          // In-range highlight
          if (inVal && outVal && dateStr > inVal && dateStr < outVal) {
            btn.classList.add('is-in-range');
          }

          // Today indicator
          if (dateStr === todayStr) {
            btn.classList.add('is-today');
          }

          // Click selection
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleDateClick(dateStr);
          });

          // Hover preview highlight without DOM recreation
          btn.addEventListener('mouseenter', () => {
            if (inVal && !outVal && dateStr > inVal) {
              popover.querySelectorAll('.cal-day-btn').forEach(b => {
                const bDate = b.getAttribute('data-date');
                if (bDate > inVal && bDate <= dateStr) {
                  b.classList.add('is-hover-range');
                } else {
                  b.classList.remove('is-hover-range');
                }
              });
            }
          });

          btn.addEventListener('mouseleave', () => {
            if (inVal && !outVal) {
              popover.querySelectorAll('.cal-day-btn.is-hover-range').forEach(b => b.classList.remove('is-hover-range'));
            }
          });
        }

        gridEl.appendChild(btn);
      }
    }

    function handleDateClick(dateStr) {
      const inVal = checkinInput.value;
      const outVal = checkoutInput.value;

      if (!inVal || (inVal && outVal)) {
        // First selection (check-in)
        setInputValue(checkinInput, dateStr);
        setInputValue(checkoutInput, '');
        activeTarget = 'out';
        hoverDateStr = null;
        renderCalendar();
      } else if (inVal && !outVal) {
        if (dateStr <= inVal) {
          // Clicked same or earlier date -> becomes new check-in
          setInputValue(checkinInput, dateStr);
          hoverDateStr = null;
          renderCalendar();
        } else {
          // Second selection (check-out)
          setInputValue(checkoutInput, dateStr);
          hoverDateStr = null;
          renderCalendar();
          // Keep popover open with range summary and Done button ready
          const doneBtn = popover.querySelector('[data-cal-close]');
          if (doneBtn) {
            doneBtn.focus();
          }
        }
      }
    }

    function updateStatusText() {
      const inVal = checkinInput.value;
      const outVal = checkoutInput.value;
      const flexSuffix = selectedFlexDays > 0 ? ` (±${selectedFlexDays}d)` : '';

      if (!inVal) {
        titleEl.textContent = 'Select check-in date';
        subEl.textContent = 'Add your travel dates for exact quotes';
      } else if (!outVal) {
        titleEl.textContent = 'Select check-out date';
        subEl.textContent = `Check-in: ${inVal}`;
      } else {
        const d1 = new Date(inVal);
        const d2 = new Date(outVal);
        const nights = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
        titleEl.textContent = `${nights} night${nights > 1 ? 's' : ''}${flexSuffix}`;
        subEl.textContent = `${inVal} → ${outVal}${flexSuffix}`;
      }
    }

    function setInputValue(input, val) {
      input.value = val;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function clampPopover() {
      if (!popover || popover.hidden || window.innerWidth < 680) return;
      popover.style.left = '';
      popover.style.right = '';
      popover.style.transform = '';

      const pad = 16;
      const rect = popover.getBoundingClientRect();
      if (rect.right > window.innerWidth - pad) {
        popover.style.left = 'auto';
        popover.style.right = '0px';
        popover.style.transform = 'none';
      }
      const updatedRect = popover.getBoundingClientRect();
      if (updatedRect.left < pad) {
        const parentLeft = container.getBoundingClientRect().left;
        popover.style.left = `${Math.max(0, pad - parentLeft)}px`;
        popover.style.right = 'auto';
        popover.style.transform = 'none';
        popover.style.maxWidth = `${window.innerWidth - pad * 2}px`;
      }
    }

    function openPopover(target = 'in') {
      activeTarget = target;
      popover.hidden = false;
      popover.classList.add('is-open');

      const isMobile = window.innerWidth < 680;
      if (isMobile) {
        if (backdrop) backdrop.hidden = false;
        document.body.classList.add('cal-modal-open');
      }

      if (checkinInput.value) {
        const parsed = parseDate(checkinInput.value);
        if (parsed) activeMonthDate = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      }
      renderCalendar();
      clampPopover();
    }

    function closePopover() {
      popover.hidden = true;
      popover.classList.remove('is-open');
      popover.style.left = '';
      popover.style.right = '';
      popover.style.transform = '';
      if (backdrop) backdrop.hidden = true;
      document.body.classList.remove('cal-modal-open');
    }

    window.addEventListener('resize', clampPopover);

    // Toggle on focus/click of inputs
    checkinInput.addEventListener('focus', () => openPopover('in'));
    checkinInput.addEventListener('click', (e) => { e.stopPropagation(); openPopover('in'); });
    checkoutInput.addEventListener('focus', () => openPopover('out'));
    checkoutInput.addEventListener('click', (e) => { e.stopPropagation(); openPopover('out'); });

    // Cell clicks on wrapper
    container.querySelectorAll('[data-date-cell]').forEach(cell => {
      cell.addEventListener('click', (e) => {
        const t = cell.getAttribute('data-date-cell');
        openPopover(t || 'in');
      });
    });

    // Manual typing in inputs updates calendar in real-time
    [checkinInput, checkoutInput].forEach(inp => {
      inp.addEventListener('input', () => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(inp.value)) {
          const parsed = parseDate(inp.value);
          if (parsed && !isNaN(parsed)) {
            activeMonthDate = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
          }
        }
        renderCalendar();
      });
    });

    // Month Navigation
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      activeMonthDate.setMonth(activeMonthDate.getMonth() - 1);
      renderCalendar();
    });

    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      activeMonthDate.setMonth(activeMonthDate.getMonth() + 1);
      renderCalendar();
    });

    if (nextMobileBtn) {
      nextMobileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        activeMonthDate.setMonth(activeMonthDate.getMonth() + 1);
        renderCalendar();
      });
    }

    // Top Segmented Switcher [ Dates ] / [ Flexible ]
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        tabBtns.forEach(b => {
          b.classList.remove('is-active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');

        activeTab = btn.getAttribute('data-cal-tab');
        if (activeTab === 'flexible') {
          datesView.hidden = true;
          flexibleView.hidden = false;
          renderFlexibleView();
        } else {
          datesView.hidden = false;
          flexibleView.hidden = true;
          renderCalendar();
        }
      });
    });

    // Focus Keyboard Tool Button
    focusKbBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closePopover();
      if (!checkinInput.value) {
        checkinInput.focus();
      } else {
        checkoutInput.focus();
      }
    });

    // Flexibility Pills [ Exact dates ] [ ± 1 day ] ...
    flexPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        flexPills.forEach(p => p.classList.remove('is-active'));
        pill.classList.add('is-active');

        selectedFlexDays = parseInt(pill.getAttribute('data-flex-days') || '0', 10);
        updateStatusText();

        // Dispatch flexibility change event
        container.dispatchEvent(new CustomEvent('cal-flexibility-change', {
          bubbles: true,
          detail: { flexDays: selectedFlexDays }
        }));
      });
    });

    // Render Flexible View helper
    function renderFlexibleView() {
      const container = popover.querySelector('[data-upcoming-months]');
      if (!container) return;
      container.innerHTML = '';

      const upcoming = [];
      const m = new Date();
      for (let i = 0; i < 6; i++) {
        const targetM = new Date(m.getFullYear(), m.getMonth() + i, 1);
        upcoming.push({
          year: targetM.getFullYear(),
          month: targetM.getMonth(),
          name: MONTH_NAMES[targetM.getMonth()]
        });
      }

      upcoming.forEach((u, i) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'cal-month-card' + (i === 0 ? ' is-active' : '');
        item.innerHTML = `
          <div class="cal-month-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <strong>${u.name}</strong>
          <small>${u.year}</small>
        `;
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          container.querySelectorAll('.cal-month-card').forEach(c => c.classList.remove('is-active'));
          item.classList.add('is-active');

          activeMonthDate = new Date(u.year, u.month, 1);
          // Auto switch back to dates tab
          tabBtns[0].click();
        });
        container.appendChild(item);
      });
    }

    // Clear dates
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setInputValue(checkinInput, '');
      setInputValue(checkoutInput, '');
      activeTarget = 'in';
      hoverDateStr = null;
      selectedFlexDays = 0;
      flexPills.forEach(p => {
        if (p.getAttribute('data-flex-days') === '0') p.classList.add('is-active');
        else p.classList.remove('is-active');
      });
      renderCalendar();
    });

    // Close buttons (Done and Close icon)
    closeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        closePopover();
      });
    });

    // Close on mobile backdrop tap
    if (backdrop) {
      backdrop.addEventListener('click', () => {
        closePopover();
      });
    }

    // Close on outside click (desktop)
    document.addEventListener('click', (e) => {
      if (window.innerWidth >= 680 && !container.contains(e.target)) {
        closePopover();
      }
    });

    // Close on Esc
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !popover.hidden) {
        closePopover();
      }
    });

    // Re-check layout on window resize
    window.addEventListener('resize', () => {
      if (!popover.hidden) {
        renderCalendar();
      }
    });
  }

  function formatDate(y, m, d) {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }

  function parseDate(str) {
    if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
    const [y, m, d] = str.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return isNaN(date.getTime()) ? null : date;
  }
}
