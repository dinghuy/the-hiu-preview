import { inquiryMessage, whatsappUrl, validateInquiry, splitQuote, formatMoney, quoteText } from './experience-core.mjs';
import { initAirbnbCalendar } from './airbnb-calendar.js';
const config = JSON.parse(document.getElementById('experience-config').textContent);
const contact = config.contact;
const forms = [...document.querySelectorAll('[data-inquiry-form]')];
const state = { villa: config.currentVilla || '', checkin: '', checkout: '', adults: '', children: '' };
const date = new Date();
const today = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const villaFor = code => config.villas.find(v => v.code === code);
let validity = { errors: [], warning: '' };
function update() {
  const villa = villaFor(state.villa);
  validity = validateInquiry(state, villa?.maxTotal, today);
  for (const form of forms) {
    for (const input of form.querySelectorAll('[name]')) {
      if (input.name in state && input.value !== state[input.name]) input.value = state[input.name];
      if (input.name === 'checkin') input.min = today;
      if (input.name === 'checkout') input.min = state.checkin || today;
    }
    form.querySelector('[data-form-errors]').textContent = validity.errors.join(' ');
    form.querySelector('[data-capacity-warning]').textContent = validity.warning;
  }
  for (const link of document.querySelectorAll('[data-wa]')) {
    const chosen = villaFor(link.dataset.villaCode || state.villa);
    const ref = link.dataset.ref || config.reference;
    link.href = whatsappUrl(contact, inquiryMessage(state, chosen, ref));
    link.setAttribute('aria-disabled', String(validity.errors.length > 0));
  }
  for (const field of document.querySelectorAll('[data-message-draft]')) field.value = inquiryMessage(state, villa, config.reference);
}
for (const form of forms) {
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', event => { if (event.target.name in state) {state[event.target.name] = event.target.value; update();} });
  form.addEventListener('change', event => { if (event.target.name in state) {state[event.target.name] = event.target.value; update();} });
}
document.addEventListener('click', event => {
  const link = event.target.closest('[data-wa], [data-zalo]');
  if (link && validity.errors.length) { event.preventDefault(); (link.closest('[data-inquiry-form]') || forms[0])?.querySelector('[data-form-errors]')?.focus(); }
});
async function copyText(text, region) {
  const fallback = region.querySelector('[data-copy-fallback]');
  const status = region.querySelector('[data-copy-status]');
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    fallback.hidden = true; status.textContent = 'Copied. Paste it into your chat.';
  } catch {
    fallback.hidden = false; fallback.value = text; fallback.focus(); fallback.select();
    status.textContent = 'Select and copy the text below, then paste it into your chat.';
  }
}
document.querySelectorAll('[data-copy-message]').forEach(button => button.addEventListener('click', () => {
  const region = button.closest('[data-copy-region]');
  if (validity.errors.length) {region.querySelector('[data-copy-status]').textContent = validity.errors.join(' ');return;}
  copyText(inquiryMessage(state, villaFor(state.villa), config.reference), region);
}));
document.querySelectorAll('[data-copy-phone]').forEach(button => button.addEventListener('click', () => copyText(contact.phone, button.closest('[data-copy-region]'))));
const sheet = document.getElementById('inquiry-sheet');
let sheetTrigger;
const openSheet = trigger => {sheetTrigger=trigger;sheet.showModal();document.body.classList.add('modal-open');sheet.querySelector('input, select')?.focus();};
function closeSheet(){sheet.close();document.body.classList.remove('modal-open');sheetTrigger?.focus();}
document.querySelectorAll('[data-open-inquiry]').forEach(button => button.addEventListener('click', () => {
  if(button.dataset.villaCode) {state.villa=button.dataset.villaCode;update();}
  if (window.matchMedia('(max-width: 767px)').matches) openSheet(button);
  else {document.getElementById('concierge').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});forms[0].querySelector('input, select')?.focus({preventScroll:true});}
}));
sheet?.querySelector('[data-close-sheet]').addEventListener('click', closeSheet);
sheet?.addEventListener('cancel', event => {event.preventDefault();closeSheet();});
sheet?.addEventListener('click', event => {if(event.target===sheet) {const b=sheet.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)closeSheet();}});
update();
const calc = document.querySelector('[data-quote-calculator]');
if (calc) {
  let result;
  const error = calc.querySelector('[data-calc-error]'), results=calc.querySelector('[data-calc-results]'), button=calc.querySelector('[data-copy-quote]');
  function calculate() {
    const fields=Object.fromEntries(new FormData(calc));
    try {
      result=splitQuote(fields.total,fields.currency,fields.nights,fields.people);
      const render=v=>`${v.approximate?'≈ ':''}${formatMoney(v.amount,result.currency)}`;
      calc.querySelector('[data-per-trip]').textContent=render(result.perTrip);
      calc.querySelector('[data-per-night]').textContent=render(result.perNight);
      calc.querySelector('[data-original-total]').textContent=formatMoney(result.total,result.currency);
      error.textContent='';results.hidden=false;button.disabled=false;
    } catch(e) {result=null;results.hidden=true;button.disabled=true;error.textContent=Object.values(fields).some(Boolean)&&fields.total!==''?e.message:'';}
  }
  calc.addEventListener('submit',event=>{event.preventDefault();calculate();});
  calc.addEventListener('input',calculate);calc.addEventListener('change',calculate);
  button.addEventListener('click',()=>{if(result)copyText(quoteText(result),calc);});
  calculate();
}

// Airbnb Interactive Booking Widget Handler
const bookingWidget = document.querySelector('[data-booking-widget]');
if (bookingWidget) {
  const checkinInput = bookingWidget.querySelector('#picker-checkin');
  const checkoutInput = bookingWidget.querySelector('#picker-checkout');
  const guestsInput = bookingWidget.querySelector('#picker-guests');
  const summaryBox = bookingWidget.querySelector('[data-stay-summary]');
  const nightsCountEl = bookingWidget.querySelector('[data-stay-nights-count]');
  const baseTotalEl = bookingWidget.querySelector('[data-stay-base-total]');
  const estTotalEl = bookingWidget.querySelector('[data-stay-estimated-total]');
  const waBtn = bookingWidget.querySelector('.booking-wa-btn');
  const rateUSD = Number(bookingWidget.dataset.rate) || 340;
  const villaCode = bookingWidget.dataset.code || '';
  const villaName = bookingWidget.dataset.name || '';
  const ref = bookingWidget.dataset.ref || config.reference;

  if (checkinInput) checkinInput.min = today;
  if (checkoutInput) checkoutInput.min = today;

  function updateBookingWidget() {
    const cin = checkinInput?.value;
    const cout = checkoutInput?.value;
    const guests = guestsInput?.value || '1';

    if (cin && checkoutInput) {
      checkoutInput.min = cin;
    }

    if (cin && cout && cout > cin) {
      const d1 = new Date(cin);
      const d2 = new Date(cout);
      const diffTime = d2.getTime() - d1.getTime();
      const nights = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
      const baseTotal = nights * rateUSD;

      if (summaryBox) summaryBox.hidden = false;
      if (nightsCountEl) nightsCountEl.textContent = String(nights);
      if (baseTotalEl) baseTotalEl.textContent = `$${baseTotal.toLocaleString()}`;
      if (estTotalEl) estTotalEl.textContent = `~$${baseTotal.toLocaleString()}`;

      state.checkin = cin;
      state.checkout = cout;
      state.adults = guests;

      const text = `Hello The Hiu Concierge, I would like to check availability for ${villaName} (${villaCode}) from ${cin} to ${cout} (${nights} night${nights>1?'s':''}, ${guests} guests). Estimated total: $${baseTotal.toLocaleString()}. Reference: ${ref}.`;
      if (waBtn) {
        waBtn.href = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(text)}`;
      }
    } else {
      if (summaryBox) summaryBox.hidden = true;
      const defaultText = `Hello The Hiu Concierge, I would like to inquire about availability and rates for ${villaName} (${villaCode}). Reference: ${ref}.`;
      if (waBtn) {
        waBtn.href = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(defaultText)}`;
      }
    }
  }

  checkinInput?.addEventListener('input', updateBookingWidget);
  checkinInput?.addEventListener('change', updateBookingWidget);
  checkoutInput?.addEventListener('input', updateBookingWidget);
  checkoutInput?.addEventListener('change', updateBookingWidget);
  guestsInput?.addEventListener('input', updateBookingWidget);
  guestsInput?.addEventListener('change', updateBookingWidget);
  updateBookingWidget();
}

// Initialize Airbnb-style interactive calendar on all calendar pickers
initAirbnbCalendar();

// Hydration readiness signals
document.documentElement.dataset.inquiryReady = 'true';
window.__inquiryReady = true;

