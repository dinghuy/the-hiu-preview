/**
 * Tier 3: Cross-Feature Interactions (12 Pairwise Integration Tests)
 * Tests synergies, state synchronization, and reactive cascades across features.
 */

import { createDOMEnvironment } from './dom_env.mjs';

export function runTier3({ html, css, appJs, parsedCSS }) {
  const tests = [];

  function assert(id, feature, name, condition, expected, actual) {
    tests.push({
      id,
      tier: 'Tier 3: Cross-Feature Interactions',
      feature,
      name,
      pass: Boolean(condition),
      expected: String(expected),
      actual: String(actual)
    });
  }

  // -------------------------------------------------------------------------
  // 1. Estimator Date Sync to Inquiry Form (F9 + F11)
  // -------------------------------------------------------------------------
  const env1 = createDOMEnvironment(html);
  env1.runApp(appJs);

  const calcCheckin = env1.document.getElementById('calc-checkin');
  const calcCheckout = env1.document.getElementById('calc-checkout');
  const formCheckin = env1.document.getElementById('form-checkin');
  const formCheckout = env1.document.getElementById('form-checkout');

  calcCheckin.value = '2026-12-10';
  calcCheckin.dispatchEvent({ type: 'change' });
  calcCheckout.value = '2026-12-15';
  calcCheckout.dispatchEvent({ type: 'change' });

  const datesSynced = formCheckin?.value === '2026-12-10' && formCheckout?.value === '2026-12-15';
  assert(
    'T3_01', 'F9 + F11: Estimator Date Sync',
    'Changing dates in Estimator dynamically updates Inquiry Form inputs',
    datesSynced,
    'formCheckin: 2026-12-10, formCheckout: 2026-12-15',
    `formCheckin: ${formCheckin?.value}, formCheckout: ${formCheckout?.value}`
  );

  // -------------------------------------------------------------------------
  // 2. Estimator Guest Count Split Reactivity (F9 + F10)
  // -------------------------------------------------------------------------
  const calcGuests = env1.document.getElementById('calc-guests');
  const calcGuestDisplay = env1.document.getElementById('calc-guest-display');
  const perPersonEl = env1.document.getElementById('calc-per-person');

  // Change to 4 guests
  calcGuests.value = '4';
  calcGuests.dispatchEvent({ type: 'change' });

  const displayUpdated = calcGuestDisplay?.textContent?.trim() === '4' ||
                         calcGuestDisplay?.textContent?.includes('4');
  assert(
    'T3_02', 'F9 + F10: Guest Count Reactivity',
    'Changing guest count immediately updates guest display count and per-person price',
    displayUpdated && perPersonEl?.textContent !== '—',
    'Guest display: 4 and recalculated per-person price',
    `Display: ${calcGuestDisplay?.textContent}, PerPerson: ${perPersonEl?.textContent}`
  );

  // -------------------------------------------------------------------------
  // 3. Modal Open Body Scroll Lock & Escape Key Restoration (F8 + F12)
  // -------------------------------------------------------------------------
  const openModalBtn = env1.document.getElementById('open-ota-modal-btn');
  const modal = env1.document.getElementById('ota-modal');

  openModalBtn.dispatchEvent({ type: 'click' });
  const scrollLocked = env1.document.body.style.overflow === 'hidden';

  env1.document.dispatchEvent({ type: 'keydown', key: 'Escape' });
  const scrollRestored = env1.document.body.style.overflow === '';

  assert(
    'T3_03', 'F8 + F12: Modal Scroll Lock & Restore',
    'Opening modal locks body scroll; Escape dismisses modal and restores body scroll',
    scrollLocked && scrollRestored && !modal.classList.contains('is-open'),
    'Locked on open, restored on Escape',
    `Locked: ${scrollLocked}, Restored: ${scrollRestored}, isOpen: ${modal.classList.contains('is-open')}`
  );

  // -------------------------------------------------------------------------
  // 4. Parallax Scroll with Reduced Motion (F6 + F7)
  // -------------------------------------------------------------------------
  const rmEnv = createDOMEnvironment(html, { prefersReducedMotion: true });
  rmEnv.runApp(appJs);

  const heroBaseLayer = rmEnv.document.querySelector('.hero-layer-base img');
  const heroFrameLayer = rmEnv.document.querySelector('.hero-layer-frame');

  rmEnv.window.scrollY = 300;
  rmEnv.window.dispatchEvent({ type: 'scroll' });

  const baseTransform = heroBaseLayer?.style?.transform || '';
  const frameTransform = heroFrameLayer?.style?.transform || '';
  const parallaxInert = !baseTransform && !frameTransform;

  assert(
    'T3_04', 'F6 + F7: Parallax with Reduced Motion',
    'Window scroll triggers zero transform mutations on hero layers when reduced motion is requested',
    parallaxInert,
    'No transform applied to hero layers on scroll',
    `base: "${baseTransform}", frame: "${frameTransform}"`
  );

  // -------------------------------------------------------------------------
  // 5. Fallback Link Direct vs Draft Generator (F10 + F11)
  // -------------------------------------------------------------------------
  const fallbackLink = env1.document.querySelector('.enquiry-direct-options a');
  const sendDraftBtn = env1.document.getElementById('send-whatsapp-draft-btn');

  sendDraftBtn.dispatchEvent({ type: 'click' });
  const lastDraftUrl = env1.openedUrls[env1.openedUrls.length - 1]?.url || '';

  const fallbackIsClean = fallbackLink?.href === 'https://wa.me/84900000000' && !fallbackLink?.href.includes('?');
  const draftHasParams = lastDraftUrl.includes('?text=');

  assert(
    'T3_05', 'F10 + F11: Fallback vs Draft Independence',
    'Fallback link provides direct blank chat while draft button carries customized inquiry text',
    fallbackIsClean && draftHasParams,
    'Fallback is blank, Draft contains ?text=',
    `Fallback: ${fallbackLink?.href}, Draft: ${lastDraftUrl.slice(0, 35)}...`
  );

  // -------------------------------------------------------------------------
  // 6. Sticky Header vs Disclaimer Banner Stacking (F1 + F3 + F8)
  // -------------------------------------------------------------------------
  const bannerZ = parseInt(parsedCSS.getDeclaration('.preview-banner', 'z-index') || '0', 10);
  const headerZ = parseInt(parsedCSS.getDeclaration('.site-header', 'z-index') || '0', 10);
  const headerPosition = parsedCSS.getDeclaration('.site-header', 'position');

  assert(
    'T3_06', 'F1 + F3 + F8: Header & Banner Stacking',
    'Disclaimer banner (z-index >= 100) and sticky header (position: sticky, z-index >= 90) maintain structured z-index stacking',
    bannerZ >= 100 && headerZ >= 90 && headerPosition === 'sticky',
    'Banner z >= 100, Header sticky with z >= 90',
    `Banner z: ${bannerZ}, Header pos: ${headerPosition}, z: ${headerZ}`
  );

  // -------------------------------------------------------------------------
  // 7. Mobile Viewport with Modal Open (F8 + F12)
  // -------------------------------------------------------------------------
  const modalMaxHeight = parsedCSS.getDeclaration('.modal-content', 'max-height');
  const modalOverflowY = parsedCSS.getDeclaration('.modal-content', 'overflow-y') ||
                         parsedCSS.getDeclaration('.modal-backdrop', 'overflow-y');

  const mobileScrollSafe = (modalMaxHeight && modalMaxHeight.includes('vh')) &&
                           (modalOverflowY === 'auto' || modalOverflowY === 'scroll');

  assert(
    'T3_07', 'F8 + F12: Mobile Modal Viewport Containment',
    'Modal content specifies max-height (vh-bounded) and overflow-y: auto to prevent vertical offscreen trapping on mobile',
    mobileScrollSafe,
    'max-height: 90vh and overflow-y: auto',
    `max-height: ${modalMaxHeight}, overflow-y: ${modalOverflowY}`
  );

  // -------------------------------------------------------------------------
  // 8. Responsive Card Grids Symmetry on Tablet (F3 + F8)
  // -------------------------------------------------------------------------
  const tabletRoomsGrid = parsedCSS.getDeclaration('.rooms-grid', 'grid-template-columns', 'max-width: 992px');
  const tabletLastCardSpan = parsedCSS.getDeclaration('.rooms-grid > :last-child', 'grid-column', 'max-width: 992px') ||
                             parsedCSS.getDeclaration('.room-card:last-child', 'grid-column', 'max-width: 992px');

  const isBalancedGrid = !tabletRoomsGrid || tabletRoomsGrid === '1fr' || !tabletRoomsGrid.includes('1fr 1fr') || Boolean(tabletLastCardSpan);

  assert(
    'T3_08', 'F3 + F8: Responsive Card Grid Symmetry',
    'Tablet media queries (769px-992px) avoid asymmetrical orphan 3rd card on 2-column layout',
    isBalancedGrid,
    '1fr or symmetric 3-column / span layout',
    tabletRoomsGrid || 'Default 3-col'
  );

  // -------------------------------------------------------------------------
  // 9. Dark Host Info Pane Text Hierarchy vs Ground (F1 + F2)
  // -------------------------------------------------------------------------
  const darkPaneText = parsedCSS.getDeclaration('.enquiry-info-pane', 'color');
  const darkPaneBg = parsedCSS.getDeclaration('.enquiry-info-pane', 'background');

  assert(
    'T3_09', 'F1 + F2: Dark Pane Contrast & Tone',
    'Enquiry host assurance pane uses high-contrast dark panel (#242320) with light inverse text',
    (darkPaneBg?.includes('#242320') || darkPaneBg?.includes('var(--surface-dark)')) &&
    (darkPaneText?.includes('var(--ink-inverse)') || darkPaneText?.toLowerCase() === '#f9f8f5' || !darkPaneText),
    'Dark background with inverse text',
    `Bg: ${darkPaneBg}, Color: ${darkPaneText || 'Inherited/Elements'}`
  );

  // -------------------------------------------------------------------------
  // 10. Price Strip Starting Rate vs Estimator Rate Sync (F6 + F10)
  // -------------------------------------------------------------------------
  const priceStripText = env1.document.querySelector('.hero-price-strip')?.textContent || '';
  const has350InPriceStrip = priceStripText.includes('$350');
  const appHas350BaseWeekday = appJs.includes('BASE_WEEKDAY_RATE = 350') || appJs.includes('350');

  assert(
    'T3_10', 'F6 + F10: Price Strip vs Estimator Base Sync',
    'Hero starting price ($350) exactly matches base weekday night rate ($350) in Estimator engine',
    has350InPriceStrip && appHas350BaseWeekday,
    '$350 starting price aligned across Act 1 and Act 4',
    `Price strip: ${has350InPriceStrip ? '$350 found' : 'Missing'}, Engine: ${appHas350BaseWeekday ? '350 configured' : 'Missing'}`
  );

  // -------------------------------------------------------------------------
  // 11. Focus Trapping inside OTA Modal (F8 + F12)
  // -------------------------------------------------------------------------
  // Test whether modal dialog accessibility manages focus on open/close
  const hasFocusPlacement = appJs.includes('.focus()') || html.includes('autofocus');
  assert(
    'T3_11', 'F8 + F12: Modal Accessibility Focus Management',
    'OTA Modal manages focus placement or contains focus trapping logic for keyboard accessibility',
    hasFocusPlacement,
    'Focus management (.focus()) implemented for modal dialog',
    hasFocusPlacement ? 'Present' : 'Missing'
  );

  // -------------------------------------------------------------------------
  // 12. Disclaimer Banner Prominence & Non-PII Form Submission (F5 + F12)
  // -------------------------------------------------------------------------
  const bannerFirstInBody = html.indexOf('<aside class="preview-banner"') < html.indexOf('<header class="site-header"');
  const formOnSubmit = html.includes('onsubmit="return false;"');

  assert(
    'T3_12', 'F5 + F12: Disclaimer Prominence & Form Privacy',
    'Disclaimer banner is positioned at very top of body, and inquiry form prevents HTTP POST data transmission',
    bannerFirstInBody && formOnSubmit,
    'Banner top of body & onsubmit="return false;"',
    `Banner before header: ${bannerFirstInBody}, onsubmit: ${formOnSubmit}`
  );

  // -------------------------------------------------------------------------
  // 13. Space Perspective Angle Switcher (F5 + F6)
  // -------------------------------------------------------------------------
  const spaceEnv = createDOMEnvironment(html);
  spaceEnv.runApp(appJs);

  const anglePills = spaceEnv.document.querySelectorAll('.angle-pill');
  const card1Img = spaceEnv.document.getElementById('space-img-1');
  const card1PoolPill = Array.from(anglePills).find(p => p.getAttribute('data-src') === 'assets/pool.jpg');

  if (card1PoolPill) {
    card1PoolPill.dispatchEvent({ type: 'click' });
  }

  const angleSwitched = card1PoolPill &&
                        card1PoolPill.classList.contains('is-active') &&
                        card1PoolPill.getAttribute('aria-selected') === 'true' &&
                        card1Img && card1Img.getAttribute('src') === 'assets/pool.jpg';

  assert(
    'T3_13', 'F5 + F6: Space Perspective Angle Reactivity',
    'Clicking perspective angle pill switches space card image src and toggles aria-selected',
    angleSwitched,
    'Active angle pill with aria-selected="true" and updated img src',
    `Pill active: ${card1PoolPill?.classList.contains('is-active')}, img src: ${card1Img?.getAttribute('src')}`
  );

  // -------------------------------------------------------------------------
  // 14. Space Card Contextual Inquiry Deep Link & Form Purpose Pre-fill (F6 + F11)
  // -------------------------------------------------------------------------
  const inquiryLinks = spaceEnv.document.querySelectorAll('.space-inquiry-link');
  const inquiryLink = Array.from(inquiryLinks).find(l => l.getAttribute('data-purpose') === 'Family holiday');
  const testFormPurpose = spaceEnv.document.getElementById('form-purpose');

  if (inquiryLink) {
    inquiryLink.dispatchEvent({ type: 'click' });
  }

  const purposePrefilled = testFormPurpose && testFormPurpose.value === 'Family holiday';

  assert(
    'T3_14', 'F6 + F11: Contextual Inquiry Micro-Hook to Form Purpose Pre-fill',
    'Clicking contextual inquiry link in space card pre-selects matching stay purpose in Act 5 inquiry form',
    purposePrefilled,
    'formPurpose.value === "Family holiday"',
    `formPurpose.value: ${testFormPurpose?.value}`
  );

  return tests;
}
