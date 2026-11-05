#!/usr/bin/env node

/**
 * ============================================================================
 * Tier 5: Empirical Adversarial Challenge, Property-Based Fuzzing & Stress Suite
 * ============================================================================
 * Author: challenger_2 (teamwork_challenger: critic, specialist)
 * Target: /Users/dinhhuy/Project/Villa Agency/scrollcraft/builds/the-hiu-preview
 *
 * Adversarial Stress Areas:
 * 1. Quick Stay Estimator Mathematical Invariants:
 *    - 250+ randomized property-based date pairs across 2026, 2027, 2028 (leap year), 2029, 2030
 *    - Extreme stays: 1 night, 7 nights, 14 nights, 30 nights, 90 nights, 365 nights
 *    - Calendar edge cases: month boundaries, leap days (Feb 28 to Mar 1, 2028), year transitions
 *    - Timezone spoofing: America/Los_Angeles (UTC-8), America/New_York (UTC-5), UTC (UTC+0),
 *      Asia/Ho_Chi_Minh (UTC+7), Asia/Tokyo (UTC+9), Pacific/Kiritimati (UTC+14)
 *    - Date validation edge cases: checkOut == checkIn, checkOut < checkIn, empty strings, garbage strings
 *    - Guest count split: 1 through 10 guests, math and rounding verification
 * 2. WhatsApp Draft URL Generator Fuzzing:
 *    - Special characters, quotes, ampersands, unicode, Vietnamese diacritics, emojis, newlines
 *    - Roundtrip URL decoding verification
 *    - Strict fallback link verification (zero query string params)
 * 3. Modal Dialog Concurrency & State Machine:
 *    - Rapid clicking open/close toggles (100 cycles)
 *    - Backdrop clicks vs inner modal clicks
 *    - Escape key spam (closed & open states)
 *    - Tab focus trap cycling (forward and shift-tab reverse)
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createDOMEnvironment, MockElement } from './dom_env.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const htmlPath = path.join(projectRoot, 'index.html');
const appJsPath = path.join(projectRoot, 'app.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const appJs = fs.readFileSync(appJsPath, 'utf8');

// Terminal formatting
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const results = [];

function assert(category, testName, condition, expected, actual) {
  const pass = Boolean(condition);
  results.push({
    category,
    name: testName,
    pass,
    expected: String(expected),
    actual: String(actual)
  });
  if (!pass) {
    console.error(`  ${ANSI.red}✗ FAIL:${ANSI.reset} [${category}] ${testName}`);
    console.error(`    ${ANSI.dim}Expected:${ANSI.reset} ${ANSI.green}${expected}${ANSI.reset}`);
    console.error(`    ${ANSI.dim}Actual:${ANSI.reset}   ${ANSI.red}${actual}${ANSI.reset}`);
  }
}

// ============================================================================
// INDEPENDENT MATHEMATICAL ORACLE FOR STAY ESTIMATOR
// ============================================================================
function oracleCalculateStay(inStr, outStr, guests = 8) {
  if (!inStr || !outStr || !/^\d{4}-\d{2}-\d{2}$/.test(inStr) || !/^\d{4}-\d{2}-\d{2}$/.test(outStr)) {
    return { valid: false, reason: 'invalid_format' };
  }

  const [inY, inM, inD] = inStr.split('-').map(Number);
  const [outY, outM, outD] = outStr.split('-').map(Number);

  // Use UTC timestamps to establish pure calendar day arithmetic independent of local DST
  const startUtc = Date.UTC(inY, inM - 1, inD);
  const endUtc = Date.UTC(outY, outM - 1, outD);

  if (endUtc <= startUtc) {
    return { valid: false, reason: 'checkout_before_or_same' };
  }

  const nights = Math.round((endUtc - startUtc) / (1000 * 60 * 60 * 24));
  if (nights <= 0) {
    return { valid: false, reason: 'zero_or_negative_nights' };
  }

  let totalPrice = 0;
  for (let i = 0; i < nights; i++) {
    const curUtc = new Date(startUtc + i * 24 * 3600 * 1000);
    const dayOfWeek = curUtc.getUTCDay(); // 0: Sun, 5: Fri, 6: Sat
    const isWeekend = (dayOfWeek === 5 || dayOfWeek === 6);
    totalPrice += isWeekend ? 420 : 350;
  }

  const perPersonPerNight = Math.round(totalPrice / (nights * guests));

  return {
    valid: true,
    nights,
    totalPrice,
    perPersonPerNight,
    durationText: `${nights} night${nights > 1 ? 's' : ''}`,
    totalText: `$${totalPrice.toLocaleString('en-US')}`,
    perPersonText: `$${perPersonPerNight} / night`
  };
}

function formatDateYMD(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// ============================================================================
// SUITE 1: QUICK STAY ESTIMATOR MATHEMATICAL INVARIANTS & FUZZING
// ============================================================================
console.log(`${ANSI.bold}${ANSI.cyan}▶ Executing Suite 1: Quick Stay Estimator Mathematical Invariants...${ANSI.reset}`);

// Helper to instantiate a fresh DOM environment and run app.js
function createStayTester() {
  const env = createDOMEnvironment(html);
  env.runApp(appJs);
  const checkinInput = env.document.getElementById('calc-checkin');
  const checkoutInput = env.document.getElementById('calc-checkout');
  const guestsSelect = env.document.getElementById('calc-guests');
  const durationEl = env.document.getElementById('calc-duration');
  const totalEl = env.document.getElementById('calc-total');
  const perPersonEl = env.document.getElementById('calc-per-person');
  const guestDisplayEl = env.document.getElementById('calc-guest-display');

  function setInputs(inDate, outDate, guests) {
    if (inDate !== undefined) {
      checkinInput.value = inDate;
      checkinInput.dispatchEvent({ type: 'change' });
    }
    if (outDate !== undefined) {
      checkoutInput.value = outDate;
      checkoutInput.dispatchEvent({ type: 'change' });
    }
    if (guests !== undefined) {
      guestsSelect.value = String(guests);
      guestsSelect.dispatchEvent({ type: 'change' });
    }
    return {
      duration: durationEl?.textContent?.trim(),
      total: totalEl?.textContent?.trim(),
      perPerson: perPersonEl?.textContent?.trim(),
      guestDisplay: guestDisplayEl?.textContent?.trim()
    };
  }

  return { env, setInputs, checkinInput, checkoutInput, guestsSelect };
}

// 1.1 Property-based fuzz tests across 250+ randomized date pairs across multiple years
{
  const tester = createStayTester();
  const testYears = [2026, 2027, 2028, 2029, 2030];
  let fuzzPassed = 0;
  const TOTAL_FUZZ_PAIRS = 250;

  for (let i = 0; i < TOTAL_FUZZ_PAIRS; i++) {
    const yr = testYears[i % testYears.length];
    const month = 1 + Math.floor(Math.random() * 12);
    const day = 1 + Math.floor(Math.random() * 27); // 1..27 is valid in all months
    const stayNights = 1 + Math.floor(Math.random() * 60); // 1 to 60 nights

    const startDate = new Date(Date.UTC(yr, month - 1, day));
    const endDate = new Date(startDate.getTime() + stayNights * 24 * 3600 * 1000);

    const inStr = formatDateYMD(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, startDate.getUTCDate());
    const outStr = formatDateYMD(endDate.getUTCFullYear(), endDate.getUTCMonth() + 1, endDate.getUTCDate());
    const guests = [4, 6, 8, 10][Math.floor(Math.random() * 4)];

    const expected = oracleCalculateStay(inStr, outStr, guests);
    const actual = tester.setInputs(inStr, outStr, guests);

    const matchesDuration = actual.duration === expected.durationText;
    const matchesTotal = actual.total === expected.totalText;
    const matchesPerPerson = actual.perPerson === expected.perPersonText;

    if (matchesDuration && matchesTotal && matchesPerPerson) {
      fuzzPassed++;
    } else {
      assert(
        'Estimator Property Fuzz',
        `Fuzz Pair #${i + 1} (${inStr} -> ${outStr}, ${guests} guests)`,
        false,
        `${expected.durationText} | ${expected.totalText} | ${expected.perPersonText}`,
        `${actual.duration} | ${actual.total} | ${actual.perPerson}`
      );
    }
  }

  assert(
    'Estimator Property Fuzz',
    `250 randomized property-based date pairs matched oracle identically`,
    fuzzPassed === TOTAL_FUZZ_PAIRS,
    `${TOTAL_FUZZ_PAIRS}/${TOTAL_FUZZ_PAIRS} matched`,
    `${fuzzPassed}/${TOTAL_FUZZ_PAIRS} matched`
  );
}

// 1.2 Extreme Stays: 1, 7, 14, 30, 90, 365 nights
{
  const tester = createStayTester();
  const extremeDurations = [1, 7, 14, 30, 90, 365];

  for (const n of extremeDurations) {
    const inStr = '2026-06-01'; // Monday
    const startUtc = Date.UTC(2026, 5, 1);
    const endUtc = new Date(startUtc + n * 24 * 3600 * 1000);
    const outStr = formatDateYMD(endUtc.getUTCFullYear(), endUtc.getUTCMonth() + 1, endUtc.getUTCDate());
    const guests = 8;

    const expected = oracleCalculateStay(inStr, outStr, guests);
    const actual = tester.setInputs(inStr, outStr, guests);

    assert(
      'Extreme Stays',
      `Stay duration of ${n} night${n > 1 ? 's' : ''} (${inStr} to ${outStr})`,
      actual.duration === expected.durationText && actual.total === expected.totalText && actual.perPerson === expected.perPersonText,
      `Duration: ${expected.durationText}, Total: ${expected.totalText}, PerPerson: ${expected.perPersonText}`,
      `Duration: ${actual.duration}, Total: ${actual.total}, PerPerson: ${actual.perPerson}`
    );
  }
}

// 1.3 Calendar Edge Cases: Month boundaries & Leap year 2028
{
  const tester = createStayTester();
  const edgeCases = [
    { name: 'Month boundary non-leap (Feb 28 to Mar 2, 2026)', in: '2026-02-28', out: '2026-03-02', guests: 8 },
    { name: 'Month boundary non-leap (Feb 28 to Mar 2, 2027)', in: '2027-02-28', out: '2027-03-02', guests: 8 },
    { name: 'Leap year day span (Feb 28 to Mar 1, 2028)', in: '2028-02-28', out: '2028-03-01', guests: 8 },
    { name: 'Leap year single day (Feb 28 to Feb 29, 2028)', in: '2028-02-28', out: '2028-02-29', guests: 8 },
    { name: 'Leap year single day (Feb 29 to Mar 1, 2028)', in: '2028-02-29', out: '2028-03-01', guests: 8 },
    { name: 'Year boundary transition (Dec 30, 2026 to Jan 3, 2027)', in: '2026-12-30', out: '2027-01-03', guests: 8 },
    { name: 'Short month transition (Apr 30 to May 2, 2026)', in: '2026-04-30', out: '2026-05-02', guests: 8 },
    { name: 'End of 31-day month transition (Oct 31 to Nov 2, 2026)', in: '2026-10-31', out: '2026-11-02', guests: 8 }
  ];

  for (const ec of edgeCases) {
    const expected = oracleCalculateStay(ec.in, ec.out, ec.guests);
    const actual = tester.setInputs(ec.in, ec.out, ec.guests);

    assert(
      'Calendar Edge Cases',
      `${ec.name}: expected ${expected.nights} nights`,
      actual.duration === expected.durationText && actual.total === expected.totalText,
      `Duration: ${expected.durationText}, Total: ${expected.totalText}`,
      `Duration: ${actual.duration}, Total: ${actual.total}`
    );
  }
}

// 1.4 Date Validation Edge Cases: checkOut <= checkIn, empty, garbage
{
  const tester = createStayTester();
  const invalidCases = [
    { name: 'checkOut == checkIn (same day)', in: '2026-07-10', out: '2026-07-10' },
    { name: 'checkOut < checkIn (reversed dates)', in: '2026-07-15', out: '2026-07-10' },
    { name: 'Empty checkIn', in: '', out: '2026-07-15' },
    { name: 'Empty checkOut', in: '2026-07-10', out: '' },
    { name: 'Garbage string checkIn', in: 'not-a-date', out: '2026-07-15' },
    { name: 'Garbage string checkOut', in: '2026-07-10', out: 'corrupted-data' },
    { name: 'Invalid month (2026-13-10)', in: '2026-13-10', out: '2026-07-15' },
    { name: 'HTML Injection string', in: '<script>alert(1)</script>', out: '2026-07-15' }
  ];

  for (const ic of invalidCases) {
    const actual = tester.setInputs(ic.in, ic.out, 8);
    const durationIsError = actual.duration === 'Please choose valid dates';
    const totalIsReset = actual.total === '—';
    const perPersonIsReset = actual.perPerson === '—';

    assert(
      'Date Validation Edge Cases',
      `${ic.name} safely resets estimator and displays error message`,
      durationIsError && totalIsReset && perPersonIsReset,
      'duration="Please choose valid dates", total="—", perPerson="—"',
      `duration="${actual.duration}", total="${actual.total}", perPerson="${actual.perPerson}"`
    );
  }
}

// 1.5 Guest Count Split: 1 through 10 guests verification
{
  const tester = createStayTester();
  // Fixed stay: Friday & Saturday night -> $420 + $420 = $840 total, 2 nights
  const inStr = '2026-06-05';
  const outStr = '2026-06-07';
  const totalPrice = 840;
  const nights = 2;

  for (let g = 1; g <= 10; g++) {
    const actual = tester.setInputs(inStr, outStr, g);
    const expectedPerPersonPerNight = Math.round(totalPrice / (nights * g));
    const expectedPerPersonText = `$${expectedPerPersonPerNight} / night`;
    const expectedGuestDisplay = String(g);

    assert(
      'Guest Count Split',
      `Split calculation for ${g} guest${g > 1 ? 's' : ''} on $${totalPrice} / ${nights} nights`,
      actual.perPerson === expectedPerPersonText && actual.guestDisplay === expectedGuestDisplay,
      `perPerson="${expectedPerPersonText}", guestDisplay="${expectedGuestDisplay}"`,
      `perPerson="${actual.perPerson}", guestDisplay="${actual.guestDisplay}"`
    );
  }
}

// 1.6 Timezone Spoofing: America/Los_Angeles, America/New_York, UTC, Asia/Ho_Chi_Minh, Asia/Tokyo, Pacific/Kiritimati
{
  console.log(`${ANSI.dim}  Spawning subprocesses to verify calculation across 6 physical timezones...${ANSI.reset}`);
  const testTimezones = [
    { tz: 'America/Los_Angeles', offset: 'UTC-8' },
    { tz: 'America/New_York', offset: 'UTC-5' },
    { tz: 'UTC', offset: 'UTC+0' },
    { tz: 'Asia/Ho_Chi_Minh', offset: 'UTC+7' },
    { tz: 'Asia/Tokyo', offset: 'UTC+9' },
    { tz: 'Pacific/Kiritimati', offset: 'UTC+14' }
  ];

  // Node execution script that imports dom_env and tests weekend vs weekday calculation in the target TZ
  const tzWorkerScript = `
    import fs from 'node:fs';
    import { createDOMEnvironment } from './tests/dom_env.mjs';

    const html = fs.readFileSync('index.html', 'utf8');
    const appJs = fs.readFileSync('app.js', 'utf8');

    const env = createDOMEnvironment(html);
    env.runApp(appJs);

    const checkin = env.document.getElementById('calc-checkin');
    const checkout = env.document.getElementById('calc-checkout');
    const totalEl = env.document.getElementById('calc-total');

    function check(inVal, outVal) {
      checkin.value = inVal;
      checkin.dispatchEvent({ type: 'change' });
      checkout.value = outVal;
      checkout.dispatchEvent({ type: 'change' });
      return totalEl.textContent.trim();
    }

    // Test cases:
    // 1. Friday night only (2026-06-05 to 2026-06-06): Expected $420
    const fri = check('2026-06-05', '2026-06-06');
    // 2. Saturday night only (2026-06-06 to 2026-06-07): Expected $420
    const sat = check('2026-06-06', '2026-06-07');
    // 3. Sunday night only (2026-06-07 to 2026-06-08): Expected $350
    const sun = check('2026-06-07', '2026-06-08');
    // 4. Thursday night only (2026-06-04 to 2026-06-05): Expected $350
    const thu = check('2026-06-04', '2026-06-05');
    // 5. Full weekend (2026-06-05 to 2026-06-07, 2 nights): Expected $840
    const weekend = check('2026-06-05', '2026-06-07');
    // 6. Full 7 nights (2026-06-01 Mon to 2026-06-08 Mon): Expected $2,590 (5x$350 + 2x$420)
    const week = check('2026-06-01', '2026-06-08');

    const result = { fri, sat, sun, thu, weekend, week };
    console.log(JSON.stringify(result));
  `;

  for (const { tz, offset } of testTimezones) {
    const proc = spawnSync('node', ['--input-type=module', '-e', tzWorkerScript], {
      cwd: projectRoot,
      env: { ...process.env, TZ: tz },
      encoding: 'utf8'
    });

    if (proc.status !== 0) {
      assert(
        'Timezone Spoofing',
        `Subprocess execution in ${tz} (${offset}) exited cleanly`,
        false,
        'exit code 0',
        `exit code ${proc.status}: ${proc.stderr}`
      );
      continue;
    }

    try {
      const res = JSON.parse(proc.stdout.trim());
      assert(
        'Timezone Spoofing',
        `${tz} (${offset}): Friday night is $420`,
        res.fri === '$420',
        '$420',
        res.fri
      );
      assert(
        'Timezone Spoofing',
        `${tz} (${offset}): Saturday night is $420`,
        res.sat === '$420',
        '$420',
        res.sat
      );
      assert(
        'Timezone Spoofing',
        `${tz} (${offset}): Sunday night is $350`,
        res.sun === '$350',
        '$350',
        res.sun
      );
      assert(
        'Timezone Spoofing',
        `${tz} (${offset}): Thursday night is $350`,
        res.thu === '$350',
        '$350',
        res.thu
      );
      assert(
        'Timezone Spoofing',
        `${tz} (${offset}): Full weekend (Fri+Sat) is $840`,
        res.weekend === '$840',
        '$840',
        res.weekend
      );
      assert(
        'Timezone Spoofing',
        `${tz} (${offset}): Full 7-night week is $2,590`,
        res.week === '$2,590',
        '$2,590',
        res.week
      );
    } catch (err) {
      assert(
        'Timezone Spoofing',
        `Parse output in ${tz} (${offset})`,
        false,
        'valid JSON',
        err.message
      );
    }
  }
}

// ============================================================================
// SUITE 2: WHATSAPP DRAFT URL GENERATOR FUZZING & FALLBACK
// ============================================================================
console.log(`${ANSI.bold}${ANSI.cyan}▶ Executing Suite 2: WhatsApp Draft URL Generator Fuzzing...${ANSI.reset}`);

{
  const env = createDOMEnvironment(html);
  env.runApp(appJs);

  const formCheckin = env.document.getElementById('form-checkin');
  const formCheckout = env.document.getElementById('form-checkout');
  const formGuests = env.document.getElementById('form-guests');
  const formPurpose = env.document.getElementById('form-purpose');
  const formNotes = env.document.getElementById('form-notes');
  const sendDraftBtn = env.document.getElementById('send-whatsapp-draft-btn');

  // 2.1 Adversarial payload fuzzing
  const adversarialNotes = [
    {
      name: 'Quotes and Ampersands',
      text: 'Special request: "Seafood BBQ" & \'Chef Dinner\', please confirm & verify!'
    },
    {
      name: 'Vietnamese Diacritics and Accents',
      text: 'Chào The Hiu! Đoàn gồm người lớn & trẻ nhỏ, xin hỗ trợ nhận phòng sớm lúc 11:30 sáng và chuẩn bị 2 nôi em bé.'
    },
    {
      name: 'Emojis and Unicode Symbols',
      text: '🏖️ Villa trip 2026! 🌊 Need extra pool towels ☀️ & early iced coffee 🍹🇻🇳💯'
    },
    {
      name: 'Multiple Newlines and Formatting',
      text: 'Line 1: Need 2 baby cribs.\n\nLine 2: 2 parking spaces for 7-seater SUVs.\r\nLine 3: Late check-out at 14:00.'
    },
    {
      name: 'URL Special Characters and Delimiters',
      text: 'Question marks ??? Hashes #villa #vungtau, percents 100%, equals a=b&c=d, slashes /paths/test'
    }
  ];

  for (const payload of adversarialNotes) {
    env.openedUrls.length = 0; // reset
    formCheckin.value = '2026-08-10';
    formCheckout.value = '2026-08-14';
    formGuests.value = '5-8 guests';
    formPurpose.value = 'Family holiday';
    formNotes.value = payload.text;

    sendDraftBtn.dispatchEvent({ type: 'click' });

    assert(
      'WhatsApp URL Fuzzing',
      `${payload.name}: window.open invoked exactly once`,
      env.openedUrls.length === 1,
      '1 open call',
      `${env.openedUrls.length} calls`
    );

    const opened = env.openedUrls[0];
    const rawUrl = opened?.url || '';

    // Verify origin and phone number
    assert(
      'WhatsApp URL Fuzzing',
      `${payload.name}: URL points strictly to wa.me/84900000000`,
      rawUrl.startsWith('https://wa.me/84900000000?text='),
      'Starts with https://wa.me/84900000000?text=',
      rawUrl.slice(0, 35)
    );

    // Verify receiver roundtrip decoding
    const queryPart = rawUrl.split('?text=')[1] || '';
    let decodedText = '';
    let decodeSuccess = false;
    try {
      decodedText = decodeURIComponent(queryPart);
      decodeSuccess = true;
    } catch (e) {
      decodeSuccess = false;
    }

    assert(
      'WhatsApp URL Fuzzing',
      `${payload.name}: decodeURIComponent succeeds without URIError`,
      decodeSuccess,
      'valid percent-encoding',
      decodeSuccess ? 'decoded cleanly' : 'URIError'
    );

    assert(
      'WhatsApp URL Fuzzing',
      `${payload.name}: decoded message contains verbatim payload`,
      decodedText.includes(payload.text.trim()),
      `contains "${payload.text.trim().slice(0, 30)}..."`,
      decodedText.includes(payload.text.trim()) ? 'VERBATIM MATCH' : 'MISMATCH'
    );

    assert(
      'WhatsApp URL Fuzzing',
      `${payload.name}: window.open called with noopener,noreferrer`,
      opened?.features === 'noopener,noreferrer' && opened?.target === '_blank',
      'target="_blank", features="noopener,noreferrer"',
      `target="${opened?.target}", features="${opened?.features}"`
    );
  }

  // 2.2 Verify Fallback Link: strictly https://wa.me/84900000000 with zero query parameters
  const fallbackLinks = env.document.querySelectorAll('.enquiry-direct-options a');
  assert(
    'WhatsApp Fallback',
    'Fallback inquiry link exists in Act 5 direct options',
    fallbackLinks.length >= 1,
    'At least 1 link found',
    `${fallbackLinks.length} found`
  );

  const fallbackHref = fallbackLinks[0]?.getAttribute('href') || '';
  assert(
    'WhatsApp Fallback',
    'Fallback link href is strictly "https://wa.me/84900000000" with zero query string',
    fallbackHref === 'https://wa.me/84900000000',
    'https://wa.me/84900000000',
    fallbackHref
  );

  assert(
    'WhatsApp Fallback',
    'Fallback link href contains NO query question mark or parameters',
    !fallbackHref.includes('?'),
    'Zero query string params',
    fallbackHref.includes('?') ? 'Contains query params' : 'Clean'
  );
}

// ============================================================================
// SUITE 3: MODAL DIALOG CONCURRENCY & STATE MACHINE
// ============================================================================
console.log(`${ANSI.bold}${ANSI.cyan}▶ Executing Suite 3: Modal Dialog Concurrency & State Machine...${ANSI.reset}`);

{
  const env = createDOMEnvironment(html);
  env.runApp(appJs);

  const otaModal = env.document.getElementById('ota-modal');
  const openOtaBtn = env.document.getElementById('open-ota-modal-btn');
  const formOtaBtn = env.document.getElementById('form-ota-btn');
  const closeOtaBtn = env.document.getElementById('close-ota-modal-btn');
  const body = env.document.body;

  // 3.1 Rapid open/close cycling stress (100 sequential cycles)
  let cyclingStable = true;
  for (let i = 0; i < 100; i++) {
    // Alternate opening triggers
    const trigger = (i % 2 === 0) ? openOtaBtn : formOtaBtn;
    trigger.dispatchEvent({ type: 'click' });

    if (!otaModal.classList.contains('is-open') || body.style.overflow !== 'hidden') {
      cyclingStable = false;
      break;
    }

    // Close via close button or backdrop click
    if (i % 3 === 0) {
      closeOtaBtn.dispatchEvent({ type: 'click' });
    } else if (i % 3 === 1) {
      otaModal.dispatchEvent({ type: 'click', target: otaModal });
    } else {
      env.document.dispatchEvent({ type: 'keydown', key: 'Escape' });
    }

    if (otaModal.classList.contains('is-open') || body.style.overflow !== '') {
      cyclingStable = false;
      break;
    }
  }

  assert(
    'Modal State Machine',
    '100 rapid open/close cycles executed deterministically without state leak',
    cyclingStable,
    'Clean transitions across 100 cycles',
    cyclingStable ? 'Clean' : 'Corrupted state'
  );

  // 3.2 Backdrop clicks vs Inner modal clicks
  // Open modal
  openOtaBtn.dispatchEvent({ type: 'click' });
  assert(
    'Modal Click Discrimination',
    'Modal opens on trigger click',
    otaModal.classList.contains('is-open'),
    'is-open present',
    otaModal.classList.toString()
  );

  // Click inside modal content (should NOT close)
  const modalContent = otaModal.querySelector('.modal-content') || new MockElement('div');
  otaModal.dispatchEvent({ type: 'click', target: modalContent });
  assert(
    'Modal Click Discrimination',
    'Clicking modal content does NOT dismiss dialog',
    otaModal.classList.contains('is-open'),
    'Modal remains open',
    otaModal.classList.contains('is-open') ? 'Remains open' : 'Closed prematurely'
  );

  // Click a child platform box (should NOT close)
  const channelBox = otaModal.querySelector('.ota-channel-box') || new MockElement('div');
  otaModal.dispatchEvent({ type: 'click', target: channelBox });
  assert(
    'Modal Click Discrimination',
    'Clicking inner child element (.ota-channel-box) does NOT dismiss dialog',
    otaModal.classList.contains('is-open'),
    'Modal remains open',
    otaModal.classList.contains('is-open') ? 'Remains open' : 'Closed prematurely'
  );

  // Click backdrop element itself (target === otaModal) -> MUST close
  otaModal.dispatchEvent({ type: 'click', target: otaModal });
  assert(
    'Modal Click Discrimination',
    'Clicking backdrop backdrop overlay (target === otaModal) dismisses dialog',
    !otaModal.classList.contains('is-open') && body.style.overflow === '',
    'Modal closed and body overflow reset',
    `is-open: ${otaModal.classList.contains('is-open')}, overflow: "${body.style.overflow}"`
  );

  // 3.3 Escape key spam
  // Spam Escape 50 times when closed
  let closedSpamClean = true;
  for (let i = 0; i < 50; i++) {
    try {
      env.document.dispatchEvent({ type: 'keydown', key: 'Escape' });
      if (otaModal.classList.contains('is-open') || body.style.overflow !== '') {
        closedSpamClean = false;
      }
    } catch (e) {
      closedSpamClean = false;
    }
  }
  assert(
    'Modal Escape Spam',
    'Spamming Escape 50 times when modal is closed is safe and no-op',
    closedSpamClean,
    'No errors, state intact',
    closedSpamClean ? 'Clean' : 'Error/Corrupted'
  );

  // Open modal, spam Escape 50 times
  openOtaBtn.dispatchEvent({ type: 'click' });
  let openSpamClean = true;
  for (let i = 0; i < 50; i++) {
    try {
      env.document.dispatchEvent({ type: 'keydown', key: 'Escape' });
      if (i === 0 && (otaModal.classList.contains('is-open') || body.style.overflow !== '')) {
        openSpamClean = false;
      }
    } catch (e) {
      openSpamClean = false;
    }
  }
  assert(
    'Modal Escape Spam',
    'Spamming Escape 50 times when modal is open dismisses on 1st and ignores next 49',
    openSpamClean && !otaModal.classList.contains('is-open') && body.style.overflow === '',
    'Modal cleanly closed on 1st escape',
    openSpamClean ? 'Clean' : 'Error'
  );

  // Non-Escape keys ignored
  openOtaBtn.dispatchEvent({ type: 'click' });
  const nonEscapeKeys = ['Enter', 'Space', 'ArrowDown', 'KeyA', 'Backspace'];
  let nonEscapeIgnored = true;
  for (const k of nonEscapeKeys) {
    env.document.dispatchEvent({ type: 'keydown', key: k });
    if (!otaModal.classList.contains('is-open')) {
      nonEscapeIgnored = false;
    }
  }
  assert(
    'Modal Key Handling',
    'Non-Escape keys do NOT trigger modal dismissal',
    nonEscapeIgnored,
    'Modal remains open',
    nonEscapeIgnored ? 'Ignored' : 'Modal closed'
  );
  closeOtaBtn.dispatchEvent({ type: 'click' });

  // 3.4 Tab focus trap cycling
  openOtaBtn.focus();
  openOtaBtn.dispatchEvent({ type: 'click' });

  // In the current modal, closeOtaBtn is focused on open
  assert(
    'Modal Focus Trap',
    'closeOtaBtn receives focus upon modal open',
    env.document.activeElement === closeOtaBtn,
    'closeOtaBtn active',
    env.document.activeElement?.id || 'null'
  );

  // Dispatch Tab forward event
  let tabDefaultPrevented = false;
  otaModal.dispatchEvent({
    type: 'keydown',
    key: 'Tab',
    shiftKey: false,
    preventDefault: () => { tabDefaultPrevented = true; }
  });

  assert(
    'Modal Focus Trap',
    'Tab forward event cycles focus within modal and prevents default on boundary',
    tabDefaultPrevented && env.document.activeElement === closeOtaBtn,
    'preventDefault called, focus trapped on modal',
    `prevented: ${tabDefaultPrevented}, active: ${env.document.activeElement?.id}`
  );

  // Dispatch Shift+Tab reverse event
  let shiftTabDefaultPrevented = false;
  otaModal.dispatchEvent({
    type: 'keydown',
    key: 'Tab',
    shiftKey: true,
    preventDefault: () => { shiftTabDefaultPrevented = true; }
  });

  assert(
    'Modal Focus Trap',
    'Shift+Tab reverse event wraps focus to last focusable element and prevents default',
    shiftTabDefaultPrevented && env.document.activeElement === closeOtaBtn,
    'preventDefault called, focus trapped on modal',
    `prevented: ${shiftTabDefaultPrevented}, active: ${env.document.activeElement?.id}`
  );

  // Close modal and verify focus restores to openOtaBtn
  closeOtaBtn.dispatchEvent({ type: 'click' });
  assert(
    'Modal Focus Restoration',
    'Closing modal restores focus to opening trigger button (openOtaBtn)',
    env.document.activeElement === openOtaBtn,
    'openOtaBtn active',
    env.document.activeElement?.id || 'null'
  );

  // Test secondary trigger formOtaBtn focus restoration
  formOtaBtn.focus();
  formOtaBtn.dispatchEvent({ type: 'click' });
  assert(
    'Modal Focus Restoration',
    'Opening via formOtaBtn moves focus to close button',
    env.document.activeElement === closeOtaBtn,
    'closeOtaBtn active',
    env.document.activeElement?.id || 'null'
  );
  closeOtaBtn.dispatchEvent({ type: 'click' });
  assert(
    'Modal Focus Restoration',
    'Closing modal restores focus to secondary trigger button (formOtaBtn)',
    env.document.activeElement === formOtaBtn,
    'formOtaBtn active',
    env.document.activeElement?.id || 'null'
  );
}

// ============================================================================
// SUMMARY & VERDICT
// ============================================================================
console.log(`\n${ANSI.dim}------------------------------------------------------------------------------${ANSI.reset}`);
const passedCount = results.filter(r => r.pass).length;
const failedCount = results.filter(r => !r.pass).length;
const totalCount = results.length;

console.log(`${ANSI.bold}Tier 5 Adversarial Stress Test Summary:${ANSI.reset}`);
console.log(`  Passed:  ${ANSI.green}${passedCount}${ANSI.reset}`);
console.log(`  Failed:  ${failedCount > 0 ? ANSI.red : ANSI.green}${failedCount}${ANSI.reset}`);
console.log(`  Total:   ${totalCount}`);
console.log(`${ANSI.dim}------------------------------------------------------------------------------${ANSI.reset}`);

if (failedCount > 0) {
  console.log(`${ANSI.bold}${ANSI.red}VERDICT: REQUEST_CHANGES (${failedCount} adversarial vulnerabilities confirmed)${ANSI.reset}\n`);
  process.exit(1);
} else {
  console.log(`${ANSI.bold}${ANSI.green}VERDICT: APPROVE (${passedCount}/${totalCount} stress tests passed with 100% mathematical integrity)${ANSI.reset}\n`);
  process.exit(0);
}
