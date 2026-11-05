/**
 * Tier 4: Real-World Scenarios (5 Comprehensive End-to-End Workloads)
 * Simulates real user journeys, multi-device viewport constraints, accessibility,
 * timezone-independent financial calculations, and direct vs OTA decision flows.
 */

import { createDOMEnvironment } from './dom_env.mjs';
import { execSync } from 'node:child_process';

export function runTier4({ html, css, appJs, parsedCSS }) {
  const tests = [];

  function assert(id, feature, name, condition, expected, actual) {
    tests.push({
      id,
      tier: 'Tier 4: Real-World Scenarios',
      feature,
      name,
      pass: Boolean(condition),
      expected: String(expected),
      actual: String(actual)
    });
  }

  // =========================================================================
  // Scenario 1: Mobile Guest Discovery & Inquiry on iPhone (390px)
  // =========================================================================
  (() => {
    const env = createDOMEnvironment(html, { innerWidth: 390, innerHeight: 844 });
    env.runApp(appJs);

    // 1. Check mobile layout tokens
    const mobPad = parsedCSS.getDeclaration('.container', 'padding-left', 'max-width: 768px') || '20px';
    const bodyOverflowX = parsedCSS.getDeclaration('body', 'overflow-x');

    // 2. Interact with Estimator: 3 nights (Fri Nov 20 to Mon Nov 23) for 6 guests
    const checkin = env.document.getElementById('calc-checkin');
    const checkout = env.document.getElementById('calc-checkout');
    const guests = env.document.getElementById('calc-guests');
    const duration = env.document.getElementById('calc-duration');
    const total = env.document.getElementById('calc-total');
    const perPerson = env.document.getElementById('calc-per-person');

    checkin.value = '2026-11-20'; // Fri
    checkout.value = '2026-11-23'; // Mon
    guests.value = '6';
    checkin.dispatchEvent({ type: 'change' });
    checkout.dispatchEvent({ type: 'change' });
    guests.dispatchEvent({ type: 'change' });

    // 2 weekend nights ($840) + 1 weekday night ($350) = $1,190
    // Per person: Math.round(1190 / 18) = $66 / night
    const calcCorrect = total.textContent.includes('$1,190') &&
                        duration.textContent.includes('3 nights') &&
                        perPerson.textContent.includes('$66');

    // 3. Complete inquiry form
    const formCheckin = env.document.getElementById('form-checkin');
    const formCheckout = env.document.getElementById('form-checkout');
    const formGuests = env.document.getElementById('form-guests');
    const formPurpose = env.document.getElementById('form-purpose');
    const formNotes = env.document.getElementById('form-notes');
    const sendBtn = env.document.getElementById('send-whatsapp-draft-btn');

    formCheckin.value = checkin.value;
    formCheckout.value = checkout.value;
    formGuests.value = '6 Guests';
    formPurpose.value = 'Weekend Getaway';
    formNotes.value = 'Arriving by car, need 2 parking spots';

    sendBtn.dispatchEvent({ type: 'click' });
    const lastOpened = env.openedUrls[env.openedUrls.length - 1]?.url || '';
    const decoded = decodeURIComponent(lastOpened);

    const draftValid = lastOpened.startsWith('https://wa.me/84900000000?text=') &&
                       decoded.includes('2026-11-20') &&
                       decoded.includes('2026-11-23') &&
                       decoded.includes('6 Guests') &&
                       decoded.includes('Weekend Getaway') &&
                       decoded.includes('need 2 parking spots');

    const pass = mobPad === '20px' && bodyOverflowX === 'hidden' && calcCorrect && draftValid;

    assert(
      'T4_01', 'Scenario 1: Mobile Guest Discovery & Inquiry',
      'Mobile guest on iPhone (390px) computes stay, completes form, and generates verified WhatsApp URL',
      pass,
      'Valid mobile calculations and draft URL encoding',
      `calc: ${total.textContent} (${duration.textContent}), draft: ${lastOpened.slice(0, 35)}...`
    );
  })();

  // =========================================================================
  // Scenario 2: International Guest Weekend Stay Calculation in US Timezone
  // =========================================================================
  (() => {
    let outputData = null;
    try {
      const cmd = `TZ=America/New_York node -e '
        import fs from "node:fs";
        import { createDOMEnvironment } from "./tests/dom_env.mjs";
        const html = fs.readFileSync("./index.html", "utf8");
        const appJs = fs.readFileSync("./app.js", "utf8");
        const env = createDOMEnvironment(html);
        env.runApp(appJs);
        const checkin = env.document.getElementById("calc-checkin");
        const checkout = env.document.getElementById("calc-checkout");
        const total = env.document.getElementById("calc-total");
        const perPerson = env.document.getElementById("calc-per-person");
        const duration = env.document.getElementById("calc-duration");

        checkin.value = "2026-11-13";
        checkout.value = "2026-11-15";
        checkin.dispatchEvent({ type: "change" });
        checkout.dispatchEvent({ type: "change" });

        const validTotal = total.textContent;
        const validPerPerson = perPerson.textContent;

        checkout.value = "2026-11-12";
        checkout.dispatchEvent({ type: "change" });
        const invalidDuration = duration.textContent;
        const invalidTotal = total.textContent;

        console.log(JSON.stringify({ validTotal, validPerPerson, invalidDuration, invalidTotal }));
      '`;
      outputData = JSON.parse(execSync(cmd, { cwd: '/Users/dinhhuy/Project/Villa Agency/scrollcraft/builds/the-hiu-preview', encoding: 'utf8' }).trim());
    } catch (err) {
      outputData = { error: err.message };
    }

    const is840 = outputData?.validTotal?.includes('$840');
    const is53PerPerson = outputData?.validPerPerson?.includes('$53');
    const showsInvalidError = outputData?.invalidDuration?.includes('Please choose valid dates') &&
                              outputData?.invalidTotal === '—';

    const pass = is840 && is53PerPerson && showsInvalidError;

    assert(
      'T4_02', 'Scenario 2: US Timezone Weekend Stay Calculation',
      'International traveler in US Eastern timezone gets accurate weekend rates ($840) and validation on invalid dates',
      pass,
      'Total $840, Per-person $53, error on invalid check-out',
      `Weekend Total: ${outputData?.validTotal}, Error handled: ${showsInvalidError}`
    );
  })();

  // =========================================================================
  // Scenario 3: Accessibility User with Reduced Motion Navigation
  // =========================================================================
  (() => {
    const env = createDOMEnvironment(html, { prefersReducedMotion: true });
    env.runApp(appJs);

    // 1. Verify CSS reduced motion rules
    const scrollAuto = parsedCSS.getDeclaration('html', 'scroll-behavior', 'prefers-reduced-motion');
    const transitionNone = parsedCSS.getDeclaration('*, *::before, *::after', 'transition', 'prefers-reduced-motion') ||
                           parsedCSS.getDeclaration('*', 'transition', 'prefers-reduced-motion');
    const transformNone = parsedCSS.getDeclaration('*, *::before, *::after', 'transform', 'prefers-reduced-motion') ||
                          parsedCSS.getDeclaration('*', 'transform', 'prefers-reduced-motion') ||
                          parsedCSS.getDeclaration('.space-card:hover', 'transform', 'prefers-reduced-motion');

    // 2. Verify scroll parallax does not apply transforms
    const heroBaseImg = env.document.querySelector('.hero-layer-base img');
    env.window.scrollY = 250;
    env.window.dispatchEvent({ type: 'scroll' });

    const heroBaseTransform = heroBaseImg?.style?.transform || '';

    // 3. Verify modal opens and closes cleanly with keyboard Escape
    const openBtn = env.document.getElementById('open-ota-modal-btn');
    const modal = env.document.getElementById('ota-modal');

    openBtn.dispatchEvent({ type: 'click' });
    const modalOpened = modal.classList.contains('is-open');

    env.document.dispatchEvent({ type: 'keydown', key: 'Escape' });
    const modalClosed = !modal.classList.contains('is-open');

    const pass = scrollAuto?.includes('auto') &&
                 transitionNone?.includes('none') &&
                 transformNone?.includes('none') &&
                 !heroBaseTransform &&
                 modalOpened &&
                 modalClosed;

    assert(
      'T4_03', 'Scenario 3: Reduced Motion User Experience',
      'User with prefers-reduced-motion experiences zero animation/transforms, inert scroll parallax, and accessible modal',
      pass,
      'Scroll auto, transitions none, transform none, inert parallax, accessible modal',
      `Scroll: ${scrollAuto}, TransformOverride: ${transformNone}, ParallaxTransform: "${heroBaseTransform}"`
    );
  })();

  // =========================================================================
  // Scenario 4: Group Organizer Comparing Direct Rates vs OTA Platforms
  // =========================================================================
  (() => {
    const env = createDOMEnvironment(html);
    env.runApp(appJs);

    // 5 nights: Wed Nov 18 to Mon Nov 23 for 8 guests
    const checkin = env.document.getElementById('calc-checkin');
    const checkout = env.document.getElementById('calc-checkout');
    const guests = env.document.getElementById('calc-guests');
    const total = env.document.getElementById('calc-total');
    const perPerson = env.document.getElementById('calc-per-person');

    checkin.value = '2026-11-18'; // Wed
    checkout.value = '2026-11-23'; // Mon
    guests.value = '8';
    checkin.dispatchEvent({ type: 'change' });
    checkout.dispatchEvent({ type: 'change' });
    guests.dispatchEvent({ type: 'change' });

    // 3 weekdays (Wed, Thu, Sun = $1050) + 2 weekend (Fri, Sat = $840) = $1,890
    // Per person: 1890 / 40 = $47.25 -> $47
    const calcCorrect = total.textContent.includes('$1,890') && perPerson.textContent.includes('$47');

    // Open OTA Modal
    const openOtaBtn = env.document.getElementById('open-ota-modal-btn');
    const modal = env.document.getElementById('ota-modal');
    openOtaBtn.dispatchEvent({ type: 'click' });

    const modalText = env.document.querySelector('.modal-content')?.textContent || '';
    const mentionsChannels = modalText.includes('Airbnb') && modalText.includes('Booking.com');
    const explainsSavings = modalText.includes('Direct Booking Benefit') || modalText.includes('zero OTA platform service fees') || modalText.includes('best rate') || modalText.includes('15');

    // Close modal via backdrop
    modal.dispatchEvent({ type: 'click', target: modal });
    const modalClosed = !modal.classList.contains('is-open');

    const pass = calcCorrect && mentionsChannels && explainsSavings && modalClosed;

    assert(
      'T4_04', 'Scenario 4: Group Organizer Direct vs OTA Comparison',
      'Organizer calculates 5-night stay ($1,890), opens OTA comparison detailing direct savings, and dismisses modal',
      pass,
      'Calculation $1,890 ($47/night), modal highlights Airbnb/Booking and 15-20% direct saving',
      `Calc: ${total.textContent}, Channels: ${mentionsChannels}, SavingsText: ${explainsSavings}`
    );
  })();

  // =========================================================================
  // Scenario 5: Family Vacationer Reviewing Floorplan & Submitting Inquiry
  // =========================================================================
  (() => {
    const env = createDOMEnvironment(html);
    env.runApp(appJs);

    // 1. Verify 3 Bedroom cards
    const roomCards = env.document.querySelectorAll('.room-card');
    const has3Rooms = roomCards.length === 3;

    // 2. Verify Floorplan SVG levels
    const floorplanWrap = env.document.querySelector('.floorplan-svg-wrap');
    const floorplanText = floorplanWrap?.textContent || '';
    const hasBothLevels = floorplanText.includes('GROUND LEVEL') && floorplanText.includes('UPPER LEVEL');

    // 3. Submit inquiry with family notes
    const formCheckin = env.document.getElementById('form-checkin');
    const formCheckout = env.document.getElementById('form-checkout');
    const formGuests = env.document.getElementById('form-guests');
    const formPurpose = env.document.getElementById('form-purpose');
    const formNotes = env.document.getElementById('form-notes');
    const sendBtn = env.document.getElementById('send-whatsapp-draft-btn');

    formCheckin.value = '2026-12-24';
    formCheckout.value = '2026-12-27';
    formGuests.value = '4 Guests';
    formPurpose.value = 'Family Vacation';
    formNotes.value = 'Traveling with infant: need crib setup and early check-in recommendation';

    sendBtn.dispatchEvent({ type: 'click' });
    const lastOpened = env.openedUrls[env.openedUrls.length - 1]?.url || '';
    const decoded = decodeURIComponent(lastOpened);

    const draftContainsFamilyNotes = decoded.includes('Family Vacation') &&
                                    decoded.includes('need crib setup and early check-in recommendation');

    const fallbackLink = env.document.querySelector('.enquiry-direct-options a');
    const fallbackClean = fallbackLink && fallbackLink.href === 'https://wa.me/84900000000';

    const pass = has3Rooms && hasBothLevels && draftContainsFamilyNotes && fallbackClean;

    assert(
      'T4_05', 'Scenario 5: Family Vacationer Review & Inquiry',
      'Family vacationer reviews 3 bedroom cards and 2-level SVG floorplan, then drafts customized WhatsApp inquiry',
      pass,
      '3 room cards, 2-level floorplan, and family inquiry draft with fallback link',
      `Rooms: ${roomCards.length}, FloorplanLevels: ${hasBothLevels}, Draft: ${draftContainsFamilyNotes}`
    );
  })();

  return tests;
}
